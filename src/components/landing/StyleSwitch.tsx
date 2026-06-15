/**
 *
 * Style feature animation — a self-contained CSS loop (server component). A real
 * CV card (name highlighted by identifier in the author lists) cycles through
 * templates while the accent recolours (@property --sy-ac); a "58 one-click
 * layouts" badge sits by the template thumbnails, an opt-in field-normalized
 * metrics row reads "Metrics, done responsibly", and the citation style
 * cross-fades (APA → Vancouver → Nature). Loops 12s. Reduced-motion freezes it.
 */
export default function StyleSwitch() {
  return (
    <div className="feat-fig sy" aria-hidden="true">
      <div className="sy-panel">
        <div className="sy-head">
          <div className="sy-head-main">
            <span className="sy-head-eyebrow">Funder, job &amp; industry layouts</span>
            <span className="sy-template">
              <span className="sy-tpl-name t1">
                Classic<em className="sy-tpl-type">Default</em>
              </span>
              <span className="sy-tpl-name t2">
                ERC<em className="sy-tpl-type">Funder</em>
              </span>
              <span className="sy-tpl-name t3">
                NIH Biosketch<em className="sy-tpl-type">Funder</em>
              </span>
            </span>
          </div>
          <span className="sy-custom">Fully customizable</span>
        </div>
        <div className="sy-thumbs-row">
          <div className="sy-thumbs">
            {/* single column */}
            <span className="sy-thumb sy-th1">
              <span className="syt-bar" />
              <i />
              <i />
              <i className="sh" />
            </span>
            {/* sidebar */}
            <span className="sy-thumb sy-th2">
              <span className="syt-row">
                <span className="syt-side" />
                <span className="syt-main">
                  <i />
                  <i />
                  <i className="sh" />
                </span>
              </span>
            </span>
            {/* header band + two columns */}
            <span className="sy-thumb sy-th3">
              <span className="syt-bar" />
              <span className="syt-grid">
                <i />
                <i />
                <i />
                <i />
              </span>
            </span>
          </div>
          <span className="sy-layouts">
            <b>58</b> one-click layouts
          </span>
        </div>

        <div className="sy-card">
          <div className="sy-side">
            <span className="sy-side-av" />
            <i />
            <i className="short" />
            <i />
          </div>
          <div className="sy-main">
            <div className="sy-namerow">
              <span className="sy-name-txt">Dr. Mara Lindqvist</span>
              <span className="sy-you">you</span>
            </div>
            <span className="sy-authors">
              Chen Y, <b>Lindqvist M</b>, Patel R · <i>Nature</i> · 2025
            </span>
            <span className="sy-authors">
              <b>Lindqvist M</b>, Okonkwo A · <i>Cell Rep.</i> · 2024
            </span>
            <div className="sy-metrics">
              <span className="sy-metric-k">Metrics, done responsibly</span>
              <span className="sy-metric-row">
                <span className="sy-metric">FWCI 1.8</span>
                <span className="sy-metric">RCR 1.4</span>
                <span className="sy-metric-note">field-normalized · opt-in</span>
              </span>
            </div>
          </div>
        </div>

        <div className="sy-foot">
          <div className="sy-swatches">
            <span className="sw sw1" />
            <span className="sw sw2" />
            <span className="sw sw3" />
            <span className="sw sw4" />
          </div>
          <div className="sy-cite">
            <span className="sy-cite-k">Style</span>
            <span className="sy-cite-box">
              <span className="sy-cite-name c1">APA</span>
              <span className="sy-cite-name c2">Vancouver</span>
              <span className="sy-cite-name c3">Nature</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
