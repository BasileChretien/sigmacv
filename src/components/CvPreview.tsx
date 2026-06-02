"use client";

interface CvPreviewProps {
  html: string;
  loading?: boolean;
}

export default function CvPreview({ html, loading }: CvPreviewProps) {
  return (
    <div className="cv-preview">
      {html ? (
        // Sandboxed iframe isolates the CV's own styles from the app chrome.
        // NOTE: keep `sandbox=""` empty — never add `allow-scripts`/`allow-same-origin`,
        // which would re-enable script execution on untrusted CV markup.
        <iframe
          title="CV preview"
          className="cv-preview-frame"
          srcDoc={html}
          sandbox=""
          style={loading ? { opacity: 0.5, transition: "opacity 0.15s" } : undefined}
        />
      ) : (
        <div className="cv-preview-empty muted">
          {loading ? "Rendering preview…" : "Preview will appear here."}
        </div>
      )}
    </div>
  );
}
