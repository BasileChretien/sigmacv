import { toCslName } from "@/lib/openalex/toCsl";

/**
 * Printed forms of a person's name that a CSL style might render, for the
 * identifier-driven self-name highlight (a substring match in the rendered
 * citation). citeproc renders names style-specifically — "Chrétien, B.",
 * "B. Chrétien", "Chrétien B" — so the reliably-present token is the FAMILY
 * name; it is always included alongside the raw input and both name orders.
 *
 * Used for names we only know as a STRING (a user-asserted "claimed" author, or
 * a typed manual entry) — works whose authorships carry the user's identifier go
 * through `selfNameVariants(work, matches)` in `build.ts` instead.
 */
export function nameVariants(rawName: string): string[] {
  const raw = rawName.trim();
  if (!raw) return [];
  const name = toCslName(raw);
  const variants = new Set<string>([raw]);
  if (typeof name.family === "string" && name.family) {
    variants.add(name.family);
    if (typeof name.given === "string" && name.given) {
      variants.add(`${name.family}, ${name.given}`);
      variants.add(`${name.given} ${name.family}`);
    }
  }
  return [...variants].filter((v) => v.length >= 2);
}
