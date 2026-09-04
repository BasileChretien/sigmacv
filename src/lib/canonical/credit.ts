/**
 * CRediT (Contributor Roles Taxonomy, ANSI/NISO Z39.104-2022) — the 14 roles a
 * contributor can hold on a work, plus the tolerant normaliser that maps the
 * many spellings found in the wild ("Writing – review & editing",
 * "writing-review-and-editing", the NISO URI form …) onto one canonical
 * lower-case identifier each.
 *
 * Dependency-free on purpose: the schema (enum), the curate op, the Crossref
 * client, the renderer and the editor all import from here, so the vocabulary
 * has exactly one definition.
 */

/** The 14 CRediT roles, in the taxonomy's canonical order. */
export const CREDIT_ROLES = [
  "conceptualization",
  "data-curation",
  "formal-analysis",
  "funding-acquisition",
  "investigation",
  "methodology",
  "project-administration",
  "resources",
  "software",
  "supervision",
  "validation",
  "visualization",
  "writing-original-draft",
  "writing-review-editing",
] as const;
export type CreditRole = (typeof CREDIT_ROLES)[number];

/** Where an item's CRediT roles came from: the publisher's deposit (Crossref)
 *  or the account holder's own declaration in the editor. */
export const CREDIT_ROLE_SOURCES = ["crossref", "self"] as const;

const ROLE_SET: ReadonlySet<string> = new Set(CREDIT_ROLES);

/** Tokens that carry no meaning in a role name ("review AND editing"). */
const FILLER = new Set(["and", "the", "of"]);

/** British spellings → the taxonomy's American forms. */
const SPELLING: Record<string, string> = {
  conceptualisation: "conceptualization",
  visualisation: "visualization",
};

/**
 * Map one raw role value (any spelling, the NISO URI, or a stray non-CRediT
 * label) onto a canonical {@link CreditRole}, or `undefined` when it isn't one
 * of the 14. Never throws on a non-string.
 */
export function normalizeCreditRole(raw: unknown): CreditRole | undefined {
  if (typeof raw !== "string") return undefined;
  let value = raw.trim().toLowerCase();
  if (!value) return undefined;
  // The NISO URI form (https://credit.niso.org/contributor-roles/formal-analysis/):
  // keep only the last non-empty path segment.
  if (/^https?:\/\//.test(value)) {
    const segments = value
      .replace(/[?#].*$/, "")
      .split("/")
      .filter(Boolean);
    value = segments[segments.length - 1] ?? "";
  }
  const tokens = value
    .split(/[^a-z]+/)
    .filter((t) => t && !FILLER.has(t))
    .map((t) => SPELLING[t] ?? t);
  const key = tokens.join("-");
  return ROLE_SET.has(key) ? (key as CreditRole) : undefined;
}

/**
 * Normalise a list of raw role values: unknown values dropped, duplicates
 * collapsed, and the result put in the taxonomy's canonical order (so two
 * declarations of the same roles compare equal whatever order they came in).
 */
export function normalizeCreditRoles(raw: readonly unknown[]): CreditRole[] {
  const found = new Set<CreditRole>();
  for (const r of raw) {
    const role = normalizeCreditRole(r);
    if (role) found.add(role);
  }
  return CREDIT_ROLES.filter((r) => found.has(r));
}

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}

/**
 * One raw role entry as it may appear in a deposit: a bare string, or an object
 * `{ value | role | name, vocab | vocabulary }`. An object whose vocabulary is
 * named and is NOT CRediT is dropped (a publisher's in-house role list must never
 * be mistaken for the taxonomy); an object with no vocabulary is judged on its
 * value alone (the normaliser rejects anything that isn't one of the 14).
 */
function roleValueOf(entry: unknown): unknown {
  if (typeof entry === "string") return entry;
  const rec = asRecord(entry);
  if (!rec) return undefined;
  const vocab = rec.vocab ?? rec.vocabulary;
  if (typeof vocab === "string" && !/credit/i.test(vocab)) return undefined;
  return rec.value ?? rec.role ?? rec.name;
}

/**
 * Extract the CRediT roles from ONE contributor record of a deposited work,
 * accepting every plausible shape the Crossref schema (5.4+) and its JSON
 * rendering may take — `role` (string / string[] / object[]), `contributor-role`
 * and `roles` — and rejecting anything outside the 14. Pure; the caller has
 * already selected the contributor by identifier (ORCID), never by name.
 */
export function extractCreditRoles(contributor: unknown): CreditRole[] {
  const rec = asRecord(contributor);
  if (!rec) return [];
  const raw: unknown[] = [];
  for (const key of ["role", "contributor-role", "roles"]) {
    const v = rec[key];
    if (v === undefined || v === null) continue;
    for (const entry of Array.isArray(v) ? v : [v]) {
      const value = roleValueOf(entry);
      if (value !== undefined) raw.push(value);
    }
  }
  return normalizeCreditRoles(raw);
}
