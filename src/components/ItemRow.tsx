"use client";

import { isHidden, type CvItem } from "@/lib/canonical/schema";

interface ItemRowProps {
  item: CvItem;
  isFirst: boolean;
  isLast: boolean;
  onToggleIncluded: () => void;
  onToggleNotMine: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  /** Edit a manual entry's text (only passed for source === "manual"). */
  onUpdateText?: (text: string) => void;
  /** Delete a manual entry (only passed for source === "manual"). */
  onRemove?: () => void;
}

export default function ItemRow({
  item,
  isFirst,
  isLast,
  onToggleIncluded,
  onToggleNotMine,
  onMoveUp,
  onMoveDown,
  onUpdateText,
  onRemove,
}: ItemRowProps) {
  const isCitation = Boolean(item.csl);
  const isManual = item.source === "manual";
  const title = item.csl?.title ?? item.displayText ?? "Untitled";
  const year = item.meta.year ?? "—";
  const venue =
    typeof item.csl?.["container-title"] === "string"
      ? item.csl["container-title"]
      : "";

  const rowClass = [
    "cv-item-row",
    isHidden(item) ? "is-excluded" : "",
    item.notMine ? "is-not-mine" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={rowClass}>
      <div className="cv-item-body">
        {isManual && onUpdateText ? (
          <input
            className="cv-item-edit"
            value={item.displayText ?? ""}
            onChange={(e) => onUpdateText(e.target.value)}
            placeholder="e.g. Visiting Researcher, MIT (2023)"
            aria-label="Entry text"
          />
        ) : (
          <div className="cv-item-title">{title}</div>
        )}
        {isCitation ? (
          <div className="cv-item-meta">
            <span>{year}</span>
            {venue ? <span> · {venue}</span> : null}
            {item.authoredBySelf ? (
              <span className="cv-self-badge" title="Matched by your identifier">
                you
              </span>
            ) : null}
            {item.notMine ? (
              <span className="cv-notmine-badge" title="You marked this as wrongly attributed">
                not mine
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="cv-item-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label="Move up"
          title="Move up"
        >
          ↑
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onMoveDown}
          disabled={isLast}
          aria-label="Move down"
          title="Move down"
        >
          ↓
        </button>
        <button
          type="button"
          className="mine-btn"
          onClick={onToggleIncluded}
          aria-pressed={!item.included}
          title="Keep on file but leave it off this CV"
        >
          {item.included ? "Hide" : "Show"}
        </button>
        {isCitation ? (
          <button
            type="button"
            className={`mine-btn${item.notMine ? " is-restore" : ""}`}
            onClick={onToggleNotMine}
            aria-pressed={item.notMine}
            title="This work is wrongly attributed to me (corrects the record)"
          >
            {item.notMine ? "Mine" : "Not mine"}
          </button>
        ) : null}
        {isManual && onRemove ? (
          <button
            type="button"
            className="mine-btn is-delete"
            onClick={onRemove}
            title="Delete this entry"
            aria-label="Delete entry"
          >
            Delete
          </button>
        ) : null}
      </div>
    </li>
  );
}
