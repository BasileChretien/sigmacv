"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { trackEvent } from "@/lib/analytics/track";
import { previewStrings } from "@/lib/i18n/preview";
import { AUTHOR_QUERY_MAX } from "@/lib/openalex/authorQuery";
import { resolveSeeItFirstInput, seeItFirstHref } from "@/lib/search/seeItFirst";
import { localeSearchPath } from "@/lib/seo";

/**
 * "See it first": the no-commitment front door. A name or an ORCID iD opens
 * the matching no-login surface (name lookup or automatic preview) before any
 * OAuth is asked for. Rendered at the top of the home sign-in card, on the
 * orcid-to-cv landing page, and under the preview page's malformed-iD notice
 * (with its own `prompt`). The analytics event carries only which kind of
 * input was used — never the value.
 *
 * The visible prompt is a heading (so it sits beside the card's "Sign in" in
 * heading navigation); the input's accessible name is the visually-hidden
 * label, which the placeholder repeats for sighted users.
 */
export default function SeeItFirstForm({ locale, prompt }: { locale: string; prompt?: string }) {
  const s = previewStrings(locale);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);
  // Marks the navigation as pending so the button can show immediate feedback
  // (disabled + busy) in the beat before the route paints — and so an impatient
  // double-click can't fire two navigations.
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const target = resolveSeeItFirstInput(value);
    const href = seeItFirstHref(target, localeSearchPath(locale));
    if (!href) {
      setInvalid(true);
      // Put the reader back on the field so the error is read in context.
      inputRef.current?.focus();
      return;
    }
    trackEvent("See it first", { input: target.kind });
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <form className="hp2-preview" onSubmit={onSubmit} noValidate data-testid="see-it-first">
      <h2 className="hp2-preview-label">{prompt ?? s.formPrompt}</h2>
      <label className="visually-hidden" htmlFor="see-it-first-input">
        {s.formAria}
      </label>
      <div className="auth-email-row">
        <input
          ref={inputRef}
          id="see-it-first-input"
          name="who"
          className="hp2-preview-input"
          type="text"
          autoComplete="off"
          spellCheck={false}
          maxLength={AUTHOR_QUERY_MAX}
          placeholder={s.formAria}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? "see-it-first-error" : "see-it-first-hint"}
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
        <p id="see-it-first-error" className="hp2-preview-error" role="alert">
          {s.formInvalid}
        </p>
      ) : (
        <p id="see-it-first-hint" className="hp2-preview-hint">
          {s.formHint}
        </p>
      )}
    </form>
  );
}
