import JSZip from "jszip";
import { licenseInfo } from "@/lib/canonical/license";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { renderCvBibtex } from "./bibtex";
import { cvCslItems } from "./csljson";
import { renderCvHtml } from "./html";
import { cvSlug } from "./slug";
import type { Renderer, RenderInput, RenderResult } from "./types";

/**
 * RO-Crate export — packages the CV and its representations as a Research Object
 * Crate (https://w3id.org/ro/crate/1.1): a ZIP whose root holds an
 * `ro-crate-metadata.json` (JSON-LD, schema.org vocabulary) describing the CV as a
 * Dataset, its author (by ORCID), its reuse license, and each bundled file.
 *
 * Bundled, self-contained, all derived from the canonical object (no Playwright):
 *   - cv.json      — the canonical CV object (SigmaCV schema)
 *   - cv.csl.json  — publications as CSL-JSON
 *   - cv.bib       — publications as BibTeX
 *   - cv.html      — human-readable CV
 *
 * Pure data only — the PDF (Playwright) is intentionally left out so the renderer
 * stays light and unit-testable; users export the PDF separately if they want it.
 */

const RO_CRATE_CONTEXT = "https://w3id.org/ro/crate/1.1/context";
const RO_CRATE_SPEC = "https://w3id.org/ro/crate/1.1";
const SIGMACV_ID = "https://sigmacv.org";
/** A bare ORCID iD (four 4-digit groups; last char a digit or the X checksum). */
const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

interface CrateFile {
  name: string;
  encodingFormat: string;
  description: string;
  content: string;
}

/** The files bundled in the crate, each derived from the canonical object. */
export function crateFiles(cv: CanonicalCv): CrateFile[] {
  return [
    {
      name: "cv.json",
      encodingFormat: "application/json",
      description: "The canonical CV object (SigmaCV schema).",
      content: JSON.stringify(cv, null, 2),
    },
    {
      name: "cv.csl.json",
      encodingFormat: "application/vnd.citationstyles.csl+json",
      description: "Publications as CSL-JSON.",
      content: JSON.stringify(cvCslItems(cv), null, 2),
    },
    {
      name: "cv.bib",
      encodingFormat: "application/x-bibtex",
      description: "Publications as BibTeX.",
      content: renderCvBibtex(cv),
    },
    {
      name: "cv.html",
      encodingFormat: "text/html",
      description: "Human-readable CV (HTML).",
      content: renderCvHtml(cv),
    },
  ];
}

/** Build the `ro-crate-metadata.json` JSON-LD object for the CV. Pure. */
export function buildRoCrateMetadata(cv: CanonicalCv): Record<string, unknown> {
  const name = cv.owner.displayName || "Researcher";
  const orcid = cv.owner.orcid.trim();
  const authorId = orcid && ORCID_RE.test(orcid) ? `https://orcid.org/${orcid}` : "#author";
  const license = licenseInfo(cv.display.cvLicense)?.url;

  const graph: Record<string, unknown>[] = [
    {
      "@id": "ro-crate-metadata.json",
      "@type": "CreativeWork",
      conformsTo: { "@id": RO_CRATE_SPEC },
      about: { "@id": "./" },
    },
    {
      "@id": "./",
      "@type": "Dataset",
      name: `${name} — Curriculum Vitae`,
      description:
        "Academic CV assembled by SigmaCV from open research information (OpenAlex, ORCID, …).",
      datePublished: cv.provenance.generatedAt,
      author: { "@id": authorId },
      publisher: { "@id": SIGMACV_ID },
      ...(license ? { license: { "@id": license } } : {}),
      hasPart: crateFiles(cv).map((f) => ({ "@id": f.name })),
    },
    {
      "@id": authorId,
      "@type": "Person",
      name,
      ...(authorId.startsWith("https://orcid.org/") ? { identifier: authorId } : {}),
    },
    { "@id": SIGMACV_ID, "@type": "Organization", name: "SigmaCV", url: SIGMACV_ID },
    ...(license ? [{ "@id": license, "@type": "CreativeWork", name: cv.display.cvLicense }] : []),
    ...crateFiles(cv).map((f) => ({
      "@id": f.name,
      "@type": "File",
      name: f.name,
      encodingFormat: f.encodingFormat,
      description: f.description,
    })),
  ];

  return { "@context": RO_CRATE_CONTEXT, "@graph": graph };
}

/** Build the RO-Crate ZIP for the CV (metadata descriptor + bundled files). */
export async function renderCvRoCrate(cv: CanonicalCv): Promise<Buffer> {
  const zip = new JSZip();
  zip.file("ro-crate-metadata.json", JSON.stringify(buildRoCrateMetadata(cv), null, 2));
  for (const f of crateFiles(cv)) zip.file(f.name, f.content);
  return zip.generateAsync({ type: "nodebuffer" });
}

export const rocrateRenderer: Renderer = {
  format: "ro-crate",
  async render({ cv }: RenderInput): Promise<RenderResult> {
    return {
      format: "ro-crate",
      mimeType: "application/zip",
      filename: `${cvSlug(cv.owner.displayName)}-cv.crate.zip`,
      buffer: await renderCvRoCrate(cv),
    };
  },
};
