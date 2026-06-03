import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { enabledProviders } from "@/auth.config";
import SiteLinks from "@/components/SiteLinks";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/cv");

  async function signInWithOrcid() {
    "use server";
    await signIn("orcid", { redirectTo: "/cv" });
  }

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/cv" });
  }

  async function signInWithEmail(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    if (email) await signIn("email", { email, redirectTo: "/cv" });
  }

  return (
    <main className="container" style={{ maxWidth: 720, paddingTop: "4rem" }}>
      <h1 style={{ fontSize: "2.4rem", marginBottom: "0.5rem" }}>SigmaCV</h1>
      <p
        className="muted"
        style={{ fontSize: "1.15rem", marginTop: 0, marginBottom: "2rem" }}
      >
        Clean, customizable academic CVs auto-generated from open research data.
      </p>

      <ol
        className="muted"
        style={{ lineHeight: 1.9, marginBottom: "2rem", paddingLeft: "1.1rem" }}
      >
        <li>Sign in with your ORCID iD.</li>
        <li>Your publications populate automatically from OpenAlex.</li>
        <li>Curate them, pick a citation style, and export to PDF.</li>
      </ol>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 360 }}>
        <form action={signInWithOrcid}>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ fontSize: "1.05rem", width: "100%", justifyContent: "center" }}
          >
            <OrcidMark />
            Sign in with ORCID
          </button>
        </form>

        {enabledProviders.google ? (
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="btn"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Continue with Google
            </button>
          </form>
        ) : null}

        {enabledProviders.email ? (
          <form
            action={signInWithEmail}
            style={{ display: "flex", gap: "0.4rem" }}
          >
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.org"
              style={{
                flex: 1,
                padding: "0.5rem 0.6rem",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
              }}
            />
            <button type="submit" className="btn">
              Email me a link
            </button>
          </form>
        ) : null}
      </div>

      <p className="muted" style={{ marginTop: "2rem", fontSize: "0.85rem" }}>
        Open source · Apache-2.0 · Your data stays yours. SigmaCV reads only
        public research metadata and never logs your choices without explicit
        consent.
      </p>

      <footer
        className="site-footer"
        style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}
      >
        <Link href="/about" className="muted">
          About
        </Link>
        <SiteLinks />
      </footer>
    </main>
  );
}

function OrcidMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 256 256"
      aria-hidden="true"
      style={{ display: "inline-block" }}
    >
      <circle cx="128" cy="128" r="128" fill="#ffffff" opacity="0.18" />
      <path
        fill="currentColor"
        d="M86 70a14 14 0 1 1-28 0 14 14 0 0 1 28 0zM72 96h22v98H72zM118 96h42c34 0 52 24 52 49 0 27-21 49-52 49h-42zm22 20v58h18c24 0 30-18 30-29 0-18-11-29-31-29z"
      />
    </svg>
  );
}
