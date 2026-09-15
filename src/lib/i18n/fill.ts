/**
 * Substitute every `{key}` in a UI template (a locale may repeat one), in ONE
 * pass over the template.
 *
 * One pass, so a substituted value is never scanned again: a value that itself
 * contains `{otherKey}` stays literal. And a FUNCTION replacer, so a value from a
 * data source (a funder name, an award number, a publisher's statement) that
 * contains `$&`, `$'` or `` $` `` is never read as a replacement pattern. A
 * placeholder with no value is left as written.
 */
export function fill(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(
    /\{(\w+)\}/g,
    (placeholder: string, key: string) =>
      (Object.prototype.hasOwnProperty.call(values, key) ? values[key] : undefined) ?? placeholder,
  );
}
