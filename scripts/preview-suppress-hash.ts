/**
 * Print the HMAC to add to `PREVIEW_SUPPRESSED_ORCID_HMACS` for one ORCID iD —
 * the GDPR Art. 21 objection list for the no-login preview (see
 * `src/lib/cv/previewSuppression.ts`).
 *
 *   npm run preview:suppress-hash 0000-0002-1825-0097
 *
 * Reads AUTH_SECRET from `.env` (via dotenv in the npm script); run it with the
 * PRODUCTION secret, since the HMAC is keyed by it. Append the printed value to
 * the comma-separated env var on the server and restart the app. Never write the
 * plaintext iD anywhere: the objection record is the HMAC.
 *
 * The HMAC is keyed by AUTH_SECRET, so ROTATING AUTH_SECRET VOIDS EVERY ENTRY:
 * recompute the list under the new secret and deploy both together (see
 * SECURITY.md). Nothing detects a stale list at runtime — a stale entry simply
 * stops matching and the record is previewed again.
 */
import { previewSuppressionHmac } from "../src/lib/cv/previewSuppression";
import { validOrcidOrNull } from "../src/lib/orcid/validate";

const raw = process.argv[2];
const secret = process.env.AUTH_SECRET;

if (!raw) {
  console.error("usage: npm run preview:suppress-hash <orcid>");
  process.exit(2);
}
if (!secret) {
  console.error("AUTH_SECRET is not set — run with the production .env");
  process.exit(2);
}
const orcid = validOrcidOrNull(raw);
if (!orcid) {
  console.error(`not a well-formed, checksum-valid ORCID iD: ${raw}`);
  process.exit(1);
}
console.log(previewSuppressionHmac(orcid, secret));
