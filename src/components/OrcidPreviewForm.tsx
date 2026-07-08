"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { previewStrings } from "@/lib/i18n/preview";
import { isValidOrcidChecksum } from "@/lib/orcid/checksum";

/**
 * Extract a canonical, checksum-valid ORCID iD from free-form input (a bare iD or
 * a full orcid.org URL), or null otherwise. Client-side convenience only — the
 * /preview route re-validates authoritatively. The checksum helper is pure
 * (dependency-free), so no server-only module reaches the client bundle.
 */
function extractOrcid(raw: string): string | null {
  const m = /(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i.exec(raw.trim());
  const v = m?.[1]?.toUpperCase();
  return v && isValidOrcidChecksum(v) ? v : null;
}

/**
 * "See it first" affordance: paste an ORCID iD → open the no-login preview at
 * /preview/<iD>. Lets a visitor evaluate SigmaCV before granting any OAuth — the
 * try-before-you-trust path. Rendered on the home sign-in card and the
 * orcid-to-cv landing page.
 */
export default function OrcidPreviewForm({ locale }: { locale: string }) {
  const s = previewStrings(locale);
  const router = useRouter();
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);
  // Marks the navigation as pending so the button can show immediate feedback
  // (disabled + busy) in the beat before the route's loading.tsx paints — and so
  // an impatient double-click can't fire two heavy preview builds.
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const orcid = extractOrcid(value);
    if (!orcid) {
      setInvalid(true);
      return;
    }
    startTransition(() => {
      router.push(`/preview/${orcid}`);
    });
  }

  return (
    <form className="hp2-preview" onSubmit={onSubmit} noValidate>
      <label className="hp2-preview-label" htmlFor="orcid-preview">
        {s.formPrompt}
      </label>
      <div className="auth-email-row">
        <input
          id="orcid-preview"
          name="orcid"
          className="hp2-preview-input"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          placeholder="0000-0000-0000-0000"
          aria-label={s.formAria}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? "orcid-preview-error" : undefined}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (invalid) setInvalid(false);
          }}
        />
        <button type="submit" className="hp2-btn" disabled={isPending} aria-busy={isPending}>
          {isPending ? <span className="hp2-btn-spinner" aria-hidden="true" /> : null}
          {s.formCta}
        </button>
      </div>
      {invalid ? (
        <p id="orcid-preview-error" className="hp2-preview-error" role="alert">
          {s.invalidBody}
        </p>
      ) : null}
    </form>
  );
}
