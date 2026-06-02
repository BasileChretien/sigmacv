// Manually trigger the scheduled public-CV re-sync (also the cron's target).
// Usage: RESYNC_SECRET=… [APP_URL=http://localhost:3000] node scripts/resync.mjs
const base = process.env.APP_URL ?? "http://localhost:3000";
const secret = process.env.RESYNC_SECRET;

if (!secret) {
  console.error("RESYNC_SECRET is not set.");
  process.exit(1);
}

const res = await fetch(`${base}/api/internal/resync`, {
  method: "POST",
  headers: { Authorization: `Bearer ${secret}` },
});
const body = await res.text();
console.log(`${res.status} ${body}`);
process.exit(res.ok ? 0 : 1);
