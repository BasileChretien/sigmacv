# Product Hunt launch kit

Everything needed to launch SigmaCV on [Product Hunt](https://www.producthunt.com)
in one sitting. Maps to the discoverability roadmap items **O2** (tool
directories) and **G4** (listed where LLMs retrieve): the payoff is a high-authority
backlink to `sigmacv.org` and a discussion thread that search engines and LLMs
both index. Copy/paste and adapt.

> **Integrity guardrails (non-negotiable, carry from `DISCOVERABILITY-ROADMAP.md`).**
> No upvote-begging (against PH rules — "support us on PH" is fine, "please upvote"
> is not), no sockpuppets, no fake reviews, no incentivised votes. SigmaCV's whole
> brand is responsible/transparent; gaming the launch would poison it. Authentic
> engagement only — it also happens to be what wins Product of the Day.

---

## 1. Name

**SigmaCV**

_(Working title; ties to the Sigma-Score bibliometric index, may change. Don't
foreground the renaming on the launch — keep the listing clean and confident.)_

## 2. Tagline options (PH hard limit: 60 characters)

Pick one. The tagline is the single most important field — it appears in the feed,
search, and social cards. Character counts in brackets.

1. **The academic CV that builds itself — free & open source** _(55)_ ◀ **recommended**
2. Your academic CV, auto-built from the open research record _(58)_
3. Auto-build your academic CV from ORCID — free, open source _(58)_
4. Free, open-source academic CV builder, powered by ORCID _(55)_
5. Your publications → a polished academic CV, automatically _(56)_
6. Sign in with ORCID. Your academic CV builds itself. _(51)_

**Why #1:** leads with the benefit ("builds itself"), and "free & open source" is a
proven PH magnet. #2 is the strongest fallback if you'd rather not put "free" in
the tagline (it's covered everywhere else).

## 3. Short description (PH product-page description, ~260-char target)

> Keeping an academic CV current is a chore — SigmaCV does it for you. Sign in with
> your ORCID iD and it builds a clean CV from open research data, matched to you by
> identifier (never by name). Curate, pick a style, export to PDF/DOCX/LaTeX, or
> publish a living page. Free & open-source. _(≈265)_

Shorter fallback (~180):

> Sign in with ORCID and SigmaCV auto-builds a clean academic CV from open research
> data — curate it, style it, and export to PDF/DOCX/LaTeX or publish a living page.
> Free & open-source.

## 4. Topics / tags (PH allows up to 3)

PH topics come from a fixed picker — search these and choose the 3 closest matches:

- **Primary (recommended):** `Education` · `Open Source` · `Productivity`
- **Swap-ins if the picker surfaces them:** `Science` (very on-audience),
  `Career` / `Resumes` (high-intent), `Writing`, `Developer Tools` (for the
  self-host angle).

Lead with **Education** + **Open Source** — both have engaged PH audiences that
match SigmaCV, and "Open Source" pulls in the maker community that upvotes and
shares.

## 5. Links

| Field   | Value                                                                                  |
| ------- | -------------------------------------------------------------------------------------- |
| Website | `https://sigmacv.org`                                                                  |
| GitHub  | `https://github.com/BasileChretien/sigmacv`                                            |
| Makers  | Basile Chrétien (tag yourself as maker)                                                |
| Pricing | **Free** (select the "Free" pricing option; it's free for individuals + self-hostable) |

## 6. Maker's first comment (post immediately at launch)

**Paste verbatim** — written as plain text (Product Hunt comments don't reliably render
markdown, so emojis carry the structure; no `**bold**` that could show as literal
asterisks). The blank lines between paragraphs matter — keep them.

```
👋 Hi Product Hunt! I'm Basile — a pharmacist and researcher at Nagoya University, and SigmaCV is the tool I wish I'd had for the past decade.

Every time a funder, employer, or collaborator asked for my CV, I rebuilt it from scratch: reformatting citations by hand, digging up dates, redoing the whole layout for yet another template. Hours, every single time — a chore every academic knows.

So I built something to do it for me, and made it free, open-source, and not-for-profit.

How it works: you sign in with your ORCID iD, and SigmaCV assembles a clean, ready-to-use CV from the open research record — your publications, and where the data exists, your positions, education, funding, datasets, editorial roles, even clinical trials and patents (12 open sources in all). You start from a filled-in CV, not a blank page. Then you curate it, pick a style, and export — or publish a public page that keeps itself up to date.

A few things I care about that make it different:

🔎 It finds your work by identifier, never by name (ORCID / OpenAlex ID) — so it avoids the "someone else with my name" mix-up that plagues name-based tools, especially for common names and non-Latin scripts.

✋ You stay in control — mark anything "not mine" and it's hidden, never deleted. Nothing is invented; you decide what appears.

📄 One CV → 14 formats (PDF, Word, LaTeX, Markdown, BibTeX, NIH biosketch…) with identical, correctly-styled citations everywhere — plus 58 one-click funder/institution layouts (UKRI R4RI, Royal Society, NIH, NSF, ERC…), applied reversibly.

📊 Responsible metrics, or none at all — off by default, and when on it prefers field-normalized indicators and never shows a journal Impact Factor (in line with DORA).

🔒 Privacy-first — it reads only public metadata, never writes back to your records, asks per-field consent before anything goes public, and gives you full export + one-click deletion.

It's live in 10 languages at https://sigmacv.org — sign in with ORCID and watch your CV build itself. The code is on GitHub (Apache-2.0) and fully self-hostable.

I'd genuinely love your feedback: try it with your own ORCID and tell me what looks wrong or what's missing. The "not mine" corrections and the sections you choose are exactly what make the next version better. I'll be in the comments all day 🙏
```

**Tone notes:** personal founder story first, marketing second. Plain text + emoji
bullets read cleanly on PH. Ends on a clear, low-friction ask for feedback — not a
vote. ~380 words; if you want it shorter, cut the 🔎/✋/📄/📊/🔒 block down to your
top three.

**Prep a few canned replies** (you'll get these): "How is this different from ORCID's
own CV / Google Scholar?" → identifier-matching + every-format export + funder layouts,
none of which those do. "Is my data safe?" → reads only public metadata, never writes
back, per-field consent, export + delete. "Is it really free?" → yes for individuals,
and open-source + self-hostable so there's no lock-in.

## 7. Gallery shot list

PH gallery specs: **1270 × 760 px** (≈1.67:1), first image is the thumbnail/social
card. First slide must show the **product**, not a bare logo. Aim for 6–8 slides with
a consistent caption band (legible at small sizes). **All 8 slides below are now
produced** and every slide is now a file in `docs/images/` — ready to upload in order.

| #   | Slide                | Caption (overlay)                                                           | Asset                                        |
| --- | -------------------- | --------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | **Cover / hero**     | (baked into the image)                                                      | ✅ `docs/images/product-hunt-hero.png`       |
| 2   | Auto-built CV        | "From ORCID sign-in to a finished CV — your name highlighted automatically" | ✅ `docs/images/example-cv.png`              |
| 3   | Curation view        | "You stay in control: keep, reorder, hide, or mark 'not mine'"              | ✅ `docs/images/curate.png`                  |
| 4   | 58 one-click layouts | (baked in — funder grid)                                                    | ✅ `docs/images/product-hunt-models.png`     |
| 5   | Responsible metrics  | (baked in — off-by-default + DORA/Leiden)                                   | ✅ `docs/images/product-hunt-metrics.png`    |
| 6   | Export formats       | (baked in — all 14 formats)                                                 | ✅ `docs/images/product-hunt-formats.png`    |
| 7   | Living public page   | (baked in — re-syncing page + per-field consent)                            | ✅ `docs/images/product-hunt-public.png`     |
| 8   | The homepage         | "Sign in with your ORCID iD — your CV builds itself"                        | ✅ `docs/images/homepage.png` (optional 8th) |

Slides 1, 4, 5, 6, 7 are branded graphics (same indigo system); they use real product
data — the actual 14 export formats, real funder names, the real metric labels +
"DORA/Leiden, never a journal Impact Factor" line, and the real per-field publish
consent. Slides 2/3/8 are real product screenshots. (The export/model/metrics menus are
native OS dropdowns that can't be screenshotted expanded, which is why those slides are
designed graphics rather than raw captures.) Each `.png` has an editable `.svg` beside
it — tweak text/colour and re-render with `sharp({density:144})`.

**Design notes:** the set already shares a consistent indigo brand. If you shoot
anything new, keep backgrounds light and use illustrative / non-identifying content
(as the README screenshots do). A short 30–60 s screen-capture video in slot 1
(sign-in → CV appears → export) outperforms a static cover on PH if you have time —
but the captioned static hero is fine for v1.

## 8. Launch-day playbook

- **When:** PH's "day" flips at **12:01 am Pacific**. Submitting at/just after
  midnight PT gives a full 24 h on the leaderboard. Tue–Thu generally see the most
  traffic; avoid days with a huge tech launch dominating the feed.
- **Self-launch is fine** — you don't need a big-name hunter; makers can launch their
  own products. (If a well-followed hunter offers, great, but don't block on it.)
- **Post the maker's first comment the moment it goes live** (section 6).
- **Be present all day.** Reply to every comment quickly and substantively — engagement
  is what the ranking rewards and what converts curious visitors. Treat tough questions
  (privacy, "is my data safe", "how is this different from X") as gifts and answer them
  fully.
- **Tell your network the morning of** — email, academic Mastodon/Bluesky, ORCID/OpenAlex
  communities, relevant Slacks. Share the link and say what it is; **do not ask for
  upvotes** (PH rule). "We're live on Product Hunt today, would love your feedback" is
  the right framing.
- **After:** add the Product Hunt "Featured" badge/embed to the README and the site
  footer (extra backlink + social proof), and note the launch in `CHANGELOG.md`.

## 9. Pre-launch checklist (Basile — human actions)

- [ ] Product Hunt account in good standing; profile filled in (photo, bio, links).
- [ ] Product drafted in the PH submit flow with tagline (§2), description (§3),
      topics (§4), links (§5).
- [ ] Gallery: 6–8 images uploaded (§7) — cover slide designed, "capture" slides shot.
- [ ] Maker's first comment (§6) saved and ready to paste at go-live.
- [ ] Yourself tagged as maker; pricing set to **Free**.
- [ ] Scheduled for **12:01 am PT** on a Tue–Thu.
- [ ] Launch-morning announcement drafted for your network (no upvote ask).
- [ ] `sigmacv.org` healthy and ORCID sign-in verified working that morning.
- [ ] PH badge ready to add to README + site post-launch.

---

_See also: [`OUTREACH.md`](OUTREACH.md) (reusable pitch copy for libraries / DORA-CoARA /
open-metadata) and [`DISCOVERABILITY-ROADMAP.md`](DISCOVERABILITY-ROADMAP.md) (O2/G4 context)._
