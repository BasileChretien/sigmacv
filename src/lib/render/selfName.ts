import { nameVariants } from "@/lib/canonical/nameVariants";
import type { CvItem, CvOwner } from "@/lib/canonical/schema";

type PubName = NonNullable<CvOwner["publicationName"]>;

/** A preferred publication name with at least one non-blank part. */
function effectiveParts(
  pub: CvOwner["publicationName"],
): { family?: string; given?: string } | null {
  if (!pub) return null;
  const family = pub.family?.trim() || undefined;
  const given = pub.given?.trim() || undefined;
  return family || given ? { family, given } : null;
}

/**
 * Apply the owner's preferred publication name to ONE citation item: substitute the
 * account holder's own author entry in the item's CSL — located by the
 * **identifier-derived** `meta.authorPosition` (1-based), never by matching a name —
 * and augment `selfNameVariants` so the identifier-driven highlight still bolds the
 * renamed name. Only the parts the user set are overridden; the rest fall back to the
 * source name. Feed the result to `cslForRender` / citeproc.
 *
 * Pure + immutable. A no-op (returns the item as-is) when: there's no override, the
 * item isn't the user's own, it isn't a citation, the self position is unknown or out
 * of range, or the override changes nothing. A DISPLAY choice only — the source data,
 * the identifier match, and the "not mine" disambiguation signal are all untouched.
 */
export function withSelfPublicationName(item: CvItem, pub: CvOwner["publicationName"]): CvItem {
  const parts = effectiveParts(pub);
  if (!parts || !item.authoredBySelf || !item.csl) return item;
  const pos = item.meta.authorPosition;
  const authors = item.csl.author;
  if (!pos || !authors || pos < 1 || pos > authors.length) return item;
  const idx = pos - 1;
  const orig = authors[idx];
  if (!orig) return item;
  const family = parts.family ?? orig.family;
  const given = parts.given ?? orig.given;
  if (family === orig.family && given === orig.given && !orig.literal) return item;
  const newAuthor: PubName & Record<string, unknown> = { ...orig, family, given };
  // A source `literal` (unsplittable) name would make citeproc ignore family/given —
  // drop it so the override actually prints.
  delete newAuthor.literal;
  const author = authors.map((a, i) => (i === idx ? newAuthor : a));
  const csl = { ...item.csl, author };
  const printed = `${given ?? ""} ${family ?? ""}`.trim();
  const selfNameVariants = [...new Set([...item.selfNameVariants, ...nameVariants(printed)])];
  return { ...item, csl, selfNameVariants };
}
