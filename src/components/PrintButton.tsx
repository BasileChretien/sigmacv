"use client";

/** Opens the browser's print dialog (which also saves as PDF). */
export default function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className="btn btn-primary" onClick={() => window.print()}>
      {label}
    </button>
  );
}
