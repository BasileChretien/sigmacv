/**
 * Substitute every `{key}` in a UI template (a locale may repeat one).
 *
 * Always a FUNCTION replacer: a value from a data source (a funder name, an
 * award number, a publisher's statement) may contain `$&`, `$'` or `` $` ``,
 * which a string replacement would read as a pattern and splice into the copy.
 */
export function fill(template: string, values: Readonly<Record<string, string>>): string {
  let out = template;
  for (const [key, value] of Object.entries(values)) {
    out = out.replaceAll(`{${key}}`, () => value);
  }
  return out;
}
