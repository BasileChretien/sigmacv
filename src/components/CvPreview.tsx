"use client";

import { ui } from "@/lib/i18n/ui";

interface CvPreviewProps {
  html: string;
  loading?: boolean;
  locale: string;
}

export default function CvPreview({ html, loading, locale }: CvPreviewProps) {
  const u = ui(locale);
  return (
    <div className="cv-preview">
      {html ? (
        // Sandboxed iframe isolates the CV's own styles from the app chrome and
        // keeps untrusted CV markup inert. NEVER add `allow-scripts`/
        // `allow-same-origin` — those would re-enable script execution / parent
        // access on the CV markup. `allow-popups` + `allow-popups-to-escape-sandbox`
        // are required so a publication's DOI/URL link can open in a NEW TAB from
        // inside the sandbox (a bare `sandbox=""` silently blocks the click); the
        // opened tab escapes the sandbox so the destination loads as a normal page.
        // Neither token grants the CV frame script or same-origin access.
        <iframe
          title={u.previewTitle}
          className={`cv-preview-frame${loading ? " is-loading" : ""}`}
          srcDoc={html}
          sandbox="allow-popups allow-popups-to-escape-sandbox"
        />
      ) : (
        <div className="cv-preview-empty muted">
          {loading ? u.previewRendering : u.previewEmpty}
        </div>
      )}
    </div>
  );
}
