/**
 * Shared profile-photo helpers for the DOCX renderers (the hand-built `docx`
 * path and the HTML→DOCX path). Kept in its own module so both can use them
 * without a circular import.
 */

/** A decoded data-URL photo, or null when it isn't a supported PNG/JPEG. */
export interface DecodedPhoto {
  type: "png" | "jpg";
  data: Buffer;
}

/** Parse a `data:image/...;base64,...` URL into a typed buffer (PNG/JPEG only). */
export function parsePhoto(photo: string | undefined | null): DecodedPhoto | null {
  if (!photo) return null;
  const m = /^data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=]+)$/.exec(photo);
  if (!m) return null;
  return { type: m[1] === "png" ? "png" : "jpg", data: Buffer.from(m[2]!, "base64") };
}

/** Decode intrinsic pixel size from a PNG/JPEG buffer (so a photo isn't
 *  distorted). Returns null if it can't be read. */
export function imageSize(data: Buffer, type: "png" | "jpg"): { w: number; h: number } | null {
  if (type === "png") {
    if (data.length < 24) return null;
    const w = data.readUInt32BE(16);
    const h = data.readUInt32BE(20);
    return w > 0 && h > 0 ? { w, h } : null;
  }
  // JPEG: walk the segment markers (each FF-prefixed) to the Start-Of-Frame,
  // which carries the size. Stop if the stream desyncs (a non-FF marker byte).
  let o = 2;
  while (o + 9 < data.length && data[o] === 0xff) {
    const marker = data[o + 1]!;
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const h = data.readUInt16BE(o + 5);
      const w = data.readUInt16BE(o + 7);
      return w > 0 && h > 0 ? { w, h } : null;
    }
    o += 2 + data.readUInt16BE(o + 2);
  }
  return null; // no SOF found ⇒ caller falls back to a square box
}

/** Width/height (px) to display a photo at, scaled to `boxWidth` keeping aspect
 *  (square fallback when the size can't be read). */
export function photoBox(photo: DecodedPhoto, boxWidth: number): { width: number; height: number } {
  const size = imageSize(photo.data, photo.type);
  return {
    width: boxWidth,
    height: size ? Math.round((boxWidth * size.h) / size.w) : boxWidth,
  };
}
