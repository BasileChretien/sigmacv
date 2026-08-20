import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * `public/.well-known/security.txt` (RFC 9116) publishes how to report a
 * vulnerability privately. SigmaCV processes personal data for real researchers,
 * so having no reporting route means a finder's only options are a public issue
 * or silence.
 *
 * The field that needs guarding is `Expires`. RFC 9116 makes it mandatory, and a
 * file past its expiry is worse than none — it reads as an abandoned project.
 * Nothing would otherwise notice it lapsing, so this fails 30 days BEFORE the
 * date rather than on it, leaving time to renew.
 */
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = readFileSync(join(repoRoot, "public", ".well-known", "security.txt"), "utf8");

/** Field lookup per RFC 9116: case-insensitive name, one value per line. */
function field(name: string): string | undefined {
  const line = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .find((l) => l.toLowerCase().startsWith(`${name.toLowerCase()}:`));
  return line?.slice(line.indexOf(":") + 1).trim();
}

describe("security.txt", () => {
  it("declares a usable Contact", () => {
    const contact = field("Contact");
    expect(contact, "RFC 9116 requires at least one Contact field").toBeTruthy();
    // A bare address is a common mistake: the value must be a URI.
    expect(contact, "Contact must be a URI (mailto: or https:)").toMatch(/^(mailto:|https:)/);
  });

  it("has not expired, with 30 days of warning", () => {
    const expires = field("Expires");
    expect(expires, "RFC 9116 requires an Expires field").toBeTruthy();

    const when = new Date(expires!);
    expect(Number.isNaN(when.getTime()), `Expires is not a valid date: ${expires}`).toBe(false);

    const daysLeft = Math.floor((when.getTime() - Date.now()) / 86_400_000);
    expect(
      daysLeft,
      `security.txt expires in ${daysLeft} day(s) (${expires}). Renew it: bump Expires ` +
        `by a year in public/.well-known/security.txt. An expired file reads as an ` +
        `abandoned project, so this fails early rather than on the day.`,
    ).toBeGreaterThan(30);
  });

  it("points Canonical at the production URL", () => {
    // A wrong Canonical lets someone host a lookalike file elsewhere and claim it
    // is authoritative for this domain.
    expect(field("Canonical")).toBe("https://sigmacv.org/.well-known/security.txt");
  });
});
