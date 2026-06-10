// Ambient declaration for side-effect CSS imports (e.g. `import "./globals.css"`).
// TypeScript 6 (TS2882) requires a declaration for side-effect imports that have
// no type information; the bundler (Next.js / Turbopack) handles the actual CSS.
declare module "*.css";
