import type { CvItem, DataLink } from "@/lib/canonical/schema";
import { renderStrings } from "@/lib/i18n/render";
import { escapeHtml, safeHref } from "./escape";

/**
 * The compact "Data: GEO GSE12345 · Zenodo 10.5281/… — Code: github.com/org/repo"
 * line rendered under a publication when `display.showDataLinks` is on (HTML/PDF).
 * Each link is a real anchor. The URLs are identifier-derived (accession URLs,
 * doi.org, repository landing pages) but originate from third-party sources the
 * owner doesn't control, so — like the user-typed profile links — they carry
 * `nofollow ugc`: a link on a CV must never pass link equity from our domain.
 */

/** Human label for a data-repository DOI prefix (else the generic "DOI"). */
const DOI_PREFIX_LABELS: ReadonlyArray<readonly [string, string]> = [
  ["10.5281/", "Zenodo"],
  ["10.5061/", "Dryad"],
  ["10.17605/", "OSF"],
  ["10.7910/", "Dataverse"],
  ["10.17632/", "Mendeley Data"],
  ["10.1594/", "PANGAEA"],
  ["10.5524/", "GigaDB"],
  ["10.15468/", "GBIF"],
  ["10.6019/", "PRIDE"],
  ["10.2210/", "PDB"],
];

const UGC_REL = ' rel="nofollow ugc noopener noreferrer"';

/** The visible text of one link: "<repository> <identifier>" (a URL shows its host+path). */
export function dataLinkText(link: DataLink): string {
  if (link.scheme === "doi") {
    const label = DOI_PREFIX_LABELS.find(([p]) => link.id.startsWith(p))?.[1] ?? "DOI";
    return `${label} ${link.id}`;
  }
  if (link.scheme === "url") {
    return link.url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/+$/, "");
  }
  return `${link.scheme.toUpperCase()} ${link.id}`;
}

function anchor(link: DataLink): string {
  const href = safeHref(link.url);
  const text = escapeHtml(dataLinkText(link));
  if (!href) return text;
  const title = link.title ? ` title="${escapeHtml(link.title)}"` : "";
  return `<a href="${escapeHtml(href)}"${UGC_REL}${title}>${text}</a>`;
}

/**
 * The data/code line for an item, or "" when it carries no links. Datasets and
 * "other" links go under the "Data" label, software under "Code"; both groups sit
 * on one muted line, so the entry never grows by more than a line.
 */
export function dataLinksHtml(item: CvItem, locale: string): string {
  const links = item.meta.dataLinks ?? [];
  if (links.length === 0) return "";
  const s = renderStrings(locale);
  const data = links.filter((l) => l.kind !== "software");
  const code = links.filter((l) => l.kind === "software");
  const group = (label: string, list: DataLink[]): string =>
    `<span class="cv-datalinks-group"><span class="cv-datalinks-label">${escapeHtml(
      label,
    )}:</span> ${list.map(anchor).join(" · ")}</span>`;
  const groups: string[] = [];
  if (data.length) groups.push(group(s.dataLinksLabel, data));
  if (code.length) groups.push(group(s.codeLinksLabel, code));
  return `<div class="cv-datalinks">${groups.join(" — ")}</div>`;
}
