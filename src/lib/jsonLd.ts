/**
 * Serialise a JSON-LD object for embedding inside a `<script type="application/
 * ld+json">` tag. Escapes `<` to `<` so a value containing `</script>` (or
 * any `<`) can never break out of the script element and inject same-origin
 * markup/JS. ALL JSON-LD emitters must go through this — app-origin pages
 * (marketing/legal) do not ship a script-blocking CSP, so a breakout there would
 * be exploitable if user/CMS-derived strings are ever wired in.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
