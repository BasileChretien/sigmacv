/**
 *
 * Export feature animation — a self-contained CSS loop (server component). Five
 * output chips (PDF · DOCX · LaTeX · Markdown · Public page) light up in turn;
 * the preview cross-fades to a real-content rendering of the same CV in each
 * format; a progress bar fills and a check stamps each round. Loops 15s.
 * Reduced-motion freezes to the PDF slot.
 */
const FORMATS = ["PDF", "DOCX", "LaTeX", "Markdown", "Public page"];

export default function Export() {
  return (
    <div className="feat-fig ex" aria-hidden="true">
      <div className="ex-panel">
        <div className="ex-chips">
          {FORMATS.map((f, i) => (
            <span key={f} className={`ex-chip ex-c${i + 1}`}>
              {f}
            </span>
          ))}
        </div>

        <div className="ex-preview">
          {/* PDF */}
          <div className="ex-doc ex-d1">
            <span className="ex-doc-tab">Σ</span>
            <span className="ex-name">Dr. Mara Lindqvist</span>
            <span className="ex-sub">Pharmacovigilance · Open science</span>
            <span className="ex-h">Publications</span>
            <span className="ex-t">Field-normalized impact across disciplines · 2025</span>
            <span className="ex-t">Signal detection in pharmacovigilance · 2024</span>
          </div>
          {/* DOCX */}
          <div className="ex-doc ex-d2">
            <span className="ex-mark ex-mark-w">W</span>
            <span className="ex-name">Mara Lindqvist — CV</span>
            <span className="ex-h">Publications</span>
            <span className="ex-t">Field-normalized impact across disciplines</span>
            <span className="ex-t">Signal detection in pharmacovigilance</span>
          </div>
          {/* LaTeX */}
          <div className="ex-doc ex-d3 ex-code">
            <span className="ex-code-l">
              <em>\documentclass</em>
              {"{moderncv}"}
            </span>
            <span className="ex-code-l">
              <em>\name</em>
              {"{Mara}{Lindqvist}"}
            </span>
            <span className="ex-code-l">
              <em>\section</em>
              {"{Publications}"}
            </span>
            <span className="ex-code-l ex-code-i">
              \nocite{"{*}"} \bibliography{"{cv}"}
            </span>
          </div>
          {/* Markdown */}
          <div className="ex-doc ex-d4 ex-code">
            <span className="ex-code-l">
              <em># </em>Mara Lindqvist
            </span>
            <span className="ex-code-l">
              <em>## </em>Publications
            </span>
            <span className="ex-code-l ex-code-i">- Field-normalized impact… (2025)</span>
            <span className="ex-code-l ex-code-i">- Signal detection in… (2024)</span>
          </div>
          {/* Public page */}
          <div className="ex-doc ex-d5 ex-web">
            <span className="ex-web-url">
              <span className="ex-web-dot" /> sigmacv.org/p/mara-lindqvist
            </span>
            <span className="ex-web-globe">◍</span>
            <span className="ex-name ex-web-name">Dr. Mara Lindqvist</span>
            <span className="ex-sub">Living public CV · re-syncs from the record</span>
          </div>
        </div>

        <div className="ex-foot">
          <div className="ex-bar">
            <i />
          </div>
          <span className="ex-check">✓</span>
        </div>
      </div>
    </div>
  );
}
