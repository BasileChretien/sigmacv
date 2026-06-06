import { createServer, type Server } from "node:http";
import worksFixture from "../../tests/fixtures/openalex-works.json" with { type: "json" };

// A tiny fixture OpenAlex server so the sync journey is deterministic. The app
// reaches it via OPENALEX_API_BASE (server-side fetch — Playwright page.route
// cannot intercept it).
let server: Server | null = null;

export async function startOpenAlexServer(): Promise<void> {
  const base = process.env.OPENALEX_API_BASE;
  if (!base) return;
  const url = new URL(base);
  const port = Number(url.port || "80");

  server = createServer((req, res) => {
    const reqUrl = new URL(req.url ?? "/", base);
    res.setHeader("Content-Type", "application/json");
    if (reqUrl.pathname === "/authors") {
      res.end(
        JSON.stringify({
          results: [
            {
              id: "https://openalex.org/A5001069481",
              display_name: "Basile Chrétien",
              orcid: "https://orcid.org/0000-0002-7483-2489",
              works_count: 3,
              cited_by_count: 1500,
              summary_stats: {
                "2yr_mean_citedness": 3.4,
                h_index: 12,
                i10_index: 8,
              },
            },
          ],
          meta: { next_cursor: null },
        }),
      );
      return;
    }
    if (reqUrl.pathname === "/works") {
      res.end(JSON.stringify({ results: worksFixture, meta: { next_cursor: null } }));
      return;
    }
    res.statusCode = 404;
    res.end("{}");
  });

  await new Promise<void>((resolve) => server!.listen(port, resolve));
}

export async function stopOpenAlexServer(): Promise<void> {
  if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
  server = null;
}
