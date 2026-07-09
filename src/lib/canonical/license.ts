import { CV_LICENSES, type CvLicenseKey } from "./schema";

/**
 * Whole-CV reuse license metadata (FAIR / open-science). PURE: a static lookup,
 * no i18n — license names are proper nouns and stay in their canonical English
 * form across every locale.
 *
 * `licenseInfo(key)` → `{ key, name, url }` for a real, linkable license, or
 * `null` for the two sentinels with no canonical URL:
 *   - "none"               → no license statement at all
 *   - "all-rights-reserved" → explicitly closed (no public reuse URL)
 */

export interface LicenseInfo {
  key: CvLicenseKey;
  /** Human-readable name (proper noun, not translated). */
  name: string;
  /** Canonical SPDX license page. */
  url: string;
}

/** key → human name + SPDX URL, only for the licenses that HAVE a canonical URL. */
const LINKABLE: Record<string, { name: string; url: string }> = {
  "CC0-1.0": {
    name: "CC0 1.0",
    url: "https://spdx.org/licenses/CC0-1.0.html",
  },
  "CC-BY-4.0": {
    name: "CC BY 4.0",
    url: "https://spdx.org/licenses/CC-BY-4.0.html",
  },
  "CC-BY-SA-4.0": {
    name: "CC BY-SA 4.0",
    url: "https://spdx.org/licenses/CC-BY-SA-4.0.html",
  },
};

/**
 * Resolve a license key to its display name + SPDX URL, or null when there's no
 * canonical URL ("none" / "all-rights-reserved") or the key is unrecognized.
 */
export function licenseInfo(key: string | undefined | null): LicenseInfo | null {
  if (!key) return null;
  const entry = LINKABLE[key];
  if (!entry) return null;
  return { key: key as CvLicenseKey, name: entry.name, url: entry.url };
}

/** The selectable license keys (re-export for UI/tests). */
export const CV_LICENSE_KEYS = CV_LICENSES;

/**
 * The reuse license for the EXPOSED METADATA — the machine-readable bibliographic
 * representations (JSON-LD, CSL-JSON, BibTeX) SigmaCV serves for a public CV.
 * Fixed at CC0: the major scholarly infrastructures (Crossref, DataCite, OpenAlex)
 * release bibliographic metadata into the public domain, so the records can be
 * freely aggregated and reused. This is SEPARATE from the owner's chosen CV
 * CONTENT license (`display.cvLicense`): the facts describing public works are CC0
 * even when the CV content itself is licensed more restrictively (or not at all).
 */
export const METADATA_LICENSE_URL = licenseInfo("CC0-1.0")!.url;
