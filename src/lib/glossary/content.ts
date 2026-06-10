// Localized content for the /glossary surface (one entry per locale × slug).
// Structure (block types, heading ids, CTA hrefs) is single-sourced from the
// `GLOSSARY_META` definition in `glossary.ts`; only the prose lives here, so an
// anchor or href can never drift between languages (the parity test in
// tests/glossary.test.ts enforces this). Non-English copy was machine-drafted and
// is flagged for a per-locale native-speaker review pass (cf. `landingContent.ts`).
import type { Locale } from "@/lib/i18n";
import type { GlossaryContent, GlossarySlug } from "./glossary";

export const GLOSSARY_CONTENT: Record<Locale, Record<GlossarySlug, GlossaryContent>> = {
  "en-US": {
    orcid: {
      term: "ORCID",
      short:
        "ORCID is a free, unique, persistent digital identifier that distinguishes you from every other researcher and links you to your work.",
      title: "What is ORCID?",
      description:
        "ORCID (Open Researcher and Contributor ID) is a free, persistent identifier that distinguishes researchers and links them to their publications. Here's what it is and why it matters for your academic CV.",
      blocks: [
        {
          type: "p",
          text: "ORCID — short for Open Researcher and Contributor ID — is a free, unique, persistent digital identifier for researchers, provided by the non-profit ORCID organisation at orcid.org. Your ORCID iD is a 16-digit number (for example, 0000-0002-1825-0097) that stays with you for your whole career.",
        },
        {
          type: "p",
          text: "Its purpose is disambiguation: it reliably distinguishes you from other researchers with the same or similar names, and it follows you across job moves, name changes and different publishers. Journals, funders and institutions increasingly use ORCID to connect you to your contributions automatically.",
        },
        {
          type: "h2",
          id: "why-it-matters",
          text: "Why ORCID matters for your CV",
        },
        {
          type: "p",
          text: "ORCID is the reliable anchor for an academic CV. Because it is an identifier rather than a name, tools can pull your verified publications and link your work without the false matches that plague name-based searches — which matters most for common names and names in non-Latin scripts.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "How SigmaCV uses ORCID",
        },
        {
          type: "p",
          text: "You sign in to SigmaCV with your ORCID iD. It reads your public ORCID record, resolves your OpenAlex author profile, and assembles your CV — matching your work by identifier, never by name. It only reads public metadata and never writes anything back to ORCID.",
        },
        {
          type: "cta",
          label: "Build your CV from ORCID",
          href: "/orcid-to-cv",
        },
      ],
      faq: [
        {
          q: "Is ORCID free?",
          a: "Yes — registering an ORCID iD at orcid.org is free and takes about a minute.",
        },
      ],
    },
    openalex: {
      term: "OpenAlex",
      short:
        "OpenAlex is a free, open catalogue of the world's scholarly works, authors, institutions and venues, run by the non-profit OurResearch.",
      title: "What is OpenAlex?",
      description:
        "OpenAlex is a free, fully open index of scholarly works, authors and institutions. Here's what it is, how it compares to proprietary databases, and how it powers your CV.",
      blocks: [
        {
          type: "p",
          text: "OpenAlex is a free and fully open catalogue of the global research literature — works, authors, institutions, venues and concepts — built and maintained by the non-profit OurResearch. It indexes hundreds of millions of works and offers an open API and open data, as a successor to the discontinued Microsoft Academic Graph.",
        },
        {
          type: "p",
          text: "It matters because it is an open alternative to proprietary databases like Scopus and Web of Science: anyone can use it, and it underpins discovery and citation analysis without a paywall or licence restriction.",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "OpenAlex and your CV",
        },
        {
          type: "p",
          text: "For an academic CV, OpenAlex is a broad, open source of your publications and their citation data, linked to you by your OpenAlex author identifier.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "How SigmaCV uses OpenAlex",
        },
        {
          type: "p",
          text: "SigmaCV resolves your OpenAlex author ID from your ORCID iD, imports your works, and — only if you opt in — derives field-normalized metrics from OpenAlex data, default off and DORA-aligned.",
        },
        {
          type: "cta",
          label: "Build your CV from OpenAlex",
          href: "/openalex-cv",
        },
      ],
      faq: [
        {
          q: "Is OpenAlex free?",
          a: "Yes — OpenAlex is fully open, with a free API and an open data licence.",
        },
      ],
    },
    fwci: {
      term: "FWCI",
      short:
        "The Field-Weighted Citation Impact (FWCI) compares a work's citations to the world average for works of the same field, type and year — so 1.0 means exactly average.",
      title: "What is the Field-Weighted Citation Impact (FWCI)?",
      description:
        "The Field-Weighted Citation Impact (FWCI) is a field-normalized citation metric where 1.0 is the world average. Here's what it means and how to use it responsibly on a CV.",
      blocks: [
        {
          type: "p",
          text: "The Field-Weighted Citation Impact (FWCI) is a citation metric that compares the citations a work has received to the average for works of the same field, type and publication year. A value of 1.0 means a work was cited exactly as often as expected; 2.0 means twice as often.",
        },
        {
          type: "p",
          text: "Field-normalization matters because citation rates differ enormously between fields — a highly cited mathematics paper and a highly cited biomedical paper have very different raw counts. FWCI puts them on a comparable scale.",
        },
        {
          type: "h2",
          id: "vs-h-index",
          text: "FWCI vs the h-index and raw counts",
        },
        {
          type: "p",
          text: "Unlike the h-index or raw citation counts, FWCI is comparable across disciplines and career stages, which makes it a more defensible indicator. It is still imperfect and should be read with context, not as a single verdict on quality.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Using FWCI on your CV (responsibly)",
        },
        {
          type: "p",
          text: "If you include metrics on a CV, a field-normalized indicator like FWCI is more responsible than a journal Impact Factor or a bare h-index — but DORA and the Leiden Manifesto are clear that metrics should support, not replace, expert judgement. SigmaCV keeps metrics off by default, opt-in, and field-normalized.",
        },
        {
          type: "cta",
          label: "Read: using metrics responsibly",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "What does an FWCI of 1.0 mean?",
          a: "Exactly the world average: the work has been cited as often as similar works (same field, type and year). Above 1.0 is above average.",
        },
      ],
    },
    "h-index": {
      term: "h-index",
      short:
        "The h-index is the largest number h such that you have h publications each cited at least h times.",
      title: "What is the h-index?",
      description:
        "The h-index is a researcher-level metric combining output and citations — but it has real limits. Here's what it measures and how to treat it on a CV.",
      blocks: [
        {
          type: "p",
          text: "The h-index is a single number that tries to capture both how much you publish and how often you are cited: it is the largest number h for which you have h publications that have each been cited at least h times. An h-index of 10 means you have 10 papers with at least 10 citations each.",
        },
        {
          type: "h2",
          id: "limits",
          text: "The limits of the h-index",
        },
        {
          type: "p",
          text: "The h-index depends heavily on field and career length: it grows over time and is far higher in fast-citing fields, so it is not comparable across disciplines or between researchers at different stages. It also undervalues early-career work and can be inflated.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Should you put your h-index on a CV?",
        },
        {
          type: "p",
          text: "It is optional and field-dependent. If you include it, give context and pair it with field-normalized indicators rather than presenting it alone — and remember that DORA and the Leiden Manifesto discourage over-reliance on any single number. SigmaCV's metrics are opt-in and prefer field-normalized indicators.",
        },
        {
          type: "cta",
          label: "Read: using metrics responsibly",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "Is the h-index a good measure of research quality?",
          a: "It is a rough proxy at best: it depends heavily on field and career length and is not comparable across disciplines. Field-normalized indicators are more defensible, and metrics should support, not replace, expert judgement.",
        },
      ],
    },
    csl: {
      term: "CSL",
      short:
        "The Citation Style Language (CSL) is an open standard for describing citation and bibliography formats, used by Zotero, Mendeley and many other tools.",
      title: "What is the Citation Style Language (CSL)?",
      description:
        "The Citation Style Language (CSL) is the open standard behind consistent citations in tools like Zotero. Here's what it is and why it keeps your CV's references identical everywhere.",
      blocks: [
        {
          type: "p",
          text: "The Citation Style Language (CSL) is an open, XML-based standard that describes how citations and bibliographies should be formatted. Thousands of styles — APA, Vancouver, Chicago, IEEE and many journal-specific formats — are defined in the open CSL styles repository, and tools such as Zotero and Mendeley use them.",
        },
        {
          type: "p",
          text: "Its value is consistency: one machine-readable definition of a style means every reference is formatted the same way, and you can switch styles instantly without reformatting anything by hand.",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "CSL and your CV",
        },
        {
          type: "p",
          text: "Formatting every reference on your CV through a single CSL style is what keeps your Word, PDF and LaTeX versions identical — the most common formatting failure on academic CVs is mixing styles or hand-formatting references inconsistently.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "How SigmaCV uses CSL",
        },
        {
          type: "p",
          text: "SigmaCV formats every citation through CSL (via citeproc-js), so you can pick any supported style and your publication list reads identically across every export format.",
        },
        {
          type: "cta",
          label: "Generate a formatted publication list",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "Can I change citation styles easily with CSL?",
          a: "Yes — that's the point. Choose any CSL style and every reference reformats consistently across all your CV's output formats.",
        },
      ],
    },
    "nih-biosketch": {
      term: "NIH biosketch",
      short:
        "An NIH biosketch is a short, structured CV the US National Institutes of Health requires in grant applications, highlighting your contributions to science and selected publications.",
      title: "What is an NIH biosketch?",
      description:
        "An NIH biosketch is a short, structured CV required in NIH grant applications. Here's what it includes, how it differs from a full academic CV, and how to draft one.",
      blocks: [
        {
          type: "p",
          text: 'An NIH biosketch is a short, structured CV that the US National Institutes of Health requires in grant applications. It is typically limited to five pages and has set sections: education and training, positions and honours, an optional personal statement, and a "contributions to science" section that highlights a handful of contributions, each with up to four supporting publications.',
        },
        {
          type: "p",
          text: "Its structure is deliberate: rather than an exhaustive list, it asks you to tell the story of your most important contributions and their impact.",
        },
        {
          type: "h2",
          id: "vs-cv",
          text: "Biosketch vs a full academic CV",
        },
        {
          type: "p",
          text: "A biosketch is much shorter and more narrative than a full academic CV, and it follows NIH's specific format. The practical approach is to keep a complete CV and derive the biosketch from it for each application.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "How SigmaCV helps",
        },
        {
          type: "p",
          text: "SigmaCV drafts an NIH-style biosketch from your ORCID and OpenAlex record: your publications are pulled in automatically, and you curate the contributions and selected publications before exporting.",
        },
        {
          type: "cta",
          label: "Generate an NIH biosketch",
          href: "/nih-biosketch",
        },
      ],
      faq: [
        {
          q: "How long is an NIH biosketch?",
          a: "Typically up to five pages. Always follow the current NIH instructions and forms for your specific funding opportunity.",
        },
      ],
    },
    preprint: {
      term: "preprint",
      short:
        "A preprint is a complete version of a scholarly paper shared publicly before, or instead of, formal peer review — typically on a server like arXiv, bioRxiv or medRxiv.",
      title: "What is a preprint?",
      description:
        "A preprint is a research paper shared publicly before peer review. Here's what it is, why preprints matter, and how to list them on an academic CV.",
      blocks: [
        {
          type: "p",
          text: "A preprint is a full draft of a research paper made publicly available before — or without — formal peer review, usually on a dedicated server such as arXiv (physics, maths, CS), bioRxiv (biology) or medRxiv (medicine). It carries a DOI and can be cited.",
        },
        {
          type: "p",
          text: "Preprints speed up the sharing of results and establish priority, and they are increasingly accepted as legitimate scholarly output — but because they have not been peer-reviewed, they should always be identified as preprints.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Listing preprints on a CV",
        },
        {
          type: "p",
          text: "Include your preprints, but label them clearly and keep them separate from peer-reviewed articles — don't present a preprint as a published paper, and avoid listing the same work twice (as both a preprint and the version of record) without making the relationship explicit.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Preprints in SigmaCV",
        },
        {
          type: "p",
          text: "SigmaCV pulls your preprints from the open record alongside your other work and lets you group and label them, so your CV represents them honestly.",
        },
        {
          type: "cta",
          label: "Generate a formatted publication list",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "Should I include preprints on my academic CV?",
          a: "Yes — preprints are increasingly accepted output — but label them clearly as preprints and keep them separate from peer-reviewed publications.",
        },
      ],
    },
    dora: {
      term: "DORA",
      short:
        "DORA, the San Francisco Declaration on Research Assessment, is a global declaration calling for research to be assessed on its own merits rather than by journal-based metrics like the Journal Impact Factor.",
      title: "What is DORA (the Declaration on Research Assessment)?",
      description:
        "DORA (the San Francisco Declaration on Research Assessment) calls for responsible research assessment. Here's what it is and what it means for metrics on a CV.",
      blocks: [
        {
          type: "p",
          text: "DORA — the San Francisco Declaration on Research Assessment — is a 2012 declaration, now signed by thousands of organisations and individuals worldwide, that sets out recommendations for improving how research is evaluated. Its central message: do not use journal-based metrics, such as the Journal Impact Factor, as a proxy for the quality of individual articles or researchers.",
        },
        {
          type: "p",
          text: "Instead, DORA asks that research be assessed on its own merits, that a range of outputs and impacts be valued, and that the limitations of metrics be made explicit.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "What DORA means for metrics on a CV",
        },
        {
          type: "p",
          text: "In practice: don't cite the Impact Factor of the journals your papers appeared in, lead with the work itself, and if you include metrics prefer field-normalized indicators with context. Many institutions and funders now assess applications in line with DORA.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "How SigmaCV aligns with DORA",
        },
        {
          type: "p",
          text: "SigmaCV is built to this stance: metrics are off by default and opt-in, it prefers field-normalized indicators over raw counts, and it never shows a journal Impact Factor.",
        },
        {
          type: "cta",
          label: "Read: using metrics responsibly",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "What does DORA say about the Journal Impact Factor?",
          a: "DORA explicitly recommends against using journal-based metrics like the Journal Impact Factor to assess the quality of individual research or researchers, because the JIF measures the journal, not the article.",
        },
      ],
    },
    "leiden-manifesto": {
      term: "Leiden Manifesto",
      short:
        "The Leiden Manifesto for research metrics is a set of ten principles for using quantitative research metrics responsibly — to support, not replace, expert judgement.",
      title: "What is the Leiden Manifesto?",
      description:
        "The Leiden Manifesto sets out ten principles for the responsible use of research metrics. Here's what it is and how it relates to assessing a CV.",
      blocks: [
        {
          type: "p",
          text: "The Leiden Manifesto for research metrics, published in Nature in 2015, is a set of ten principles for the responsible use of quantitative indicators in research assessment. Its core idea is that metrics should inform, not replace, expert judgement.",
        },
        {
          type: "p",
          text: "Among its principles: quantitative evaluation should support qualitative, expert assessment; measure performance against the mission of the group; account for differences between fields; keep data collection and analysis transparent; and recognise that indicators can be gamed and have systemic effects.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Why it matters for your CV",
        },
        {
          type: "p",
          text: "Like DORA, the Leiden Manifesto encourages reading metrics in context and not reducing a researcher to a single number. If you present metrics on a CV, choose field-normalized indicators, give context, and let your actual contributions lead.",
        },
        {
          type: "cta",
          label: "Read: using metrics responsibly",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "How is the Leiden Manifesto different from DORA?",
          a: "Both promote responsible research assessment. DORA focuses on not misusing journal-based metrics (like the Impact Factor) for individual assessment; the Leiden Manifesto gives ten broader principles for using any quantitative metric responsibly alongside expert judgement.",
        },
      ],
    },
  },
  "zh-CN": {
    orcid: {
      term: "ORCID",
      short:
        "ORCID 是一个免费、唯一、持久的数字标识符，用于区分您与其他研究者，并将您与您的研究成果相关联。",
      title: "什么是 ORCID？",
      description:
        "ORCID（开放研究者与贡献者标识符）是一个免费的持久标识符，用于区分研究者并将其与发表成果相关联。以下介绍它是什么，以及它对您的学术简历有何意义。",
      blocks: [
        {
          type: "p",
          text: "ORCID——Open Researcher and Contributor ID（开放研究者与贡献者标识符）的缩写——是由非营利组织 ORCID 在 orcid.org 为研究者提供的免费、唯一、持久的数字标识符。您的 ORCID iD 是一个 16 位数字（例如 0000-0002-1825-0097），将伴随您整个职业生涯。",
        },
        {
          type: "p",
          text: "其目的在于消除歧义：它能可靠地将您与同名或相似名称的其他研究者区分开来，并在您更换工作单位、姓名变更或与不同出版商合作时始终有效。期刊、资助机构和科研机构越来越多地使用 ORCID 自动关联您与您的研究贡献。",
        },
        {
          type: "h2",
          id: "why-it-matters",
          text: "ORCID 对您的简历有何意义",
        },
        {
          type: "p",
          text: "ORCID 是学术简历的可靠锚点。由于它是标识符而非姓名，工具可以提取您已验证的发表成果并关联您的工作，避免基于姓名搜索时常见的错误匹配——这对于常见姓名和非拉丁文字姓名尤为重要。",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "SigmaCV 如何使用 ORCID",
        },
        {
          type: "p",
          text: "您使用 ORCID iD 登录 SigmaCV。它读取您的公开 ORCID 记录，解析您的 OpenAlex 作者档案，并整合生成您的简历——通过标识符而非姓名匹配您的成果。它仅读取公开元数据，从不向 ORCID 写回任何内容。",
        },
        {
          type: "cta",
          label: "从 ORCID 生成简历",
          href: "/orcid-to-cv",
        },
      ],
      faq: [
        {
          q: "ORCID 是免费的吗？",
          a: "是的——在 orcid.org 注册 ORCID iD 完全免费，只需约一分钟。",
        },
      ],
    },
    openalex: {
      term: "OpenAlex",
      short:
        "OpenAlex 是由非营利组织 OurResearch 运营的全球学术成果、作者、机构和学术期刊的免费、开放目录。",
      title: "什么是 OpenAlex？",
      description:
        "OpenAlex 是学术成果、作者和机构的免费、完全开放的索引库。以下介绍它是什么、与专有数据库有何不同，以及它如何驱动您的简历生成。",
      blocks: [
        {
          type: "p",
          text: "OpenAlex 是一个覆盖全球研究文献的免费、完全开放的目录——包含成果、作者、机构、学术期刊和概念——由非营利组织 OurResearch 构建和维护，是已停用的 Microsoft Academic Graph 的继承者。它收录了数亿条成果，提供开放 API 和开放数据。",
        },
        {
          type: "p",
          text: "其重要性在于：它是 Scopus 和 Web of Science 等专有数据库的开放替代方案——任何人均可使用，且无需付费或许可限制即可支持文献发现和引用分析。",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "OpenAlex 与您的简历",
        },
        {
          type: "p",
          text: "对于学术简历而言，OpenAlex 是您发表成果及其引用数据的广泛开放来源，通过您的 OpenAlex 作者标识符与您相关联。",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "SigmaCV 如何使用 OpenAlex",
        },
        {
          type: "p",
          text: "SigmaCV 从您的 ORCID iD 解析您的 OpenAlex 作者 ID，导入您的成果，并——仅在您选择开启时——从 OpenAlex 数据中导出领域归一化指标，默认关闭，符合 DORA 原则。",
        },
        {
          type: "cta",
          label: "从 OpenAlex 生成简历",
          href: "/openalex-cv",
        },
      ],
      faq: [
        {
          q: "OpenAlex 是免费的吗？",
          a: "是的——OpenAlex 完全开放，提供免费 API 和开放数据许可。",
        },
      ],
    },
    fwci: {
      term: "FWCI",
      short:
        "领域加权引用影响力（FWCI）将一篇成果的引用次数与同领域、同类型、同发表年份成果的全球平均水平进行比较——1.0 表示恰好等于平均水平。",
      title: "什么是领域加权引用影响力（FWCI）？",
      description:
        "领域加权引用影响力（FWCI）是一种以 1.0 为全球平均值的领域归一化引用指标。以下介绍它的含义以及如何在简历中负责任地使用它。",
      blocks: [
        {
          type: "p",
          text: "领域加权引用影响力（FWCI）是一种引用指标，将一篇成果获得的引用次数与同领域、同类型、同发表年份成果的平均值进行比较。数值 1.0 表示该成果的引用次数恰好符合预期；2.0 表示为预期的两倍。",
        },
        {
          type: "p",
          text: "领域归一化至关重要，因为不同领域的引用率差异悬殊——一篇高被引数学论文与一篇高被引生物医学论文的原始引用次数可能大相径庭。FWCI 将它们置于可比的尺度之上。",
        },
        {
          type: "h2",
          id: "vs-h-index",
          text: "FWCI 与 h-index 及原始计数的比较",
        },
        {
          type: "p",
          text: "与 h-index 或原始引用次数不同，FWCI 在不同学科和职业阶段之间具有可比性，因此是更具可辩护性的指标。它仍不完善，应结合背景信息加以解读，而非作为质量的单一判定标准。",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "在简历中使用 FWCI（负责任地）",
        },
        {
          type: "p",
          text: "如果您在简历中列出指标，FWCI 等领域归一化指标比期刊影响因子或单独的 h-index 更为负责任——但 DORA 和 Leiden Manifesto 明确指出，指标应辅助而非替代专家判断。SigmaCV 将指标设为默认关闭、需主动开启，并优先选用领域归一化指标。",
        },
        {
          type: "cta",
          label: "阅读：负责任地使用指标",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "FWCI 为 1.0 是什么意思？",
          a: "恰好等于全球平均水平：该成果的引用次数与同类成果（同领域、同类型、同发表年份）相当。高于 1.0 表示高于平均水平。",
        },
      ],
    },
    "h-index": {
      term: "h-index",
      short: "h-index 是满足以下条件的最大整数 h：您至少有 h 篇发表成果，每篇各被引用至少 h 次。",
      title: "什么是 h-index？",
      description:
        "h-index 是兼顾产出量和引用量的研究者级别指标——但它有实质性的局限性。以下介绍它衡量的内容以及如何在简历中对待它。",
      blocks: [
        {
          type: "p",
          text: "h-index 是一个试图同时衡量发表数量和被引用频率的单一数字：它是满足以下条件的最大整数 h——您有 h 篇发表成果，每篇各被引用至少 h 次。h-index 为 10 意味着您有 10 篇论文，每篇各被引用至少 10 次。",
        },
        {
          type: "h2",
          id: "limits",
          text: "h-index 的局限性",
        },
        {
          type: "p",
          text: "h-index 在很大程度上取决于研究领域和职业年限：它随时间推移不断增长，在高引用率领域中远高于其他领域，因此在不同学科之间或不同职业阶段的研究者之间不具有可比性。它还低估了职业早期的工作价值，且可能被人为抬高。",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "简历中应列出 h-index 吗？",
        },
        {
          type: "p",
          text: "这是可选的，且取决于所在领域。如您确实要列出，请提供背景信息并搭配领域归一化指标，而非单独呈现——并请记住，DORA 和 Leiden Manifesto 不鼓励过度依赖任何单一数字。SigmaCV 的指标为选择性开启，优先选用领域归一化指标。",
        },
        {
          type: "cta",
          label: "阅读：负责任地使用指标",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "h-index 是衡量研究质量的好标准吗？",
          a: "充其量是粗略的替代指标：它在很大程度上取决于研究领域和职业年限，在不同学科之间不具有可比性。领域归一化指标更具可辩护性，且指标应辅助而非替代专家判断。",
        },
      ],
    },
    csl: {
      term: "CSL",
      short:
        "引文格式语言（CSL）是描述引用和参考文献格式的开放标准，被 Zotero、Mendeley 及众多其他工具所采用。",
      title: "什么是引文格式语言（CSL）？",
      description:
        "引文格式语言（CSL）是 Zotero 等工具中保持引用格式一致性的开放标准。以下介绍它是什么，以及为何它能确保您简历中的参考文献在所有输出格式下保持完全一致。",
      blocks: [
        {
          type: "p",
          text: "引文格式语言（CSL）是一种开放的基于 XML 的标准，用于描述引用和参考文献的格式规范。数千种格式样式——APA、Vancouver、Chicago、IEEE 及众多期刊专用格式——均在开放的 CSL 样式库中定义，Zotero 和 Mendeley 等工具均采用这些样式。",
        },
        {
          type: "p",
          text: "其价值在于一致性：一套机器可读的格式定义意味着每条参考文献的格式完全相同，且无需手动重新格式化即可即时切换格式样式。",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "CSL 与您的简历",
        },
        {
          type: "p",
          text: "通过统一的 CSL 格式样式处理简历中的每条参考文献，可确保您的 Word、PDF 和 LaTeX 版本格式一致——学术简历中最常见的格式失误，正是混用格式样式或手动格式化参考文献导致前后不一。",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "SigmaCV 如何使用 CSL",
        },
        {
          type: "p",
          text: "SigmaCV 通过 CSL（借助 citeproc-js）格式化每一条引用，因此您可以选择任何支持的格式样式，且您的发表成果列表在所有导出格式下呈现完全一致。",
        },
        {
          type: "cta",
          label: "生成格式化的发表成果列表",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "使用 CSL 可以轻松切换引用格式吗？",
          a: "可以——这正是 CSL 的意义所在。选择任意 CSL 格式样式，所有参考文献将在您简历的所有输出格式中统一重新格式化。",
        },
      ],
    },
    "nih-biosketch": {
      term: "NIH biosketch",
      short:
        "NIH 个人简介（NIH biosketch）是美国国立卫生研究院（NIH）在基金申请中要求提交的简短、结构化简历，重点突出您对科学的贡献及精选发表成果。",
      title: "什么是 NIH 个人简介（NIH biosketch）？",
      description:
        "NIH 个人简介（NIH biosketch）是 NIH 基金申请中要求的简短、结构化简历。以下介绍其包含内容、与完整学术简历的区别，以及如何准备。",
      blocks: [
        {
          type: "p",
          text: 'NIH 个人简介（NIH biosketch）是美国国立卫生研究院（NIH）在基金申请中要求提交的简短、结构化简历。通常限制在五页以内，包含固定板块：教育与培训经历、职务与荣誉、可选的个人陈述，以及"对科学的贡献"部分——该部分重点列出您的若干核心贡献，每项贡献附最多四篇支撑性发表成果。',
        },
        {
          type: "p",
          text: "其结构设计是刻意为之：相较于详尽的列表，它要求您讲述最重要贡献的故事及其影响。",
        },
        {
          type: "h2",
          id: "vs-cv",
          text: "个人简介与完整学术简历的比较",
        },
        {
          type: "p",
          text: "个人简介比完整学术简历篇幅短得多、叙述性更强，且须遵循 NIH 的特定格式。实际可行的做法是维护完整简历，并针对每次申请从中衍生出个人简介。",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "SigmaCV 如何提供帮助",
        },
        {
          type: "p",
          text: "SigmaCV 从您的 ORCID 和 OpenAlex 记录中起草 NIH 风格的个人简介：发表成果自动导入，您可在导出前整理贡献内容并精选发表成果。",
        },
        {
          type: "cta",
          label: "生成 NIH 个人简介",
          href: "/nih-biosketch",
        },
      ],
      faq: [
        {
          q: "NIH 个人简介的篇幅有多长？",
          a: "通常不超过五页。请务必遵循 NIH 针对您具体资助机会发布的最新说明和表格要求。",
        },
      ],
    },
    preprint: {
      term: "预印本",
      short:
        "预印本是在正式同行评审之前（或替代同行评审）公开分享的学术论文完整版本——通常发布在 arXiv、bioRxiv 或 medRxiv 等平台上。",
      title: "什么是预印本？",
      description:
        "预印本是在同行评审之前公开分享的研究论文。以下介绍它是什么、为何预印本重要，以及如何在学术简历中列出预印本。",
      blocks: [
        {
          type: "p",
          text: "预印本是在正式同行评审之前——或无需经过同行评审——在专用平台上公开发布的研究论文完整草稿，常见平台包括 arXiv（物理、数学、计算机科学）、bioRxiv（生物学）和 medRxiv（医学）。预印本附有 DOI，可被引用。",
        },
        {
          type: "p",
          text: "预印本加快了成果分享的速度并确立了优先权，且越来越多地被视为合法的学术产出——但由于尚未经过同行评审，应始终明确标注为预印本。",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "在简历中列出预印本",
        },
        {
          type: "p",
          text: "请列出您的预印本，但须清晰标注，并与同行评审论文分开——不要将预印本呈现为已发表论文，也不要在未明确说明关联关系的情况下将同一成果列出两次（如同时列为预印本和正式记录版本）。",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "SigmaCV 中的预印本处理",
        },
        {
          type: "p",
          text: "SigmaCV 从公开记录中与其他成果一并提取您的预印本，并允许您对其进行分组和标注，确保简历中对预印本的呈现真实准确。",
        },
        {
          type: "cta",
          label: "生成格式化的发表成果列表",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "学术简历中应包含预印本吗？",
          a: "应该——预印本日益获得认可——但需清晰标注为预印本，并与同行评审论文分开列出。",
        },
      ],
    },
    dora: {
      term: "DORA",
      short:
        "DORA，即《旧金山科研评估宣言》，是一项全球性宣言，呼吁根据研究成果本身而非期刊影响因子等期刊级别指标来评估研究。",
      title: "什么是 DORA（科研评估宣言）？",
      description:
        "DORA（《旧金山科研评估宣言》）呼吁负责任地开展科研评估。以下介绍它是什么，以及它对简历中指标使用的意义。",
      blocks: [
        {
          type: "p",
          text: "DORA——《旧金山科研评估宣言》——是一份发布于 2012 年的宣言，目前已获得全球数千个组织和个人的签署，就改善研究评估方式提出了一系列建议。其核心信息是：不应将期刊级别指标（如期刊影响因子）作为评估个人文章或研究者质量的替代标准。",
        },
        {
          type: "p",
          text: "相反，DORA 要求根据研究成果本身进行评估，重视多元化的产出和影响，并明确指出指标的局限性。",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "DORA 对简历中指标使用的意义",
        },
        {
          type: "p",
          text: "实际操作上：不要在简历中引用您论文所发表期刊的影响因子，以研究工作本身为重点，如需列出指标则优先选择有背景信息的领域归一化指标。目前许多机构和资助机构已按照 DORA 原则评估申请材料。",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "SigmaCV 如何与 DORA 保持一致",
        },
        {
          type: "p",
          text: "SigmaCV 的设计理念与此保持一致：指标默认关闭且需主动开启，优先选用领域归一化指标而非原始计数，且从不显示期刊影响因子。",
        },
        {
          type: "cta",
          label: "阅读：负责任地使用指标",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "DORA 对期刊影响因子有何立场？",
          a: "DORA 明确建议不要使用期刊影响因子等期刊级别指标来评估个人研究或研究者的质量，因为期刊影响因子衡量的是期刊，而非论文本身。",
        },
      ],
    },
    "leiden-manifesto": {
      term: "Leiden Manifesto",
      short:
        "《莱顿科研指标宣言》（Leiden Manifesto）是一套关于负责任地使用定量科研指标的十项原则——旨在辅助而非替代专家判断。",
      title: "什么是 Leiden Manifesto？",
      description:
        "《莱顿科研指标宣言》提出了负责任使用科研指标的十项原则。以下介绍它是什么及其与简历评估的关系。",
      blocks: [
        {
          type: "p",
          text: "《莱顿科研指标宣言》（Leiden Manifesto）于 2015 年发表于 Nature，是一套关于在科研评估中负责任地使用定量指标的十项原则。其核心理念是：指标应为专家判断提供信息，而非取而代之。",
        },
        {
          type: "p",
          text: "其原则包括：定量评估应支持而非取代定性专家评估；应结合团队使命衡量绩效；应考虑不同领域的差异；应保持数据收集和分析的透明度；并应认识到指标可能被操控且具有系统性影响。",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "这对您的简历有何意义",
        },
        {
          type: "p",
          text: "与 DORA 一样，Leiden Manifesto 鼓励结合背景解读指标，而非将研究者简化为单一数字。如您在简历中呈现指标，请选择领域归一化指标，提供背景信息，并让实际研究贡献居于主导地位。",
        },
        {
          type: "cta",
          label: "阅读：负责任地使用指标",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "Leiden Manifesto 与 DORA 有何不同？",
          a: "两者均倡导负责任的科研评估。DORA 侧重于不滥用期刊级别指标（如影响因子）进行个人评估；Leiden Manifesto 则提出了十项更广泛的原则，涵盖如何在专家判断的基础上负责任地使用任何定量指标。",
        },
      ],
    },
  },
  "es-ES": {
    orcid: {
      term: "ORCID",
      short:
        "ORCID es un identificador digital único, gratuito y persistente que le distingue de cualquier otro investigador y le vincula a su trabajo.",
      title: "¿Qué es ORCID?",
      description:
        "ORCID (Open Researcher and Contributor ID) es un identificador persistente y gratuito que distingue a los investigadores y los vincula a sus publicaciones. Esto es lo que es y por qué importa para su currículum académico.",
      blocks: [
        {
          type: "p",
          text: "ORCID —acrónimo de Open Researcher and Contributor ID— es un identificador digital único, gratuito y persistente para investigadores, proporcionado por la organización sin ánimo de lucro ORCID en orcid.org. Su ORCID iD es un número de 16 dígitos (por ejemplo, 0000-0002-1825-0097) que le acompañará durante toda su carrera.",
        },
        {
          type: "p",
          text: "Su propósito es la desambiguación: le distingue de forma fiable de otros investigadores con el mismo nombre o uno similar, y le sigue en los cambios de empleo, de nombre y de editoriales. Las revistas, los organismos financiadores y las instituciones utilizan cada vez más ORCID para vincularle automáticamente a sus contribuciones.",
        },
        {
          type: "h2",
          id: "why-it-matters",
          text: "Por qué ORCID importa para su CV",
        },
        {
          type: "p",
          text: "ORCID es el ancla fiable de un currículum académico. Al ser un identificador y no un nombre, las herramientas pueden recuperar sus publicaciones verificadas y vincular su trabajo sin las coincidencias falsas que aquejan a las búsquedas basadas en nombre —lo que más importa en el caso de nombres comunes y nombres escritos en alfabetos no latinos.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Cómo utiliza SigmaCV ORCID",
        },
        {
          type: "p",
          text: "Usted inicia sesión en SigmaCV con su ORCID iD. SigmaCV lee su registro público de ORCID, resuelve su perfil de autor en OpenAlex y compila su CV —identificando su trabajo por identificador, nunca por nombre—. Solo lee metadatos públicos y nunca escribe nada en ORCID.",
        },
        {
          type: "cta",
          label: "Genere su CV a partir de ORCID",
          href: "/orcid-to-cv",
        },
      ],
      faq: [
        {
          q: "¿Es gratuito ORCID?",
          a: "Sí: registrar un ORCID iD en orcid.org es gratuito y lleva aproximadamente un minuto.",
        },
      ],
    },
    openalex: {
      term: "OpenAlex",
      short:
        "OpenAlex es un catálogo gratuito y abierto de las obras académicas, autores, instituciones y publicaciones del mundo, gestionado por la organización sin ánimo de lucro OurResearch.",
      title: "¿Qué es OpenAlex?",
      description:
        "OpenAlex es un índice gratuito y totalmente abierto de obras académicas, autores e instituciones. Esto es lo que es, cómo se compara con las bases de datos propietarias y cómo impulsa su CV.",
      blocks: [
        {
          type: "p",
          text: "OpenAlex es un catálogo gratuito y totalmente abierto de la literatura de investigación global —obras, autores, instituciones, publicaciones y conceptos— construido y mantenido por la organización sin ánimo de lucro OurResearch. Indexa cientos de millones de obras y ofrece una API abierta y datos abiertos, como sucesor del Microsoft Academic Graph, que fue discontinuado.",
        },
        {
          type: "p",
          text: "Su importancia radica en que es una alternativa abierta a bases de datos propietarias como Scopus y Web of Science: cualquiera puede utilizarlo, y sustenta el descubrimiento y el análisis de citas sin barreras de pago ni restricciones de licencia.",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "OpenAlex y su CV",
        },
        {
          type: "p",
          text: "Para un currículum académico, OpenAlex es una fuente abierta y amplia de sus publicaciones y sus datos de citas, vinculados a usted mediante su identificador de autor en OpenAlex.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Cómo utiliza SigmaCV OpenAlex",
        },
        {
          type: "p",
          text: "SigmaCV resuelve su ID de autor en OpenAlex a partir de su ORCID iD, importa sus obras y —solo si usted lo activa— deriva indicadores normalizados por campo a partir de los datos de OpenAlex, desactivados por defecto y alineados con DORA.",
        },
        {
          type: "cta",
          label: "Genere su CV a partir de OpenAlex",
          href: "/openalex-cv",
        },
      ],
      faq: [
        {
          q: "¿Es gratuito OpenAlex?",
          a: "Sí: OpenAlex es completamente abierto, con una API gratuita y una licencia de datos abierta.",
        },
      ],
    },
    fwci: {
      term: "FWCI",
      short:
        "El Field-Weighted Citation Impact (FWCI) compara las citas de un trabajo con la media mundial de trabajos del mismo campo, tipo y año, de modo que 1,0 significa exactamente la media.",
      title: "¿Qué es el Field-Weighted Citation Impact (FWCI)?",
      description:
        "El Field-Weighted Citation Impact (FWCI) es una métrica de citas normalizada por campo en la que 1,0 equivale a la media mundial. Esto es lo que significa y cómo usarlo de forma responsable en un CV.",
      blocks: [
        {
          type: "p",
          text: "El Field-Weighted Citation Impact (FWCI) es una métrica de citas que compara las citas recibidas por un trabajo con la media de trabajos del mismo campo, tipo y año de publicación. Un valor de 1,0 significa que el trabajo fue citado exactamente con la frecuencia esperada; 2,0 significa el doble.",
        },
        {
          type: "p",
          text: "La normalización por campo es importante porque las tasas de citas difieren enormemente entre disciplinas: un artículo de matemáticas muy citado y uno biomédico muy citado tienen recuentos brutos muy diferentes. El FWCI los sitúa en una escala comparable.",
        },
        {
          type: "h2",
          id: "vs-h-index",
          text: "FWCI frente al h-index y los recuentos brutos",
        },
        {
          type: "p",
          text: "A diferencia del h-index o los recuentos brutos de citas, el FWCI es comparable entre disciplinas y etapas de carrera, lo que lo convierte en un indicador más defendible. Sigue siendo imperfecto y debe leerse con contexto, nunca como veredicto único sobre la calidad.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Usar el FWCI en su CV (con responsabilidad)",
        },
        {
          type: "p",
          text: "Si incluye métricas en un CV, un indicador normalizado por campo como el FWCI es más responsable que el factor de impacto de revista o un h-index aislado, pero DORA y el Leiden Manifesto son claros: las métricas deben apoyar, no sustituir, el juicio de los expertos. SigmaCV mantiene las métricas desactivadas por defecto, de activación opcional y normalizadas por campo.",
        },
        {
          type: "cta",
          label: "Leer: uso responsable de las métricas",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "¿Qué significa un FWCI de 1,0?",
          a: "Exactamente la media mundial: el trabajo ha sido citado con la misma frecuencia que trabajos similares (mismo campo, tipo y año). Por encima de 1,0 está por encima de la media.",
        },
      ],
    },
    "h-index": {
      term: "h-index",
      short:
        "El h-index es el mayor número h tal que usted tiene h publicaciones que han sido citadas al menos h veces cada una.",
      title: "¿Qué es el h-index?",
      description:
        "El h-index es una métrica a nivel de investigador que combina producción y citas, pero tiene limitaciones reales. Esto es lo que mide y cómo tratarlo en un CV.",
      blocks: [
        {
          type: "p",
          text: "El h-index es un único número que intenta capturar tanto la cantidad de publicaciones como la frecuencia con la que se le cita: es el mayor número h para el que usted tiene h publicaciones que han sido citadas al menos h veces cada una. Un h-index de 10 significa que tiene 10 artículos con al menos 10 citas cada uno.",
        },
        {
          type: "h2",
          id: "limits",
          text: "Las limitaciones del h-index",
        },
        {
          type: "p",
          text: "El h-index depende en gran medida del campo y de la duración de la carrera: crece con el tiempo y es mucho más alto en los campos con mayor velocidad de citación, por lo que no es comparable entre disciplinas ni entre investigadores en distintas etapas. También infravalora los trabajos de los investigadores en etapas iniciales y puede inflarse.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "¿Debería incluir su h-index en un CV?",
        },
        {
          type: "p",
          text: "Es opcional y depende del campo. Si lo incluye, aporte contexto y combínelo con indicadores normalizados por campo en lugar de presentarlo de forma aislada —y recuerde que DORA y el Leiden Manifesto desaconsejan la dependencia excesiva de cualquier número único—. Las métricas de SigmaCV son optativas y priorizan los indicadores normalizados por campo.",
        },
        {
          type: "cta",
          label: "Leer: uso responsable de las métricas",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "¿Es el h-index una buena medida de la calidad investigadora?",
          a: "En el mejor de los casos es una aproximación burda: depende en gran medida del campo y de la duración de la carrera y no es comparable entre disciplinas. Los indicadores normalizados por campo son más defendibles, y las métricas deben apoyar, no sustituir, el juicio de los expertos.",
        },
      ],
    },
    csl: {
      term: "CSL",
      short:
        "El Citation Style Language (CSL) es un estándar abierto para describir formatos de citas y bibliografías, utilizado por Zotero, Mendeley y muchas otras herramientas.",
      title: "¿Qué es el Citation Style Language (CSL)?",
      description:
        "El Citation Style Language (CSL) es el estándar abierto que subyace a las citas coherentes en herramientas como Zotero. Esto es lo que es y por qué mantiene las referencias de su CV idénticas en todos los formatos.",
      blocks: [
        {
          type: "p",
          text: "El Citation Style Language (CSL) es un estándar abierto basado en XML que describe cómo deben formatearse las citas y las bibliografías. Miles de estilos —APA, Vancouver, Chicago, IEEE y muchos formatos específicos de revistas— están definidos en el repositorio abierto de estilos CSL, y herramientas como Zotero y Mendeley los utilizan.",
        },
        {
          type: "p",
          text: "Su valor está en la coherencia: una única definición legible por máquina de un estilo significa que cada referencia se formatea del mismo modo, y se puede cambiar de estilo al instante sin reformatear nada a mano.",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "CSL y su CV",
        },
        {
          type: "p",
          text: "Formatear todas las referencias de su CV a través de un único estilo CSL es lo que mantiene idénticas sus versiones en Word, PDF y LaTeX: el fallo de formato más frecuente en los currículos académicos es mezclar estilos o formatear las referencias a mano de forma inconsistente.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Cómo utiliza SigmaCV CSL",
        },
        {
          type: "p",
          text: "SigmaCV formatea cada cita a través de CSL (mediante citeproc-js), de modo que puede elegir cualquier estilo compatible y su lista de publicaciones sea idéntica en todos los formatos de exportación.",
        },
        {
          type: "cta",
          label: "Genere una lista de publicaciones formateada",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "¿Puedo cambiar fácilmente de estilo de cita con CSL?",
          a: "Sí, esa es la idea. Elija cualquier estilo CSL y todas las referencias se reformatearán de forma coherente en todos los formatos de exportación de su CV.",
        },
      ],
    },
    "nih-biosketch": {
      term: "NIH biosketch",
      short:
        "Un NIH biosketch es un CV breve y estructurado que los Institutos Nacionales de Salud de EE. UU. (NIH) exigen en las solicitudes de financiación, destacando sus contribuciones a la ciencia y publicaciones seleccionadas.",
      title: "¿Qué es un NIH biosketch?",
      description:
        "Un NIH biosketch es un CV breve y estructurado requerido en las solicitudes de ayudas del NIH. Esto es lo que incluye, en qué se diferencia de un currículum académico completo y cómo redactarlo.",
      blocks: [
        {
          type: "p",
          text: "Un NIH biosketch es un CV breve y estructurado que los Institutos Nacionales de Salud de EE. UU. (NIH) exigen en las solicitudes de financiación. Suele estar limitado a cinco páginas y tiene secciones establecidas: formación y entrenamiento, cargos y distinciones, una declaración personal opcional y una sección de «contribuciones a la ciencia» que destaca un puñado de contribuciones, cada una con hasta cuatro publicaciones de respaldo.",
        },
        {
          type: "p",
          text: "Su estructura es deliberada: en lugar de una lista exhaustiva, le pide que cuente la historia de sus contribuciones más importantes y su impacto.",
        },
        {
          type: "h2",
          id: "vs-cv",
          text: "Biosketch frente a un currículum académico completo",
        },
        {
          type: "p",
          text: "Un biosketch es mucho más breve y narrativo que un currículum académico completo, y sigue el formato específico del NIH. El enfoque práctico es mantener un CV completo y derivar el biosketch de él para cada solicitud.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Cómo ayuda SigmaCV",
        },
        {
          type: "p",
          text: "SigmaCV elabora un biosketch de estilo NIH a partir de sus registros en ORCID y OpenAlex: sus publicaciones se importan automáticamente, y usted selecciona las contribuciones y las publicaciones elegidas antes de exportar.",
        },
        {
          type: "cta",
          label: "Genere un NIH biosketch",
          href: "/nih-biosketch",
        },
      ],
      faq: [
        {
          q: "¿Qué extensión tiene un NIH biosketch?",
          a: "Habitualmente hasta cinco páginas. Siga siempre las instrucciones y los formularios vigentes del NIH para su oportunidad de financiación específica.",
        },
      ],
    },
    preprint: {
      term: "preprint",
      short:
        "Un preprint es una versión completa de un artículo académico compartida públicamente antes de la revisión por pares formal, o en su lugar, habitualmente en un servidor como arXiv, bioRxiv o medRxiv.",
      title: "¿Qué es un preprint?",
      description:
        "Un preprint es un artículo de investigación compartido públicamente antes de la revisión por pares. Esto es lo que es, por qué importan los preprints y cómo listarlos en un currículum académico.",
      blocks: [
        {
          type: "p",
          text: "Un preprint es un borrador completo de un artículo de investigación puesto a disposición del público antes —o sin— revisión formal por pares, normalmente en un servidor especializado como arXiv (física, matemáticas, informática), bioRxiv (biología) o medRxiv (medicina). Lleva un DOI y puede citarse.",
        },
        {
          type: "p",
          text: "Los preprints aceleran la difusión de resultados y establecen la prioridad, y son cada vez más aceptados como producción científica legítima; pero como no han sido revisados por pares, siempre deben identificarse como preprints.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Incluir preprints en un CV",
        },
        {
          type: "p",
          text: "Incluya sus preprints, pero etiquételos claramente y manténgalos separados de los artículos revisados por pares: no presente un preprint como artículo publicado y evite listar el mismo trabajo dos veces (como preprint y como versión de registro) sin hacer explícita la relación entre ambos.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Preprints en SigmaCV",
        },
        {
          type: "p",
          text: "SigmaCV extrae sus preprints del registro abierto junto con el resto de su trabajo y le permite agruparlos y etiquetarlos, de modo que su CV los represente con honestidad.",
        },
        {
          type: "cta",
          label: "Genere una lista de publicaciones formateada",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "¿Debo incluir preprints en mi currículum académico?",
          a: "Sí —los preprints son una producción cada vez más aceptada—, pero etiquételos claramente como preprints y manténgalos separados de las publicaciones revisadas por pares.",
        },
      ],
    },
    dora: {
      term: "DORA",
      short:
        "DORA, la Declaración de San Francisco sobre Evaluación de la Investigación, es una declaración global que pide que la investigación se evalúe por sus propios méritos y no por métricas basadas en revistas como el factor de impacto.",
      title: "¿Qué es DORA (la Declaración sobre Evaluación de la Investigación)?",
      description:
        "DORA (la Declaración de San Francisco sobre Evaluación de la Investigación) aboga por una evaluación responsable de la investigación. Esto es lo que es y qué implica para las métricas en un CV.",
      blocks: [
        {
          type: "p",
          text: "DORA —la Declaración de San Francisco sobre Evaluación de la Investigación— es una declaración de 2012, firmada hoy por miles de organizaciones e individuos en todo el mundo, que establece recomendaciones para mejorar la forma en que se evalúa la investigación. Su mensaje central: no utilice métricas basadas en revistas, como el factor de impacto, como indicador sustitutivo de la calidad de artículos o investigadores individuales.",
        },
        {
          type: "p",
          text: "En su lugar, DORA pide que la investigación se evalúe por sus propios méritos, que se valore una amplia gama de productos e impactos, y que se hagan explícitas las limitaciones de las métricas.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Lo que DORA implica para las métricas en un CV",
        },
        {
          type: "p",
          text: "En la práctica: no cite el factor de impacto de las revistas en las que han aparecido sus artículos, dé protagonismo al trabajo en sí mismo y, si incluye métricas, prefiera los indicadores normalizados por campo con contexto. Muchas instituciones y organismos financiadores evalúan ahora las solicitudes en línea con DORA.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Cómo se alinea SigmaCV con DORA",
        },
        {
          type: "p",
          text: "SigmaCV está construido en torno a esta postura: las métricas están desactivadas por defecto y son optativas; prefiere los indicadores normalizados por campo frente a los recuentos brutos y nunca muestra el factor de impacto de revista.",
        },
        {
          type: "cta",
          label: "Leer: uso responsable de las métricas",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "¿Qué dice DORA sobre el factor de impacto de revista?",
          a: "DORA recomienda explícitamente no utilizar métricas basadas en revistas, como el factor de impacto, para evaluar la calidad de investigaciones o investigadores individuales, porque el JIF mide la revista, no el artículo.",
        },
      ],
    },
    "leiden-manifesto": {
      term: "Leiden Manifesto",
      short:
        "El Leiden Manifesto para las métricas de investigación es un conjunto de diez principios para utilizar los indicadores cuantitativos de investigación de forma responsable: para apoyar, no sustituir, el juicio de los expertos.",
      title: "¿Qué es el Leiden Manifesto?",
      description:
        "El Leiden Manifesto establece diez principios para el uso responsable de las métricas de investigación. Esto es lo que es y cómo se relaciona con la evaluación de un CV.",
      blocks: [
        {
          type: "p",
          text: "El Leiden Manifesto para las métricas de investigación, publicado en Nature en 2015, es un conjunto de diez principios para el uso responsable de indicadores cuantitativos en la evaluación de la investigación. Su idea central es que las métricas deben informar, no sustituir, el juicio de los expertos.",
        },
        {
          type: "p",
          text: "Entre sus principios: la evaluación cuantitativa debe apoyar la evaluación cualitativa de los expertos; medir el rendimiento en relación con la misión del grupo; tener en cuenta las diferencias entre campos; mantener la transparencia en la recopilación y el análisis de datos; y reconocer que los indicadores pueden manipularse y tienen efectos sistémicos.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Por qué importa para su CV",
        },
        {
          type: "p",
          text: "Al igual que DORA, el Leiden Manifesto fomenta la lectura de las métricas en contexto y no reducir a un investigador a un único número. Si presenta métricas en un CV, elija indicadores normalizados por campo, aporte contexto y deje que sus contribuciones reales ocupen el primer plano.",
        },
        {
          type: "cta",
          label: "Leer: uso responsable de las métricas",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "¿En qué se diferencia el Leiden Manifesto de DORA?",
          a: "Ambos promueven una evaluación responsable de la investigación. DORA se centra en no usar indebidamente las métricas basadas en revistas (como el factor de impacto) para la evaluación individual; el Leiden Manifesto ofrece diez principios más amplios para usar cualquier métrica cuantitativa de forma responsable junto con el juicio de los expertos.",
        },
      ],
    },
  },
  "fr-FR": {
    orcid: {
      term: "ORCID",
      short:
        "ORCID est un identifiant numérique unique, gratuit et pérenne qui vous distingue de tout autre chercheur et relie votre identité à vos travaux.",
      title: "Qu'est-ce qu'ORCID ?",
      description:
        "ORCID (Open Researcher and Contributor ID) est un identifiant pérenne gratuit qui distingue les chercheurs et les relie à leurs publications. Découvrez ce qu'il est et pourquoi il est essentiel pour votre CV académique.",
      blocks: [
        {
          type: "p",
          text: "ORCID — abréviation de Open Researcher and Contributor ID — est un identifiant numérique unique, gratuit et pérenne pour les chercheurs, fourni par l'organisation à but non lucratif ORCID sur orcid.org. Votre ORCID iD est un numéro à 16 chiffres (par exemple, 0000-0002-1825-0097) qui vous accompagne tout au long de votre carrière.",
        },
        {
          type: "p",
          text: "Son objectif est la désambiguïsation : il vous distingue de manière fiable des autres chercheurs portant des noms identiques ou similaires, et vous suit à travers les changements de poste, les changements de nom et les différents éditeurs. Les revues, les organismes de financement et les institutions utilisent de plus en plus ORCID pour vous relier automatiquement à vos contributions.",
        },
        {
          type: "h2",
          id: "why-it-matters",
          text: "Pourquoi ORCID est important pour votre CV",
        },
        {
          type: "p",
          text: "ORCID constitue l'ancre fiable d'un CV académique. Étant un identifiant et non un nom, les outils peuvent récupérer vos publications vérifiées et associer vos travaux sans les faux positifs qui affectent les recherches par nom — ce qui compte particulièrement pour les noms courants et les noms en graphies non latines.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Comment SigmaCV utilise ORCID",
        },
        {
          type: "p",
          text: "Vous vous connectez à SigmaCV avec votre ORCID iD. SigmaCV lit votre profil ORCID public, résout votre profil auteur OpenAlex et assemble votre CV — en associant vos travaux par identifiant, jamais par nom. Il ne lit que les métadonnées publiques et n'écrit jamais rien dans ORCID.",
        },
        {
          type: "cta",
          label: "Construire votre CV à partir d'ORCID",
          href: "/orcid-to-cv",
        },
      ],
      faq: [
        {
          q: "ORCID est-il gratuit ?",
          a: "Oui — l'enregistrement d'un ORCID iD sur orcid.org est gratuit et prend environ une minute.",
        },
      ],
    },
    openalex: {
      term: "OpenAlex",
      short:
        "OpenAlex est un catalogue gratuit et ouvert des travaux académiques, auteurs, institutions et revues du monde entier, géré par l'organisation à but non lucratif OurResearch.",
      title: "Qu'est-ce qu'OpenAlex ?",
      description:
        "OpenAlex est un index libre et totalement ouvert des travaux académiques, auteurs et institutions. Découvrez ce qu'il est, comment il se compare aux bases de données propriétaires et comment il alimente votre CV.",
      blocks: [
        {
          type: "p",
          text: "OpenAlex est un catalogue gratuit et totalement ouvert de la littérature scientifique mondiale — travaux, auteurs, institutions, revues et concepts — construit et maintenu par l'organisation à but non lucratif OurResearch. Il indexe des centaines de millions de travaux et propose une API ouverte ainsi que des données ouvertes, en tant que successeur du Microsoft Academic Graph, aujourd'hui abandonné.",
        },
        {
          type: "p",
          text: "Son importance tient au fait qu'il constitue une alternative ouverte aux bases de données propriétaires comme Scopus et Web of Science : n'importe qui peut l'utiliser, et il soutient la découverte et l'analyse des citations sans barrière tarifaire ni restriction de licence.",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "OpenAlex et votre CV",
        },
        {
          type: "p",
          text: "Pour un CV académique, OpenAlex est une source large et ouverte de vos publications et de leurs données de citation, reliées à vous via votre identifiant auteur OpenAlex.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Comment SigmaCV utilise OpenAlex",
        },
        {
          type: "p",
          text: "SigmaCV résout votre identifiant auteur OpenAlex à partir de votre ORCID iD, importe vos travaux et — uniquement si vous y consentez — calcule des indicateurs normalisés par le champ à partir des données OpenAlex, désactivés par défaut et alignés avec DORA.",
        },
        {
          type: "cta",
          label: "Construire votre CV à partir d'OpenAlex",
          href: "/openalex-cv",
        },
      ],
      faq: [
        {
          q: "OpenAlex est-il gratuit ?",
          a: "Oui — OpenAlex est entièrement ouvert, avec une API gratuite et une licence de données ouverte.",
        },
      ],
    },
    fwci: {
      term: "FWCI",
      short:
        "Le FWCI (Field-Weighted Citation Impact, ou impact de citation normalisé par le champ) compare les citations d'un travail à la moyenne mondiale des travaux du même domaine, du même type et de la même année — 1,0 signifie exactement la moyenne.",
      title: "Qu'est-ce que le FWCI (Field-Weighted Citation Impact) ?",
      description:
        "Le FWCI (Field-Weighted Citation Impact) est un indicateur bibliométrique normalisé par le champ où 1,0 correspond à la moyenne mondiale. Découvrez ce qu'il mesure et comment l'utiliser de façon responsable sur un CV.",
      blocks: [
        {
          type: "p",
          text: "Le FWCI (Field-Weighted Citation Impact) est un indicateur bibliométrique qui compare les citations reçues par un travail à la moyenne des travaux du même domaine, du même type et de la même année de publication. Une valeur de 1,0 signifie que le travail a été cité aussi souvent que prévu ; 2,0 signifie deux fois plus souvent.",
        },
        {
          type: "p",
          text: "La normalisation par le champ est essentielle car les taux de citation varient considérablement d'un domaine à l'autre — un article de mathématiques très cité et un article biomédical très cité affichent des chiffres bruts très différents. Le FWCI les place sur une échelle comparable.",
        },
        {
          type: "h2",
          id: "vs-h-index",
          text: "FWCI versus indice h et comptes bruts",
        },
        {
          type: "p",
          text: "Contrairement à l'indice h ou aux comptes bruts de citations, le FWCI est comparable entre disciplines et stades de carrière, ce qui en fait un indicateur plus défendable. Il reste imparfait et doit être interprété avec contexte, et non comme un verdict unique sur la qualité.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Utiliser le FWCI sur votre CV (de façon responsable)",
        },
        {
          type: "p",
          text: "Si vous incluez des indicateurs sur un CV, un indicateur normalisé par le champ comme le FWCI est plus responsable que le facteur d'impact d'une revue ou un indice h brut — mais DORA et le Leiden Manifesto sont clairs : les indicateurs doivent soutenir, et non remplacer, le jugement d'experts. SigmaCV maintient les indicateurs désactivés par défaut, optionnels et normalisés par le champ.",
        },
        {
          type: "cta",
          label: "Lire : utiliser les indicateurs de façon responsable",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "Que signifie un FWCI de 1,0 ?",
          a: "Exactement la moyenne mondiale : le travail a été cité aussi souvent que des travaux similaires (même domaine, type et année). Au-dessus de 1,0, on est au-dessus de la moyenne.",
        },
      ],
    },
    "h-index": {
      term: "h-index",
      short:
        "L'indice h (h-index) est le plus grand nombre h tel que vous avez h publications chacune citée au moins h fois.",
      title: "Qu'est-ce que l'indice h (h-index) ?",
      description:
        "L'indice h est un indicateur au niveau du chercheur qui combine production et citations — mais il présente des limites réelles. Découvrez ce qu'il mesure et comment le traiter sur un CV.",
      blocks: [
        {
          type: "p",
          text: "L'indice h est un chiffre unique qui tente de rendre compte à la fois de votre volume de publications et de la fréquence à laquelle vous êtes cité : c'est le plus grand nombre h pour lequel vous avez h publications ayant chacune été citée au moins h fois. Un indice h de 10 signifie que vous avez 10 articles comptant chacun au moins 10 citations.",
        },
        {
          type: "h2",
          id: "limits",
          text: "Les limites de l'indice h",
        },
        {
          type: "p",
          text: "L'indice h dépend fortement du domaine et de la durée de la carrière : il croît avec le temps et est bien plus élevé dans les domaines à citation rapide, si bien qu'il n'est pas comparable entre disciplines ni entre chercheurs à des stades différents. Il sous-estime également le travail en début de carrière et peut être artificiellement gonflé.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Faut-il mettre son indice h sur un CV ?",
        },
        {
          type: "p",
          text: "C'est optionnel et dépend du domaine. Si vous l'incluez, donnez du contexte et associez-le à des indicateurs normalisés par le champ plutôt que de le présenter seul — et gardez à l'esprit que DORA et le Leiden Manifesto déconseillent de se fier à un seul chiffre. Les indicateurs de SigmaCV sont optionnels et privilégient les indicateurs normalisés par le champ.",
        },
        {
          type: "cta",
          label: "Lire : utiliser les indicateurs de façon responsable",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "L'indice h est-il un bon indicateur de la qualité de la recherche ?",
          a: "C'est au mieux une approximation grossière : il dépend fortement du domaine et de la durée de carrière et n'est pas comparable entre disciplines. Les indicateurs normalisés par le champ sont plus défendables, et les indicateurs doivent soutenir, et non remplacer, le jugement d'experts.",
        },
      ],
    },
    csl: {
      term: "CSL",
      short:
        "Le Citation Style Language (CSL) est un standard ouvert pour décrire les formats de citation et de bibliographie, utilisé par Zotero, Mendeley et de nombreux autres outils.",
      title: "Qu'est-ce que le Citation Style Language (CSL) ?",
      description:
        "Le Citation Style Language (CSL) est le standard ouvert qui garantit la cohérence des citations dans des outils comme Zotero. Découvrez ce qu'il est et pourquoi il assure l'uniformité des références de votre CV.",
      blocks: [
        {
          type: "p",
          text: "Le Citation Style Language (CSL) est un standard ouvert en XML qui décrit comment les citations et les bibliographies doivent être mises en forme. Des milliers de styles — APA, Vancouver, Chicago, IEEE et de nombreux formats spécifiques à des revues — sont définis dans le dépôt ouvert CSL styles, et des outils tels que Zotero et Mendeley les utilisent.",
        },
        {
          type: "p",
          text: "Sa valeur réside dans la cohérence : une définition de style lisible par la machine signifie que chaque référence est mise en forme de manière identique, et vous pouvez changer de style instantanément sans reformater quoi que ce soit à la main.",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "Le CSL et votre CV",
        },
        {
          type: "p",
          text: "Mettre en forme toutes les références de votre CV via un unique style CSL est ce qui garantit l'uniformité de vos versions Word, PDF et LaTeX — l'erreur de mise en forme la plus fréquente sur les CVs académiques est le mélange de styles ou le formatage manuel incohérent des références.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Comment SigmaCV utilise le CSL",
        },
        {
          type: "p",
          text: "SigmaCV met en forme chaque citation via CSL (via citeproc-js), de sorte que vous pouvez choisir n'importe quel style supporté et votre liste de publications se présente de manière identique dans chaque format d'export.",
        },
        {
          type: "cta",
          label: "Générer une liste de publications mise en forme",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "Peut-on changer facilement de style de citation avec CSL ?",
          a: "Oui — c'est précisément l'intérêt. Choisissez n'importe quel style CSL et chaque référence se reformate de façon cohérente dans tous les formats de sortie de votre CV.",
        },
      ],
    },
    "nih-biosketch": {
      term: "NIH biosketch",
      short:
        "Un NIH biosketch est un CV court et structuré exigé par les National Institutes of Health américains dans les dossiers de demande de financement, mettant en avant vos contributions à la science et vos publications sélectionnées.",
      title: "Qu'est-ce qu'un NIH biosketch ?",
      description:
        "Un NIH biosketch est un CV court et structuré requis dans les demandes de financement auprès du NIH. Découvrez ce qu'il contient, en quoi il diffère d'un CV académique complet et comment en rédiger un.",
      blocks: [
        {
          type: "p",
          text: "Un NIH biosketch est un CV court et structuré que les National Institutes of Health américains exigent dans les dossiers de demande de financement. Il est généralement limité à cinq pages et comporte des sections prédéfinies : formation et cursus, postes et distinctions, une déclaration personnelle optionnelle, et une section « contributions à la science » qui met en avant une sélection de contributions, chacune accompagnée de quatre publications de référence au plus.",
        },
        {
          type: "p",
          text: "Sa structure est délibérée : plutôt qu'une liste exhaustive, il vous invite à raconter vos contributions les plus importantes et leur impact.",
        },
        {
          type: "h2",
          id: "vs-cv",
          text: "Biosketch versus CV académique complet",
        },
        {
          type: "p",
          text: "Un biosketch est bien plus court et plus narratif qu'un CV académique complet, et il suit le format spécifique du NIH. L'approche pratique consiste à conserver un CV complet et à en dériver le biosketch pour chaque candidature.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Comment SigmaCV aide",
        },
        {
          type: "p",
          text: "SigmaCV génère un biosketch au format NIH à partir de votre profil ORCID et OpenAlex : vos publications sont importées automatiquement, et vous sélectionnez les contributions et les publications retenues avant d'exporter.",
        },
        {
          type: "cta",
          label: "Générer un NIH biosketch",
          href: "/nih-biosketch",
        },
      ],
      faq: [
        {
          q: "Quelle est la longueur d'un NIH biosketch ?",
          a: "En général, cinq pages au maximum. Suivez toujours les instructions et formulaires NIH en vigueur pour votre appel à financement spécifique.",
        },
      ],
    },
    preprint: {
      term: "preprint",
      short:
        "Un préprint (preprint) est une version complète d'un article académique mise à disposition du public avant, ou en lieu et place d'une évaluation par les pairs formelle — généralement sur un serveur comme arXiv, bioRxiv ou medRxiv.",
      title: "Qu'est-ce qu'un préprint (preprint) ?",
      description:
        "Un préprint est un article de recherche rendu public avant évaluation par les pairs. Découvrez ce qu'il est, pourquoi les préprints sont importants et comment les lister sur un CV académique.",
      blocks: [
        {
          type: "p",
          text: "Un préprint est une version complète d'un article de recherche mise à disposition du public avant — ou sans — évaluation formelle par les pairs, généralement sur un serveur dédié tel qu'arXiv (physique, mathématiques, informatique), bioRxiv (biologie) ou medRxiv (médecine). Il porte un DOI et peut être cité.",
        },
        {
          type: "p",
          text: "Les préprints accélèrent le partage des résultats et établissent la priorité, et ils sont de plus en plus acceptés comme production académique légitime — mais, n'ayant pas été évalués par les pairs, ils doivent toujours être identifiés comme tels.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Lister les préprints sur un CV",
        },
        {
          type: "p",
          text: "Incluez vos préprints, mais étiquetez-les clairement et séparez-les des articles évalués par les pairs — ne présentez pas un préprint comme un article publié, et évitez de lister le même travail deux fois (comme préprint et comme version de référence) sans expliciter la relation entre les deux.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Les préprints dans SigmaCV",
        },
        {
          type: "p",
          text: "SigmaCV récupère vos préprints dans le registre ouvert aux côtés de vos autres travaux et vous permet de les regrouper et de les étiqueter, de sorte que votre CV les représente honnêtement.",
        },
        {
          type: "cta",
          label: "Générer une liste de publications mise en forme",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "Faut-il inclure les préprints sur son CV académique ?",
          a: "Oui — les préprints sont de plus en plus acceptés comme production — mais étiquetez-les clairement comme préprints et séparez-les des publications évaluées par les pairs.",
        },
      ],
    },
    dora: {
      term: "DORA",
      short:
        "DORA, la Déclaration de San Francisco sur l'évaluation de la recherche (San Francisco Declaration on Research Assessment), est une déclaration mondiale appelant à évaluer la recherche sur ses propres mérites plutôt qu'à partir d'indicateurs liés aux revues, comme le facteur d'impact.",
      title:
        "Qu'est-ce que DORA (la Déclaration de San Francisco sur l'évaluation de la recherche) ?",
      description:
        "DORA (la Déclaration de San Francisco sur l'évaluation de la recherche) plaide pour une évaluation responsable de la recherche. Découvrez ce qu'elle est et ce qu'elle implique pour les indicateurs sur un CV.",
      blocks: [
        {
          type: "p",
          text: "DORA — la Déclaration de San Francisco sur l'évaluation de la recherche (San Francisco Declaration on Research Assessment) — est une déclaration de 2012, désormais signée par des milliers d'organisations et d'individus dans le monde entier, qui formule des recommandations pour améliorer l'évaluation de la recherche. Son message central : ne pas utiliser les indicateurs liés aux revues, tels que le facteur d'impact, comme indicateur de substitution de la qualité des articles individuels ou des chercheurs.",
        },
        {
          type: "p",
          text: "Au contraire, DORA demande que la recherche soit évaluée sur ses propres mérites, qu'une diversité de productions et d'impacts soit valorisée, et que les limites des indicateurs soient explicitement reconnues.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Ce que DORA implique pour les indicateurs sur un CV",
        },
        {
          type: "p",
          text: "En pratique : ne citez pas le facteur d'impact des revues dans lesquelles vos articles ont été publiés, mettez en avant les travaux eux-mêmes, et si vous incluez des indicateurs, préférez les indicateurs normalisés par le champ accompagnés d'un contexte. De nombreuses institutions et organismes de financement évaluent désormais les candidatures en accord avec DORA.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Comment SigmaCV s'aligne sur DORA",
        },
        {
          type: "p",
          text: "SigmaCV est conçu selon cette philosophie : les indicateurs sont désactivés par défaut et optionnels, il privilégie les indicateurs normalisés par le champ aux comptes bruts, et n'affiche jamais le facteur d'impact d'une revue.",
        },
        {
          type: "cta",
          label: "Lire : utiliser les indicateurs de façon responsable",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "Que dit DORA à propos du facteur d'impact des revues ?",
          a: "DORA recommande explicitement de ne pas utiliser les indicateurs liés aux revues, comme le facteur d'impact, pour évaluer la qualité de la recherche individuelle ou des chercheurs, car le facteur d'impact mesure la revue, et non l'article.",
        },
      ],
    },
    "leiden-manifesto": {
      term: "Leiden Manifesto",
      short:
        "Le Leiden Manifesto pour les indicateurs de recherche est un ensemble de dix principes pour utiliser les indicateurs quantitatifs de manière responsable — pour soutenir, et non remplacer, le jugement d'experts.",
      title: "Qu'est-ce que le Leiden Manifesto ?",
      description:
        "Le Leiden Manifesto énonce dix principes pour un usage responsable des indicateurs de recherche. Découvrez ce qu'il est et ce qu'il implique pour l'évaluation d'un CV.",
      blocks: [
        {
          type: "p",
          text: "Le Leiden Manifesto pour les indicateurs de recherche, publié dans Nature en 2015, est un ensemble de dix principes pour l'utilisation responsable des indicateurs quantitatifs dans l'évaluation de la recherche. Son idée centrale est que les indicateurs doivent informer, et non remplacer, le jugement d'experts.",
        },
        {
          type: "p",
          text: "Parmi ses principes : l'évaluation quantitative doit soutenir l'expertise qualitative ; mesurer la performance en regard de la mission du groupe ; tenir compte des différences entre champs disciplinaires ; assurer la transparence de la collecte et de l'analyse des données ; et reconnaître que les indicateurs peuvent être manipulés et avoir des effets systémiques.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Pourquoi cela compte pour votre CV",
        },
        {
          type: "p",
          text: "Comme DORA, le Leiden Manifesto encourage à interpréter les indicateurs dans leur contexte et à ne pas réduire un chercheur à un seul chiffre. Si vous présentez des indicateurs sur un CV, choisissez des indicateurs normalisés par le champ, donnez du contexte, et laissez vos contributions réelles être au premier plan.",
        },
        {
          type: "cta",
          label: "Lire : utiliser les indicateurs de façon responsable",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "En quoi le Leiden Manifesto diffère-t-il de DORA ?",
          a: "Les deux promeuvent une évaluation responsable de la recherche. DORA se concentre sur la non-utilisation abusive des indicateurs liés aux revues (comme le facteur d'impact) pour l'évaluation individuelle ; le Leiden Manifesto formule dix principes plus larges pour utiliser n'importe quel indicateur quantitatif de façon responsable, en complément du jugement d'experts.",
        },
      ],
    },
  },
  "de-DE": {
    orcid: {
      term: "ORCID",
      short:
        "ORCID ist ein kostenloser, eindeutiger, dauerhafter digitaler Identifier, der Sie von jeder anderen Forscherin und jedem anderen Forscher unterscheidet und Sie mit Ihren Werken verknüpft.",
      title: "Was ist ORCID?",
      description:
        "ORCID (Open Researcher and Contributor ID) ist ein kostenloser, dauerhafter Identifier, der Forschende voneinander unterscheidet und sie mit ihren Publikationen verknüpft. Hier erfahren Sie, was es ist und warum es für Ihren akademischen Lebenslauf wichtig ist.",
      blocks: [
        {
          type: "p",
          text: "ORCID – kurz für Open Researcher and Contributor ID – ist ein kostenloser, eindeutiger, dauerhafter digitaler Identifier für Forschende, bereitgestellt von der gemeinnützigen ORCID-Organisation unter orcid.org. Ihre ORCID iD ist eine 16-stellige Nummer (zum Beispiel 0000-0002-1825-0097), die Sie über Ihre gesamte Karriere begleitet.",
        },
        {
          type: "p",
          text: "Ihr Zweck ist die Disambiguierung: Sie unterscheidet Sie zuverlässig von anderen Forschenden mit gleichen oder ähnlichen Namen und folgt Ihnen bei Stellenwechseln, Namensänderungen und unterschiedlichen Verlagen. Zeitschriften, Fördergeber und Institutionen nutzen ORCID zunehmend, um Sie automatisch mit Ihren Beiträgen zu verknüpfen.",
        },
        {
          type: "h2",
          id: "why-it-matters",
          text: "Warum ORCID für Ihren Lebenslauf wichtig ist",
        },
        {
          type: "p",
          text: "ORCID ist der zuverlässige Anker für einen akademischen Lebenslauf. Da es sich um einen Identifier und nicht um einen Namen handelt, können Tools Ihre verifizierten Publikationen abrufen und Ihre Arbeiten verknüpfen, ohne die Falschzuordnungen, die namensbasierte Suchen plagen – was bei häufigen Namen und Namen in nicht-lateinischen Schriften besonders wichtig ist.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Wie SigmaCV ORCID nutzt",
        },
        {
          type: "p",
          text: "Sie melden sich bei SigmaCV mit Ihrer ORCID iD an. Es liest Ihr öffentliches ORCID-Profil, löst Ihr OpenAlex-Autorenprofil auf und stellt Ihren Lebenslauf zusammen – Ihre Werke werden per Identifier abgeglichen, nie per Name. Es liest nur öffentliche Metadaten und schreibt nichts in ORCID zurück.",
        },
        {
          type: "cta",
          label: "Lebenslauf aus ORCID erstellen",
          href: "/orcid-to-cv",
        },
      ],
      faq: [
        {
          q: "Ist ORCID kostenlos?",
          a: "Ja – die Registrierung einer ORCID iD unter orcid.org ist kostenlos und dauert etwa eine Minute.",
        },
      ],
    },
    openalex: {
      term: "OpenAlex",
      short:
        "OpenAlex ist ein kostenloser, offener Katalog der wissenschaftlichen Werke, Autorinnen und Autoren, Institutionen und Publikationsorgane der Welt, betrieben von der gemeinnützigen Organisation OurResearch.",
      title: "Was ist OpenAlex?",
      description:
        "OpenAlex ist ein kostenloser, vollständig offener Index wissenschaftlicher Werke, Autorinnen und Autoren sowie Institutionen. Hier erfahren Sie, was es ist, wie es sich mit proprietären Datenbanken vergleicht und wie es Ihren Lebenslauf antreibt.",
      blocks: [
        {
          type: "p",
          text: "OpenAlex ist ein kostenloser und vollständig offener Katalog der weltweiten Forschungsliteratur – Werke, Autorinnen und Autoren, Institutionen, Publikationsorgane und Konzepte – erstellt und gepflegt von der gemeinnützigen Organisation OurResearch. Es indiziert Hunderte Millionen von Werken und bietet eine offene API sowie offene Daten als Nachfolger des eingestellten Microsoft Academic Graph.",
        },
        {
          type: "p",
          text: "Es ist bedeutsam, weil es eine offene Alternative zu proprietären Datenbanken wie Scopus und Web of Science ist: jede und jeder kann es nutzen, und es ermöglicht Entdeckung und Zitierungsanalyse ohne Bezahlschranke oder Lizenzbeschränkung.",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "OpenAlex und Ihr Lebenslauf",
        },
        {
          type: "p",
          text: "Für einen akademischen Lebenslauf ist OpenAlex eine breite, offene Quelle für Ihre Publikationen und deren Zitierungsdaten, verknüpft mit Ihnen über Ihren OpenAlex-Autorenidentifier.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Wie SigmaCV OpenAlex nutzt",
        },
        {
          type: "p",
          text: "SigmaCV löst Ihre OpenAlex-Autoren-ID aus Ihrer ORCID iD auf, importiert Ihre Werke und leitet – nur wenn Sie es aktivieren – feldnormierte Metriken aus OpenAlex-Daten ab, standardmäßig deaktiviert und DORA-konform.",
        },
        {
          type: "cta",
          label: "Lebenslauf aus OpenAlex erstellen",
          href: "/openalex-cv",
        },
      ],
      faq: [
        {
          q: "Ist OpenAlex kostenlos?",
          a: "Ja – OpenAlex ist vollständig offen, mit einer kostenlosen API und einer offenen Datenlizenz.",
        },
      ],
    },
    fwci: {
      term: "FWCI",
      short:
        "Der Field-Weighted Citation Impact (FWCI) vergleicht die Zitierungen eines Werks mit dem weltweiten Durchschnitt für Werke desselben Fachgebiets, Typs und Jahres – ein Wert von 1,0 bedeutet genau Durchschnitt.",
      title: "Was ist der Field-Weighted Citation Impact (FWCI)?",
      description:
        "Der Field-Weighted Citation Impact (FWCI) ist eine feldnormierte Zitierungsmetrik, bei der 1,0 dem Weltdurchschnitt entspricht. Hier erfahren Sie, was er bedeutet und wie Sie ihn verantwortungsvoll im Lebenslauf einsetzen.",
      blocks: [
        {
          type: "p",
          text: "Der Field-Weighted Citation Impact (FWCI) ist eine Zitierungsmetrik, die die erhaltenen Zitierungen eines Werks mit dem Durchschnitt für Werke desselben Fachgebiets, Typs und Veröffentlichungsjahres vergleicht. Ein Wert von 1,0 bedeutet, dass ein Werk genau so oft zitiert wurde wie erwartet; 2,0 bedeutet doppelt so oft.",
        },
        {
          type: "p",
          text: "Feldnormierung ist wichtig, weil die Zitierungsraten zwischen Fachgebieten enorm variieren – ein vielzitiertes Mathematikpapier und ein vielzitiertes biomedizinisches Papier haben sehr unterschiedliche rohe Zählwerte. Der FWCI bringt sie auf eine vergleichbare Skala.",
        },
        {
          type: "h2",
          id: "vs-h-index",
          text: "FWCI vs. h-Index und rohe Zählwerte",
        },
        {
          type: "p",
          text: "Anders als der h-Index oder rohe Zitierungszahlen ist der FWCI über Disziplinen und Karrierestufen hinweg vergleichbar, was ihn zu einem vertretbareren Indikator macht. Er ist immer noch unvollkommen und sollte im Kontext gelesen werden, nicht als alleiniges Qualitätsurteil.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "FWCI verantwortungsvoll im Lebenslauf einsetzen",
        },
        {
          type: "p",
          text: "Wenn Sie Metriken in einem Lebenslauf angeben, ist ein feldnormierter Indikator wie der FWCI verantwortungsvoller als ein Journal Impact Factor oder ein bloßer h-Index – aber DORA und das Leiden Manifesto machen deutlich, dass Metriken das Urteil von Fachleuten unterstützen, nicht ersetzen sollten. SigmaCV hält Metriken standardmäßig deaktiviert, opt-in und feldnormiert.",
        },
        {
          type: "cta",
          label: "Lesen: Metriken verantwortungsvoll einsetzen",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "Was bedeutet ein FWCI von 1,0?",
          a: "Genau der Weltdurchschnitt: Das Werk wurde so oft zitiert wie vergleichbare Werke (gleiches Fachgebiet, Typ und Jahr). Über 1,0 bedeutet überdurchschnittlich.",
        },
      ],
    },
    "h-index": {
      term: "h-Index",
      short:
        "Der h-Index ist die größte Zahl h, für die Sie h Publikationen haben, die jeweils mindestens h-mal zitiert wurden.",
      title: "Was ist der h-Index?",
      description:
        "Der h-Index ist eine Metrik auf Forscher-Ebene, die Output und Zitierungen kombiniert – aber er hat echte Grenzen. Hier erfahren Sie, was er misst und wie Sie ihn im Lebenslauf behandeln sollten.",
      blocks: [
        {
          type: "p",
          text: "Der h-Index ist eine einzelne Zahl, die sowohl erfassen soll, wie viel Sie publizieren, als auch wie oft Sie zitiert werden: Es ist die größte Zahl h, für die Sie h Publikationen haben, die jeweils mindestens h-mal zitiert wurden. Ein h-Index von 10 bedeutet, dass Sie 10 Artikel mit jeweils mindestens 10 Zitierungen haben.",
        },
        {
          type: "h2",
          id: "limits",
          text: "Die Grenzen des h-Index",
        },
        {
          type: "p",
          text: "Der h-Index hängt stark vom Fachgebiet und der Karrieredauer ab: Er wächst im Laufe der Zeit und ist in schnell zitierenden Fachgebieten viel höher, sodass er über Disziplinen und zwischen Forschenden in unterschiedlichen Stadien hinweg nicht vergleichbar ist. Er bewertet frühe Karrierephasen auch unter und kann aufgebläht sein.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Sollten Sie Ihren h-Index in einen Lebenslauf aufnehmen?",
        },
        {
          type: "p",
          text: "Das ist optional und fachgebietsabhängig. Wenn Sie ihn angeben, geben Sie Kontext und ergänzen Sie ihn durch feldnormierte Indikatoren, anstatt ihn allein darzustellen – und bedenken Sie, dass DORA und das Leiden Manifesto von einer übermäßigen Abhängigkeit von einer einzigen Zahl abraten. Die Metriken von SigmaCV sind opt-in und bevorzugen feldnormierte Indikatoren.",
        },
        {
          type: "cta",
          label: "Lesen: Metriken verantwortungsvoll einsetzen",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "Ist der h-Index ein gutes Maß für Forschungsqualität?",
          a: "Er ist bestenfalls eine grobe Annäherung: Er hängt stark vom Fachgebiet und der Karrieredauer ab und ist über Disziplinen hinweg nicht vergleichbar. Feldnormierte Indikatoren sind vertretbarer, und Metriken sollten das Urteil von Fachleuten unterstützen, nicht ersetzen.",
        },
      ],
    },
    csl: {
      term: "CSL",
      short:
        "Die Citation Style Language (CSL) ist ein offener Standard zur Beschreibung von Zitier- und Bibliografieformaten, der von Zotero, Mendeley und vielen anderen Tools verwendet wird.",
      title: "Was ist die Citation Style Language (CSL)?",
      description:
        "Die Citation Style Language (CSL) ist der offene Standard hinter einheitlichen Zitierungen in Tools wie Zotero. Hier erfahren Sie, was es ist und warum es dafür sorgt, dass die Referenzen in Ihrem Lebenslauf überall identisch sind.",
      blocks: [
        {
          type: "p",
          text: "Die Citation Style Language (CSL) ist ein offener, XML-basierter Standard, der beschreibt, wie Zitierungen und Bibliografien formatiert werden sollen. Tausende von Stilen – APA, Vancouver, Chicago, IEEE und viele zeitschriftenspezifische Formate – sind im offenen CSL-Styles-Repository definiert, und Tools wie Zotero und Mendeley nutzen sie.",
        },
        {
          type: "p",
          text: "Ihr Wert liegt in der Einheitlichkeit: Eine maschinenlesbare Definition eines Stils bedeutet, dass jede Referenz gleich formatiert wird, und Sie können Stile sofort wechseln, ohne irgendetwas manuell neu zu formatieren.",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "CSL und Ihr Lebenslauf",
        },
        {
          type: "p",
          text: "Das Formatieren aller Referenzen in Ihrem Lebenslauf durch einen einzigen CSL-Stil ist das, was Ihre Word-, PDF- und LaTeX-Versionen identisch hält – der häufigste Formatierungsfehler in akademischen Lebensläufen ist das Mischen von Stilen oder das inkonsistente manuelle Formatieren von Referenzen.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Wie SigmaCV CSL nutzt",
        },
        {
          type: "p",
          text: "SigmaCV formatiert jede Zitierung durch CSL (über citeproc-js), sodass Sie einen beliebigen unterstützten Stil wählen können und Ihre Publikationsliste über alle Exportformate hinweg identisch aussieht.",
        },
        {
          type: "cta",
          label: "Formatierte Publikationsliste erstellen",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "Kann ich mit CSL einfach Zitierstile wechseln?",
          a: "Ja – das ist der Sinn. Wählen Sie einen beliebigen CSL-Stil, und jede Referenz wird einheitlich über alle Ausgabeformate Ihres Lebenslaufs neu formatiert.",
        },
      ],
    },
    "nih-biosketch": {
      term: "NIH Biosketch",
      short:
        "Ein NIH Biosketch ist ein kurzer, strukturierter Lebenslauf, den das US-amerikanische National Institutes of Health (NIH) in Förderanträgen verlangt und der Ihre wissenschaftlichen Beiträge sowie ausgewählte Publikationen hervorhebt.",
      title: "Was ist ein NIH Biosketch?",
      description:
        "Ein NIH Biosketch ist ein kurzer, strukturierter Lebenslauf, der in NIH-Förderanträgen erforderlich ist. Hier erfahren Sie, was er enthält, wie er sich von einem vollständigen akademischen Lebenslauf unterscheidet und wie man ihn verfasst.",
      blocks: [
        {
          type: "p",
          text: "Ein NIH Biosketch ist ein kurzer, strukturierter Lebenslauf, den das US-amerikanische National Institutes of Health (NIH) in Förderanträgen verlangt. Er ist in der Regel auf fünf Seiten begrenzt und hat festgelegte Abschnitte: Ausbildung und Training, Positionen und Ehrungen, eine optionale persönliche Stellungnahme und einen Abschnitt „Contributions to Science“, der einige Beiträge hervorhebt, jeweils mit bis zu vier unterstützenden Publikationen.",
        },
        {
          type: "p",
          text: "Seine Struktur ist bewusst gestaltet: Anstatt einer erschöpfenden Liste bittet er Sie, die Geschichte Ihrer wichtigsten Beiträge und ihrer Wirkung zu erzählen.",
        },
        {
          type: "h2",
          id: "vs-cv",
          text: "Biosketch vs. vollständiger akademischer Lebenslauf",
        },
        {
          type: "p",
          text: "Ein Biosketch ist viel kürzer und narrativer als ein vollständiger akademischer Lebenslauf und folgt dem spezifischen Format des NIH. Der praktische Ansatz besteht darin, einen vollständigen Lebenslauf zu pflegen und den Biosketch für jede Bewerbung daraus abzuleiten.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Wie SigmaCV hilft",
        },
        {
          type: "p",
          text: "SigmaCV entwirft einen NIH-konformen Biosketch aus Ihrem ORCID- und OpenAlex-Profil: Ihre Publikationen werden automatisch abgerufen, und Sie kuratieren die Beiträge und ausgewählten Publikationen vor dem Export.",
        },
        {
          type: "cta",
          label: "NIH Biosketch erstellen",
          href: "/nih-biosketch",
        },
      ],
      faq: [
        {
          q: "Wie lang ist ein NIH Biosketch?",
          a: "In der Regel bis zu fünf Seiten. Befolgen Sie stets die aktuellen NIH-Anweisungen und Formulare für Ihre spezifische Fördermöglichkeit.",
        },
      ],
    },
    preprint: {
      term: "Preprint",
      short:
        "Ein Preprint ist eine vollständige Version eines wissenschaftlichen Artikels, die öffentlich zugänglich gemacht wird, bevor – oder anstelle von – einer formellen Begutachtung, typischerweise auf einem Server wie arXiv, bioRxiv oder medRxiv.",
      title: "Was ist ein Preprint?",
      description:
        "Ein Preprint ist ein Forschungsartikel, der öffentlich zugänglich gemacht wird, bevor er begutachtet wurde. Hier erfahren Sie, was er ist, warum Preprints wichtig sind und wie Sie sie in einem akademischen Lebenslauf aufführen.",
      blocks: [
        {
          type: "p",
          text: "Ein Preprint ist ein vollständiger Entwurf eines Forschungsartikels, der öffentlich zugänglich gemacht wird, bevor – oder ohne – eine formelle Begutachtung, üblicherweise auf einem dedizierten Server wie arXiv (Physik, Mathematik, Informatik), bioRxiv (Biologie) oder medRxiv (Medizin). Er trägt einen DOI und kann zitiert werden.",
        },
        {
          type: "p",
          text: "Preprints beschleunigen die Weitergabe von Ergebnissen und etablieren die Priorität. Sie werden zunehmend als legitime wissenschaftliche Leistung akzeptiert – da sie jedoch nicht begutachtet wurden, sollten sie stets als Preprints gekennzeichnet werden.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Preprints im Lebenslauf aufführen",
        },
        {
          type: "p",
          text: "Nehmen Sie Ihre Preprints auf, aber kennzeichnen Sie sie klar und halten Sie sie von begutachteten Artikeln getrennt – stellen Sie einen Preprint nicht als veröffentlichtes Papier dar, und vermeiden Sie es, dieselbe Arbeit zweimal aufzuführen (sowohl als Preprint als auch als Verlagsversion), ohne die Beziehung ausdrücklich zu machen.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Preprints in SigmaCV",
        },
        {
          type: "p",
          text: "SigmaCV ruft Ihre Preprints aus dem offenen Datenbestand neben Ihren übrigen Werken ab und ermöglicht Ihnen, sie zu gruppieren und zu kennzeichnen, sodass sie in Ihrem Lebenslauf ehrlich repräsentiert werden.",
        },
        {
          type: "cta",
          label: "Formatierte Publikationsliste erstellen",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "Sollte ich Preprints in meinen akademischen Lebenslauf aufnehmen?",
          a: "Ja – Preprints werden zunehmend als Leistung anerkannt – aber kennzeichnen Sie sie klar als Preprints und halten Sie sie von begutachteten Publikationen getrennt.",
        },
      ],
    },
    dora: {
      term: "DORA",
      short:
        "DORA, die San Francisco Declaration on Research Assessment, ist eine globale Erklärung, die fordert, Forschung nach ihren eigenen Verdiensten zu bewerten und nicht anhand zeitschriftenbasierter Metriken wie dem Journal Impact Factor.",
      title: "Was ist DORA (die Declaration on Research Assessment)?",
      description:
        "DORA (die San Francisco Declaration on Research Assessment) fordert eine verantwortungsvolle Forschungsbewertung. Hier erfahren Sie, was es ist und was es für Metriken in einem Lebenslauf bedeutet.",
      blocks: [
        {
          type: "p",
          text: "DORA – die San Francisco Declaration on Research Assessment – ist eine Erklärung aus dem Jahr 2012, die inzwischen von Tausenden von Organisationen und Einzelpersonen weltweit unterzeichnet wurde und Empfehlungen enthält, wie die Bewertung von Forschung verbessert werden kann. Ihre zentrale Botschaft: Verwenden Sie keine zeitschriftenbasierten Metriken, wie den Journal Impact Factor, als Stellvertreter für die Qualität einzelner Artikel oder Forschender.",
        },
        {
          type: "p",
          text: "Stattdessen fordert DORA, dass Forschung nach ihren eigenen Verdiensten bewertet wird, dass eine Bandbreite von Outputs und Wirkungen gewürdigt wird und dass die Grenzen von Metriken ausdrücklich gemacht werden.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Was DORA für Metriken im Lebenslauf bedeutet",
        },
        {
          type: "p",
          text: "In der Praxis: Zitieren Sie nicht den Impact Factor der Zeitschriften, in denen Ihre Artikel erschienen sind, stellen Sie die Arbeit selbst in den Vordergrund, und wenn Sie Metriken angeben, bevorzugen Sie feldnormierte Indikatoren mit Kontext. Viele Institutionen und Fördergeber bewerten Anträge inzwischen im Einklang mit DORA.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Wie SigmaCV sich an DORA orientiert",
        },
        {
          type: "p",
          text: "SigmaCV ist auf diese Grundlage ausgerichtet: Metriken sind standardmäßig deaktiviert und opt-in, es werden feldnormierte Indikatoren gegenüber rohen Zählwerten bevorzugt, und ein Journal Impact Factor wird nie angezeigt.",
        },
        {
          type: "cta",
          label: "Lesen: Metriken verantwortungsvoll einsetzen",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "Was sagt DORA über den Journal Impact Factor?",
          a: "DORA empfiehlt ausdrücklich, zeitschriftenbasierte Metriken wie den Journal Impact Factor nicht zur Bewertung der Qualität einzelner Forschungsleistungen oder Forschender zu verwenden, weil der JIF die Zeitschrift misst, nicht den Artikel.",
        },
      ],
    },
    "leiden-manifesto": {
      term: "Leiden Manifesto",
      short:
        "Das Leiden Manifesto für Forschungsmetriken ist eine Reihe von zehn Prinzipien für den verantwortungsvollen Umgang mit quantitativen Forschungsmetriken – zur Unterstützung, nicht als Ersatz des Urteils von Fachleuten.",
      title: "Was ist das Leiden Manifesto?",
      description:
        "Das Leiden Manifesto enthält zehn Prinzipien für den verantwortungsvollen Umgang mit Forschungsmetriken. Hier erfahren Sie, was es ist und wie es sich auf die Bewertung eines Lebenslaufs bezieht.",
      blocks: [
        {
          type: "p",
          text: "Das Leiden Manifesto für Forschungsmetriken, 2015 in Nature veröffentlicht, ist eine Reihe von zehn Prinzipien für den verantwortungsvollen Einsatz quantitativer Indikatoren in der Forschungsbewertung. Seine Kernidee: Metriken sollen das Urteil von Fachleuten informieren, nicht ersetzen.",
        },
        {
          type: "p",
          text: "Zu seinen Prinzipien gehören: Quantitative Bewertung soll qualitative, fachkundige Beurteilung unterstützen; Leistung soll an der Mission der Gruppe gemessen werden; Unterschiede zwischen Fachgebieten sind zu berücksichtigen; Datenerhebung und Analyse sind transparent zu halten; und es ist anzuerkennen, dass Indikatoren manipuliert werden können und systemische Auswirkungen haben.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Warum es für Ihren Lebenslauf wichtig ist",
        },
        {
          type: "p",
          text: "Wie DORA ermutigt das Leiden Manifesto dazu, Metriken im Kontext zu lesen und Forschende nicht auf eine einzige Zahl zu reduzieren. Wenn Sie Metriken in einem Lebenslauf präsentieren, wählen Sie feldnormierte Indikatoren, geben Sie Kontext an und lassen Sie Ihre tatsächlichen Beiträge den Vordergrund einnehmen.",
        },
        {
          type: "cta",
          label: "Lesen: Metriken verantwortungsvoll einsetzen",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "Wie unterscheidet sich das Leiden Manifesto von DORA?",
          a: "Beide fördern eine verantwortungsvolle Forschungsbewertung. DORA konzentriert sich darauf, den Missbrauch zeitschriftenbasierter Metriken (wie dem Impact Factor) für die Individualbewertung zu vermeiden; das Leiden Manifesto formuliert zehn umfassendere Prinzipien für den verantwortungsvollen Umgang mit jeglichen quantitativen Metriken neben dem Urteil von Fachleuten.",
        },
      ],
    },
  },
  "ja-JP": {
    orcid: {
      term: "ORCID",
      short:
        "ORCID は、あなたを他のすべての研究者から区別し、あなたの業績と紐付ける、無料で一意かつ永続的なデジタル識別子です。",
      title: "ORCIDとは何か",
      description:
        "ORCID（Open Researcher and Contributor ID）は、研究者を区別し業績と紐付ける無料の永続的識別子です。その概要とアカデミックCVにとっての重要性を解説します。",
      blocks: [
        {
          type: "p",
          text: "ORCID——Open Researcher and Contributor IDの略——は、非営利団体ORCIDがorcid.orgで提供する、研究者のための無料で一意かつ永続的なデジタル識別子です。ORCID iDは16桁の番号（例：0000-0002-1825-0097）であり、キャリアを通じてあなたとともに在り続けます。",
        },
        {
          type: "p",
          text: "その目的は曖昧さの解消です。同一または類似した名前を持つ他の研究者から確実にあなたを区別し、転職、改名、出版社の変更があっても追跡できます。学術誌、資金提供機関、機関はますますORCIDを使用して、あなたの貢献を自動的に紐付けるようになっています。",
        },
        {
          type: "h2",
          id: "why-it-matters",
          text: "ORCIDがCVにとって重要な理由",
        },
        {
          type: "p",
          text: "ORCID はアカデミックCVの信頼できる基盤です。識別子は名前ではないため、ツールはあなたの確認済み業績を取得し、名前ベースの検索につきもののマッチングエラーなしにあなたの業績を紐付けることができます——これはよくある名前やラテン文字以外の名前を持つ研究者にとって特に重要です。",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "SigmaCV がORCIDをどのように活用するか",
        },
        {
          type: "p",
          text: "SigmaCV にはORCID iDでサインインします。SigmaCV は公開ORCID記録を読み取り、OpenAlexの著者プロファイルを解決し、名前でなく識別子によってあなたの業績をマッチングしてCVをまとめます。公開メタデータを読み取るのみで、ORCIDへの書き戻しは一切行いません。",
        },
        {
          type: "cta",
          label: "ORCIDからCVを作成",
          href: "/orcid-to-cv",
        },
      ],
      faq: [
        {
          q: "ORCID は無料ですか？",
          a: "はい——orcid.orgでORCID iDを登録するのは無料で、約1分で完了します。",
        },
      ],
    },
    openalex: {
      term: "OpenAlex",
      short:
        "OpenAlexは、非営利団体OurResearchが運営する、世界の学術業績・著者・機関・掲載誌の無料・オープンなカタログです。",
      title: "OpenAlexとは何か",
      description:
        "OpenAlexは学術業績・著者・機関の無料で完全にオープンなインデックスです。その概要、有料データベースとの比較、そしてCVへの活用方法を解説します。",
      blocks: [
        {
          type: "p",
          text: "OpenAlexは、非営利団体OurResearchが構築・維持する、世界の研究文献——業績、著者、機関、掲載誌、概念——の無料・完全オープンなカタログです。数億件の業績をインデックス化し、オープンAPIとオープンデータを提供しています。廃止されたMicrosoft Academic Graphの後継です。",
        },
        {
          type: "p",
          text: "OpenAlexが重要なのは、ScopusやWeb of Scienceのような有料データベースのオープンな代替手段だからです。誰でも利用でき、ペイウォールやライセンス制限なしに学術発見と引用分析を支えます。",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "OpenAlexとあなたのCV",
        },
        {
          type: "p",
          text: "アカデミックCVにとって、OpenAlexはOpenAlexの著者識別子によってあなたと紐付けられた業績と引用データの広範でオープンなソースです。",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "SigmaCV がOpenAlexをどのように活用するか",
        },
        {
          type: "p",
          text: "SigmaCV は、ORCID iDからOpenAlexの著者IDを解決し、業績をインポートします——そして、オプトインした場合のみ、OpenAlexデータから分野規準化指標を導出します。デフォルトはオフで、DORAに準拠しています。",
        },
        {
          type: "cta",
          label: "OpenAlexからCVを作成",
          href: "/openalex-cv",
        },
      ],
      faq: [
        {
          q: "OpenAlexは無料ですか？",
          a: "はい——OpenAlexは完全にオープンで、無料のAPIとオープンデータライセンスを提供しています。",
        },
      ],
    },
    fwci: {
      term: "FWCI",
      short:
        "Field-Weighted Citation Impact（FWCI）は、ある業績の被引用数を同じ分野・種類・年の業績の世界平均と比較します——1.0はちょうど平均を意味します。",
      title: "Field-Weighted Citation Impact（FWCI）とは何か",
      description:
        "Field-Weighted Citation Impact（FWCI）は分野規準化された引用指標で、1.0が世界平均です。その意味とCVでの責任ある活用方法を解説します。",
      blocks: [
        {
          type: "p",
          text: "Field-Weighted Citation Impact（FWCI）は、ある業績が受けた被引用数を、同じ分野・種類・出版年の業績の平均と比較する引用指標です。1.0の値はその業績が期待通りの頻度で引用されたことを意味し、2.0は2倍引用されたことを意味します。",
        },
        {
          type: "p",
          text: "分野規準化が重要なのは、被引用率が分野間で大きく異なるためです——数学の高被引用論文と生物医学の高被引用論文は単純計数がまったく異なります。FWCIはそれらを比較可能なスケールに置きます。",
        },
        {
          type: "h2",
          id: "vs-h-index",
          text: "FWCIとh-index・単純計数の比較",
        },
        {
          type: "p",
          text: "h-indexや単純被引用数と異なり、FWCIは分野とキャリア段階を超えて比較可能であり、より正当性のある指標となります。それでも不完全であり、文脈とともに読む必要があります。質に対する単一の判断として扱わないでください。",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "CVでのFWCIの責任ある活用",
        },
        {
          type: "p",
          text: "CVに指標を含める場合、FWCIのような分野規準化指標はジャーナルのインパクトファクターや単純なh-indexより責任ある選択です——ただしDORAとLeiden Manifestoは、指標は専門的な判断を補完するものであり、代替するものではないことを明確にしています。SigmaCV は指標をデフォルトでオフ・オプトイン・分野規準化に保っています。",
        },
        {
          type: "cta",
          label: "参照：指標の責任ある活用",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "FWCIが1.0とはどういう意味ですか？",
          a: "ちょうど世界平均：その業績は類似の業績（同じ分野・種類・年）と同じ頻度で引用されています。1.0を超えれば平均以上です。",
        },
      ],
    },
    "h-index": {
      term: "h-index",
      short: "h-indexは、h本の論文がそれぞれh回以上引用されているような最大の数hです。",
      title: "h-indexとは何か",
      description:
        "h-indexは、研究成果数と被引用数を組み合わせた研究者レベルの指標ですが、真の限界があります。その測定内容とCVでの扱い方を解説します。",
      blocks: [
        {
          type: "p",
          text: "h-indexは、どれだけ発表しているかとどれだけ引用されているかの両方を単一の数値で捉えようとするものです。h本の論文がそれぞれh回以上引用されているような最大の数hです。h-indexが10であれば、10回以上引用されている論文が10本あることを意味します。",
        },
        {
          type: "h2",
          id: "limits",
          text: "h-indexの限界",
        },
        {
          type: "p",
          text: "h-indexは分野とキャリアの長さに大きく依存します。時間とともに増加し、被引用率の高い分野ではるかに大きくなるため、分野をまたいだ比較や異なる段階の研究者間の比較ができません。また初期キャリアの業績を過小評価し、水増しされることもあります。",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "h-indexをCVに載せるべきか",
        },
        {
          type: "p",
          text: "任意であり、分野によって異なります。記載する場合は文脈を与え、単独で提示せず分野規準化指標と組み合わせてください——DORAとLeiden Manifestoは単一の数値への過度の依存を戒めています。SigmaCV の指標はオプトインで、分野規準化指標を優先しています。",
        },
        {
          type: "cta",
          label: "参照：指標の責任ある活用",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "h-indexは研究の質の良い尺度ですか？",
          a: "せいぜい粗い代理指標です。分野とキャリアの長さに大きく依存し、分野横断での比較ができません。分野規準化指標の方が正当性があり、指標は専門的な判断を補完するものであり、代替するものではありません。",
        },
      ],
    },
    csl: {
      term: "CSL",
      short:
        "Citation Style Language（CSL）は、ZoteroやMendeleyなど多くのツールで使用される、引用・参考文献フォーマットを記述するオープン標準です。",
      title: "Citation Style Language（CSL）とは何か",
      description:
        "Citation Style Language（CSL）は、Zoteroなどのツールで一貫した引用を実現するオープン標準です。その概要と、CVの参考文献をどこでも同一に保つ仕組みを解説します。",
      blocks: [
        {
          type: "p",
          text: "Citation Style Language（CSL）は、引用と参考文献リストのフォーマット方法を記述するオープンなXMLベースの標準です。APA、Vancouver、Chicago、IEEEおよび多くのジャーナル固有のフォーマットを含む数千のスタイルが、オープンなCSLスタイルリポジトリで定義されており、ZoteroやMendeleyなどのツールがこれを使用しています。",
        },
        {
          type: "p",
          text: "その価値は一貫性にあります。スタイルの機械可読な定義が一つあるということは、すべての参考文献が同じ方法でフォーマットされ、手作業での再フォーマットなしにスタイルを瞬時に切り替えられることを意味します。",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "CSLとあなたのCV",
        },
        {
          type: "p",
          text: "CV上のすべての参考文献を単一のCSLスタイルを通じてフォーマットすることが、Word、PDF、LaTeX版を同一に保つ方法です——アカデミックCVで最もよくあるフォーマットの失敗は、スタイルの混在や参考文献を不一致に手作業でフォーマットすることです。",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "SigmaCV がCSLをどのように活用するか",
        },
        {
          type: "p",
          text: "SigmaCV はすべての引用をCSL（citeproc-jsを通じて）でフォーマットするため、任意のサポートされるスタイルを選択でき、業績リストはあらゆるエクスポート形式で同一に表示されます。",
        },
        {
          type: "cta",
          label: "フォーマット済み業績リストを生成",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "CSLを使えば引用スタイルを簡単に変更できますか？",
          a: "はい——それがCSLの目的です。任意のCSLスタイルを選択すると、すべての参考文献がCVのすべての出力形式で一貫して再フォーマットされます。",
        },
      ],
    },
    "nih-biosketch": {
      term: "NIH biosketch",
      short:
        "NIH biosketachは、米国国立衛生研究所（NIH）がグラント申請で求める短く構造化されたCVで、科学への貢献と選択した業績を強調します。",
      title: "NIH biosketachとは何か",
      description:
        "NIH biosketachはNIHのグラント申請で求められる短く構造化されたCVです。その内容、完全なアカデミックCVとの違い、そして作成方法を解説します。",
      blocks: [
        {
          type: "p",
          text: "NIH biosketachは、米国国立衛生研究所（NIH）がグラント申請で求める短く構造化されたCVです。通常5ページに制限され、定められたセクションがあります：教育・訓練、職歴・栄誉、任意の個人陳述、そして最大4本の関連業績を伴ういくつかの貢献をハイライトする「科学への貢献」セクション。",
        },
        {
          type: "p",
          text: "その構造は意図的なものです——網羅的なリストではなく、最も重要な貢献とそのインパクトのストーリーを語ることを求めています。",
        },
        {
          type: "h2",
          id: "vs-cv",
          text: "Biosketachと完全なアカデミックCVの違い",
        },
        {
          type: "p",
          text: "biosketachは完全なアカデミックCVよりはるかに短くナラティブであり、NIH固有の形式に従います。実践的なアプローチは、完全なCVを保持し、各申請のためにそこからbiosketachを派生させることです。",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "SigmaCV がどのように役立つか",
        },
        {
          type: "p",
          text: "SigmaCV は、ORCIDとOpenAlexの記録からNIHスタイルのbiosketachを作成します。業績は自動的に取得され、エクスポートの前に貢献と選択業績をキュレーションできます。",
        },
        {
          type: "cta",
          label: "NIH biosketachを生成",
          href: "/nih-biosketch",
        },
      ],
      faq: [
        {
          q: "NIH biosketachはどのくらいの長さですか？",
          a: "通常最大5ページです。特定の資金調達機会に合わせた最新のNIHの指示とフォームに常に従ってください。",
        },
      ],
    },
    preprint: {
      term: "プレプリント",
      short:
        "プレプリントは、正式な査読の前または代わりに公開共有される学術論文の完全版で——通常はarXiv、bioRxiv、medRxivのようなサーバーで公開されます。",
      title: "プレプリントとは何か",
      description:
        "プレプリントは査読前に公開共有される研究論文です。その概要、プレプリントが重要な理由、そしてアカデミックCVへの記載方法を解説します。",
      blocks: [
        {
          type: "p",
          text: "プレプリントは、正式な査読の前——または査読なしに——公開される研究論文の完全草稿で、通常はarXiv（物理学・数学・CS）、bioRxiv（生物学）、medRxiv（医学）のような専用サーバーで公開されます。DOIが付与され、引用することができます。",
        },
        {
          type: "p",
          text: "プレプリントは結果の共有を速め、優先権を確立します。正当な学術的成果として広く認められるようになっていますが——査読を経ていないため、常にプレプリントとして識別される必要があります。",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "CVへのプレプリントの記載",
        },
        {
          type: "p",
          text: "プレプリントは記載してください。ただし、明確にラベルを付け、査読済み論文とは別に保ってください——プレプリントを出版済み論文として提示しないでください。また、関係性を明確にせずに同じ業績を重複して掲載しないでください（プレプリントと出版版の両方を載せる場合）。",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "SigmaCV でのプレプリント",
        },
        {
          type: "p",
          text: "SigmaCV は、他の業績と並んでオープン記録からプレプリントを取得し、グループ化・ラベル付けを可能にするため、CVでプレプリントが正直に表示されます。",
        },
        {
          type: "cta",
          label: "フォーマット済み業績リストを生成",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "アカデミックCVにプレプリントを含めるべきですか？",
          a: "はい——プレプリントは広く認められた成果です——ただし、プレプリントとして明確にラベルを付け、査読済み論文とは別に記載してください。",
        },
      ],
    },
    dora: {
      term: "DORA",
      short:
        "DORA（サンフランシスコ研究評価宣言）は、研究をジャーナルのインパクトファクターのようなジャーナル基準の指標ではなく、それ自体の価値で評価することを求める世界的な宣言です。",
      title: "DORA（研究評価に関する宣言）とは何か",
      description:
        "DORA（サンフランシスコ研究評価宣言）は責任ある研究評価を求めます。その概要とCVの指標における意味を解説します。",
      blocks: [
        {
          type: "p",
          text: "DORA——サンフランシスコ研究評価宣言——は2012年の宣言で、現在世界中の数千の組織と個人が署名しており、研究の評価方法の改善に向けた勧告をまとめています。その中心的なメッセージ：個々の論文や研究者の質の代理としてジャーナルのインパクトファクターのようなジャーナル基準の指標を使用しないこと。",
        },
        {
          type: "p",
          text: "代わりにDORAは、研究をそれ自体の価値で評価すること、多様な成果とインパクトを重視すること、そして指標の限界を明確にすることを求めています。",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "CVの指標においてDORAが意味すること",
        },
        {
          type: "p",
          text: "実践的には：論文が掲載されたジャーナルのインパクトファクターを引用しないこと、研究そのものを前面に出すこと、指標を含める場合は文脈付きの分野規準化指標を優先すること。多くの機関・資金提供機関が今はDORAに沿って申請を評価しています。",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "SigmaCV がDORAとどのように整合しているか",
        },
        {
          type: "p",
          text: "SigmaCV はこのスタンスを基に構築されています。指標はデフォルトでオフかつオプトイン、単純計数より分野規準化指標を優先し、ジャーナルのインパクトファクターは一切表示しません。",
        },
        {
          type: "cta",
          label: "参照：指標の責任ある活用",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "DORAはジャーナルのインパクトファクターについて何を言っていますか？",
          a: "DORAは、ジャーナルのインパクトファクターのようなジャーナル基準の指標を個々の研究や研究者の質の評価に使用しないよう明確に勧告しています。JIFは論文ではなくジャーナルを測定するものだからです。",
        },
      ],
    },
    "leiden-manifesto": {
      term: "Leiden Manifesto",
      short:
        "研究指標に関するLeiden Manifestoは、定量的な研究指標を責任を持って活用するための10原則——専門的な判断を代替するのではなく補完するためのもの——をまとめたものです。",
      title: "Leiden Manifestoとは何か",
      description:
        "Leiden Manifestoは研究指標の責任ある活用のための10原則を示しています。その概要とCVの評価との関係を解説します。",
      blocks: [
        {
          type: "p",
          text: "2015年にNatureで発表された研究指標に関するLeiden Manifestoは、研究評価における定量的指標の責任ある活用のための10原則をまとめたものです。その核心的な考えは、指標は専門的な判断に情報を与えるものであり、代替するものではないということです。",
        },
        {
          type: "p",
          text: "その原則のうちには次のものが含まれます：定量的評価は定性的・専門的評価を補完するべきである。グループのミッションに対してパフォーマンスを測定すること。分野間の違いを考慮すること。データ収集と分析を透明に保つこと。そして、指標が操作され得ること、システム的な影響があることを認識すること。",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "CVにとってなぜ重要か",
        },
        {
          type: "p",
          text: "DORAと同様に、Leiden Manifestoは指標を文脈の中で読むことを促し、研究者を単一の数値に還元しないよう求めています。CVで指標を提示する場合は、分野規準化指標を選択し、文脈を与え、実際の貢献を前面に出してください。",
        },
        {
          type: "cta",
          label: "参照：指標の責任ある活用",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "Leiden ManifestoとDORAの違いは何ですか？",
          a: "どちらも責任ある研究評価を推進しています。DORAは個別評価へのジャーナル基準の指標（インパクトファクターなど）の誤用に焦点を当てています。Leiden Manifestoは専門的な判断と並んで任意の定量的指標を責任を持って活用するためのより広い10原則を示しています。",
        },
      ],
    },
  },
  "pt-BR": {
    orcid: {
      term: "ORCID",
      short:
        "O ORCID é um identificador digital gratuito, único e persistente que distingue você de todos os outros pesquisadores e vincula você à sua produção.",
      title: "O que é o ORCID?",
      description:
        "O ORCID (Open Researcher and Contributor ID) é um identificador persistente gratuito que distingue pesquisadores e os vincula às suas publicações. Saiba o que é e por que importa para o seu currículo acadêmico.",
      blocks: [
        {
          type: "p",
          text: "ORCID — abreviação de Open Researcher and Contributor ID — é um identificador digital gratuito, único e persistente para pesquisadores, fornecido pela organização sem fins lucrativos ORCID em orcid.org. Seu ORCID iD é um número de 16 dígitos (por exemplo, 0000-0002-1825-0097) que permanece com você por toda a carreira.",
        },
        {
          type: "p",
          text: "Seu objetivo é a desambiguação: ele distingue você de maneira confiável de outros pesquisadores com nomes iguais ou semelhantes e o acompanha em mudanças de emprego, alterações de nome e diferentes editoras. Periódicos, financiadores e instituições utilizam cada vez mais o ORCID para vincular você às suas contribuições de forma automática.",
        },
        {
          type: "h2",
          id: "why-it-matters",
          text: "Por que o ORCID importa para o seu currículo",
        },
        {
          type: "p",
          text: "O ORCID é a âncora confiável de um currículo acadêmico. Por ser um identificador e não um nome, as ferramentas podem recuperar suas publicações verificadas e vincular sua produção sem os falsos positivos que afetam as buscas por nome — o que é especialmente relevante para nomes comuns e em alfabetos não latinos.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Como o SigmaCV usa o ORCID",
        },
        {
          type: "p",
          text: "Você acessa o SigmaCV com seu ORCID iD. Ele lê seu registro público no ORCID, resolve seu perfil de autor no OpenAlex e monta seu currículo — identificando seus trabalhos por identificador, nunca por nome. Ele apenas lê metadados públicos e nunca grava nada de volta no ORCID.",
        },
        {
          type: "cta",
          label: "Gere seu currículo a partir do ORCID",
          href: "/orcid-to-cv",
        },
      ],
      faq: [
        {
          q: "O ORCID é gratuito?",
          a: "Sim — registrar um ORCID iD em orcid.org é gratuito e leva cerca de um minuto.",
        },
      ],
    },
    openalex: {
      term: "OpenAlex",
      short:
        "O OpenAlex é um catálogo gratuito e aberto das produções acadêmicas, autores, instituições e veículos do mundo, mantido pela organização sem fins lucrativos OurResearch.",
      title: "O que é o OpenAlex?",
      description:
        "O OpenAlex é um índice gratuito e totalmente aberto de produções acadêmicas, autores e instituições. Saiba o que é, como se compara a bases de dados proprietárias e como alimenta o seu currículo.",
      blocks: [
        {
          type: "p",
          text: "O OpenAlex é um catálogo gratuito e totalmente aberto da literatura científica global — produções, autores, instituições, veículos e conceitos — construído e mantido pela organização sem fins lucrativos OurResearch. Indexa centenas de milhões de trabalhos e oferece uma API aberta e dados abertos, como sucessor do descontinuado Microsoft Academic Graph.",
        },
        {
          type: "p",
          text: "Seu valor reside no fato de ser uma alternativa aberta a bases de dados proprietárias como Scopus e Web of Science: qualquer pessoa pode utilizá-lo, e ele sustenta a descoberta e a análise de citações sem barreiras de pagamento ou restrições de licença.",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "O OpenAlex e o seu currículo",
        },
        {
          type: "p",
          text: "Para um currículo acadêmico, o OpenAlex é uma fonte ampla e aberta das suas publicações e seus dados de citação, vinculadas a você pelo seu identificador de autor no OpenAlex.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Como o SigmaCV usa o OpenAlex",
        },
        {
          type: "p",
          text: "O SigmaCV resolve seu ID de autor no OpenAlex a partir do seu ORCID iD, importa seus trabalhos e — apenas se você optar por isso — deriva métricas normalizadas por área a partir dos dados do OpenAlex, desativadas por padrão e em consonância com DORA.",
        },
        {
          type: "cta",
          label: "Gere seu currículo a partir do OpenAlex",
          href: "/openalex-cv",
        },
      ],
      faq: [
        {
          q: "O OpenAlex é gratuito?",
          a: "Sim — o OpenAlex é totalmente aberto, com uma API gratuita e uma licença de dados aberta.",
        },
      ],
    },
    fwci: {
      term: "FWCI",
      short:
        "O Field-Weighted Citation Impact (FWCI) compara as citações de um trabalho com a média mundial de trabalhos da mesma área, tipo e ano — de modo que 1,0 equivale exatamente à média.",
      title: "O que é o Field-Weighted Citation Impact (FWCI)?",
      description:
        "O Field-Weighted Citation Impact (FWCI) é uma métrica de citação normalizada por área em que 1,0 corresponde à média mundial. Saiba o que significa e como usá-lo de forma responsável em um currículo.",
      blocks: [
        {
          type: "p",
          text: "O Field-Weighted Citation Impact (FWCI) é uma métrica de citação que compara o número de citações recebidas por um trabalho com a média de trabalhos da mesma área, tipo e ano de publicação. Um valor de 1,0 significa que o trabalho foi citado exatamente com a frequência esperada; 2,0 significa o dobro.",
        },
        {
          type: "p",
          text: "A normalização por área é importante porque as taxas de citação diferem enormemente entre campos — um artigo de matemática muito citado e um artigo biomédico muito citado têm contagens brutas muito diferentes. O FWCI os coloca em uma escala comparável.",
        },
        {
          type: "h2",
          id: "vs-h-index",
          text: "FWCI vs h-index e contagens brutas",
        },
        {
          type: "p",
          text: "Ao contrário do h-index ou de contagens brutas de citações, o FWCI é comparável entre disciplinas e etapas da carreira, o que o torna um indicador mais defensável. Ainda assim, é imperfeito e deve ser interpretado com contexto, nunca como um veredicto único sobre a qualidade.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Usando o FWCI no currículo (de forma responsável)",
        },
        {
          type: "p",
          text: "Se você incluir métricas no currículo, um indicador normalizado por área como o FWCI é mais responsável do que um Journal Impact Factor ou um h-index isolado — mas DORA e o Leiden Manifesto são claros ao afirmar que as métricas devem apoiar, e não substituir, o julgamento especializado. O SigmaCV mantém as métricas desativadas por padrão, opcionais e normalizadas por área.",
        },
        {
          type: "cta",
          label: "Leia: uso responsável de métricas",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "O que significa um FWCI de 1,0?",
          a: "Exatamente a média mundial: o trabalho foi citado com a mesma frequência que trabalhos similares (mesma área, tipo e ano). Acima de 1,0 está acima da média.",
        },
      ],
    },
    "h-index": {
      term: "h-index",
      short:
        "O h-index é o maior número h tal que você tem h publicações cada uma citada pelo menos h vezes.",
      title: "O que é o h-index?",
      description:
        "O h-index é uma métrica de nível de pesquisador que combina volume de produção e citações — mas tem limitações reais. Saiba o que mede e como tratá-lo em um currículo.",
      blocks: [
        {
          type: "p",
          text: "O h-index é um número único que tenta capturar tanto quanto você publica quanto com que frequência é citado: é o maior número h para o qual você tem h publicações que foram cada uma citada pelo menos h vezes. Um h-index de 10 significa que você tem 10 artigos com pelo menos 10 citações cada.",
        },
        {
          type: "h2",
          id: "limits",
          text: "As limitações do h-index",
        },
        {
          type: "p",
          text: "O h-index depende muito da área e da duração da carreira: cresce ao longo do tempo e é muito mais elevado em áreas com altas taxas de citação, portanto não é comparável entre disciplinas ou entre pesquisadores em diferentes etapas. Também subestima a produção em início de carreira e pode ser inflado.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Você deve colocar o h-index no currículo?",
        },
        {
          type: "p",
          text: "É opcional e depende da área. Se o incluir, forneça contexto e combine-o com indicadores normalizados por área em vez de apresentá-lo isoladamente — e lembre-se de que DORA e o Leiden Manifesto desencorajam a dependência excessiva de qualquer número único. As métricas do SigmaCV são opcionais e preferem indicadores normalizados por área.",
        },
        {
          type: "cta",
          label: "Leia: uso responsável de métricas",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "O h-index é uma boa medida de qualidade da pesquisa?",
          a: "É, no melhor dos casos, um proxy aproximado: depende muito da área e da duração da carreira e não é comparável entre disciplinas. Indicadores normalizados por área são mais defensáveis, e as métricas devem apoiar, e não substituir, o julgamento especializado.",
        },
      ],
    },
    csl: {
      term: "CSL",
      short:
        "A Citation Style Language (CSL) é um padrão aberto para descrever formatos de citação e bibliografias, utilizado pelo Zotero, Mendeley e muitas outras ferramentas.",
      title: "O que é a Citation Style Language (CSL)?",
      description:
        "A Citation Style Language (CSL) é o padrão aberto por trás das citações consistentes em ferramentas como o Zotero. Saiba o que é e por que mantém as referências do seu currículo idênticas em qualquer formato.",
      blocks: [
        {
          type: "p",
          text: "A Citation Style Language (CSL) é um padrão aberto baseado em XML que descreve como citações e bibliografias devem ser formatadas. Milhares de estilos — APA, Vancouver, Chicago, IEEE e muitos formatos específicos de periódicos — são definidos no repositório aberto de estilos CSL, e ferramentas como Zotero e Mendeley os utilizam.",
        },
        {
          type: "p",
          text: "Seu valor é a consistência: uma única definição legível por máquina de um estilo significa que cada referência é formatada da mesma forma, e você pode trocar de estilo instantaneamente sem reformatar nada manualmente.",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "CSL e o seu currículo",
        },
        {
          type: "p",
          text: "Formatar todas as referências do currículo por meio de um único estilo CSL é o que mantém suas versões em Word, PDF e LaTeX idênticas — o erro de formatação mais comum em currículos acadêmicos é misturar estilos ou formatar referências manualmente de forma inconsistente.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Como o SigmaCV usa o CSL",
        },
        {
          type: "p",
          text: "O SigmaCV formata todas as citações por meio do CSL (via citeproc-js), para que você possa escolher qualquer estilo suportado e sua lista de publicações seja lida de forma idêntica em todos os formatos de exportação.",
        },
        {
          type: "cta",
          label: "Gere uma lista de publicações formatada",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "Posso trocar de estilo de citação facilmente com o CSL?",
          a: "Sim — esse é justamente o objetivo. Escolha qualquer estilo CSL e todas as referências serão reformatadas de forma consistente em todos os formatos de saída do seu currículo.",
        },
      ],
    },
    "nih-biosketch": {
      term: "NIH biosketch",
      short:
        "Um NIH biosketch é um CV curto e estruturado que o US National Institutes of Health exige em candidaturas a financiamentos, destacando suas contribuições à ciência e publicações selecionadas.",
      title: "O que é um NIH biosketch?",
      description:
        "Um NIH biosketch é um CV curto e estruturado exigido em candidaturas a financiamentos do NIH. Saiba o que inclui, como difere de um currículo acadêmico completo e como elaborar um.",
      blocks: [
        {
          type: "p",
          text: 'Um NIH biosketch é um CV curto e estruturado que o US National Institutes of Health exige em candidaturas a financiamentos. Normalmente está limitado a cinco páginas e tem seções definidas: formação e treinamento, cargos e honrarias, uma declaração pessoal opcional e uma seção de "contribuições à ciência" que destaca um conjunto de contribuições, cada uma com até quatro publicações de suporte.',
        },
        {
          type: "p",
          text: "Sua estrutura é intencional: em vez de uma lista exaustiva, ele pede que você conte a história das suas contribuições mais importantes e de seu impacto.",
        },
        {
          type: "h2",
          id: "vs-cv",
          text: "Biosketch vs currículo acadêmico completo",
        },
        {
          type: "p",
          text: "O biosketch é muito mais curto e narrativo do que um currículo acadêmico completo e segue o formato específico do NIH. A abordagem prática é manter um currículo completo e derivar o biosketch a partir dele para cada candidatura.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Como o SigmaCV ajuda",
        },
        {
          type: "p",
          text: "O SigmaCV elabora um biosketch no estilo NIH a partir do seu registro no ORCID e no OpenAlex: suas publicações são importadas automaticamente e você curadoria as contribuições e publicações selecionadas antes de exportar.",
        },
        {
          type: "cta",
          label: "Gere um NIH biosketch",
          href: "/nih-biosketch",
        },
      ],
      faq: [
        {
          q: "Qual é a extensão de um NIH biosketch?",
          a: "Normalmente até cinco páginas. Siga sempre as instruções e formulários atuais do NIH para a oportunidade de financiamento específica.",
        },
      ],
    },
    preprint: {
      term: "preprint",
      short:
        "Um preprint é uma versão completa de um artigo acadêmico disponibilizada publicamente antes — ou em vez — da revisão formal por pares, normalmente em um servidor como arXiv, bioRxiv ou medRxiv.",
      title: "O que é um preprint?",
      description:
        "Um preprint é um artigo de pesquisa disponibilizado publicamente antes da revisão por pares. Saiba o que é, por que os preprints importam e como listá-los em um currículo acadêmico.",
      blocks: [
        {
          type: "p",
          text: "Um preprint é uma versão completa de um artigo de pesquisa disponibilizada publicamente antes — ou sem — revisão formal por pares, geralmente em um servidor dedicado como arXiv (física, matemática, ciência da computação), bioRxiv (biologia) ou medRxiv (medicina). Possui um DOI e pode ser citado.",
        },
        {
          type: "p",
          text: "Os preprints aceleram o compartilhamento de resultados e estabelecem prioridade, e são cada vez mais aceitos como produção acadêmica legítima — mas, por não terem sido revisados por pares, devem sempre ser identificados como preprints.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Listando preprints no currículo",
        },
        {
          type: "p",
          text: "Inclua seus preprints, mas identifique-os claramente e mantenha-os separados dos artigos revisados por pares — não apresente um preprint como artigo publicado e evite listar o mesmo trabalho duas vezes (como preprint e como versão final publicada) sem deixar a relação entre eles explícita.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Preprints no SigmaCV",
        },
        {
          type: "p",
          text: "O SigmaCV importa seus preprints do registro aberto junto com seus demais trabalhos e permite que você os agrupe e identifique, para que seu currículo os represente com honestidade.",
        },
        {
          type: "cta",
          label: "Gere uma lista de publicações formatada",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "Devo incluir preprints no currículo acadêmico?",
          a: "Sim — preprints são uma produção cada vez mais aceita — mas identifique-os claramente como preprints e mantenha-os separados das publicações revisadas por pares.",
        },
      ],
    },
    dora: {
      term: "DORA",
      short:
        "DORA, a San Francisco Declaration on Research Assessment, é uma declaração global que defende a avaliação da pesquisa pelos seus próprios méritos, e não por métricas baseadas em periódicos como o Journal Impact Factor.",
      title: "O que é DORA (a Declaration on Research Assessment)?",
      description:
        "DORA (a San Francisco Declaration on Research Assessment) defende uma avaliação responsável da pesquisa. Saiba o que é e o que significa para as métricas em um currículo.",
      blocks: [
        {
          type: "p",
          text: "DORA — a San Francisco Declaration on Research Assessment — é uma declaração de 2012, hoje assinada por milhares de organizações e indivíduos no mundo todo, que estabelece recomendações para melhorar a forma como a pesquisa é avaliada. Sua mensagem central: não use métricas baseadas em periódicos, como o Journal Impact Factor, como proxy da qualidade de artigos ou pesquisadores individualmente.",
        },
        {
          type: "p",
          text: "Em vez disso, DORA pede que a pesquisa seja avaliada pelos seus próprios méritos, que uma variedade de produções e impactos seja valorizada e que as limitações das métricas sejam explicitadas.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "O que DORA significa para as métricas no currículo",
        },
        {
          type: "p",
          text: "Na prática: não cite o Impact Factor dos periódicos em que seus artigos foram publicados, destaque o próprio trabalho e, se incluir métricas, prefira indicadores normalizados por área com contexto. Muitas instituições e financiadores agora avaliam candidaturas em conformidade com DORA.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Como o SigmaCV se alinha com DORA",
        },
        {
          type: "p",
          text: "O SigmaCV foi construído em torno dessa postura: as métricas estão desativadas por padrão e são opcionais, prefere indicadores normalizados por área em detrimento de contagens brutas e nunca exibe um Journal Impact Factor.",
        },
        {
          type: "cta",
          label: "Leia: uso responsável de métricas",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "O que DORA diz sobre o Journal Impact Factor?",
          a: "DORA recomenda explicitamente não utilizar métricas baseadas em periódicos como o Journal Impact Factor para avaliar a qualidade de pesquisas ou pesquisadores individualmente, pois o JIF mede o periódico, e não o artigo.",
        },
      ],
    },
    "leiden-manifesto": {
      term: "Leiden Manifesto",
      short:
        "O Leiden Manifesto para métricas de pesquisa é um conjunto de dez princípios para o uso responsável de indicadores quantitativos de pesquisa — para apoiar, e não substituir, o julgamento especializado.",
      title: "O que é o Leiden Manifesto?",
      description:
        "O Leiden Manifesto estabelece dez princípios para o uso responsável de métricas de pesquisa. Saiba o que é e como se relaciona à avaliação de um currículo.",
      blocks: [
        {
          type: "p",
          text: "O Leiden Manifesto para métricas de pesquisa, publicado na Nature em 2015, é um conjunto de dez princípios para o uso responsável de indicadores quantitativos na avaliação da pesquisa. Sua ideia central é que as métricas devem informar, e não substituir, o julgamento especializado.",
        },
        {
          type: "p",
          text: "Entre seus princípios: a avaliação quantitativa deve apoiar a avaliação qualitativa especializada; o desempenho deve ser medido em relação à missão do grupo; as diferenças entre áreas devem ser levadas em conta; a coleta de dados e as análises devem ser transparentes; e deve-se reconhecer que os indicadores podem ser manipulados e têm efeitos sistêmicos.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Por que isso importa para o seu currículo",
        },
        {
          type: "p",
          text: "Assim como DORA, o Leiden Manifesto incentiva a interpretação das métricas em contexto e rejeita a redução de um pesquisador a um único número. Se você apresentar métricas no currículo, escolha indicadores normalizados por área, forneça contexto e deixe suas contribuições reais em destaque.",
        },
        {
          type: "cta",
          label: "Leia: uso responsável de métricas",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "Qual é a diferença entre o Leiden Manifesto e DORA?",
          a: "Ambos promovem a avaliação responsável da pesquisa. DORA foca em não fazer uso indevido de métricas baseadas em periódicos (como o Impact Factor) para a avaliação individual; o Leiden Manifesto oferece dez princípios mais amplos para o uso responsável de qualquer métrica quantitativa em conjunto com o julgamento especializado.",
        },
      ],
    },
  },
  "it-IT": {
    orcid: {
      term: "ORCID",
      short:
        "ORCID è un identificatore digitale gratuito, univoco e persistente che distingue ciascun ricercatore dagli altri e collega la sua identità alla propria produzione scientifica.",
      title: "Che cos'è ORCID?",
      description:
        "ORCID (Open Researcher and Contributor ID) è un identificatore persistente e gratuito che distingue i ricercatori e li collega alle loro pubblicazioni. Scopri cos'è e perché è importante per il tuo curriculum vitae accademico.",
      blocks: [
        {
          type: "p",
          text: "ORCID — acronimo di Open Researcher and Contributor ID — è un identificatore digitale gratuito, univoco e persistente per i ricercatori, fornito dall'organizzazione non-profit ORCID all'indirizzo orcid.org. Il tuo ORCID iD è un numero a 16 cifre (ad esempio, 0000-0002-1825-0097) che ti accompagna per tutta la carriera.",
        },
        {
          type: "p",
          text: "Il suo scopo è la disambiguazione: consente di distinguerti in modo affidabile da altri ricercatori con lo stesso nome o nomi simili, e ti segue attraverso cambi di istituzione, cambiamenti di nome e diversi editori. Riviste, enti finanziatori e istituzioni utilizzano sempre più ORCID per collegare automaticamente le tue contribuzioni alla tua identità.",
        },
        {
          type: "h2",
          id: "why-it-matters",
          text: "Perché ORCID è importante per il tuo CV",
        },
        {
          type: "p",
          text: "ORCID costituisce il punto di riferimento affidabile per un curriculum vitae accademico. Essendo un identificatore e non un nome, i sistemi possono recuperare le tue pubblicazioni verificate e collegare il tuo lavoro senza i falsi abbinamenti tipici delle ricerche per nome — il che è particolarmente rilevante per i nomi comuni e quelli in alfabeti non latini.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Come SigmaCV utilizza ORCID",
        },
        {
          type: "p",
          text: "Accedi a SigmaCV con il tuo ORCID iD. Il sistema legge il tuo profilo ORCID pubblico, risolve il tuo profilo autore su OpenAlex e assembla il tuo CV, abbinando il tuo lavoro tramite identificatore e mai tramite nome. Legge esclusivamente metadati pubblici e non scrive mai nulla sul tuo profilo ORCID.",
        },
        {
          type: "cta",
          label: "Costruisci il tuo CV da ORCID",
          href: "/orcid-to-cv",
        },
      ],
      faq: [
        {
          q: "ORCID è gratuito?",
          a: "Sì — registrare un ORCID iD su orcid.org è gratuito e richiede circa un minuto.",
        },
      ],
    },
    openalex: {
      term: "OpenAlex",
      short:
        "OpenAlex è un catalogo gratuito e aperto delle opere accademiche, degli autori, delle istituzioni e delle sedi di pubblicazione del mondo intero, gestito dall'organizzazione non-profit OurResearch.",
      title: "Che cos'è OpenAlex?",
      description:
        "OpenAlex è un indice completamente aperto e gratuito delle opere accademiche, degli autori e delle istituzioni. Scopri cos'è, come si confronta con i database proprietari e come alimenta il tuo CV.",
      blocks: [
        {
          type: "p",
          text: "OpenAlex è un catalogo gratuito e completamente aperto della letteratura scientifica mondiale — opere, autori, istituzioni, sedi di pubblicazione e concetti — costruito e mantenuto dall'organizzazione non-profit OurResearch. Indicizza centinaia di milioni di opere e offre un'API aperta e dati aperti, come successore del progetto Microsoft Academic Graph, ora dismesso.",
        },
        {
          type: "p",
          text: "La sua rilevanza sta nell'essere un'alternativa aperta a database proprietari come Scopus e Web of Science: chiunque può utilizzarlo, e supporta la scoperta e l'analisi citazionale senza barriere d'accesso o restrizioni di licenza.",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "OpenAlex e il tuo CV",
        },
        {
          type: "p",
          text: "Per un curriculum vitae accademico, OpenAlex rappresenta una fonte aperta e ampia delle tue pubblicazioni e dei relativi dati citazionali, collegati alla tua persona tramite il tuo identificatore autore OpenAlex.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Come SigmaCV utilizza OpenAlex",
        },
        {
          type: "p",
          text: "SigmaCV risolve il tuo ID autore OpenAlex a partire dal tuo ORCID iD, importa le tue opere e — solo se lo scegli — ricava metriche field-normalized dai dati OpenAlex, disattivate per impostazione predefinita e allineate a DORA.",
        },
        {
          type: "cta",
          label: "Costruisci il tuo CV da OpenAlex",
          href: "/openalex-cv",
        },
      ],
      faq: [
        {
          q: "OpenAlex è gratuito?",
          a: "Sì — OpenAlex è completamente aperto, con un'API gratuita e una licenza per i dati aperta.",
        },
      ],
    },
    fwci: {
      term: "FWCI",
      short:
        "Il Field-Weighted Citation Impact (FWCI) confronta le citazioni di un'opera con la media mondiale di opere dello stesso campo, tipo e anno di pubblicazione: il valore 1,0 corrisponde esattamente alla media.",
      title: "Che cos'è il Field-Weighted Citation Impact (FWCI)?",
      description:
        "Il Field-Weighted Citation Impact (FWCI) è una metrica citazionale field-normalized in cui 1,0 rappresenta la media mondiale. Scopri cosa significa e come utilizzarla responsabilmente in un CV.",
      blocks: [
        {
          type: "p",
          text: "Il Field-Weighted Citation Impact (FWCI) è una metrica citazionale che confronta le citazioni ricevute da un'opera con la media delle opere dello stesso campo, tipo e anno di pubblicazione. Un valore di 1,0 significa che l'opera è stata citata esattamente quanto atteso; 2,0 significa il doppio.",
        },
        {
          type: "p",
          text: "La normalizzazione per campo è essenziale perché i tassi di citazione differiscono enormemente tra discipline: un articolo di matematica altamente citato e uno biomedico altamente citato presentano conteggi assoluti molto diversi. Il FWCI li pone su una scala confrontabile.",
        },
        {
          type: "h2",
          id: "vs-h-index",
          text: "FWCI vs h-index e conteggi assoluti",
        },
        {
          type: "p",
          text: "A differenza dell'h-index o dei conteggi assoluti di citazioni, il FWCI è confrontabile tra discipline e stadi di carriera, il che lo rende un indicatore più difendibile. Rimane comunque imperfetto e va interpretato nel contesto, non come giudizio definitivo sulla qualità.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Utilizzare il FWCI nel CV (in modo responsabile)",
        },
        {
          type: "p",
          text: "Se si includono metriche in un CV, un indicatore field-normalized come il FWCI è più appropriato di un Journal Impact Factor o di un h-index isolato — ma DORA e il Leiden Manifesto sono chiari: le metriche devono supportare, non sostituire, il giudizio esperto. SigmaCV mantiene le metriche disattivate per impostazione predefinita, a scelta dell'utente e field-normalized.",
        },
        {
          type: "cta",
          label: "Leggi: utilizzare le metriche in modo responsabile",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "Cosa significa un FWCI di 1,0?",
          a: "Esattamente la media mondiale: l'opera è stata citata quanto ci si aspetterebbe da opere simili (stesso campo, tipo e anno). Un valore superiore a 1,0 indica un impatto sopra la media.",
        },
      ],
    },
    "h-index": {
      term: "h-index",
      short:
        "L'h-index è il massimo numero h tale per cui si dispone di h pubblicazioni ciascuna citata almeno h volte.",
      title: "Che cos'è l'h-index?",
      description:
        "L'h-index è una metrica a livello di ricercatore che combina produttività e citazioni, ma presenta limiti reali. Scopri cosa misura e come trattarlo in un CV.",
      blocks: [
        {
          type: "p",
          text: "L'h-index è un singolo numero che cerca di catturare sia la produttività scientifica sia la frequenza delle citazioni: è il massimo numero h per cui si dispone di h pubblicazioni ciascuna citata almeno h volte. Un h-index di 10 significa che si hanno 10 articoli con almeno 10 citazioni ciascuno.",
        },
        {
          type: "h2",
          id: "limits",
          text: "I limiti dell'h-index",
        },
        {
          type: "p",
          text: "L'h-index dipende fortemente dal campo disciplinare e dalla durata della carriera: cresce nel tempo ed è molto più elevato nelle discipline a elevata frequenza citazionale, quindi non è confrontabile tra discipline diverse o tra ricercatori in fasi di carriera differenti. Penalizza inoltre il lavoro nelle prime fasi della carriera e può essere gonfiato artificialmente.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Conviene inserire l'h-index nel CV?",
        },
        {
          type: "p",
          text: "È facoltativo e dipende dalla disciplina. Se lo si include, è necessario fornire il contesto e affiancarlo a indicatori field-normalized anziché presentarlo da solo — ricordando che DORA e il Leiden Manifesto scoraggiano la dipendenza eccessiva da un singolo numero. Le metriche in SigmaCV sono opzionali e privilegiano gli indicatori field-normalized.",
        },
        {
          type: "cta",
          label: "Leggi: utilizzare le metriche in modo responsabile",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "L'h-index è una buona misura della qualità della ricerca?",
          a: "È al massimo un'approssimazione grossolana: dipende fortemente dal campo e dalla durata della carriera e non è confrontabile tra discipline. Gli indicatori field-normalized sono più difendibili, e le metriche dovrebbero supportare, non sostituire, il giudizio esperto.",
        },
      ],
    },
    csl: {
      term: "CSL",
      short:
        "Il Citation Style Language (CSL) è uno standard aperto per la descrizione dei formati di citazione e bibliografia, utilizzato da Zotero, Mendeley e molti altri strumenti.",
      title: "Che cos'è il Citation Style Language (CSL)?",
      description:
        "Il Citation Style Language (CSL) è lo standard aperto alla base delle citazioni coerenti in strumenti come Zotero. Scopri cos'è e perché garantisce che i riferimenti del tuo CV siano identici ovunque.",
      blocks: [
        {
          type: "p",
          text: "Il Citation Style Language (CSL) è uno standard aperto basato su XML che descrive come devono essere formattate le citazioni e le bibliografie. Migliaia di stili — APA, Vancouver, Chicago, IEEE e molti formati specifici di riviste — sono definiti nel repository aperto degli stili CSL, e strumenti come Zotero e Mendeley li utilizzano.",
        },
        {
          type: "p",
          text: "Il suo valore risiede nella coerenza: un'unica definizione leggibile dalla macchina di uno stile garantisce che ogni riferimento sia formattato in modo identico, e permette di cambiare stile istantaneamente senza riformattare nulla manualmente.",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "CSL e il tuo CV",
        },
        {
          type: "p",
          text: "Formattare ogni riferimento del proprio CV attraverso un unico stile CSL è ciò che garantisce l'uniformità tra le versioni Word, PDF e LaTeX — il difetto di formattazione più comune nei curriculum vitae accademici è la mescolanza di stili o la formattazione manuale incoerente dei riferimenti.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Come SigmaCV utilizza CSL",
        },
        {
          type: "p",
          text: "SigmaCV formatta ogni citazione tramite CSL (attraverso citeproc-js), in modo che tu possa scegliere qualsiasi stile supportato e la tua lista di pubblicazioni risulti identica in tutti i formati di esportazione.",
        },
        {
          type: "cta",
          label: "Genera una lista di pubblicazioni formattata",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "Con CSL è facile cambiare stile citazionale?",
          a: "Sì — è proprio questo il suo scopo. Scegli qualsiasi stile CSL e ogni riferimento viene riformattato in modo coerente in tutti i formati di output del tuo CV.",
        },
      ],
    },
    "nih-biosketch": {
      term: "NIH biosketch",
      short:
        "Un NIH biosketch è un CV breve e strutturato che il National Institutes of Health statunitense richiede nelle domande di finanziamento, con l'obiettivo di evidenziare i contributi scientifici e le pubblicazioni selezionate.",
      title: "Che cos'è un NIH biosketch?",
      description:
        "Un NIH biosketch è un CV breve e strutturato richiesto nelle domande di finanziamento NIH. Scopri cosa include, in cosa differisce da un curriculum vitae accademico completo e come redigerlo.",
      blocks: [
        {
          type: "p",
          text: "Un NIH biosketch è un CV breve e strutturato che il National Institutes of Health statunitense richiede nelle domande di finanziamento. È tipicamente limitato a cinque pagine e presenta sezioni predefinite: formazione e percorso di studi, posizioni e riconoscimenti, una dichiarazione personale facoltativa e una sezione «contributi alla scienza» che mette in evidenza un numero limitato di contributi, ciascuno con un massimo di quattro pubblicazioni a supporto.",
        },
        {
          type: "p",
          text: "La sua struttura è deliberata: anziché un elenco esaustivo, invita a raccontare i propri contributi più importanti e il loro impatto.",
        },
        {
          type: "h2",
          id: "vs-cv",
          text: "Biosketch vs curriculum vitae accademico completo",
        },
        {
          type: "p",
          text: "Un biosketch è molto più breve e narrativo rispetto a un curriculum vitae accademico completo, e segue il formato specifico NIH. L'approccio pratico consiste nel mantenere un CV completo e ricavare il biosketch da esso per ciascuna domanda di finanziamento.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Come SigmaCV aiuta",
        },
        {
          type: "p",
          text: "SigmaCV redige un biosketch in stile NIH a partire dal tuo profilo ORCID e OpenAlex: le tue pubblicazioni vengono importate automaticamente, dopodiché puoi selezionare i contributi e le pubblicazioni prima di esportare.",
        },
        {
          type: "cta",
          label: "Genera un NIH biosketch",
          href: "/nih-biosketch",
        },
      ],
      faq: [
        {
          q: "Quanto è lungo un NIH biosketch?",
          a: "Tipicamente fino a cinque pagine. Segui sempre le istruzioni e i moduli NIH aggiornati relativi alla specifica opportunità di finanziamento.",
        },
      ],
    },
    preprint: {
      term: "preprint",
      short:
        "Un preprint (o pre-stampa) è una versione completa di un articolo accademico resa pubblica prima, o in alternativa, della revisione formale da parte dei pari — tipicamente su un server come arXiv, bioRxiv o medRxiv.",
      title: "Che cos'è un preprint?",
      description:
        "Un preprint è un articolo di ricerca condiviso pubblicamente prima della revisione tra pari. Scopri cos'è, perché i preprint sono importanti e come elencarli in un curriculum vitae accademico.",
      blocks: [
        {
          type: "p",
          text: "Un preprint è una bozza completa di un articolo di ricerca resa disponibile pubblicamente prima — o senza — la revisione formale tra pari, solitamente su un server dedicato come arXiv (fisica, matematica, informatica), bioRxiv (biologia) o medRxiv (medicina). È dotato di un DOI e può essere citato.",
        },
        {
          type: "p",
          text: "I preprint accelerano la condivisione dei risultati e stabiliscono la priorità di scoperta; sono sempre più accettati come produzione scientifica legittima — ma, non essendo stati sottoposti a revisione tra pari, devono essere sempre identificati come tali.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Elencare i preprint nel CV",
        },
        {
          type: "p",
          text: "Includi i tuoi preprint, ma etichettali chiaramente e tienili separati dagli articoli sottoposti a revisione tra pari — non presentare un preprint come un articolo pubblicato, ed evita di elencare la stessa opera due volte (come preprint e come versione pubblicata) senza chiarire esplicitamente la relazione.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "I preprint in SigmaCV",
        },
        {
          type: "p",
          text: "SigmaCV recupera i tuoi preprint dal record aperto insieme alle altre tue opere e ti consente di raggrupparli ed etichettarli, in modo che il tuo CV li rappresenti correttamente.",
        },
        {
          type: "cta",
          label: "Genera una lista di pubblicazioni formattata",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "Devo includere i preprint nel mio curriculum vitae accademico?",
          a: "Sì — i preprint sono sempre più accettati come produzione scientifica — ma etichettali chiaramente come tali e tienili separati dalle pubblicazioni sottoposte a revisione tra pari.",
        },
      ],
    },
    dora: {
      term: "DORA",
      short:
        "DORA, la San Francisco Declaration on Research Assessment, è una dichiarazione globale che invita a valutare la ricerca per i suoi meriti intrinseci anziché in base a metriche basate sulle riviste, come il Journal Impact Factor.",
      title: "Che cos'è DORA (la Declaration on Research Assessment)?",
      description:
        "DORA (la San Francisco Declaration on Research Assessment) promuove una valutazione responsabile della ricerca. Scopri cos'è e cosa implica per le metriche in un CV.",
      blocks: [
        {
          type: "p",
          text: "DORA — la San Francisco Declaration on Research Assessment — è una dichiarazione del 2012, oggi firmata da migliaia di organizzazioni e individui in tutto il mondo, che formula raccomandazioni per migliorare il modo in cui la ricerca viene valutata. Il suo messaggio centrale: non utilizzare metriche basate sulle riviste, come il Journal Impact Factor, come indicatore sostitutivo della qualità di singoli articoli o ricercatori.",
        },
        {
          type: "p",
          text: "DORA chiede invece che la ricerca sia valutata per i suoi meriti intrinseci, che venga riconosciuta una pluralità di output e impatti, e che i limiti delle metriche siano resi espliciti.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Cosa implica DORA per le metriche nel CV",
        },
        {
          type: "p",
          text: "In pratica: non citare il Journal Impact Factor delle riviste in cui sono apparsi i tuoi articoli, dai risalto al lavoro stesso e, se includi metriche, privilegia indicatori field-normalized con il relativo contesto. Molte istituzioni ed enti finanziatori valutano ormai le domande in linea con DORA.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Come SigmaCV è allineato a DORA",
        },
        {
          type: "p",
          text: "SigmaCV è costruito su questa posizione: le metriche sono disattivate per impostazione predefinita e attivabili su scelta dell'utente, privilegia gli indicatori field-normalized rispetto ai conteggi assoluti e non mostra mai un Journal Impact Factor.",
        },
        {
          type: "cta",
          label: "Leggi: utilizzare le metriche in modo responsabile",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "Cosa dice DORA riguardo al Journal Impact Factor?",
          a: "DORA raccomanda esplicitamente di non utilizzare metriche basate sulle riviste, come il Journal Impact Factor, per valutare la qualità della ricerca o dei singoli ricercatori, poiché il JIF misura la rivista, non l'articolo.",
        },
      ],
    },
    "leiden-manifesto": {
      term: "Leiden Manifesto",
      short:
        "Il Leiden Manifesto per le metriche della ricerca è un insieme di dieci principi per l'utilizzo responsabile degli indicatori quantitativi nella ricerca — a supporto, e non in sostituzione, del giudizio esperto.",
      title: "Che cos'è il Leiden Manifesto?",
      description:
        "Il Leiden Manifesto enuncia dieci principi per l'uso responsabile delle metriche della ricerca. Scopri cos'è e come si collega alla valutazione di un CV.",
      blocks: [
        {
          type: "p",
          text: "Il Leiden Manifesto for research metrics, pubblicato su Nature nel 2015, è un insieme di dieci principi per l'uso responsabile degli indicatori quantitativi nella valutazione della ricerca. La sua idea centrale è che le metriche debbano informare, non sostituire, il giudizio esperto.",
        },
        {
          type: "p",
          text: "Tra i suoi principi: la valutazione quantitativa deve supportare quella qualitativa e degli esperti; la performance deve essere misurata rispetto alla missione del gruppo; devono essere tenute in considerazione le differenze tra campi disciplinari; la raccolta dei dati e le analisi devono essere trasparenti; e si deve riconoscere che gli indicatori possono essere manipolati e hanno effetti sistemici.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Perché è rilevante per il tuo CV",
        },
        {
          type: "p",
          text: "Come DORA, il Leiden Manifesto incoraggia a leggere le metriche nel loro contesto e a non ridurre un ricercatore a un singolo numero. Se si presentano metriche in un CV, è opportuno scegliere indicatori field-normalized, fornire il contesto e lasciare che siano i contributi concreti a guidare la lettura.",
        },
        {
          type: "cta",
          label: "Leggi: utilizzare le metriche in modo responsabile",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "In cosa differisce il Leiden Manifesto da DORA?",
          a: "Entrambi promuovono una valutazione responsabile della ricerca. DORA si concentra sul non abusare delle metriche basate sulle riviste (come il Journal Impact Factor) per la valutazione individuale; il Leiden Manifesto fornisce dieci principi più ampi per l'utilizzo responsabile di qualsiasi metrica quantitativa in affiancamento al giudizio esperto.",
        },
      ],
    },
  },
  "ko-KR": {
    orcid: {
      term: "ORCID",
      short:
        "ORCID는 다른 모든 연구자와 귀하를 구별하고 연구 성과물과 연결해 주는 무료의 고유하고 영구적인 디지털 식별자입니다.",
      title: "ORCID란 무엇입니까?",
      description:
        "ORCID(Open Researcher and Contributor ID)는 연구자를 구별하고 그 논문과 연결해 주는 무료의 영구적 식별자입니다. ORCID가 무엇인지, 그리고 학술 CV에서 왜 중요한지 설명합니다.",
      blocks: [
        {
          type: "p",
          text: "ORCID — Open Researcher and Contributor ID의 약칭 — 는 비영리 기관인 ORCID(orcid.org)가 제공하는 연구자를 위한 무료의 고유하고 영구적인 디지털 식별자입니다. ORCID iD는 16자리 숫자(예: 0000-0002-1825-0097)로 구성되며, 연구자의 전 경력에 걸쳐 유지됩니다.",
        },
        {
          type: "p",
          text: "ORCID의 목적은 식별 모호성 해소입니다. 동일하거나 유사한 이름을 가진 다른 연구자와 귀하를 확실히 구별해 주며, 직장 이동, 이름 변경, 출판사 변경과 무관하게 귀하의 기여물과 연결됩니다. 학술지, 연구비 지원 기관, 소속 기관은 ORCID를 통해 귀하의 기여물을 자동으로 연결하는 방향으로 나아가고 있습니다.",
        },
        {
          type: "h2",
          id: "why-it-matters",
          text: "학술 CV에서 ORCID가 중요한 이유",
        },
        {
          type: "p",
          text: "ORCID는 학술 CV의 신뢰할 수 있는 닻 역할을 합니다. 이름이 아닌 식별자이기 때문에, 이름 기반 검색에서 발생하는 오귀속(誤歸屬) 없이 검증된 논문을 자동으로 가져오고 연구 성과물을 연결할 수 있습니다. 이는 흔한 이름이나 비라틴 문자 이름을 가진 연구자에게 특히 중요합니다.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "SigmaCV가 ORCID를 사용하는 방법",
        },
        {
          type: "p",
          text: "귀하는 ORCID iD로 SigmaCV에 로그인합니다. SigmaCV는 귀하의 공개 ORCID 기록을 읽고, OpenAlex 저자 프로필을 확인하여, 이름이 아닌 식별자를 기준으로 연구 성과물을 매칭해 CV를 자동으로 구성합니다. 공개 메타데이터만 읽으며, ORCID에 어떠한 데이터도 기록하지 않습니다.",
        },
        {
          type: "cta",
          label: "ORCID로 CV 만들기",
          href: "/orcid-to-cv",
        },
      ],
      faq: [
        {
          q: "ORCID는 유료입니까?",
          a: "아닙니다. orcid.org에서 ORCID iD를 등록하는 것은 무료이며, 약 1분이면 완료됩니다.",
        },
      ],
    },
    openalex: {
      term: "OpenAlex",
      short:
        "OpenAlex는 비영리 기관인 OurResearch가 운영하는 전 세계 학술 저작물, 저자, 기관, 게재지의 무료 공개 목록입니다.",
      title: "OpenAlex란 무엇입니까?",
      description:
        "OpenAlex는 학술 저작물, 저자, 기관의 완전 공개 무료 색인입니다. OpenAlex가 무엇인지, 상용 데이터베이스와 어떻게 다른지, 그리고 귀하의 CV 구성에 어떻게 활용되는지 설명합니다.",
      blocks: [
        {
          type: "p",
          text: "OpenAlex는 비영리 기관인 OurResearch가 구축·운영하는 전 세계 연구 문헌 — 저작물, 저자, 기관, 게재지, 개념 — 의 완전 공개 무료 목록입니다. 수억 건의 저작물을 색인하며, 중단된 Microsoft Academic Graph의 후속으로 공개 API와 공개 데이터를 제공합니다.",
        },
        {
          type: "p",
          text: "OpenAlex가 중요한 이유는 Scopus나 Web of Science 같은 상용 데이터베이스의 공개 대안이기 때문입니다. 누구나 이용할 수 있으며, 유료 구독이나 라이선스 제약 없이 문헌 발견과 인용 분석을 지원합니다.",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "OpenAlex와 귀하의 CV",
        },
        {
          type: "p",
          text: "학술 CV 관점에서 OpenAlex는 귀하의 논문과 인용 데이터를 OpenAlex 저자 식별자로 연결하는 광범위한 공개 출처입니다.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "SigmaCV가 OpenAlex를 사용하는 방법",
        },
        {
          type: "p",
          text: "SigmaCV는 귀하의 ORCID iD에서 OpenAlex 저자 ID를 확인하고, 저작물을 가져옵니다. 귀하가 선택한 경우에 한해 OpenAlex 데이터에서 분야 정규화 지표를 산출하며, 기본값은 비활성화 상태이고 DORA 기준에 부합합니다.",
        },
        {
          type: "cta",
          label: "OpenAlex로 CV 만들기",
          href: "/openalex-cv",
        },
      ],
      faq: [
        {
          q: "OpenAlex는 유료입니까?",
          a: "아닙니다. OpenAlex는 무료 API와 공개 데이터 라이선스를 갖춘 완전 공개 서비스입니다.",
        },
      ],
    },
    fwci: {
      term: "FWCI",
      short:
        "분야 가중 인용 영향력(FWCI)은 동일 분야, 유형, 연도의 저작물 세계 평균 대비 해당 저작물의 인용 수를 비교하는 지표로, 1.0은 정확히 평균을 의미합니다.",
      title: "분야 가중 인용 영향력(FWCI)이란 무엇입니까?",
      description:
        "분야 가중 인용 영향력(FWCI)은 1.0을 세계 평균으로 하는 분야 정규화 인용 지표입니다. FWCI의 의미와 CV에서 책임감 있게 활용하는 방법을 설명합니다.",
      blocks: [
        {
          type: "p",
          text: "분야 가중 인용 영향력(FWCI)은 특정 저작물이 받은 인용 수를, 동일 분야·유형·출판 연도 저작물의 평균과 비교하는 인용 지표입니다. 1.0은 해당 저작물이 기대치만큼 인용되었음을, 2.0은 기대치의 두 배 인용되었음을 의미합니다.",
        },
        {
          type: "p",
          text: "분야 정규화가 중요한 이유는 분야마다 인용 빈도가 크게 다르기 때문입니다. 고피인용 수학 논문과 고피인용 의생명과학 논문의 절대적 인용 수는 매우 다릅니다. FWCI는 이를 비교 가능한 척도로 나타냅니다.",
        },
        {
          type: "h2",
          id: "vs-h-index",
          text: "FWCI 대 h-index 및 단순 인용 수",
        },
        {
          type: "p",
          text: "h-index나 단순 인용 수와 달리, FWCI는 분야와 경력 단계를 초월하여 비교 가능하므로 더 신뢰할 수 있는 지표입니다. 그러나 이 역시 불완전하며, 단독 판단 근거가 아닌 맥락과 함께 해석되어야 합니다.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "CV에 FWCI를 책임감 있게 활용하기",
        },
        {
          type: "p",
          text: "CV에 지표를 포함할 경우, FWCI와 같은 분야 정규화 지표가 저널 영향력 지수나 단순 h-index보다 책임감 있는 선택입니다. 다만 DORA와 Leiden Manifesto는 지표가 전문가 판단을 보조해야 하며 대체해서는 안 된다고 명확히 밝히고 있습니다. SigmaCV는 지표를 기본적으로 비활성화하고, 선택 시 분야 정규화 지표를 제공합니다.",
        },
        {
          type: "cta",
          label: "읽기: 지표의 책임감 있는 활용",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "FWCI 1.0은 무엇을 의미합니까?",
          a: "정확히 세계 평균을 의미합니다. 해당 저작물이 동일 분야·유형·연도의 유사 저작물만큼 인용되었다는 뜻입니다. 1.0 이상은 평균을 초과합니다.",
        },
      ],
    },
    "h-index": {
      term: "h-index",
      short: "h-index는 각각 h회 이상 인용된 논문이 h편 존재하는 가장 큰 h를 나타내는 지표입니다.",
      title: "h-index란 무엇입니까?",
      description:
        "h-index는 연구 생산성과 인용 영향력을 결합한 연구자 단위 지표이지만 실질적인 한계가 있습니다. h-index가 측정하는 것과 CV에서 어떻게 다루어야 하는지 설명합니다.",
      blocks: [
        {
          type: "p",
          text: "h-index는 연구자의 발표량과 인용 빈도를 하나의 숫자로 나타내려는 지표입니다. 각각 h회 이상 인용된 논문이 h편 존재하는 가장 큰 h값으로 정의됩니다. h-index가 10이라면 10회 이상 인용된 논문이 10편 있음을 의미합니다.",
        },
        {
          type: "h2",
          id: "limits",
          text: "h-index의 한계",
        },
        {
          type: "p",
          text: "h-index는 분야와 경력 기간에 크게 의존합니다. 시간이 지날수록 증가하며, 빠른 인용이 이루어지는 분야에서 훨씬 높게 나타나므로 분야 간, 경력 단계 간 비교가 불가능합니다. 또한 초기 경력 연구자의 성과를 과소평가하는 경향이 있으며 부풀려질 수도 있습니다.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "CV에 h-index를 포함해야 합니까?",
        },
        {
          type: "p",
          text: "선택 사항이며 분야에 따라 다릅니다. 포함할 경우, 단독으로 제시하지 않고 분야 정규화 지표와 함께 맥락을 제공해야 합니다. DORA와 Leiden Manifesto는 단일 숫자에 과도하게 의존하는 것을 권장하지 않습니다. SigmaCV의 지표는 선택 제공 방식이며 분야 정규화 지표를 우선합니다.",
        },
        {
          type: "cta",
          label: "읽기: 지표의 책임감 있는 활용",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "h-index는 연구 질을 나타내는 좋은 지표입니까?",
          a: "기껏해야 개략적인 대리 지표에 불과합니다. 분야와 경력 기간에 크게 의존하며 분야 간 비교가 불가능합니다. 분야 정규화 지표가 더 신뢰할 수 있으며, 지표는 전문가 판단을 보조해야 하지 대체해서는 안 됩니다.",
        },
      ],
    },
    csl: {
      term: "CSL",
      short:
        "Citation Style Language(CSL)는 Zotero, Mendeley 등 여러 도구에서 사용되는 인용 및 참고문헌 형식을 기술하는 공개 표준입니다.",
      title: "Citation Style Language(CSL)란 무엇입니까?",
      description:
        "Citation Style Language(CSL)는 Zotero 등의 도구에서 일관된 인용을 가능하게 하는 공개 표준입니다. CSL이 무엇이며, CV의 참고문헌을 어디서나 동일하게 유지하는 데 왜 중요한지 설명합니다.",
      blocks: [
        {
          type: "p",
          text: "Citation Style Language(CSL)는 인용과 참고문헌 목록의 형식을 기술하는 XML 기반 공개 표준입니다. APA, Vancouver, Chicago, IEEE 및 수많은 저널별 형식을 포함하는 수천 개의 스타일이 공개 CSL 스타일 저장소에 정의되어 있으며, Zotero, Mendeley 등의 도구가 이를 활용합니다.",
        },
        {
          type: "p",
          text: "CSL의 가치는 일관성에 있습니다. 스타일을 기계 판독 가능한 형태로 단일 정의하면 모든 참고문헌이 동일한 방식으로 형식화되고, 수동 재형식화 없이 즉시 스타일을 전환할 수 있습니다.",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "CSL과 귀하의 CV",
        },
        {
          type: "p",
          text: "CV의 모든 참고문헌을 단일 CSL 스타일로 형식화하면 Word, PDF, LaTeX 버전이 동일하게 유지됩니다. 학술 CV에서 가장 흔한 형식 오류가 여러 스타일을 혼용하거나 참고문헌을 수동으로 비일관되게 형식화하는 것입니다.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "SigmaCV가 CSL을 사용하는 방법",
        },
        {
          type: "p",
          text: "SigmaCV는 모든 인용을 CSL(citeproc-js 사용)로 형식화하므로, 지원되는 어떤 스타일을 선택하더라도 모든 내보내기 형식에서 논문 목록이 동일하게 표시됩니다.",
        },
        {
          type: "cta",
          label: "형식화된 논문 목록 생성하기",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "CSL로 인용 스타일을 쉽게 바꿀 수 있습니까?",
          a: "그것이 바로 CSL의 목적입니다. 어떤 CSL 스타일을 선택하든 CV의 모든 출력 형식에서 모든 참고문헌이 일관되게 재형식화됩니다.",
        },
      ],
    },
    "nih-biosketch": {
      term: "NIH biosketch",
      short:
        "NIH biosketch는 미국 국립보건원(NIH)이 연구비 신청에서 요구하는 간략하고 구조화된 CV로, 과학에 대한 귀하의 기여와 선별된 논문을 강조합니다.",
      title: "NIH biosketch란 무엇입니까?",
      description:
        "NIH biosketch는 NIH 연구비 신청에 요구되는 간략하고 구조화된 CV입니다. 포함 내용, 정식 학술 CV와의 차이점, 작성 방법을 설명합니다.",
      blocks: [
        {
          type: "p",
          text: "NIH biosketch는 미국 국립보건원(NIH)이 연구비 신청에서 요구하는 간략하고 구조화된 CV입니다. 일반적으로 5페이지로 제한되며, 정해진 항목으로 구성됩니다: 교육 및 훈련, 직위 및 수상, 선택적 자기소개서, 그리고 각 기여별로 최대 4편의 지지 논문을 포함하는 '과학에 대한 기여' 항목.",
        },
        {
          type: "p",
          text: "이 구조는 의도적입니다. 총망라된 목록이 아닌, 귀하의 가장 중요한 기여와 그 영향을 서술하는 방식으로 요구합니다.",
        },
        {
          type: "h2",
          id: "vs-cv",
          text: "Biosketch 대 정식 학술 CV",
        },
        {
          type: "p",
          text: "Biosketch는 정식 학술 CV보다 훨씬 짧고 서술적이며, NIH의 특정 형식을 따릅니다. 실용적인 접근은 완전한 CV를 유지하면서 각 신청마다 그로부터 biosketch를 도출하는 것입니다.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "SigmaCV가 도움을 주는 방법",
        },
        {
          type: "p",
          text: "SigmaCV는 귀하의 ORCID 및 OpenAlex 기록에서 NIH 스타일 biosketch를 초안합니다. 논문이 자동으로 불러와지며, 내보내기 전에 귀하가 기여 내용과 선별 논문을 직접 편집할 수 있습니다.",
        },
        {
          type: "cta",
          label: "NIH biosketch 생성하기",
          href: "/nih-biosketch",
        },
      ],
      faq: [
        {
          q: "NIH biosketch의 분량은 얼마입니까?",
          a: "일반적으로 최대 5페이지입니다. 항상 해당 연구비 공모에 대한 현행 NIH 지침과 양식을 따르십시오.",
        },
      ],
    },
    preprint: {
      term: "프리프린트",
      short:
        "프리프린트는 정식 동료 심사 전 또는 그 대신 공개적으로 공유된 학술 논문의 완성 버전으로, 보통 arXiv, bioRxiv, medRxiv 같은 서버에 게재됩니다.",
      title: "프리프린트(preprint)란 무엇입니까?",
      description:
        "프리프린트는 동료 심사 전에 공개적으로 공유된 연구 논문입니다. 프리프린트가 무엇인지, 왜 중요한지, 학술 CV에 어떻게 기재해야 하는지 설명합니다.",
      blocks: [
        {
          type: "p",
          text: "프리프린트는 정식 동료 심사 전 — 또는 동료 심사 없이 — 공개적으로 이용 가능하게 된 연구 논문 초고로, 보통 arXiv(물리학·수학·컴퓨터과학), bioRxiv(생물학), medRxiv(의학) 같은 전용 서버에 게재됩니다. DOI를 부여받으며 인용 가능합니다.",
        },
        {
          type: "p",
          text: "프리프린트는 연구 결과 공유를 가속화하고 우선권을 확립하며, 정당한 학술 성과물로 점점 더 인정받고 있습니다. 단, 동료 심사를 거치지 않았으므로 항상 프리프린트임을 명시해야 합니다.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "CV에 프리프린트 기재하기",
        },
        {
          type: "p",
          text: "프리프린트를 포함하되, 명확히 표시하고 동료 심사 논문과 구분하여 기재하십시오. 프리프린트를 게재 논문처럼 제시해서는 안 되며, 동일한 저작물을 프리프린트와 게재 버전으로 중복 기재할 경우 두 항목의 관계를 명시해야 합니다.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "SigmaCV에서의 프리프린트",
        },
        {
          type: "p",
          text: "SigmaCV는 귀하의 프리프린트를 다른 성과물과 함께 공개 기록에서 가져와 그룹화하고 표시할 수 있게 하여, CV에서 프리프린트를 투명하게 나타냅니다.",
        },
        {
          type: "cta",
          label: "형식화된 논문 목록 생성하기",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "학술 CV에 프리프린트를 포함해야 합니까?",
          a: "예 — 프리프린트는 점점 더 인정받는 성과물입니다 — 다만 프리프린트임을 명확히 표시하고 동료 심사 논문과 구분하여 기재하십시오.",
        },
      ],
    },
    dora: {
      term: "DORA",
      short:
        "DORA, 즉 샌프란시스코 연구 평가 선언은 저널 영향력 지수와 같은 저널 기반 지표가 아닌 연구 자체의 장점으로 연구를 평가할 것을 촉구하는 전 세계적 선언입니다.",
      title: "DORA(연구 평가에 관한 선언)란 무엇입니까?",
      description:
        "DORA(샌프란시스코 연구 평가 선언)는 책임감 있는 연구 평가를 촉구합니다. DORA가 무엇이며 CV의 지표에 대해 무엇을 의미하는지 설명합니다.",
      blocks: [
        {
          type: "p",
          text: "DORA — 샌프란시스코 연구 평가 선언 — 는 2012년 발표된 선언으로, 현재 전 세계 수천 개의 기관과 개인이 서명하였으며, 연구 평가 방식 개선을 위한 권고안을 제시합니다. 핵심 메시지: 저널 영향력 지수와 같은 저널 기반 지표를 개별 논문이나 연구자의 질을 평가하는 대리 지표로 사용하지 말 것.",
        },
        {
          type: "p",
          text: "대신 DORA는 연구 자체의 장점으로 평가할 것, 다양한 성과물과 영향력을 가치 있게 여길 것, 지표의 한계를 명시할 것을 요구합니다.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "DORA가 CV의 지표에 대해 의미하는 것",
        },
        {
          type: "p",
          text: "실제로: 논문이 게재된 저널의 영향력 지수를 인용하지 말고, 연구 자체를 앞세우며, 지표를 포함할 경우 맥락과 함께 분야 정규화 지표를 제시하십시오. 이제 많은 기관과 연구비 지원 기관이 DORA에 부합하는 방식으로 신청서를 평가합니다.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "SigmaCV가 DORA와 일치하는 방법",
        },
        {
          type: "p",
          text: "SigmaCV는 이 입장을 반영하여 구축되었습니다. 지표는 기본적으로 비활성화되어 선택 제공 방식이며, 단순 인용 수보다 분야 정규화 지표를 우선하고, 저널 영향력 지수는 표시하지 않습니다.",
        },
        {
          type: "cta",
          label: "읽기: 지표의 책임감 있는 활용",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "DORA는 저널 영향력 지수에 대해 무엇을 말합니까?",
          a: "DORA는 저널 영향력 지수 같은 저널 기반 지표를 개별 연구나 연구자의 질을 평가하는 데 사용하지 말 것을 명확히 권고합니다. 저널 영향력 지수는 저널을 측정하는 것이지 논문을 측정하는 것이 아니기 때문입니다.",
        },
      ],
    },
    "leiden-manifesto": {
      term: "Leiden Manifesto",
      short:
        "Leiden Manifesto(연구 지표에 관한 라이덴 선언)는 정량적 연구 지표를 전문가 판단을 보조하는 용도로, 대체 수단이 아닌 방식으로 책임감 있게 사용하기 위한 10가지 원칙을 제시합니다.",
      title: "Leiden Manifesto란 무엇입니까?",
      description:
        "Leiden Manifesto는 연구 지표의 책임감 있는 사용을 위한 10가지 원칙을 제시합니다. Leiden Manifesto가 무엇이며 CV 평가와 어떤 관련이 있는지 설명합니다.",
      blocks: [
        {
          type: "p",
          text: "2015년 Nature에 발표된 연구 지표에 관한 Leiden Manifesto는 연구 평가에서 정량적 지표를 책임감 있게 사용하기 위한 10가지 원칙을 담고 있습니다. 핵심 개념은 지표가 전문가 판단을 대체하는 것이 아니라 보조해야 한다는 것입니다.",
        },
        {
          type: "p",
          text: "주요 원칙으로는: 정량적 평가는 전문가의 질적 평가를 보완해야 하며, 그룹의 미션에 비추어 성과를 측정하고, 분야 간 차이를 고려하며, 데이터 수집 및 분석을 투명하게 유지하고, 지표가 조작될 수 있으며 체계적 영향을 미칠 수 있음을 인식할 것 등이 있습니다.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "귀하의 CV에 중요한 이유",
        },
        {
          type: "p",
          text: "DORA와 마찬가지로 Leiden Manifesto는 지표를 맥락과 함께 읽고 연구자를 단일 숫자로 환원하지 않도록 권장합니다. CV에 지표를 제시할 경우, 분야 정규화 지표를 선택하고, 맥락을 제공하며, 실제 기여 내용을 앞세우십시오.",
        },
        {
          type: "cta",
          label: "읽기: 지표의 책임감 있는 활용",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "Leiden Manifesto와 DORA는 어떻게 다릅니까?",
          a: "두 선언 모두 책임감 있는 연구 평가를 촉구합니다. DORA는 개별 평가에 저널 기반 지표(영향력 지수 등)를 오용하지 말 것에 초점을 맞춥니다. Leiden Manifesto는 전문가 판단과 함께 정량적 지표를 책임감 있게 사용하기 위한 10가지 광범위한 원칙을 제시합니다.",
        },
      ],
    },
  },
  "ru-RU": {
    orcid: {
      term: "ORCID",
      short:
        "ORCID — бесплатный уникальный постоянный цифровой идентификатор, позволяющий отличить вас от любого другого исследователя и связать вас с вашими работами.",
      title: "Что такое ORCID?",
      description:
        "ORCID (Open Researcher and Contributor ID) — бесплатный постоянный идентификатор, позволяющий однозначно идентифицировать исследователей и связывать их с публикациями. Что это такое и почему это важно для вашего академического резюме.",
      blocks: [
        {
          type: "p",
          text: "ORCID — аббревиатура от Open Researcher and Contributor ID — это бесплатный, уникальный, постоянный цифровой идентификатор для исследователей, предоставляемый некоммерческой организацией ORCID на сайте orcid.org. Ваш ORCID iD — это 16-значный номер (например, 0000-0002-1825-0097), который сопровождает вас на протяжении всей карьеры.",
        },
        {
          type: "p",
          text: "Его назначение — устранение омонимии: ORCID iD надёжно отличает вас от других исследователей с такими же или похожими именами и не меняется при смене места работы, фамилии или издателя. Журналы, финансирующие организации и учреждения всё активнее используют ORCID для автоматического сопоставления вас с вашими работами.",
        },
        {
          type: "h2",
          id: "why-it-matters",
          text: "Почему ORCID важен для вашего резюме",
        },
        {
          type: "p",
          text: "ORCID служит надёжной точкой привязки для академического резюме. Поскольку речь идёт об идентификаторе, а не об имени, инструменты могут извлекать ваши верифицированные публикации и связывать ваши работы без ложных совпадений, характерных для поиска по имени, — что особенно важно для распространённых имён и имён на нелатинских алфавитах.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Как SigmaCV использует ORCID",
        },
        {
          type: "p",
          text: "Вы входите в SigmaCV с помощью своего ORCID iD. Система считывает ваш открытый профиль ORCID, определяет ваш профиль автора в OpenAlex и формирует резюме — сопоставляя ваши работы по идентификатору, а не по имени. Читаются только открытые метаданные; запись в ORCID не производится.",
        },
        {
          type: "cta",
          label: "Создать резюме на основе ORCID",
          href: "/orcid-to-cv",
        },
      ],
      faq: [
        {
          q: "Является ли ORCID бесплатным?",
          a: "Да — регистрация ORCID iD на сайте orcid.org бесплатна и займёт около минуты.",
        },
      ],
    },
    openalex: {
      term: "OpenAlex",
      short:
        "OpenAlex — бесплатный открытый каталог научных работ, авторов, учреждений и изданий мира, поддерживаемый некоммерческой организацией OurResearch.",
      title: "Что такое OpenAlex?",
      description:
        "OpenAlex — бесплатный и полностью открытый индекс научных работ, авторов и учреждений. Что это такое, как он соотносится с проприетарными базами данных и как он используется при формировании вашего резюме.",
      blocks: [
        {
          type: "p",
          text: "OpenAlex — это бесплатный и полностью открытый каталог мировой научной литературы: работы, авторы, учреждения, издания и концепции — созданный и поддерживаемый некоммерческой организацией OurResearch. Каталог индексирует сотни миллионов работ, предоставляет открытый API и открытые данные и является преемником прекратившего существование Microsoft Academic Graph.",
        },
        {
          type: "p",
          text: "Его значимость определяется тем, что он представляет собой открытую альтернативу проприетарным базам данных, таким как Scopus и Web of Science: пользоваться им может любой, а поиск и анализ цитируемости возможны без платного доступа или лицензионных ограничений.",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "OpenAlex и ваше резюме",
        },
        {
          type: "p",
          text: "Для академического резюме OpenAlex является широким открытым источником сведений о ваших публикациях и их показателях цитируемости, привязанных к вам по идентификатору автора OpenAlex.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Как SigmaCV использует OpenAlex",
        },
        {
          type: "p",
          text: "SigmaCV определяет ваш идентификатор автора OpenAlex по вашему ORCID iD, импортирует ваши работы и — только с вашего согласия — извлекает из данных OpenAlex нормализованные по области показатели (по умолчанию отключены, соответствуют принципам DORA).",
        },
        {
          type: "cta",
          label: "Создать резюме на основе OpenAlex",
          href: "/openalex-cv",
        },
      ],
      faq: [
        {
          q: "Является ли OpenAlex бесплатным?",
          a: "Да — OpenAlex полностью открыт: бесплатный API и открытая лицензия на данные.",
        },
      ],
    },
    fwci: {
      term: "FWCI",
      short:
        "Взвешенный с учётом области показатель цитирования (FWCI) сравнивает цитируемость работы со средним мировым уровнем для работ той же области, типа и года — значение 1,0 означает ровно среднее.",
      title: "Что такое взвешенный с учётом области воздействия цитирования (FWCI)?",
      description:
        "Взвешенный с учётом области показатель цитирования (FWCI) — нормализованная по области метрика цитирования, где 1,0 соответствует среднемировому уровню. Что она означает и как ответственно использовать её в резюме.",
      blocks: [
        {
          type: "p",
          text: "FWCI (Field-Weighted Citation Impact) — показатель цитируемости, сравнивающий число полученных работой цитат со средним значением для работ той же области, типа и года публикации. Значение 1,0 означает, что работа цитируется ровно столько раз, сколько ожидалось; 2,0 — вдвое чаще.",
        },
        {
          type: "p",
          text: "Нормализация по области важна, поскольку интенсивность цитирования колоссально различается между дисциплинами: у высокоцитируемой математической работы и высокоцитируемой биомедицинской работы абсолютные показатели кардинально различаются. FWCI переводит их в сопоставимую шкалу.",
        },
        {
          type: "h2",
          id: "vs-h-index",
          text: "FWCI и индекс Хирша: сравнение",
        },
        {
          type: "p",
          text: "В отличие от индекса Хирша или абсолютного числа цитирований, FWCI сопоставим между дисциплинами и на разных этапах карьеры, что делает его более обоснованным показателем. Тем не менее он не лишён недостатков и должен восприниматься в контексте, а не как единственный вердикт о качестве.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Ответственное использование FWCI в резюме",
        },
        {
          type: "p",
          text: "Если вы включаете метрики в резюме, нормализованный по области показатель, подобный FWCI, более обоснован, чем импакт-фактор журнала или голый индекс Хирша, — однако DORA и Лейденский манифест однозначно указывают, что метрики должны поддерживать экспертную оценку, а не заменять её. В SigmaCV метрики по умолчанию отключены, включаются добровольно и являются нормализованными по области.",
        },
        {
          type: "cta",
          label: "Читать: ответственное использование метрик",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "Что означает FWCI, равный 1,0?",
          a: "Ровно среднемировой уровень: работа цитируется столь же часто, как аналогичные работы (той же области, типа и года). Значение выше 1,0 означает выше среднего.",
        },
      ],
    },
    "h-index": {
      term: "h-index",
      short:
        "Индекс Хирша (h-index) — наибольшее число h, при котором у вас есть h публикаций, каждая из которых процитирована не менее h раз.",
      title: "Что такое индекс Хирша (h-index)?",
      description:
        "Индекс Хирша (h-index) — показатель уровня исследователя, объединяющий продуктивность и цитируемость, — но он имеет реальные ограничения. Что он измеряет и как к нему относиться в резюме.",
      blocks: [
        {
          type: "p",
          text: "Индекс Хирша — единственное число, призванное отразить как объём публикаций, так и интенсивность их цитирования: это наибольшее число h, при котором у вас есть h публикаций, каждая из которых процитирована не менее h раз. Индекс Хирша, равный 10, означает наличие 10 статей с не менее чем 10 цитатами каждая.",
        },
        {
          type: "h2",
          id: "limits",
          text: "Ограничения индекса Хирша",
        },
        {
          type: "p",
          text: "Индекс Хирша в значительной мере зависит от области и длины карьеры: он растёт со временем и существенно выше в областях с быстрым цитированием, поэтому не поддаётся сравнению между дисциплинами и между исследователями на разных этапах карьеры. Кроме того, он недооценивает работы ранней карьеры и может быть завышен.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Стоит ли указывать индекс Хирша в резюме?",
        },
        {
          type: "p",
          text: "Это необязательно и зависит от области. Если вы его включаете, дайте контекст и дополните нормализованными по области показателями, а не представляйте его в одиночестве — и помните, что DORA и Лейденский манифест не рекомендуют чрезмерно опираться на какой-либо один показатель. Метрики в SigmaCV включаются добровольно и предпочтительно являются нормализованными по области.",
        },
        {
          type: "cta",
          label: "Читать: ответственное использование метрик",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "Является ли индекс Хирша хорошим показателем качества исследований?",
          a: "В лучшем случае — грубый косвенный показатель: он в значительной мере зависит от области и длины карьеры и не поддаётся сравнению между дисциплинами. Нормализованные по области показатели более обоснованны, а метрики должны поддерживать экспертную оценку, а не заменять её.",
        },
      ],
    },
    csl: {
      term: "CSL",
      short:
        "Citation Style Language (CSL) — открытый стандарт для описания форматов цитирования и библиографий, используемый Zotero, Mendeley и многими другими инструментами.",
      title: "Что такое Citation Style Language (CSL)?",
      description:
        "Citation Style Language (CSL) — открытый стандарт, лежащий в основе единообразного оформления цитат в таких инструментах, как Zotero. Что это такое и почему это обеспечивает идентичность ссылок в вашем резюме во всех форматах.",
      blocks: [
        {
          type: "p",
          text: "Citation Style Language (CSL) — открытый стандарт на основе XML, описывающий правила форматирования цитат и библиографий. Тысячи стилей — APA, Vancouver, Chicago, IEEE и многочисленные журнальные форматы — определены в открытом репозитории стилей CSL и используются такими инструментами, как Zotero и Mendeley.",
        },
        {
          type: "p",
          text: "Его ценность — в единообразии: одно машиночитаемое определение стиля означает, что каждая ссылка оформляется одинаково, а смена стиля происходит мгновенно, без ручного переформатирования.",
        },
        {
          type: "h2",
          id: "your-cv",
          text: "CSL и ваше резюме",
        },
        {
          type: "p",
          text: "Оформление всех ссылок в резюме через единый стиль CSL гарантирует идентичность версий в Word, PDF и LaTeX — самая распространённая ошибка форматирования в академических резюме заключается в смешении стилей или непоследовательном ручном оформлении ссылок.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Как SigmaCV использует CSL",
        },
        {
          type: "p",
          text: "SigmaCV форматирует все цитаты через CSL (посредством citeproc-js), поэтому вы можете выбрать любой поддерживаемый стиль, и список публикаций будет идентично выглядеть во всех форматах экспорта.",
        },
        {
          type: "cta",
          label: "Создать отформатированный список публикаций",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "Можно ли легко сменить стиль цитирования с помощью CSL?",
          a: "Да — именно в этом и состоит его смысл. Выберите любой стиль CSL, и все ссылки будут единообразно переформатированы во всех выходных форматах вашего резюме.",
        },
      ],
    },
    "nih-biosketch": {
      term: "NIH biosketch",
      short:
        "NIH biosketch — краткое структурированное резюме, которое Национальные институты здоровья США требуют в заявках на гранты; в нём освещаются ваши научные вклады и избранные публикации.",
      title: "Что такое NIH biosketch?",
      description:
        "NIH biosketch — краткое структурированное резюме, обязательное в заявках на гранты NIH. Что в него входит, чем оно отличается от полного академического резюме и как его составить.",
      blocks: [
        {
          type: "p",
          text: "NIH biosketch — краткое структурированное резюме, которое Национальные институты здоровья США (NIH) требуют в заявках на гранты. Как правило, оно ограничено пятью страницами и содержит установленные разделы: образование и подготовка, должности и награды, необязательное личное заявление и раздел «вклады в науку», в котором перечислены несколько ключевых вкладов, каждый из которых подкреплён не более чем четырьмя поддерживающими публикациями.",
        },
        {
          type: "p",
          text: "Его структура не случайна: вместо исчерпывающего перечня оно предлагает вам рассказать историю ваших наиболее значимых вкладов и их влияния.",
        },
        {
          type: "h2",
          id: "vs-cv",
          text: "Biosketch и полное академическое резюме",
        },
        {
          type: "p",
          text: "Biosketch значительно короче и нарративнее, чем полное академическое резюме, и составляется в строгом формате NIH. Практический подход — вести полное резюме и готовить biosketch на его основе для каждой заявки.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Как SigmaCV помогает",
        },
        {
          type: "p",
          text: "SigmaCV формирует biosketch в стиле NIH на основе ваших записей в ORCID и OpenAlex: публикации загружаются автоматически, а вы отбираете вклады и избранные публикации перед экспортом.",
        },
        {
          type: "cta",
          label: "Создать NIH biosketch",
          href: "/nih-biosketch",
        },
      ],
      faq: [
        {
          q: "Какова длина NIH biosketch?",
          a: "Как правило, не более пяти страниц. Всегда следуйте актуальным инструкциям и формам NIH для конкретной возможности финансирования.",
        },
      ],
    },
    preprint: {
      term: "препринт",
      short:
        "Препринт — полная версия научной статьи, опубликованная в открытом доступе до официального рецензирования или вместо него, как правило на таких серверах, как arXiv, bioRxiv или medRxiv.",
      title: "Что такое препринт?",
      description:
        "Препринт — научная статья, опубликованная в открытом доступе до рецензирования. Что это такое, почему препринты важны и как включить их в академическое резюме.",
      blocks: [
        {
          type: "p",
          text: "Препринт — полный черновик научной статьи, размещённый в открытом доступе до или без официального рецензирования, как правило на специализированном сервере: arXiv (физика, математика, информатика), bioRxiv (биология) или medRxiv (медицина). Препринт имеет DOI и может быть процитирован.",
        },
        {
          type: "p",
          text: "Препринты ускоряют распространение результатов и устанавливают приоритет; они всё шире признаются законным научным выходом — однако, поскольку они не прошли рецензирование, их всегда следует идентифицировать как препринты.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Включение препринтов в резюме",
        },
        {
          type: "p",
          text: "Включайте препринты, но чётко помечайте их и отделяйте от рецензированных статей — не представляйте препринт как опубликованную работу и избегайте двойного указания одной работы (как препринта и финальной версии), не обозначив связь между ними явно.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Препринты в SigmaCV",
        },
        {
          type: "p",
          text: "SigmaCV извлекает ваши препринты из открытых данных наряду с остальными работами и позволяет группировать и помечать их, обеспечивая их честное представление в резюме.",
        },
        {
          type: "cta",
          label: "Создать отформатированный список публикаций",
          href: "/publication-list",
        },
      ],
      faq: [
        {
          q: "Следует ли включать препринты в академическое резюме?",
          a: "Да — препринты всё шире признаются научным выходом, — но чётко помечайте их как препринты и отделяйте от рецензированных публикаций.",
        },
      ],
    },
    dora: {
      term: "DORA",
      short:
        "DORA — Сан-Францисская декларация об оценке исследований — международный документ, призывающий оценивать исследования по их собственным достоинствам, а не по журнальным метрикам, таким как импакт-фактор журнала.",
      title: "Что такое DORA (Декларация об оценке исследований)?",
      description:
        "DORA (Сан-Францисская декларация об оценке исследований) призывает к ответственной оценке науки. Что это такое и что это означает для метрик в резюме.",
      blocks: [
        {
          type: "p",
          text: "DORA — Сан-Францисская декларация об оценке исследований — это документ 2012 года, подписанный тысячами организаций и частных лиц по всему миру; он формулирует рекомендации по совершенствованию методов оценки исследований. Её основной посыл: не следует использовать журнальные метрики, такие как импакт-фактор журнала, в качестве показателя качества отдельных статей или исследователей.",
        },
        {
          type: "p",
          text: "Вместо этого DORA призывает оценивать исследования по их собственным достоинствам, признавать разнообразие научных выходов и их воздействия, а также явно указывать на ограничения метрик.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Что означает DORA для метрик в резюме",
        },
        {
          type: "p",
          text: "На практике: не указывайте импакт-фактор журналов, в которых опубликованы ваши статьи, делайте акцент на самих работах, а если включаете метрики — предпочитайте нормализованные по области показатели с контекстом. Многие учреждения и финансирующие организации уже оценивают заявки в соответствии с принципами DORA.",
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Как SigmaCV соответствует DORA",
        },
        {
          type: "p",
          text: "SigmaCV создан с учётом этой позиции: метрики по умолчанию отключены и включаются добровольно, предпочтительны нормализованные по области показатели вместо абсолютных значений, а импакт-фактор журналов не отображается никогда.",
        },
        {
          type: "cta",
          label: "Читать: ответственное использование метрик",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "Что DORA говорит об импакт-факторе журнала?",
          a: "DORA прямо рекомендует не использовать журнальные метрики, такие как импакт-фактор журнала, для оценки качества отдельных исследований или исследователей, поскольку импакт-фактор измеряет журнал, а не статью.",
        },
      ],
    },
    "leiden-manifesto": {
      term: "Лейденский манифест",
      short:
        "Лейденский манифест о показателях исследований — набор из десяти принципов ответственного использования количественных метрик в науке: для поддержки, а не замены экспертного суждения.",
      title: "Что такое Лейденский манифест?",
      description:
        "Лейденский манифест формулирует десять принципов ответственного использования научных метрик. Что это такое и как он соотносится с оценкой резюме.",
      blocks: [
        {
          type: "p",
          text: "Лейденский манифест о показателях исследований, опубликованный в Nature в 2015 году, — набор из десяти принципов ответственного использования количественных показателей при оценке исследований. Его основная идея: метрики должны информировать экспертное суждение, а не заменять его.",
        },
        {
          type: "p",
          text: "Среди его принципов: количественная оценка должна поддерживать качественную, экспертную; измерять деятельность следует применительно к миссии группы; необходимо учитывать различия между областями; сбор и анализ данных должны быть прозрачными; следует признавать, что показатели поддаются манипуляции и оказывают системное воздействие.",
        },
        {
          type: "h2",
          id: "on-your-cv",
          text: "Почему это важно для вашего резюме",
        },
        {
          type: "p",
          text: "Как и DORA, Лейденский манифест призывает читать метрики в контексте и не сводить исследователя к единственному числу. Если вы представляете метрики в резюме, выбирайте нормализованные по области показатели, давайте контекст и выдвигайте на первый план свои реальные научные вклады.",
        },
        {
          type: "cta",
          label: "Читать: ответственное использование метрик",
          href: "/guides/responsible-metrics-on-an-academic-cv",
        },
      ],
      faq: [
        {
          q: "Чем Лейденский манифест отличается от DORA?",
          a: "Оба документа продвигают ответственную оценку исследований. DORA сосредоточена на недопустимости злоупотребления журнальными метриками (такими как импакт-фактор) при индивидуальной оценке; Лейденский манифест формулирует десять более широких принципов ответственного использования любых количественных метрик наряду с экспертным суждением.",
        },
      ],
    },
  },
};
