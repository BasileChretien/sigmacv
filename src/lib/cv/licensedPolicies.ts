/**
 * Jisc licensed its Open Policy Finder data to SigmaCV for display in the
 * owner's own editor only (case CS-00957483, 2026-09-17): "Nothing appears on
 * public CV pages, in exports, or as a redistributed dataset." The public page,
 * its formats, snapshots, OAI and the anonymous preview already drop every
 * self-archiving input (`cv/publicProjection.ts`); this drops the Open Policy
 * Finder records from what the OWNER downloads — the JSON and RO-Crate exports
 * and the account's data export — with their stamps, so a re-imported document
 * asks again rather than showing nothing for a week. OA.Works records (public
 * domain) stay.
 *
 * Tolerant of any shape: the account export hands over the stored document
 * unparsed. Returns a new object; never mutates. Lives outside `lib/archiving`
 * on purpose: the export routes may import it, and nothing of the programme.
 */
export function withoutLicensedPolicies<T>(doc: T): T {
  if (typeof doc !== "object" || doc === null) return doc;
  const sections = (doc as { sections?: unknown }).sections;
  if (!Array.isArray(sections)) return doc;
  return {
    ...doc,
    sections: sections.map((section: unknown) => {
      const items = (section as { items?: unknown } | null)?.items;
      if (!Array.isArray(items)) return section;
      return {
        ...(section as object),
        items: items.map((item: unknown) => {
          const meta = (item as { meta?: Record<string, unknown> } | null)?.meta;
          const record = meta?.selfArchiving as { source?: unknown } | undefined;
          if (!meta || record?.source !== "open-policy-finder") return item;
          const {
            selfArchiving: _record,
            selfArchivingCheckedAt: _checked,
            selfArchivingTriedAt: _tried,
            selfArchivingOpfAt: _opf,
            selfArchivingOpfIssn: _issn,
            ...rest
          } = meta;
          return { ...(item as object), meta: rest };
        }),
      };
    }),
  } as T;
}
