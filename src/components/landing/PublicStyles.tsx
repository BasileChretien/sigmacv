/**
 * "Publish a living page" feature animation — a self-contained CSS loop (server
 * component). One mock public page (name highlighted by identifier, two
 * publication lines, a photo) stays still while its BACKDROP + accent cycle
 * through four representative public-page showcase styles — Prism → Synthwave →
 * Aura → Mesh — with a persistent "Online only — exports stay clean" caption and
 * a sigmacv.org/p/… URL pill. Loops 16s. Reduced-motion freezes to one calm
 * frame (Aura). Decorative; aria-hidden. CSS in landing/home.css (`.feat-fig.ps`).
 */
export default function PublicStyles() {
  return (
    <div className="feat-fig ps" aria-hidden="true">
      <div className="ps-frame">
        <div className="ps-bar">
          <span className="ps-live" />
          <span className="ps-url">sigmacv.org/p/mara-lindqvist</span>
          <span className="ps-style">
            <span className="ps-style-name n1">Prism</span>
            <span className="ps-style-name n2">Synthwave</span>
            <span className="ps-style-name n3">Aura</span>
            <span className="ps-style-name n4">Mesh</span>
          </span>
        </div>
        <div className="ps-stage">
          <span className="ps-bg s1" />
          <span className="ps-bg s2" />
          <span className="ps-bg s3" />
          <span className="ps-bg s4" />
          <div className="ps-card">
            <span className="ps-photo" />
            <div className="ps-card-main">
              <span className="ps-name">Dr. Mara Lindqvist</span>
              <span className="ps-line">
                Chen Y, <b>Lindqvist M</b>, Patel R · <i>Nature</i> · 2025
              </span>
              <span className="ps-line">
                <b>Lindqvist M</b>, Okonkwo A · <i>Cell Rep.</i> · 2024
              </span>
              <span className="ps-swatch" />
            </div>
          </div>
        </div>
        <div className="ps-note">Online only — exports stay clean</div>
      </div>
    </div>
  );
}
