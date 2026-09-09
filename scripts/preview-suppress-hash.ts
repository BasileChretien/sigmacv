/**
 * Print the HMAC to add to `PREVIEW_SUPPRESSED_ORCID_HMACS` for one ORCID iD —
 * the GDPR Art. 21 objection list for the no-login preview (see
 * `src/lib/cv/previewSuppression.ts`).
 *
 *   npm run preview:suppress-hash
 *   ORCID iD: 0000-0002-1825-0097
 *   <64-hex HMAC>
 *
 * The iD is read from an interactive prompt (or, when stdin is not a terminal,
 * from the first line of stdin) — never from `argv`, so it does not land in
 * shell history, process listings or audit logs. Nothing echoes the raw iD back.
 *
 * Reads PREVIEW_SUPPRESSION_KEY from `.env` (via dotenv in the npm script); run
 * it with the PRODUCTION key, since the HMAC is keyed by it. Append the printed
 * value to the comma-separated env var on the server and restart the app. Never
 * write the plaintext iD anywhere: the objection record is the HMAC.
 *
 * The key is dedicated (not AUTH_SECRET) so a routine secret rotation cannot
 * void the list. Rotating PREVIEW_SUPPRESSION_KEY itself DOES void every entry:
 * recompute them all under the new key and deploy both together (SECURITY.md).
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { previewSuppressionHmac } from "../src/lib/cv/previewSuppression";
import { validOrcidOrNull } from "../src/lib/orcid/validate";

async function readOrcid(): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdin.isTTY ? stdout : undefined });
  try {
    return (await rl.question(stdin.isTTY ? "ORCID iD: " : "")).trim();
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  const key = process.env.PREVIEW_SUPPRESSION_KEY;
  if (!key || key.length < 16) {
    console.error("PREVIEW_SUPPRESSION_KEY is not set (≥ 16 chars) — run with the production .env");
    process.exit(2);
  }
  const orcid = validOrcidOrNull(await readOrcid());
  if (!orcid) {
    // Deliberately does not echo the input: it may be a mistyped real iD.
    console.error("not a well-formed, checksum-valid ORCID iD");
    process.exit(1);
  }
  console.log(previewSuppressionHmac(orcid, key));
}

void main();
