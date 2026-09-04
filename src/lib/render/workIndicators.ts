import type { CvItem, DisplayChoices } from "@/lib/canonical/schema";
import { renderStrings } from "@/lib/i18n/render";

/**
 * One compact per-work indicator. `value` is the display string ("RCR 1.8",
 * "cited by 4 clinical articles"); `label` names the indicator for structured
 * consumers; `title` is the responsible-reading caveat (tooltip).
 */
export interface WorkIndicator {
  key: "rcr" | "fwci" | "clinicalCitations" | "clinical";
  label: string;
  value: string;
  title: string;
}

/**
 * Compact per-work assessment indicators, opt-in via `display.showWorkIndicators`.
 *
 * Per-work indicators are defensible where the aggregates in `metrics.ts` are not:
 * an aggregate over a curated list is biased by WHICH works carry a value (the
 * FWCI-derived means are computed over cited works only — see `METRIC_DEFS`),
 * whereas each per-work value is what its source reports for THAT article, shown
 * with its own caveat and never summed, averaged or ranked here. Shown only for
 * works that carry the value (RCR and clinical citations are biomedical-only, so
 * a non-biomedical work simply shows none). APT is stored but deliberately NOT
 * displayed: it is a model prediction, not an observation. Returns an empty list
 * when the toggle is off or the item carries no data.
 */
export function workIndicators(item: CvItem, display: DisplayChoices): WorkIndicator[] {
  if (!display.showWorkIndicators) return [];
  const s = renderStrings(display.locale);
  const m = item.meta;
  const decimal = (n: number) =>
    new Intl.NumberFormat(display.locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(n);
  const integer = (n: number) => new Intl.NumberFormat(display.locale).format(n);
  const out: WorkIndicator[] = [];
  if (typeof m.rcr === "number") {
    out.push({
      key: "rcr",
      label: "RCR",
      value: s.indicatorRcr.replace("{v}", decimal(m.rcr)),
      title: s.indicatorRcrTitle,
    });
  }
  if (typeof m.fwci === "number") {
    out.push({
      key: "fwci",
      label: "FWCI",
      value: s.indicatorFwci.replace("{v}", decimal(m.fwci)),
      title: s.indicatorFwciTitle,
    });
  }
  if (typeof m.clinicalCitations === "number" && m.clinicalCitations > 0) {
    const template =
      m.clinicalCitations === 1 ? s.indicatorClinicalCitationOne : s.indicatorClinicalCitations;
    out.push({
      key: "clinicalCitations",
      label: s.indicatorClinicalCitationsLabel,
      value: template.replace("{n}", integer(m.clinicalCitations)),
      title: s.indicatorClinicalCitationsTitle,
    });
  }
  if (m.isClinical === true) {
    out.push({
      key: "clinical",
      label: s.indicatorClinical,
      value: s.indicatorClinical,
      title: s.indicatorClinicalTitle,
    });
  }
  return out;
}
