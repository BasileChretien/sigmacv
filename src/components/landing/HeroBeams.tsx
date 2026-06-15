"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

/**
 *
 * Proposition B — "Beams" (chosen). All twelve open-data sources stream into a
 * central CV card on a light dotted-grid panel. Sources are colour-coded by
 * category (legend bottom-centre); each beam + its source float together; the
 * card breathes/glows, fills line-by-line on an 8s "build" clock (section ticker
 * + ripples + fills share the beat), tilts toward the cursor, and reveals on a
 * choreographed entrance. Hovering a source brightens it + its beam and shows
 * its role. Animations pause when scrolled offscreen. Reduced-motion-safe.
 */
type Cat = "works" | "id" | "data" | "act";
type Source = { label: string; role: string; cat: Cat; x: number; y: number; side: "l" | "r" };

const SOURCES: Source[] = [
  { label: "OpenAlex", role: "Works & metrics", cat: "works", x: 15, y: 7, side: "l" },
  { label: "ORCID", role: "Verified identity", cat: "id", x: 11, y: 22, side: "l" },
  { label: "Crossref", role: "DOIs & metadata", cat: "works", x: 14, y: 37, side: "l" },
  { label: "OpenAIRE", role: "Grants & open access", cat: "data", x: 11, y: 52, side: "l" },
  { label: "DBLP", role: "CS proceedings", cat: "works", x: 15, y: 67, side: "l" },
  { label: "Open Editors Plus", role: "Editorial roles", cat: "act", x: 18, y: 84, side: "l" },
  { label: "DataCite", role: "Datasets & software", cat: "data", x: 85, y: 7, side: "r" },
  { label: "Wikidata", role: "Identity links", cat: "id", x: 89, y: 22, side: "r" },
  { label: "ROR", role: "Institutions", cat: "id", x: 86, y: 37, side: "r" },
  { label: "EPO", role: "Patents", cat: "act", x: 89, y: 52, side: "r" },
  { label: "EU CTIS", role: "Trials (EU)", cat: "act", x: 89, y: 67, side: "r" },
  { label: "ClinicalTrials.gov", role: "Trials (US)", cat: "act", x: 86, y: 84, side: "r" },
];

const CATS: { key: Cat; label: string }[] = [
  { key: "works", label: "Works" },
  { key: "id", label: "Identity" },
  { key: "data", label: "Data" },
  { key: "act", label: "Activities" },
];

const SECTIONS = [
  "Publications",
  "Preprints",
  "Datasets",
  "Grants",
  "Editorial roles",
  "Clinical trials",
  "Patents",
  "Conferences",
];
const SECT_CYCLE = 8;
/** CV build clock (s); section ticker, fills and ripples all share this beat. */
const CVC = 8;
const delay = (frac: number) => `${(frac * CVC).toFixed(2)}s`;

const VB_W = 400;
const VB_H = 320;
const TARGET = { l: { x: 158, y: 160 }, r: { x: 242, y: 160 } };
const CYCLE = 2.6;

/** Smooth cubic from a source point out horizontally, then into the CV edge. */
function beamPath(nx: number, ny: number, tx: number, ty: number): string {
  const dx = tx - nx;
  const c1x = nx + dx * 0.5;
  const c2x = tx - dx * 0.1;
  const c2y = ty + (ny - ty) * 0.18;
  const n = (v: number) => Math.round(v * 10) / 10;
  return `M${n(nx)} ${n(ny)} C${n(c1x)} ${n(ny)} ${n(c2x)} ${n(c2y)} ${n(tx)} ${n(ty)}`;
}

export default function HeroBeams() {
  const wrap = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 110, damping: 18, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 110, damping: 18, mass: 0.4 });
  const layerX = useTransform(sx, [-1, 1], [-9, 9]);
  const layerY = useTransform(sy, [-1, 1], [-9, 9]);
  const gridX = useTransform(sx, [-1, 1], [7, -7]);
  const gridY = useTransform(sy, [-1, 1], [7, -7]);
  const tiltY = useTransform(sx, [-1, 1], [-9, 9]);
  const tiltX = useTransform(sy, [-1, 1], [7, -7]);

  // Pause all animation work when the graphic is scrolled offscreen.
  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e) setPaused(!e.isIntersecting);
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = wrap.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const beams = SOURCES.map((s) => {
    const nx = (s.x / 100) * VB_W;
    const ny = (s.y / 100) * VB_H;
    const t = TARGET[s.side];
    return { ...s, d: beamPath(nx, ny, t.x, t.y) };
  });

  return (
    <div
      ref={wrap}
      className={`hero-fx mb-root mb-enter${paused ? " mb-paused" : ""}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      aria-hidden="true"
    >
      <span className="mx-panel mx-panel-light" />
      <motion.span className="mx-grid mx-grid-light" style={{ x: gridX, y: gridY }} />
      <span className="mb-vignette" />

      <motion.div className="mb-layer" style={{ x: layerX, y: layerY }}>
        <svg className="mb-svg" viewBox={`0 0 ${VB_W} ${VB_H}`} fill="none" role="presentation">
          {beams.map((b, i) => (
            <g
              key={b.label}
              className={`mb-beam-g cat-${b.cat}${hovered === i ? " mb-beam-on" : ""}`}
              style={{ animationDelay: `${(-i * 0.6).toFixed(2)}s` }}
            >
              <path
                className="mb-base"
                d={b.d}
                pathLength={100}
                style={{ animationDelay: `${(0.5 + i * 0.04).toFixed(2)}s` }}
              />
              <path
                className="mb-comet"
                d={b.d}
                pathLength={100}
                style={{ animationDelay: `${(((i % 6) / 6) * CYCLE).toFixed(2)}s` }}
              />
            </g>
          ))}
        </svg>

        {SOURCES.map((s, i) => (
          <span
            key={s.label}
            className={`mb-node mb-node-${s.side} cat-${s.cat}${hovered === i ? " mb-node-on" : ""}`}
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              animationDelay: `${(-i * 0.6).toFixed(2)}s, ${(0.3 + i * 0.04).toFixed(2)}s`,
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <i className="mb-node-dot" />
            {s.label}
            {hovered === i ? <span className="mb-tip">{s.role}</span> : null}
          </span>
        ))}

        <span className="mb-cv">
          <motion.span className="mb-cv-tilt" style={{ rotateX: tiltX, rotateY: tiltY }}>
            <span className="mb-cv-glow" />
            <span className="mb-cv-ripple mb-cv-ripple-l" />
            <span className="mb-cv-ripple mb-cv-ripple-r" />
            <span className="mb-cv-inner">
              <span className="mb-cv-tab">Σ</span>
              <span className="mb-cv-head">
                <span className="mb-cv-avatar" />
                <span className="mb-cv-id">
                  <i />
                  <i className="short" />
                </span>
              </span>
              <span className="mb-cv-sect">
                {SECTIONS.map((name, i) => (
                  <span
                    key={name}
                    className="mb-cv-sect-name"
                    style={{ animationDelay: `${(i * SECT_CYCLE) / SECTIONS.length}s` }}
                  >
                    {name}
                  </span>
                ))}
              </span>
              <span className="mb-cv-line">
                <i className="mb-cv-fill" style={{ animationDelay: delay(0) }} />
              </span>
              <span className="mb-cv-line mb-cv-name">
                <i className="mb-cv-namebar" style={{ animationDelay: delay(0.125) }} />
                <span className="mb-cv-you">you</span>
              </span>
              <span className="mb-cv-line short">
                <i className="mb-cv-fill" style={{ animationDelay: delay(0.25) }} />
              </span>
              <span className="mb-cv-line">
                <i className="mb-cv-fill" style={{ animationDelay: delay(0.375) }} />
              </span>
              <span className="mb-cv-file">Academic CV</span>
            </span>
          </motion.span>
        </span>
      </motion.div>

      <div className="mb-legend">
        {CATS.map((c) => (
          <span key={c.key} className={`mb-legend-item cat-${c.key}`}>
            <i />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}
