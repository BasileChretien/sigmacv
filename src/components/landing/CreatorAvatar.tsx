"use client";

import { useState } from "react";

/**
 *
 * Creator photo with a graceful initials fallback. Shows the photo once it's
 * saved at public/basile-chretien.jpg; until then it renders the "BC" avatar so
 * the preview is never broken.
 */
export default function CreatorAvatar() {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <span className="hp2-creator-photo hp2-creator-photo-fb" aria-hidden="true">
        BC
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="hp2-creator-photo"
      src="/basile-chretien.jpg"
      alt="Basile Chrétien"
      width={96}
      height={96}
      loading="lazy"
      onError={() => setErr(true)}
    />
  );
}
