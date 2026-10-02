import { asLocale } from "@/lib/i18n";

/**
 * The edition of Open Editors Plus behind the committed seed
 * (`prisma/seed-data/oep-editorial-roles.ndjson.gz`).
 *
 * OEP is the one source SigmaCV does not read live: it is a dataset collected
 * from journals' own websites, loaded into the `OepEditorialRole` table and
 * replaced about once a year. A researcher whose editorship began or ended after
 * the collection therefore sees a role missing or lingering, with nothing on the
 * page to say why — the site states the date and the yearly rhythm instead
 * (Transparency page, and a line in the editor's Editorial Roles section).
 *
 * UPDATE THIS with every seed rebuild: `scripts/oep-build-seed.py` ends by
 * printing the range of the dataset's `scraped_at` column and its
 * `data_version`. The values below are those of OEP release 3.0.0, which the
 * current seed was built from (922,097 rows, read 2026-10-02). A later release
 * can keep the same dates: OEP 4.0.0 reclassifies journals over the same
 * collection, so loading it would change the data version and not the date.
 *
 * No server import here on purpose: `client.ts` pulls in Prisma, and this
 * constant is read by client components.
 */
export const OEP_SNAPSHOT = {
  dataVersion: "2026.2",
  collectedFrom: "2026-03-31",
  collectedTo: "2026-04-20",
} as const;

/**
 * The month the collection ended, written for the reader ("April 2026",
 * "avril 2026", "2026年4月"). A month, not a day: the masthead pages were read
 * over three weeks, and the notes that use this say "around".
 */
export function oepSnapshotDate(locale: string): string {
  return new Intl.DateTimeFormat(asLocale(locale), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${OEP_SNAPSHOT.collectedTo}T00:00:00Z`));
}
