"use client";

import { useRef, useState } from "react";
import type { CanonicalCv, CvLink } from "@/lib/canonical/schema";
import { PHOTO_DATA_URL_MAX } from "@/lib/canonical/schema";
import { updateOwner } from "@/lib/canonical/curate";
import { t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/i18n/ui";
import { resolveLink } from "@/lib/render/icons";

interface ProfilePanelProps {
  cv: CanonicalCv;
  locale: Locale;
  onChange: (next: CanonicalCv) => void;
}

const PHOTO_MAX_PX = 400;

/**
 * Downscale a chosen image to <= PHOTO_MAX_PX on its longest side and return a
 * JPEG data URL. Runs entirely in the browser (no upload) so the photo lives in
 * the canonical document. Returns null if the image can't be read.
 */
async function fileToDataUrl(file: File): Promise<string | null> {
  const original = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const img = document.createElement("img");
  const loaded = await new Promise<boolean>((resolve) => {
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = original;
  });
  if (!loaded) return null;
  const scale = Math.min(1, PHOTO_MAX_PX / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return original.length <= PHOTO_DATA_URL_MAX ? original : null;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function ProfilePanel({ cv, locale, onChange }: ProfilePanelProps) {
  const owner = cv.owner;
  const contact = owner.contact ?? {};
  const personal = owner.personal ?? {};
  const links = owner.links ?? [];
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState("");

  async function onPickPhoto(file: File | undefined) {
    setPhotoError("");
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    if (!dataUrl || dataUrl.length > PHOTO_DATA_URL_MAX) {
      setPhotoError(ui(locale).photoTooLarge);
      return;
    }
    onChange(updateOwner(cv, { photo: dataUrl }));
  }

  function setLink(index: number, patch: Partial<CvLink>) {
    const next = links.map((l, i) => (i === index ? { ...l, ...patch } : l));
    onChange(updateOwner(cv, { links: next }));
  }
  function addLink() {
    onChange(updateOwner(cv, { links: [...links, { label: "", url: "" }] }));
  }
  function removeLink(index: number) {
    onChange(updateOwner(cv, { links: links.filter((_, i) => i !== index) }));
  }

  return (
    <fieldset className="display-controls profile-panel">
      <legend>{t(locale, "profile")}</legend>

      <div className="profile-top">
        <div className="profile-photo-col">
          {owner.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="profile-photo-preview"
              src={owner.photo}
              alt={owner.displayName || t(locale, "photo")}
            />
          ) : (
            <div className="profile-photo-placeholder" aria-hidden="true" />
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="visually-hidden"
            onChange={(e) => void onPickPhoto(e.target.files?.[0])}
            aria-label={t(locale, "photo")}
          />
          <div className="profile-photo-actions">
            <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
              {t(locale, "choosePhoto")}
            </button>
            {owner.photo ? (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => onChange(updateOwner(cv, { photo: undefined }))}
              >
                {t(locale, "removePhoto")}
              </button>
            ) : null}
          </div>
          {photoError ? (
            <span className="custom-style-error">{photoError}</span>
          ) : (
            <span className="muted profile-photo-hint">{t(locale, "photoHint")}</span>
          )}
        </div>

        <div className="profile-fields">
          <label className="field">
            <span>{t(locale, "honorific")}</span>
            <input
              type="text"
              value={owner.honorific ?? ""}
              placeholder={t(locale, "honorificPlaceholder")}
              onChange={(e) =>
                onChange(updateOwner(cv, { honorific: e.target.value || undefined }))
              }
            />
          </label>
          <label className="field">
            <span>{t(locale, "displayName")}</span>
            <input
              type="text"
              value={owner.displayName}
              onChange={(e) => onChange(updateOwner(cv, { displayName: e.target.value }))}
            />
          </label>
          <label className="field">
            <span>{t(locale, "headline")}</span>
            <input
              type="text"
              value={owner.headline ?? ""}
              onChange={(e) => onChange(updateOwner(cv, { headline: e.target.value || undefined }))}
            />
          </label>
        </div>
      </div>

      <label className="field">
        <span>{t(locale, "summary")}</span>
        <textarea
          className="profile-summary"
          rows={3}
          value={owner.summary ?? ""}
          onChange={(e) => onChange(updateOwner(cv, { summary: e.target.value || undefined }))}
        />
      </label>

      <div className="profile-grid">
        <label className="field">
          <span>{t(locale, "email")}</span>
          <input
            type="email"
            value={contact.email ?? ""}
            onChange={(e) =>
              onChange(updateOwner(cv, { contact: { email: e.target.value || undefined } }))
            }
          />
        </label>
        <label className="field">
          <span>{t(locale, "phone")}</span>
          <input
            type="tel"
            value={contact.phone ?? ""}
            onChange={(e) =>
              onChange(updateOwner(cv, { contact: { phone: e.target.value || undefined } }))
            }
          />
        </label>
        <label className="field">
          <span>{t(locale, "website")}</span>
          <input
            type="url"
            value={contact.website ?? ""}
            onChange={(e) =>
              onChange(updateOwner(cv, { contact: { website: e.target.value || undefined } }))
            }
          />
        </label>
        <label className="field">
          <span>{t(locale, "location")}</span>
          <input
            type="text"
            value={contact.location ?? ""}
            onChange={(e) =>
              onChange(updateOwner(cv, { contact: { location: e.target.value || undefined } }))
            }
          />
        </label>
      </div>

      <div className="field">
        <span>{t(locale, "links")}</span>
        {links.map((l, i) => {
          // The label is OPTIONAL: a recognised service (GitHub, LinkedIn, ORCID, …)
          // is auto-detected from the URL and used as the visible name when the label
          // is blank — so its detected name shows as the placeholder here. URL is the
          // primary field, hence it comes first.
          const detected = resolveLink(l.url).service;
          return (
            <div key={i} className="profile-link-row">
              <input
                type="url"
                placeholder={t(locale, "linkUrl")}
                value={l.url}
                onChange={(e) => setLink(i, { url: e.target.value })}
                aria-label={t(locale, "linkUrl")}
              />
              <input
                type="text"
                placeholder={detected ?? t(locale, "linkLabel")}
                value={l.label}
                onChange={(e) => setLink(i, { label: e.target.value })}
                aria-label={t(locale, "linkLabel")}
              />
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => removeLink(i)}
                aria-label={t(locale, "removeLink")}
              >
                {t(locale, "removeLink")}
              </button>
            </div>
          );
        })}
        <button type="button" className="btn btn-sm" onClick={addLink}>
          {t(locale, "addLink")}
        </button>
        <span className="muted profile-link-hint">{t(locale, "linkLabelHint")}</span>
      </div>

      <details className="profile-rirekisho">
        <summary>{t(locale, "rirekishoDetails")}</summary>
        <div className="profile-grid">
          <label className="field">
            <span>{t(locale, "furigana")}</span>
            <input
              type="text"
              value={personal.phoneticName ?? ""}
              onChange={(e) =>
                onChange(
                  updateOwner(cv, { personal: { phoneticName: e.target.value || undefined } }),
                )
              }
            />
          </label>
          <label className="field">
            <span>{t(locale, "dateOfBirth")}</span>
            <input
              type="text"
              value={personal.dateOfBirth ?? ""}
              onChange={(e) =>
                onChange(
                  updateOwner(cv, { personal: { dateOfBirth: e.target.value || undefined } }),
                )
              }
            />
          </label>
          <label className="field">
            <span>{t(locale, "gender")}</span>
            <input
              type="text"
              value={personal.gender ?? ""}
              onChange={(e) =>
                onChange(updateOwner(cv, { personal: { gender: e.target.value || undefined } }))
              }
            />
          </label>
          <label className="field">
            <span>{t(locale, "nationality")}</span>
            <input
              type="text"
              value={personal.nationality ?? ""}
              onChange={(e) =>
                onChange(
                  updateOwner(cv, { personal: { nationality: e.target.value || undefined } }),
                )
              }
            />
          </label>
          <label className="field profile-address">
            <span>{t(locale, "address")}</span>
            <input
              type="text"
              value={personal.address ?? ""}
              onChange={(e) =>
                onChange(updateOwner(cv, { personal: { address: e.target.value || undefined } }))
              }
            />
          </label>
        </div>
      </details>
    </fieldset>
  );
}
