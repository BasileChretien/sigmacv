import { isLegacyDatasetsTitle, sectionTitle } from "@/lib/i18n";
import { isSoftwareType } from "./softwareItem";

/**
 * ONE-OFF, PURE normalisation for the research-software split: research software
 * used to be filed in the `datasets` section ("Datasets & Software"); it is now its
 * own `software` section. A stored CV that was last saved before the split still
 * carries its software items under `datasets` — and would keep doing so until its
 * next re-sync rebuilt the sections. Running this on every read (from
 * `migrateCanonicalDocument`, BEFORE validation) makes the section appear
 * immediately, re-sync or not.
 *
 * What it does, on the raw (unvalidated) document:
 *  - moves every item of the `datasets` section whose recorded type is software
 *    (`meta.type` / `csl.type`, see `isSoftwareType`) into the `software` section,
 *    creating it right after `datasets` (same visibility; later sections shift down
 *    by one) or appending to an existing one — items keep their id, curation
 *    (`included` / `notMine` / `featured` / `reviewedAt` / overrides) and relative
 *    order, so nothing the owner decided is lost;
 *  - retitles a `datasets` section that still carries the pre-split DEFAULT heading
 *    ("Datasets & Software", any locale) to the current default ("Datasets") in the
 *    CV's own locale — a heading the owner renamed is left exactly as it is.
 *
 * IDEMPOTENT and IDENTITY-PRESERVING: when there is nothing to move and nothing to
 * retitle it returns the very same object, so an already-normalised document is
 * never copied. Defensive throughout — a malformed document (non-array sections,
 * non-object items) is returned untouched rather than ever throwing.
 */
export function migrateSoftwareSection(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const doc = input as Record<string, unknown>;
  const sections = doc.sections;
  if (!Array.isArray(sections)) return input;

  const datasetsIndex = sections.findIndex((s) => sectionType(s) === "datasets");
  if (datasetsIndex < 0) return input;
  const datasets = sections[datasetsIndex] as Record<string, unknown>;
  const items = Array.isArray(datasets.items) ? datasets.items : [];
  const moving = items.filter(isSoftwareLike);
  const title = typeof datasets.title === "string" ? datasets.title : "";
  const retitle = isLegacyDatasetsTitle(title);
  if (moving.length === 0 && !retitle) return input;

  const locale = localeOf(doc);
  const staying = items.filter((it) => !isSoftwareLike(it));
  const nextDatasets: Record<string, unknown> = {
    ...datasets,
    ...(retitle ? { title: sectionTitle(locale, "datasets") } : {}),
    ...(moving.length > 0 ? { items: reindex(staying) } : {}),
  };

  if (moving.length === 0) {
    return { ...doc, sections: sections.map((s, i) => (i === datasetsIndex ? nextDatasets : s)) };
  }

  const softwareIndex = sections.findIndex((s) => sectionType(s) === "software");
  if (softwareIndex >= 0) {
    // A software section already exists (e.g. a rebuild ran, then a stale copy was
    // saved): append the stragglers after its own items.
    const software = sections[softwareIndex] as Record<string, unknown>;
    const existing = Array.isArray(software.items) ? software.items : [];
    const nextSoftware = { ...software, items: reindex([...existing, ...sortByOrder(moving)]) };
    return {
      ...doc,
      sections: sections.map((s, i) =>
        i === datasetsIndex ? nextDatasets : i === softwareIndex ? nextSoftware : s,
      ),
    };
  }

  // Create the software section right after datasets; every section that sat
  // after datasets shifts down one slot so no two share an order value.
  const datasetsOrder = typeof datasets.order === "number" ? datasets.order : 0;
  const software: Record<string, unknown> = {
    id: "software",
    type: "software",
    title: sectionTitle(locale, "software"),
    visible: datasets.visible !== false,
    order: datasetsOrder + 1,
    items: reindex(moving),
  };
  const shifted = sections.map((s, i) => {
    if (i === datasetsIndex) return nextDatasets;
    if (!s || typeof s !== "object") return s;
    const order = (s as Record<string, unknown>).order;
    return typeof order === "number" && order > datasetsOrder ? { ...s, order: order + 1 } : s;
  });
  shifted.splice(datasetsIndex + 1, 0, software);
  return { ...doc, sections: shifted };
}

function sectionType(section: unknown): string | undefined {
  if (!section || typeof section !== "object") return undefined;
  const type = (section as Record<string, unknown>).type;
  return typeof type === "string" ? type : undefined;
}

/** Software by recorded type — the raw-document twin of `isSoftwareItem`. */
function isSoftwareLike(item: unknown): boolean {
  if (!item || typeof item !== "object") return false;
  const it = item as { meta?: unknown; csl?: unknown };
  const metaType =
    it.meta && typeof it.meta === "object" ? (it.meta as { type?: unknown }).type : 0;
  const cslType = it.csl && typeof it.csl === "object" ? (it.csl as { type?: unknown }).type : 0;
  return isSoftwareType(metaType) || isSoftwareType(cslType);
}

function localeOf(doc: Record<string, unknown>): string {
  const display = doc.display;
  const locale =
    display && typeof display === "object" ? (display as { locale?: unknown }).locale : undefined;
  return typeof locale === "string" ? locale : "en-US";
}

function orderOf(item: unknown): number {
  const order = (item as { order?: unknown })?.order;
  return typeof order === "number" ? order : Number.MAX_SAFE_INTEGER;
}

/** Stable sort by `order` (unordered items last). */
function sortByOrder(items: unknown[]): unknown[] {
  return [...items].sort((a, b) => orderOf(a) - orderOf(b));
}

/** Clean 0..n `order` values, preserving relative order (immutable). */
function reindex(items: unknown[]): unknown[] {
  return sortByOrder(items).map((it, i) =>
    it && typeof it === "object" ? { ...(it as Record<string, unknown>), order: i } : it,
  );
}
