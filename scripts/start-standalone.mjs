// Start the production server the way the Docker image runs it: the standalone
// `server.js`, with the static assets and `public/` copied next to it (the
// Dockerfile's COPY lines do the same). Used by `npm run e2e:prod`; needs a
// build (`npm run build`) and the server's env in the environment.
//
//   PORT=3101 node scripts/start-standalone.mjs
import { spawn } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";

const standalone = path.resolve(".next", "standalone");
const server = path.join(standalone, "server.js");

if (!existsSync(server)) {
  console.error(`No production build at ${server}. Run \`npm run build\` first.`);
  process.exit(1);
}

cpSync(path.resolve(".next", "static"), path.join(standalone, ".next", "static"), {
  recursive: true,
});
cpSync(path.resolve("public"), path.join(standalone, "public"), { recursive: true });

// Serve the build as it was built, also when it has been served before. Since
// 16.3.8 Next keeps a copy of each prerendered page it has answered, and reads
// it back after a restart. On a case-insensitive filesystem (Windows, macOS) a
// request for an address that differs from a page's only by case stores a 404
// over that page's copy, and a reused build would go on serving it (the
// mis-cased address test in `e2e/production/csp.spec.ts` has the mechanism).
// Next makes the copies again on first request. Production does not come
// through here (the image starts `server.js` itself) and runs on Linux, where
// the two names are two files.
rmSync(path.join(standalone, ".next", "server", "route-cache"), { recursive: true, force: true });

const child = spawn(process.execPath, [server], {
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "production" },
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
