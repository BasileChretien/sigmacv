import { NextResponse } from "next/server";
import { getPublicCvRecord, listPublicCvRecords } from "@/lib/cv/sync";
import { logger } from "@/lib/log";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import {
  OAI_PAGE_SIZE,
  getRecordResponse,
  identifyResponse,
  listIdentifiersResponse,
  listMetadataFormatsResponse,
  listRecordsResponse,
  oaiError,
  validateOaiRequest,
  type OaiArgs,
} from "@/lib/oai/oai";
import { absoluteUrl } from "@/lib/siteUrl";

/**
 * OAI-PMH 2.0 endpoint over the indexable public CVs (FAIR "Accessible": let
 * repositories / aggregators harvest the open record). Thin — parses the request,
 * rate-limits, and hands off to the pure `lib/oai` builders + the `cv/sync`
 * harvest helpers. Supports GET and POST per the protocol.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OAI_MAX = 120;
const OAI_WINDOW_MS = 60_000;

/** Real client IP from the trusted (rightmost) proxy hop — Caddy overwrites XFF. */
function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",");
    return parts[parts.length - 1]!.trim();
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function argsFrom(params: URLSearchParams): OaiArgs {
  const g = (k: string) => params.get(k) ?? undefined;
  return {
    verb: g("verb"),
    identifier: g("identifier"),
    metadataPrefix: g("metadataPrefix"),
    from: g("from"),
    until: g("until"),
    set: g("set"),
    resumptionToken: g("resumptionToken"),
  };
}

function xmlResponse(xml: string): NextResponse {
  return new NextResponse(xml, {
    status: 200, // OAI-PMH conveys errors in the body, not the HTTP status.
    headers: { "Content-Type": "text/xml; charset=utf-8", "Cache-Control": "public, max-age=120" },
  });
}

async function handle(args: OaiArgs, req: Request): Promise<NextResponse> {
  const rl = await enforceRateLimit(`oai:${clientIp(req)}`, OAI_MAX, OAI_WINDOW_MS);
  if (!rl.ok) {
    return new NextResponse("Too many requests.", {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSec), "Content-Type": "text/plain" },
    });
  }

  const opts = { baseUrl: absoluteUrl("api/oai"), now: new Date() };
  const plan = validateOaiRequest(args);

  try {
    switch (plan.kind) {
      case "error":
        return xmlResponse(oaiError(args, plan.code, plan.message, opts));
      case "identify":
        return xmlResponse(identifyResponse(opts));
      case "listMetadataFormats":
        return xmlResponse(listMetadataFormatsResponse(args, opts));
      case "getRecord": {
        const rec = await getPublicCvRecord(plan.slug);
        return xmlResponse(
          rec
            ? getRecordResponse(args, rec, opts)
            : oaiError(
                args,
                "idDoesNotExist",
                `No record for identifier: ${args.identifier}`,
                opts,
              ),
        );
      }
      case "list": {
        const { records, total } = await listPublicCvRecords({
          limit: OAI_PAGE_SIZE,
          offset: plan.offset,
          from: plan.from,
          until: plan.until,
        });
        if (records.length === 0) {
          const empty = plan.offset > 0;
          return xmlResponse(
            oaiError(
              args,
              empty ? "badResumptionToken" : "noRecordsMatch",
              empty ? "Invalid or expired resumptionToken" : "No records match the request",
              opts,
            ),
          );
        }
        const consumed = plan.offset + records.length;
        const page = {
          records,
          total,
          cursor: plan.offset,
          nextOffset: consumed < total ? consumed : null,
        };
        return xmlResponse(
          plan.verb === "ListRecords"
            ? listRecordsResponse(args, page, opts)
            : listIdentifiersResponse(args, page, opts),
        );
      }
    }
  } catch (err) {
    logger.error("api.oai_failed", { verb: args.verb, err });
    // Surface as a transient server error (not an OAI protocol error).
    return new NextResponse("OAI service temporarily unavailable.", {
      status: 503,
      headers: { "Retry-After": "60", "Content-Type": "text/plain" },
    });
  }
}

export async function GET(req: Request) {
  return handle(argsFrom(new URL(req.url).searchParams), req);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const params = new URLSearchParams();
  for (const [k, v] of form.entries()) if (typeof v === "string") params.set(k, v);
  return handle(argsFrom(params), req);
}
