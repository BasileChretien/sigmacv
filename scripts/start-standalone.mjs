// Start the production server the way the Docker image runs it: the standalone
// `server.js`, with the static assets and `public/` copied next to it (the
// Dockerfile's COPY lines do the same). Used by `npm run e2e:prod`; needs a
// build (`npm run build`) and the server's env in the environment.
//
//   PORT=3101 node scripts/start-standalone.mjs
import { spawn } from "node:child_process";
import { cpSync, existsSync } from "node:fs";
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

const child = spawn(process.execPath, [server], {
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "production" },
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
