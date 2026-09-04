/**
 * Per-view state is keyed by SECTION id: `display.excludedItems` ("hide from this
 * view") maps `sectionId → [itemId, …]`, and every saved preset snapshots its own
 * `display` plus `sectionVisibility` / `sectionOrder` by section id. When items
 * move from one section to another (the research-software split: `datasets` →
 * `software`), those keys go stale — an item the owner hid from a published view
 * or a preset would silently reappear under its new section. This PURE helper
 * follows the move:
 *
 *  - each moved id listed under `excludedItems[from]` is removed there and added
 *    under `excludedItems[to]` (deduped; empty lists and an empty map are pruned)
 *    — on the live `display` AND on every preset's `display` snapshot;
 *  - a preset whose `sectionVisibility` recorded `from` but not yet `to` gets the
 *    same verdict for `to` (a view that hid "Datasets & Software" keeps hiding the
 *    software that was split out of it);
 *  - a preset whose `sectionOrder` lists `from` but not `to` gets `to` slotted in
 *    right after it (the split section stays next to its parent in that view).
 *
 * IDENTITY-PRESERVING: when nothing changes it returns the very same object.
 * Works on the raw (unvalidated) document the on-read migration sees as well as
 * on a validated `CanonicalCv`: every field it touches is read defensively and
 * written back in the schema's own shape, so a junk value is left as it was
 * rather than ever throwing.
 */
export function moveSectionViewState<T extends object>(
  doc: T,
  from: string,
  to: string,
  movedIds: readonly string[],
): T {
  if (movedIds.length === 0 || from === to) return doc;
  const moved = new Set(movedIds);
  const d = doc as Record<string, unknown>;
  const display = moveDisplay(d.display, from, to, moved);
  const presets = movePresets(d.presets, from, to, moved);
  if (display === d.display && presets === d.presets) return doc;
  return {
    ...doc,
    ...(display !== d.display ? { display } : {}),
    ...(presets !== d.presets ? { presets } : {}),
  };
}

function moveDisplay(display: unknown, from: string, to: string, moved: Set<string>): unknown {
  if (!display || typeof display !== "object") return display;
  const map = (display as { excludedItems?: unknown }).excludedItems;
  const next = moveExcludedItems(map, from, to, moved);
  return next === map ? display : { ...display, excludedItems: next };
}

/** The `excludedItems` map with the moved ids re-keyed; the same object if none apply. */
function moveExcludedItems(map: unknown, from: string, to: string, moved: Set<string>): unknown {
  if (!map || typeof map !== "object") return map;
  const record = map as Record<string, unknown>;
  const fromList = record[from];
  if (!Array.isArray(fromList)) return map;
  const leaving = fromList.filter((id): id is string => typeof id === "string" && moved.has(id));
  if (leaving.length === 0) return map;
  const staying = fromList.filter((id) => !(typeof id === "string" && moved.has(id)));
  const toList = Array.isArray(record[to]) ? (record[to] as unknown[]) : [];
  const nextTo = [...new Set([...toList, ...leaving])];
  const next: Record<string, unknown> = { ...record, [to]: nextTo };
  if (staying.length === 0) delete next[from];
  else next[from] = staying;
  return next;
}

function movePresets(presets: unknown, from: string, to: string, moved: Set<string>): unknown {
  if (!Array.isArray(presets)) return presets;
  let changed = false;
  const next = presets.map((p) => {
    const moved1 = movePreset(p, from, to, moved);
    if (moved1 !== p) changed = true;
    return moved1;
  });
  return changed ? next : presets;
}

function movePreset(preset: unknown, from: string, to: string, moved: Set<string>): unknown {
  if (!preset || typeof preset !== "object") return preset;
  const p = preset as { display?: unknown; sectionVisibility?: unknown; sectionOrder?: unknown };
  const display = moveDisplay(p.display, from, to, moved);
  const sectionVisibility = followVisibility(p.sectionVisibility, from, to);
  const sectionOrder = followOrder(p.sectionOrder, from, to);
  if (
    display === p.display &&
    sectionVisibility === p.sectionVisibility &&
    sectionOrder === p.sectionOrder
  ) {
    return preset;
  }
  return {
    ...preset,
    ...(display !== p.display ? { display } : {}),
    ...(sectionVisibility !== p.sectionVisibility ? { sectionVisibility } : {}),
    ...(sectionOrder !== p.sectionOrder ? { sectionOrder } : {}),
  };
}

/** `to` inherits `from`'s recorded visibility when it has none of its own. */
function followVisibility(visibility: unknown, from: string, to: string): unknown {
  if (!visibility || typeof visibility !== "object") return visibility;
  const v = visibility as Record<string, unknown>;
  if (typeof v[from] !== "boolean" || to in v) return visibility;
  return { ...v, [to]: v[from] };
}

/** `to` is slotted right after `from` when the saved order lists `from` only. */
function followOrder(order: unknown, from: string, to: string): unknown {
  if (!Array.isArray(order)) return order;
  const at = order.indexOf(from);
  if (at < 0 || order.includes(to)) return order;
  return [...order.slice(0, at + 1), to, ...order.slice(at + 1)];
}
