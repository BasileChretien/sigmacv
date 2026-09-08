import { NextResponse } from "next/server";
import { getPublicCvRecord, listAffiliationSets, listPublicCvRecords } from "@/lib/cv/sync";
import { logger } from "@/lib/log";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { readTextBodyWithLimit } from "@/lib/readBody";
import {
  OAI_PAGE_SIZE,
  findWorkRecord,
  getRecordResponse,
  identifyResponse,
  listIdentifiersResponse,
  listMetadataFormatsResponse,
  listRecordsResponse,
  listSetsResponse,
  oaiError,
  validateOaiRequest,
  type OaiArgs,
} from "@/lib/oai/oai";
import { absoluteUrl } from "@/lib/siteUrl";

/**
 * OAI-PMH 2.0 endpoint over the indexable public CVs (FAIR "Accessible": let
 * repositories / aggregators harvest the open record). Thin — parses the request,
 * rate-limits, and hands off to the pure `lib/oai` builders + the `cv/sync`
 * harvest helpers. Supports GET and POST per the protocol, and two metadata
 * formats (`oai_dc`, `oaire`) — the format is validated in `lib/oai`, carried
 * by the plan and by resumption tokens, and never changes what is harvestable.
 *
 * Consent gates (enforced in `cv/sync`, never here): every record requires the
 * owner's `publicIndexable` opt-in, whose consent copy names this endpoint;
 * the `ror:<id>` sets contain only CVs whose owner ALSO opted into "list under
 * my current affiliation".
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

/**
 * Only the repository-level verbs (Identify, ListMetadataFormats) are safe in a
 * shared cache. Record- and set-bearing answers reflect consent that an owner
 * can withdraw at any moment (unpublish, indexing off, listing off): a proxy
 * that kept serving them for two minutes would outlive the withdrawal.
 */
function xmlResponse(xml: string, shared = false): NextResponse {
  return new NextResponse(xml, {
    status: 200, // OAI-PMH conveys errors in the body, not the HTTP status.
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": shared ? "public, max-age=120" : "private, no-store",
    },
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
        return xmlResponse(identifyResponse(opts), true);
      case "listMetadataFormats":
        return xmlResponse(listMetadataFormatsResponse(args, opts), true);
      case "listSets": {
        const sets = await listAffiliationSets();
        // The schema requires at least one <set>: until a researcher opts in,
        // the repository has no set hierarchy to report.
        return xmlResponse(
          sets.length > 0
            ? listSetsResponse(args, sets, opts)
            : oaiError(args, "noSetHierarchy", "No sets are currently defined", opts),
        );
      }
      case "getRecord": {
        // A per-work record resolves through its CV's own gate (published +
        // indexable), then must be a work the public page lists.
        const cvRecord = await getPublicCvRecord(plan.slug);
        const rec = cvRecord && plan.itemId ? findWorkRecord(cvRecord, plan.itemId) : cvRecord;
        return xmlResponse(
          rec
            ? getRecordResponse(args, rec, opts, plan.metadataPrefix)
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
          set: plan.set,
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
          cursor: plan.offset,
          nextOffset: consumed < total ? consumed : null,
          filters: { set: plan.set, from: plan.from, until: plan.until },
          metadataPrefix: plan.metadataPrefix,
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

/** An OAI-PMH POST carries at most seven short arguments as
 *  `application/x-www-form-urlencoded` (protocol §3.1.1.2). Cap the body HERE,
 *  streamed, so the ceiling never depends on the edge proxy's configuration. */
const OAI_POST_MAX_BYTES = 8 * 1024;

export async function POST(req: Request) {
  const type = (req.headers.get("content-type") ?? "").toLowerCase();
  if (!type.startsWith("application/x-www-form-urlencoded")) {
    return new NextResponse("POST requests must be application/x-www-form-urlencoded.", {
      status: 415,
      headers: { "Content-Type": "text/plain" },
    });
  }
  const body = await readTextBodyWithLimit(req, OAI_POST_MAX_BYTES);
  if (!body.ok) {
    return new NextResponse("Request body too large.", {
      status: 413,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return handle(argsFrom(new URLSearchParams(body.text)), req);
}
