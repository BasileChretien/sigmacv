import { CV_MODELS, isCvModelId } from "@/lib/canonical/cvModels";
import { SNAPSHOT_LABEL_MAX } from "@/lib/cv/snapshots";

/**
 * A "freeze request" — the STATELESS way an institution, funder or recruiter asks
 * a researcher for a frozen CV version in a given shape.
 *
 * The request is nothing but a URL to the editor, e.g.
 *   /cv?freeze=erc&preset=reader&label=ERC%202027&by=2026-10-01
 * built and pasted by the requester (a call document, a job ad, an email). The
 * researcher opens it, sees exactly what it asks for, and decides. There is NO
 * server-side record of who asked whom for what: the query string is parsed in
 * the researcher's browser only, the freeze itself is an ordinary owner action
 * on `/api/cv/snapshots`, and the resulting link is sent by the researcher. A
 * request cannot switch on metrics, career context or supervisee names — it can
 * only name a CV model (a section layout) and a display preset.
 *
 * Pure; every field is allow-listed and anything malformed is dropped.
 */

/** Freeze-time display presets a request (or the Versions panel) may ask for. */
export const FREEZE_PRESETS = ["reader", "hiring"] as const;
export type FreezePreset = (typeof FREEZE_PRESETS)[number];

export function isFreezePreset(value: string): value is FreezePreset {
  return (FREEZE_PRESETS as readonly string[]).includes(value);
}

export interface FreezeRequest {
  /** A CV model id from the catalog; absent = the researcher's current layout. */
  modelId?: string;
  preset?: FreezePreset;
  /** Suggested label (the researcher can change it). */
  label?: string;
  /** Requested-by date, `YYYY-MM-DD` (display only — nothing expires). */
  by?: string;
}

/** `?freeze=` value meaning "no particular model — just freeze (with the preset)". */
const ANY_SHAPE = "1";
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function validDate(s: string): boolean {
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

/**
 * Parse the editor URL's query into a request. Null unless `freeze` is present
 * and names either a catalog model or {@link ANY_SHAPE}; malformed optional
 * fields are dropped, never rejected as a whole.
 */
export function parseFreezeRequest(params: URLSearchParams): FreezeRequest | null {
  const freeze = params.get("freeze");
  if (!freeze) return null;
  const req: FreezeRequest = {};
  if (isCvModelId(freeze)) req.modelId = freeze;
  else if (freeze !== ANY_SHAPE) return null;
  const preset = params.get("preset");
  if (preset && isFreezePreset(preset)) req.preset = preset;
  const label = params.get("label")?.replace(/\s+/g, " ").trim();
  if (label) req.label = label.slice(0, SNAPSHOT_LABEL_MAX);
  const by = params.get("by");
  if (by && validDate(by)) req.by = by;
  return req;
}

/** The query string for a request (the inverse of {@link parseFreezeRequest}). */
export function freezeRequestQuery(req: FreezeRequest): string {
  const p = new URLSearchParams();
  p.set("freeze", req.modelId && isCvModelId(req.modelId) ? req.modelId : ANY_SHAPE);
  if (req.preset) p.set("preset", req.preset);
  if (req.label) p.set("label", req.label.slice(0, SNAPSHOT_LABEL_MAX));
  if (req.by && validDate(req.by)) p.set("by", req.by);
  return `?${p.toString()}`;
}

/** The catalog name of a requested model (proper noun, not localized); undefined = current layout. */
export function freezeRequestModelName(req: FreezeRequest): string | undefined {
  return req.modelId ? CV_MODELS.find((m) => m.id === req.modelId)?.name : undefined;
}
