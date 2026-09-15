import { z } from "zod";
import { logger } from "@/lib/log";
import { openAlexResponse } from "./client";
import { shortId } from "./types";

/**
 * The repositories an author's works sit in, as OpenAlex indexes them — the input
 * of the owner worklist's "OpenAlex lists some of your works in HAL" deposit route.
 *
 * Two small polite-pool calls, never a page of works: (1) the author's works that
 * have any repository location, GROUPED by location source — one row per source
 * with a work count (the groups also hold those works' journals); (2) one batched
 * `/sources` lookup of the most frequent groups, keeping only sources OpenAlex
 * types `repository` and reading their homepage. Verified live 2026-09-15:
 * `group_by=locations.source.id` with OR author ids answered 74 groups in 8.5 KB;
 * `filter=openalex:S1|S2…` with `select=id,display_name,type,homepage_url`
 * answered the types and homepages.
 *
 * Bounded: both calls share one wall-clock budget with no retries, and the second
 * is not started once the first has spent it. Fail-soft: undefined when either
 * call fails, runs out of budget or answers something unreadable, so the caller
 * keeps what it had; an empty list is an answer (no repository found).
 */

const MAX_GROUPS = 30;
const SOURCE_ID = /^S\d{1,20}$/;
const AUTHOR_ID = /^A\d{1,20}$/;
/**
 * The lookup's wall-clock budget, both calls together: the owner sync — and the
 * paced cron resync, one owner after another — waits on it.
 */
const BUDGET_MS = 8_000;
/** Below this much budget left, the second call is not started. */
const MIN_CALL_MS = 1_000;

export interface RepositorySource {
  /** Short OpenAlex source id, `S…`. */
  sourceId: string;
  name: string;
  /** The source's homepage as OpenAlex records it (http/https only). */
  homepageUrl?: string;
  /** How many of the author's works OpenAlex lists with a location in it. */
  works: number;
}

const GroupsSchema = z.object({
  group_by: z.array(
    z
      .object({
        key: z.string(),
        key_display_name: z.string().optional().catch(undefined),
        count: z.number().int().nonnegative(),
      })
      .optional()
      .catch(undefined),
  ),
});

const SourcesSchema = z.object({
  results: z.array(
    z
      .object({
        id: z.string(),
        display_name: z.string().optional().catch(undefined),
        type: z.string().optional().catch(undefined),
        homepage_url: z.string().optional().nullable().catch(undefined),
      })
      .optional()
      .catch(undefined),
  ),
});

function httpUrl(raw: string | null | undefined): string | undefined {
  const url = raw?.trim();
  return url && /^https?:\/\/\S+$/i.test(url) && url.length <= 2048 ? url : undefined;
}

/**
 * The repository-typed sources holding the given authors' works, most works
 * first (at most the {@link MAX_GROUPS} most frequent location sources are
 * examined). `[]` without a usable author id — no call is made.
 */
export async function fetchAuthorRepositories(
  authorIds: readonly string[],
  budgetMs: number = BUDGET_MS,
): Promise<RepositorySource[] | undefined> {
  const ids = [...new Set(authorIds.map(shortId).filter((id) => AUTHOR_ID.test(id)))];
  if (ids.length === 0) return [];
  const deadline = Date.now() + budgetMs;
  try {
    const groupedRes = await openAlexResponse(
      "/works",
      {
        filter: `authorships.author.id:${ids.join("|")},locations.source.type:repository`,
        group_by: "locations.source.id",
      },
      { retries: 0, timeoutMs: budgetMs },
    );
    if (!groupedRes.ok) return undefined;
    const grouped = GroupsSchema.safeParse(await groupedRes.json());
    if (!grouped.success) return undefined;
    const groups = grouped.data.group_by
      .filter((g) => g !== undefined)
      .map((g) => ({ sourceId: shortId(g.key), name: g.key_display_name?.trim(), works: g.count }))
      .filter((g) => SOURCE_ID.test(g.sourceId))
      .slice(0, MAX_GROUPS);
    if (groups.length === 0) return [];

    const left = deadline - Date.now();
    if (left < MIN_CALL_MS) return undefined;
    const sourcesRes = await openAlexResponse(
      "/sources",
      {
        filter: `openalex:${groups.map((g) => g.sourceId).join("|")}`,
        select: "id,display_name,type,homepage_url",
        "per-page": String(MAX_GROUPS),
      },
      { retries: 0, timeoutMs: left },
    );
    if (!sourcesRes.ok) return undefined;
    const sources = SourcesSchema.safeParse(await sourcesRes.json());
    if (!sources.success) return undefined;
    const byId = new Map(
      sources.data.results.filter((s) => s !== undefined).map((s) => [shortId(s.id), s] as const),
    );

    return groups.flatMap((g): RepositorySource[] => {
      const source = byId.get(g.sourceId);
      if (source?.type !== "repository") return [];
      const name = source.display_name?.trim() || g.name;
      if (!name) return [];
      const homepageUrl = httpUrl(source.homepage_url);
      return [
        { sourceId: g.sourceId, name, ...(homepageUrl ? { homepageUrl } : {}), works: g.works },
      ];
    });
  } catch (err) {
    logger.warn("openalex.repositories_failed", { err });
    return undefined;
  }
}
