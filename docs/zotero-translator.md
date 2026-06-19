# Saving a SigmaCV page to Zotero / Mendeley

A published SigmaCV page (`https://sigmacv.org/p/<slug>`) is **already importable
into Zotero, Mendeley, and other reference managers — no setup required.** Every
publication on the page carries an invisible [COinS](https://ocoins.info)
(ContextObjects in Spans) element with its OpenURL metadata, which those tools'
browser connectors read automatically.

## What works today (nothing to install or submit)

- **Zotero** — with the [Zotero Connector](https://www.zotero.org/download/connectors)
  installed, open a public CV page and click the toolbar button. Because the page
  exposes one COinS record per publication, the connector shows the **folder /
  multi-item picker** (the same UX as a Google Scholar results page): tick the
  works you want and save them all at once. Zotero's built-in **COinS** translator
  does this — no SigmaCV-specific translator is needed.
- **Mendeley** and other connectors that read COinS behave the same way.
- **Machine formats** — the same page is also available as BibTeX, CSL-JSON, and
  JSON-LD by suffix or content negotiation, e.g.:
  - `https://sigmacv.org/p/<slug>.bib`
  - `https://sigmacv.org/p/<slug>.csl.json`
  - `https://sigmacv.org/p/<slug>.jsonld`
  - and a per-publication "Cite" menu (BibTeX / RIS / CSL-JSON) under each entry.

So for end users, the feature is **done** — the on-page hint points them at it.

## Optional: a dedicated Zotero translator (a visibility play)

You do **not** need a custom translator for saving to work (COinS already covers
it). The only reasons to add one to the public
[`zotero/translators`](https://github.com/zotero/translators) repository are:

1. **Recognition** — the connector shows "SigmaCV" as the source rather than the
   generic COinS handler.
2. **A richer mapping** — e.g. also capturing the CV owner (from the page's
   `Person` JSON-LD) or tuning item types.

Being in Zotero's translator set is genuine visibility with the research-tools
community, so it can be worth doing around a release.

### Starting-point translator

> ⚠️ **Test this in [Zotero's Scaffold](https://www.zotero.org/support/dev/translators/coding)
> before submitting.** It is a draft, not a tested translator. Scaffold assigns
> the real `translatorID` and `lastUpdated`; the values below are placeholders.

```javascript
{
	"translatorID": "REPLACE-WITH-SCAFFOLD-GENERATED-UUID",
	"label": "SigmaCV",
	"creator": "SigmaCV contributors",
	"target": "^https?://([^/]+\\.)?sigmacv\\.org/p/",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "REPLACE"
}

function detectWeb(doc, _url) {
	// A SigmaCV public CV page carries one COinS span per publication.
	return doc.getElementsByClassName("Z3988").length > 0 ? "multiple" : false;
}

async function doWeb(doc, _url) {
	// Hand off to Zotero's built-in COinS translator, which yields one item per
	// span.Z3988 on the page. (Confirm the COinS translatorID in Scaffold.)
	const coins = Zotero.loadTranslator("web");
	coins.setTranslator("05d07af9-105a-4572-99f6-a8e231c2cef8"); // COinS — verify
	coins.setDocument(doc);
	await coins.translate();
	// Optional enhancement: read the page's <script type="application/ld+json">
	// Person object to attach the CV owner / homepage to each saved item.
}
```

### Submitting it

1. Install Zotero + the [translator dev tools](https://www.zotero.org/support/dev/translators/coding)
   (Scaffold).
2. Load the draft, set the metadata, and test `detectWeb` / `doWeb` against a few
   live `https://sigmacv.org/p/<slug>` pages (ideally CVs with many publications).
3. Open a PR against [`zotero/translators`](https://github.com/zotero/translators)
   following their [contribution guide](https://github.com/zotero/translators#readme).

When merged, every Zotero user gets the SigmaCV-labelled save automatically.
