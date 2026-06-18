/**
 * Public-page showcase style — "Meadow".
 * A soft hand-painted pastoral scene in the warm watercolour mood of classic
 * hand-drawn animation: a daytime gradient sky (pale peach → warm blue), a
 * breathing sun glow, slowly drifting clouds, layered rolling GREEN HILLS that
 * sway with a gentle parallax, swaying grass blades along the bottom and the
 * centrepiece — soft petals/leaves FALLING and floating sideways while tiny
 * fireflies/sparkles rise. Entries drift + settle in softly on scroll. Cream
 * paper text, warm sun-gold self-name, leaf-green / sky-blue links. 100% CSS —
 * runs under the strict public-page CSP (no JS, no external assets).
 *
 * IP: original natural-motif homage ONLY (sky / hills / clouds / sun / petals /
 * fireflies / grass) — no character, film, or logo from any studio.
 *
 * Guardrails: scroll reveals target headings + entries individually (never the
 * whole tall section — the scroll-reveal trap); every decorative scene layer is
 * aria-hidden; a full prefers-reduced-motion fallback freezes all motion while
 * keeping every element visible and the page fully readable. Footer footnotes
 * inherit an ink floored dark enough to pass WCAG AA on the soft sky.
 */
import {
  attributionFooter,
  coauthorLinksFooter,
  commonCss,
  cvPageShell,
  headerHtml,
  licenseFooter,
  mascotBaseCss,
  mascotHtml,
  provenanceFooter,
  sectionsHtml,
} from "@/lib/render/templates/shared";
import type { CvTemplate, TemplateTheme } from "@/lib/render/templates/types";

function meadowCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    /* Warm ink on cream/sky paper — all WCAG-AA on the lightest paper tone
       (#fbf6ea). The faint tone #6a6147 ≈ 5.4:1, the floor for the small
       provenance/license/living/attribution footnotes (this style's failure
       mode: faint footer text on a soft sky). */
    --cv-ink:#33301f; --cv-ink-2:#4f4a32; --cv-muted:#5e5740; --cv-faint:#6a6147;
    --cv-rule: rgba(124,148,86,0.26); --cv-rule-strong: rgba(124,148,86,0.5); --cv-page:#fbf6ea;
    /* Pastoral palette. */
    --sky-top:#ffe9d4; --sky-mid:#fdf3e2; --sky-low:#cfe7ef; --sky-bot:#bfe0e7;
    --hill-far:#bcd79a; --hill-mid:#9ec977; --hill-near:#7bb35a; --hill-fore:#5d9a47;
    /* leaf / sky-blue darkened from #4e8a3f / #2f7aa6 so the bib/footer leaf links
       (was 3.87:1) and the ID/contact sky links (4.37:1) clear WCAG-AA on the
       lightest paper (#fbf6ea). Decorative uses (hill/leaf shapes, underlines)
       just deepen slightly. */
    --leaf:#3f7a31; --sky-blue:#2a6e96; --paper:#fbf6ea;
    --sun:#ffd27a;
    /* Sun + petals + headings pick up the user's accent, warmed toward gold. */
    --mw-sun: color-mix(in srgb, var(--cv-accent) 30%, #ffcf72);
    --mw-petal: color-mix(in srgb, var(--cv-accent) 36%, #ffd9c0);
    /* Gold base darkened from #c98a2e (which made the gold heading / honorific /
       self-name text only ~3.3:1 even after the accent mix) to #8f5e0e, so the
       mixed result stays ≥5:1 on paper for every accent. */
    --mw-gold: color-mix(in srgb, var(--cv-accent) 36%, #8f5e0e);
  }
  body {
    min-height:100vh; color:var(--cv-ink);
    font-family: ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
    /* The painted sky gradient, fixed behind everything. */
    background:
      linear-gradient(180deg,
        var(--sky-top) 0%, var(--sky-mid) 34%, var(--sky-low) 74%, var(--sky-bot) 100%);
    background-attachment: fixed;
  }
  /* Faint hand-made paper grain — a sparse warm speckle, no image. */
  body::after {
    content:""; position:fixed; inset:0; z-index:1; pointer-events:none; opacity:0.5;
    background-image:
      radial-gradient(rgba(120,96,60,0.05) 0.5px, transparent 1.4px),
      radial-gradient(rgba(120,96,60,0.04) 0.5px, transparent 1.4px);
    background-size: 7px 7px, 11px 11px; background-position: 0 0, 3px 5px;
    mix-blend-mode: multiply;
  }

  /* ===== The painted scene (all decorative, aria-hidden) ================== */
  .mw-scene { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }

  /* --- The sun: a soft warm disc that breathes (glow swells gently) ------- */
  .mw-sun {
    position:absolute; top:7%; right:13%; width:148px; height:148px; border-radius:50%;
    background: radial-gradient(circle at 50% 50%, #fffaf0 0%, var(--mw-sun) 46%, rgba(255,205,114,0) 72%);
    animation: mw-breathe 9s ease-in-out infinite;
  }
  .mw-sun::after {
    content:""; position:absolute; inset:-90%; border-radius:50%;
    background: radial-gradient(circle, color-mix(in srgb, var(--mw-sun) 60%, transparent) 0%, transparent 62%);
    animation: mw-breathe 9s ease-in-out infinite; animation-delay:-2s;
  }
  @keyframes mw-breathe {
    0%,100% { transform: scale(1); opacity:0.92; }
    50%     { transform: scale(1.06); opacity:1; }
  }

  /* --- Drifting clouds: soft blobs sliding slowly across the sky ---------- */
  .mw-cloud {
    position:absolute; border-radius:100px; background:rgba(255,255,255,0.82);
    box-shadow: 0 8px 24px -10px rgba(120,140,160,0.45);
    filter: blur(0.3px); will-change: transform;
  }
  /* Puff lobes give each cloud a hand-painted silhouette. */
  .mw-cloud::before, .mw-cloud::after {
    content:""; position:absolute; bottom:0; border-radius:50%; background:inherit;
  }
  .mw-cloud::before { width:55%; height:160%; left:14%; }
  .mw-cloud::after  { width:42%; height:130%; right:16%; }
  .mw-cl1 { top:13%; width:150px; height:42px; opacity:0.9;  animation: mw-drift 64s linear infinite; }
  .mw-cl2 { top:26%; width:108px; height:32px; opacity:0.8;  animation: mw-drift 92s linear infinite; animation-delay:-30s; }
  .mw-cl3 { top:38%; width:188px; height:50px; opacity:0.7;  animation: mw-drift 120s linear infinite; animation-delay:-66s; }
  @keyframes mw-drift { from { transform: translateX(-30vw); } to { transform: translateX(125vw); } }

  /* --- Rolling green hills: stacked wavy blobs with a gentle parallax sway - */
  .mw-hill {
    position:absolute; left:-12%; right:-12%; bottom:0; border-radius:48% 52% 0 0 / 100% 100% 0 0;
    transform-origin: 50% 100%; will-change: transform;
  }
  .mw-h1 { height:32vh; background: linear-gradient(180deg, var(--hill-far)  0%, #a9cd86 100%); opacity:0.78;
           animation: mw-sway 13s ease-in-out infinite; }
  .mw-h2 { height:25vh; background: linear-gradient(180deg, var(--hill-mid)  0%, #8cbe66 100%); opacity:0.9;
           border-radius:46% 54% 0 0 / 100% 100% 0 0; left:-18%; right:-6%;
           animation: mw-sway 11s ease-in-out infinite; animation-delay:-3s; }
  .mw-h3 { height:17vh; background: linear-gradient(180deg, var(--hill-near) 0%, #6aa84d 100%);
           border-radius:52% 48% 0 0 / 100% 100% 0 0; left:-6%; right:-16%;
           animation: mw-sway 9s  ease-in-out infinite; animation-delay:-1.5s; }
  .mw-h4 { height:10vh; background: linear-gradient(180deg, var(--hill-fore) 0%, #4e8a3f 100%);
           border-radius:50% 50% 0 0 / 100% 100% 0 0;
           animation: mw-sway 7.5s ease-in-out infinite; animation-delay:-4s; }
  @keyframes mw-sway {
    0%,100% { transform: translateX(-1.1%) scaleY(1); }
    50%     { transform: translateX(1.1%) scaleY(1.018); }
  }

  /* --- Swaying grass blades along the very bottom ------------------------- */
  .mw-grass { position:absolute; left:0; right:0; bottom:0; height:7vh; }
  .mw-blade {
    position:absolute; bottom:0; width:8px; height:100%;
    background: linear-gradient(180deg, #6aa84d 0%, #3f7a31 100%);
    border-radius:50% 50% 0 0 / 92% 92% 0 0; transform-origin:50% 100%;
    animation: mw-wave 4.2s ease-in-out infinite;
  }
  .mw-blade:nth-child(odd)  { height:84%; background: linear-gradient(180deg, #7bb35a 0%, #4e8a3f 100%); }
  .mw-blade:nth-child(3n)   { height:118%; animation-duration:5.1s; }
  .mw-blade:nth-child(4n)   { animation-duration:3.6s; }
  @keyframes mw-wave { 0%,100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }

  /* --- Falling / floating petals (the centrepiece) + rising fireflies ----- */
  .mw-fall { position:absolute; top:-6%; }
  .mw-petal {
    width:13px; height:13px;
    background: radial-gradient(circle at 32% 30%, #fff3ea 0%, var(--mw-petal) 60%, #f0a98c 100%);
    border-radius:80% 0 80% 0;
    box-shadow: 0 1px 2px rgba(140,90,70,0.18);
    animation: mw-spin 5.5s ease-in-out infinite;
  }
  .mw-leaf {
    width:14px; height:9px;
    background: radial-gradient(circle at 30% 30%, #b6d98c 0%, var(--leaf) 70%, #356b29 100%);
    border-radius:0 100% 0 100%;
    animation: mw-spin 6.5s ease-in-out infinite;
  }
  /* The descent: each .mw-fall column drifts down + sideways at staggered times. */
  .mw-fall { animation: mw-descend linear infinite; }
  .mw-f1 { left:9%;  animation-duration:15s; }
  .mw-f2 { left:24%; animation-duration:19s; animation-delay:-6s; }
  .mw-f3 { left:42%; animation-duration:13s; animation-delay:-3s; }
  .mw-f4 { left:58%; animation-duration:21s; animation-delay:-11s; }
  .mw-f5 { left:73%; animation-duration:17s; animation-delay:-8s; }
  .mw-f6 { left:88%; animation-duration:23s; animation-delay:-14s; }
  @keyframes mw-descend {
    from { transform: translate3d(0, -10vh, 0); opacity:0; }
    8%   { opacity:0.95; }
    50%  { transform: translate3d(38px, 52vh, 0); }
    92%  { opacity:0.95; }
    to   { transform: translate3d(-26px, 112vh, 0); opacity:0; }
  }
  @keyframes mw-spin {
    0%,100% { transform: rotate(-22deg); }
    50%     { transform: rotate(28deg); }
  }
  /* Tiny rising fireflies / sparkles near the hills, gently glowing. */
  .mw-fly {
    position:absolute; bottom:6vh; width:6px; height:6px; border-radius:50%;
    background: radial-gradient(circle, #fffbe6 0%, var(--mw-sun) 55%, rgba(255,210,122,0) 75%);
    animation: mw-rise linear infinite, mw-twinkle 2.4s ease-in-out infinite;
  }
  .mw-fly1 { left:18%; animation-duration:13s, 2.4s; }
  .mw-fly2 { left:37%; animation-duration:17s, 3.1s; animation-delay:-5s, -1s; }
  .mw-fly3 { left:55%; animation-duration:15s, 2.7s; animation-delay:-9s, -0.6s; }
  .mw-fly4 { left:71%; animation-duration:19s, 3.4s; animation-delay:-3s, -1.4s; }
  .mw-fly5 { left:86%; animation-duration:14s, 2.9s; animation-delay:-12s, -0.3s; }
  @keyframes mw-rise {
    from { transform: translate3d(0, 0, 0); opacity:0; }
    12%  { opacity:1; }
    50%  { transform: translate3d(20px, -34vh, 0); }
    88%  { opacity:1; }
    to   { transform: translate3d(-14px, -64vh, 0); opacity:0; }
  }
  @keyframes mw-twinkle { 0%,100% { filter:brightness(1); } 50% { filter:brightness(1.7); } }

  /* ===== The page (a soft cream paper card floating over the scene) ======= */
  .cv {
    position:relative; z-index:2; max-width:800px;
    padding: clamp(40px, 7vh, 72px) clamp(26px,5vw,56px) 16vh;
    margin: clamp(40px,8vh,90px) auto 9vh;
    background:
      linear-gradient(180deg, rgba(255,253,247,0.94), rgba(251,246,234,0.97));
    border:1px solid rgba(124,148,86,0.28); border-radius:28px;
    box-shadow:
      0 1px 0 rgba(255,255,255,0.8) inset,
      0 30px 70px -38px rgba(74,90,52,0.5),
      0 8px 26px -18px rgba(74,90,52,0.4);
  }

  /* ---- Header ------------------------------------------------------------ */
  header.cv-header { position:relative; margin-bottom:2rem; padding-bottom:1.3rem; }
  header.cv-header::after {
    /* a warm hand-painted underline wash under the whole header */
    content:""; position:absolute; left:0; right:0; bottom:0; height:3px; border-radius:3px;
    background: linear-gradient(90deg, var(--mw-gold) 0%, var(--leaf) 50%, transparent 100%);
    opacity:0.8;
  }
  header.cv-header h1 {
    font-size: clamp(2.2rem, 6vw, 3.6rem); font-weight:700; letter-spacing:0.002em; line-height:1.05;
    color: var(--cv-ink); text-wrap: balance;
  }
  header.cv-header .cv-honorific { color: var(--mw-gold); font-weight:700; }
  header.cv-header .cv-headline { font-style:italic; font-weight:500; color:var(--cv-ink-2); margin-top:0.45rem; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a { color: var(--sky-blue); }
  header.cv-header .cv-summary { color: var(--cv-ink-2); max-width:64ch; }
  .cv-self {
    color: var(--mw-gold) !important; font-weight:800;
    text-shadow: 0 1px 0 rgba(255,255,255,0.6);
  }
  .cv-photo {
    width:118px; height:118px; border-radius:50%; object-fit:cover;
    border:4px solid rgba(255,255,255,0.85);
    box-shadow: 0 0 0 2px var(--hill-near), 0 12px 30px -10px rgba(74,90,52,0.5);
  }

  /* ---- Sections: hand-painted leaf headings + soft bullets --------------- */
  section.cv-section { margin-top:2.4rem; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; display:flex; align-items:center; gap:0.6em;
    font-size:0.92rem; font-weight:700; text-transform:uppercase; letter-spacing:0.14em;
    color: var(--mw-gold); margin:0 0 1rem; padding-bottom:0.5rem;
  }
  /* A small soft leaf before each heading. */
  section.cv-section > h2::before {
    content:""; flex:none; width:0.78em; height:0.6em; border-radius:0 100% 0 100%;
    background: radial-gradient(circle at 30% 30%, #b6d98c, var(--leaf) 75%);
    transform: rotate(-12deg);
  }
  /* A warm watercolour underline that gets brushed in on reveal. */
  section.cv-section > h2::after {
    content:""; position:absolute; left:0; bottom:0; width:100%; height:3px; border-radius:3px; transform-origin:0 50%;
    background: linear-gradient(90deg, var(--mw-gold) 0 2.4rem, var(--cv-rule) 2.4rem);
  }
  ol.cv-bib > li::before {
    content:""; position:absolute; left:calc(var(--cv-hang) * -1); top:0.52em;
    width:8px; height:8px; border-radius:60% 0 60% 0;
    background: radial-gradient(circle at 32% 30%, #b6d98c, var(--hill-near) 78%);
    transform: rotate(-10deg);
  }
  ol.cv-bib > li { position:relative; }
  ol.cv-bib > li a { color: var(--leaf); text-decoration:none; border-bottom:1px solid rgba(78,138,63,0.3); }
  ol.cv-bib > li a:hover { border-bottom-color: var(--leaf); }
  .cv-prose-body p, ul.cv-prose-list > li { color: var(--cv-ink-2); }

  /* Footers — quiet but AA-legible; reuse + co-author links stay leaf-green. */
  .cv-provenance, .cv-license, .cv-attribution { color: var(--cv-faint); }
  .cv-living { color: var(--cv-muted); }
  .cv-attribution a, .cv-license a, .cv-coauthors-list a { color: var(--leaf); }
  .cv-provenance { border-top-color: var(--cv-rule); }

  /* ---- Motion: drift + settle (gated, per heading + per entry) ----------- */
  @keyframes mw-settle { from { opacity:0; transform: translateY(20px); filter: blur(4px); } to { opacity:1; transform:none; filter:none; } }
  @keyframes mw-float  { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform:none; } }
  @keyframes mw-brush  { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @supports (animation-timeline: view()) {
    section.cv-section > h2, .cv-prose-body > * {
      animation: mw-settle cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: cover 0% cover 12%;
    }
    section.cv-section > h2::after {
      animation: mw-brush cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: cover 2% cover 16%;
    }
    ol.cv-bib > li {
      animation: mw-float ease-out both;
      animation-timeline: view(); animation-range: cover 0% cover 12%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; }
    section.cv-section > h2, ol.cv-bib > li, .cv-prose-body > * { opacity:1 !important; transform:none !important; filter:none !important; }
    section.cv-section > h2::after { transform: scaleX(1) !important; }
  }

  @media (max-width: 560px) {
    .mw-sun { width:104px; height:104px; top:5%; right:9%; }
    .mw-cl3 { display:none; }
    .cv { margin-top: 8vh; border-radius:20px; }
  }

  @media print {
    .mw-scene { display:none !important; }
    body::after { display:none; }
    .cv { padding:0; margin:0; max-width:none; background:none; border:none; box-shadow:none; }
  }`;
}

/** Build the decorative scene markup (all aria-hidden, no JS, no assets). */
function meadowScene(): string {
  const clouds = `<span class="mw-cloud mw-cl1"></span><span class="mw-cloud mw-cl2"></span><span class="mw-cloud mw-cl3"></span>`;
  const hills = `<span class="mw-hill mw-h1"></span><span class="mw-hill mw-h2"></span><span class="mw-hill mw-h3"></span><span class="mw-hill mw-h4"></span>`;
  // A row of grass blades across the bottom (positioned via inline left%).
  const blades = Array.from({ length: 24 }, (_, i) => {
    const left = (i * (100 / 24) + 1).toFixed(2);
    const delay = (-(i % 7) * 0.4).toFixed(2);
    return `<span class="mw-blade" style="left:${left}%;animation-delay:${delay}s"></span>`;
  }).join("");
  // Falling petals/leaves: six staggered columns, alternating petal / leaf.
  const fall = [1, 2, 3, 4, 5, 6]
    .map((n) => {
      const kind = n % 2 === 0 ? "mw-leaf" : "mw-petal";
      return `<span class="mw-fall mw-f${n}"><span class="${kind}"></span></span>`;
    })
    .join("");
  const flies = `<span class="mw-fly mw-fly1"></span><span class="mw-fly mw-fly2"></span><span class="mw-fly mw-fly3"></span><span class="mw-fly mw-fly4"></span><span class="mw-fly mw-fly5"></span>`;
  return (
    `<div class="mw-scene" aria-hidden="true">` +
    `<span class="mw-sun"></span>` +
    clouds +
    hills +
    `<span class="mw-grass">${blades}</span>` +
    fall +
    flies +
    `</div>`
  );
}

const meadowMascotSkin = `
  /* ── Meadow mascot: a cream-and-sage watercolour storybook sprite ─────── */

  /* BODY — soft rounded square, watercolour cream-to-sage gradient,
     no hard outline, only a blurred warm drop-shadow and a faint
     sun-warm inner glow so it floats over the scene like a sticker. */
  .sm-fig {
    width: 38px; height: 38px;
    border-radius: 46% 54% 52% 48% / 50% 46% 54% 50%;   /* gently organic blob */
    background: radial-gradient(
      ellipse at 44% 38%,
      #fff8e8 0%,
      #fbf3df 28%,
      #dcefc0 62%,
      #cfe3b0 100%
    );
    border: none;
    box-shadow:
      0 0 0 2.5px rgba(255,255,255,0.72) inset,          /* soft inner highlight */
      0 4px 18px -4px rgba(74, 90, 52, 0.45),            /* warm green drop shadow */
      0 2px  8px -3px rgba(120, 96, 60, 0.28),           /* amber undertone shadow */
      0 0   22px  4px rgba(255, 220, 120, 0.22);         /* sun-warm outer glow */
    filter: drop-shadow(0 3px 6px rgba(60, 80, 30, 0.18));
    animation: mw-mascot-float 6s ease-in-out infinite;
  }
  @keyframes mw-mascot-float {
    0%, 100% { transform: translateY(0px) rotate(-1deg); }
    50%       { transform: translateY(-3px) rotate(1deg); }
  }

  /* SIGMA — warm brown-green, soft text-shadow glow so Σ reads on the
     cream body without a hard edge. Keep content/Σ from mascotBaseCss. */
  .sm-fig::before {
    color: #5a7a2e;
    text-shadow:
      0 0  5px rgba(255, 245, 200, 0.9),
      0 1px 2px rgba(255, 255, 255, 0.7),
      0 2px 6px rgba(90, 122, 46, 0.4);
    font-weight: 800;
  }

  /* FEET — two tiny rounded sage-green toes peeking out at the bottom.
     Achieved by shrinking and rounding the ::after pseudo-element and
     splitting it with a border trick. */
  .sm-fig::after {
    content: "";
    position: absolute;
    bottom: -5px; left: 50%; transform: translateX(-50%);
    width: 18px; height: 7px;
    background: transparent;
    border-radius: 0 0 40% 40%;
    box-shadow:
      -5px 0 0 5px #b5d48a,    /* left foot */
       5px 0 0 5px #b5d48a;    /* right foot */
    filter: drop-shadow(0 2px 2px rgba(74, 90, 52, 0.35));
  }

  /* DECO layer — rosy cheeks (::before) and a tiny leaf sprig (::after)
     perched on top of the body. */
  .sm-deco {
    pointer-events: none;
  }
  /* Left cheek */
  .sm-deco::before {
    content: "";
    position: absolute;
    bottom: 8px; left: 4px;
    width: 9px; height: 6px;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 60%, rgba(245, 160, 130, 0.72), rgba(245, 160, 130, 0) 80%);
    animation: mw-mascot-blush 6s ease-in-out infinite;
  }
  /* Right cheek */
  .sm-deco::after {
    content: "";
    position: absolute;
    bottom: 8px; right: 4px;
    width: 9px; height: 6px;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 60%, rgba(245, 160, 130, 0.72), rgba(245, 160, 130, 0) 80%);
    animation: mw-mascot-blush 6s ease-in-out infinite;
  }
  @keyframes mw-mascot-blush {
    0%, 100% { opacity: 0.75; }
    50%       { opacity: 1; }
  }

  /* Tiny leaf sprig on top — rendered as a rotated before on .sm-hat
     (which we must NOT change structurally per the layer contract),
     so we use a ::before on .sm-fig offset to the top-centre instead,
     placed above the Σ hat area. */
  .sm-fig .sm-deco {
    position: absolute;
    top: -7px; left: 50%; transform: translateX(-50%);
    width: 10px; height: 10px;
    pointer-events: none;
  }
  /* The leaf itself (a small rotated teardrop). */
  .sm-fig .sm-deco::before {
    top: auto; bottom: auto;
    left: 50%; transform: translateX(-50%) rotate(-30deg);
    width: 10px; height: 13px;
    border-radius: 0 80% 0 80%;
    background: radial-gradient(circle at 35% 30%, #c8e8a0, #5d9a47 80%);
    box-shadow: 0 1px 3px rgba(50, 90, 30, 0.35);
    animation: mw-mascot-leaf 5s ease-in-out infinite;
  }
  /* A tiny stem behind the leaf. */
  .sm-fig .sm-deco::after {
    top: auto; bottom: auto;
    left: 50%; transform: translateX(-40%) rotate(8deg);
    width: 3px; height: 8px;
    border-radius: 2px;
    background: linear-gradient(180deg, #7bb35a, #4e8a3f);
    box-shadow: none;
    animation: none;
    opacity: 0.85;
  }
  @keyframes mw-mascot-leaf {
    0%, 100% { transform: translateX(-50%) rotate(-30deg) scale(1); }
    50%       { transform: translateX(-50%) rotate(-22deg) scale(1.06); }
  }

  @media (prefers-reduced-motion: reduce) {
    .sm-fig, .sm-fig .sm-deco::before { animation: none !important; }
    .sm-deco::before, .sm-deco::after { animation: none !important; }
  }`;

export const meadowTemplate: CvTemplate = {
  key: "meadow",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + meadowCss(theme) + mascotBaseCss() + meadowMascotSkin;
    const body =
      mascotHtml(cv, sections) +
      meadowScene() +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
