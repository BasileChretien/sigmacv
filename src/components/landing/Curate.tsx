/**
 *
 * Curate feature animation — a self-contained CSS loop (server component) showing
 * a real, multi-section CV (Publications · Grants · Editorial roles). The one
 * name-matched paper from a different field gets flagged "not mine" and collapses
 * out (the list reflows up inside a fixed height), kept items get a confirming
 * check, and the Publications count ticks 12 → 11. Reduced-motion freezes it full.
 *
 * The example owner is a pharmacovigilance researcher; the dropped item is a
 * materials-science namesake — the disambiguation problem SigmaCV exists to fix.
 */
type Item = { title: string; meta: string; src: string; kind: "keep" | "drop" };
type Section = { name: string; count?: [string, string]; items: Item[] };

const SECTIONS: Section[] = [
  {
    name: "Publications",
    count: ["12", "11"],
    items: [
      {
        title: "Field-normalized impact across disciplines",
        meta: "Nature · 2025",
        src: "OpenAlex",
        kind: "keep",
      },
      {
        title: "Polymer self-assembly at fluid interfaces",
        meta: "Adv. Mater. · 2018",
        src: "name-matched",
        kind: "drop",
      },
      {
        title: "Signal detection in pharmacovigilance",
        meta: "Drug Saf. · 2024",
        src: "Crossref",
        kind: "keep",
      },
    ],
  },
  {
    name: "Grants",
    items: [
      {
        title: "Early-career research grant — ANR",
        meta: "2023–2026",
        src: "OpenAIRE",
        kind: "keep",
      },
    ],
  },
  {
    name: "Editorial roles",
    items: [
      {
        title: "Associate Editor — Drug Safety",
        meta: "2022 – present",
        src: "Open Editors Plus",
        kind: "keep",
      },
    ],
  },
];

export default function Curate() {
  return (
    <div className="feat-fig cu" aria-hidden="true">
      <div className="cu-panel">
        <div className="cu-bar">
          <span className="cu-bar-title">Your CV · curate</span>
        </div>
        <div className="cu-list">
          {SECTIONS.map((sec) => (
            <div key={sec.name} className="cu-group">
              <div className="cu-sec">
                <span className="cu-sec-name">{sec.name}</span>
                {sec.count ? (
                  <span className="cu-sec-count">
                    <i className="cu-count-from">{sec.count[0]}</i>
                    <i className="cu-count-to">{sec.count[1]}</i>
                  </span>
                ) : null}
              </div>
              {sec.items.map((it) => (
                <div
                  key={it.title}
                  className={`cu-row cu-${it.kind === "drop" ? "drop1" : "keep"}`}
                >
                  <span className="cu-grip">
                    <i />
                    <i />
                    <i />
                  </span>
                  {it.kind === "drop" ? (
                    <span className="cu-x">✕</span>
                  ) : (
                    <span className="cu-check">
                      <i />
                    </span>
                  )}
                  <span className="cu-item">
                    <span className="cu-title">{it.title}</span>
                    <span className="cu-meta">{it.meta}</span>
                  </span>
                  <span className={`cu-tag${it.kind === "drop" ? " cu-tag-bad" : ""}`}>
                    {it.src}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
