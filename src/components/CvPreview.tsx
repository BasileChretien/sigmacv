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
        // Sandboxed iframe isolates the CV's own styles from the app chrome.
        // NOTE: keep `sandbox=""` empty — never add `allow-scripts`/`allow-same-origin`,
        // which would re-enable script execution on untrusted CV markup.
        <iframe
          title={u.previewTitle}
          className="cv-preview-frame"
          srcDoc={html}
          sandbox=""
          style={loading ? { opacity: 0.5, transition: "opacity 0.15s" } : undefined}
        />
      ) : (
        <div className="cv-preview-empty muted">
          {loading ? u.previewRendering : u.previewEmpty}
        </div>
      )}
    </div>
  );
}
