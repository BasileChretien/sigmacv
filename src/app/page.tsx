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
    <div className="auth-shell">
      <header className="auth-nav">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true">
            Σ
          </span>
          SigmaCV
        </span>
        <Link href="/about">About</Link>
      </header>

      <main className="auth-main">
        <section className="hero">
          <span className="eyebrow">
            Open infrastructure for responsible research assessment
          </span>
          <h1 className="hero-title">
            Your academic CV, auto-built from the open record.
          </h1>
          <p className="hero-sub">
            Clean, customizable CVs generated from OpenAlex, ORCID, Crossref and
            DataCite — curate what&apos;s yours, pick a citation style, and
            export to PDF, DOCX, LaTeX or Markdown.
          </p>
          <ol className="hero-steps">
            <li>
              <span className="step-n">1</span>Sign in with your ORCID iD.
            </li>
            <li>
              <span className="step-n">2</span>Publications populate
              automatically from OpenAlex.
            </li>
            <li>
              <span className="step-n">3</span>Curate, style, and export — or
              publish a living page.
            </li>
          </ol>
        </section>

        <section className="auth-card card">
          <h2 className="auth-card-title">Sign in</h2>
          <p className="auth-card-sub muted">Free for individuals · open source</p>

          <form action={signInWithOrcid}>
            <button type="submit" className="btn btn-primary btn-lg auth-btn">
              <OrcidMark />
              Sign in with ORCID
            </button>
          </form>

          {enabledProviders.google || enabledProviders.email ? (
            <div className="auth-divider">
              <span>or</span>
            </div>
          ) : null}

          {enabledProviders.google ? (
            <form action={signInWithGoogle}>
              <button type="submit" className="btn auth-btn">
                Continue with Google
              </button>
            </form>
          ) : null}

          {enabledProviders.email ? (
            <form action={signInWithEmail} className="auth-email-row">
              <input type="email" name="email" required placeholder="you@university.edu" />
              <button type="submit" className="btn">
                Email link
              </button>
            </form>
          ) : null}

          <p className="auth-fineprint muted">
            Open source · Apache-2.0. SigmaCV reads only public research metadata
            and never logs your choices without explicit consent.
          </p>
        </section>
      </main>

      <footer className="auth-footer">
        <span className="muted">© SigmaCV · open source</span>
        <SiteLinks />
      </footer>
    </div>
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
