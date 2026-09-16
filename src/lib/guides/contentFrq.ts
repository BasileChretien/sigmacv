// Localized content of the "frq-narrative-cv" guide — the Fonds de recherche du
// Québec "CV descriptif" (mandatory in FRQ competitions since 2025-2026). Kept in
// its own module so `content.ts` stays navigable; `GUIDE_CONTENT` spreads it in
// under every locale, and the parity test in tests/guides.test.ts holds the block
// structure identical across the ten. Facts are from the FRQ instructions (French
// edition July 2025, English edition November 2025); the FRQ's own headings are
// kept verbatim in every locale — an applicant needs the funder's wording. The
// English and French copy are hand-written; the other eight were drafted from
// them and are flagged for a native-speaker review pass (cf. `content.ts`).
import type { Locale } from "@/lib/i18n";
import type { GuideContent } from "./guides";

export const FRQ_GUIDE: Record<Locale, GuideContent> = {
  "en-US": {
    title: "The FRQ narrative CV (CV-FRQ): how to prepare it",
    description:
      "What the Fonds de recherche du Québec asks for in its 'CV descriptif' — three sections, six pages in French or five in English, up to ten contributions with their audience and impact — and how to prepare one from your research record without inflating anything.",
    blocks: [
      {
        type: "p",
        text: "Since the 2025-2026 competitions, the Fonds de recherche du Québec (FRQ) asks applicants for a narrative CV — the 'CV descriptif', or CV-FRQ — in place of the Canadian Common CV. It is short, it has three fixed sections, and it is judged on what you say a contribution changed, not on how many lines you list. This guide sets out what the FRQ instructions actually require, section by section, and how to build the document from the record you already have.",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "What the CV-FRQ is" },
      {
        type: "p",
        text: "The FRQ describes the CV-FRQ as a document that highlights your expertise and relevant skills by considering a broad range of contributions and achievements — not only publications. It is written in the FRQ's Word template and attached as a PDF to the FRQnet application form; the form itself collects your education, employment history, languages and current position, so none of that needs repeating in the CV. Three sections, always in this order:",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate (English template: Section 1: Background and skills) — how your academic, professional or personal background enables you to carry out the proposed research and meet the programme's criteria.",
          "Deuxième section : Contributions et expériences les plus importantes (Section 2: Most significant contributions and experiences) — up to ten contributions or experiences, each with its impact, your role, its period and its audience.",
          "Troisième section : Activités de supervision et de mentorat (Section 3: Supervisory and mentorship activities) — how you have trained and mentored students, postdoctoral researchers and highly qualified personnel.",
        ],
      },
      { type: "h2", id: "rules", text: "The rules that apply" },
      {
        type: "ul",
        items: [
          "Six pages at most in French, five in English. The two templates differ only in language and length.",
          "Use the FRQ Word template, follow the FRQnet presentation standards for attachments, and upload the result as a PDF.",
          "No word limit. The FRQ recommends subsections that map onto the programme's evaluation criteria; bullet points and tables are allowed.",
          "A section that does not apply may simply say 's/o' (sans objet) — 'N/A' in the English template.",
          "No sensitive personal information (medical, financial or otherwise private), no photo, and nothing that could harm you or anyone else.",
          "Everything must be aligned with the objectives and evaluation criteria of the programme you are applying to — read them first, then decide what goes in.",
        ],
      },
      { type: "h2", id: "section-1", text: "Section 1: background and skills" },
      {
        type: "p",
        text: "This is the place for expertise or lived experience showing you can carry out the project, activities that demonstrate leadership, previous collaborations or achievements on the research theme, the concrete and transformational effects of your past work, recognitions such as prizes and scholarships, and skills acquired through personal experience. Write it for the programme in front of you: an evaluator reads this section against the call's criteria, so mirror their order and vocabulary.",
      },
      { type: "h2", id: "section-2", text: "Section 2: up to ten contributions" },
      {
        type: "p",
        text: "The heart of the document. A contribution need not be a single publication; it may be a cluster of closely related outputs — a paper, the dataset behind it, the guideline it informed. The FRQ lists what counts, and the list is long: publications of every kind, knowledge mobilisation (media, podcasts, public lectures), review and assessment activities, community service, artistic creation, data infrastructure and cohorts, intellectual property, conference organisation, partnerships, memoranda that shaped policies or standards of practice, software and tools, and contributions to open science in the UNESCO sense. For each one, give:",
      },
      {
        type: "ul",
        items: [
          "the date or period of the contribution;",
          "its target audience — A. academic community, B. practice community, C. general public — one letter or several;",
          "the role you played in it, stated plainly;",
          "its impact, significance and value — with something a reader can check: a DOI, a report, a registry entry, a policy that cites the work.",
        ],
      },
      {
        type: "p",
        text: "When you list publications, the FRQ asks for APA style or another standard recognised in your discipline, your own name in bold — along with the co-investigators named in the application — and an asterisk after the name of every person you supervised (Nom, Prénom*), from undergraduates to postdoctoral researchers and highly qualified personnel. Avoid repeating in this section what you already said in the first.",
      },
      { type: "h2", id: "section-3", text: "Section 3: supervision and mentorship" },
      {
        type: "p",
        text: "Describe the extent to which you have trained the next generation: supervision of college and university students at every level, of postdoctoral researchers and of highly qualified personnel; teaching and training workshops; formal or informal mentorship of early-career researchers, colleagues and partners; outreach that brings students into research; training in methods or knowledge systems, including Indigenous knowledge; and the creation of safe, equitable and inclusive research environments. Careers outside academia count as much as careers inside it.",
      },
      { type: "h2", id: "evidence", text: "Proving impact without inflating it" },
      {
        type: "p",
        text: "The question every applicant asks about a narrative CV is how to 'prove' that a contribution mattered. Evaluators new to the format ask it too. The honest answer is that a narrative claim is proved by something the reader can follow, not by a number: 'this paper documented the signal that led the regulator to amend the product monograph in 2023' is checkable if the paper has a DOI, the monograph has a date and the regulator's decision is public. A citation count or an h-index tells the reader nothing about that chain, and the FRQ's own instructions never ask for one.",
      },
      {
        type: "p",
        text: "So write the chain — output, then what it changed, then where that change is recorded — and put the identifiers in. Where a contribution reached practitioners or the public (audiences B and C), say through what: a clinical guideline, a ministry report, a professional training programme, a media series. Where you cannot document an effect, describe the contribution's significance and your role and leave it there. A reviewer trusts a CV that knows the difference.",
      },
      { type: "h2", id: "with-sigmacv", text: "Preparing it with SigmaCV" },
      {
        type: "p",
        text: "SigmaCV builds your complete academic CV from open research data — ORCID, OpenAlex, Crossref, DataCite and others — and lets you apply funder layouts to it reversibly. Two of those layouts are the CV-FRQ in French and in English: each shows exactly the three FRQ sections under the FRQ's own headings and hides everything else, because the FRQnet form collects the rest. Inside each section you write prose, and every claim can point at a real entry of your record with an evidence link, so the reader lands on the DOI, not on your word for it. Then:",
      },
      {
        type: "ol",
        items: [
          "Sign in with ORCID and let the record build; mark anything that is not yours, and add by DOI anything that is missing.",
          "Apply the CV-FRQ layout (French or English) from the CV-model picker. Your previous layout is saved as a preset, so nothing is lost.",
          "Write the three sections. Under each, the evidence panel lists your publications, datasets, supervision records and other outputs to cite with an evidence link; watch the character counter and the page count against the six- or five-page limit.",
          "Export to DOCX, paste the sections into the FRQ Word template, check the formatting rules, and attach the PDF in FRQnet.",
        ],
      },
      { type: "cta", label: "Build your CV from your ORCID record — free", href: "/" },
    ],
    faq: [
      {
        q: "Does the CV-FRQ replace the Canadian Common CV for FRQ competitions?",
        a: "For the programmes that have adopted it, yes — the FRQ asks for the CV-FRQ as a PDF attachment in FRQnet. Check the rules of the specific programme you are applying to, since adoption has been programme by programme.",
      },
      {
        q: "Is the CV-FRQ the same as the federal Tri-agency CV?",
        a: "No. They share the same spirit — a narrative, a small number of significant contributions, a mentorship section — but the Tri-agency CV is CIHR, NSERC and SSHRC's document, with its own template and rollout (NSERC's 2027 competitions, CIHR's Project Grant no sooner than fall 2027). Prepare each for the funder that asks for it.",
      },
      {
        q: "Should I include citation counts or my h-index?",
        a: "The FRQ instructions do not ask for them, and they do not demonstrate what the CV-FRQ evaluates: the impact, significance and value of a contribution and your role in it. Document the effect a contribution had instead, with identifiers a reader can follow.",
      },
      {
        q: "Can a contribution be something other than a publication?",
        a: "Yes, and the FRQ's list is deliberately broad: knowledge mobilisation, policy memoranda, data infrastructure, software, artistic creation, partnerships, conference organisation, intellectual property, community service and open-science contributions all count, alone or grouped with related outputs.",
      },
    ],
  },
  "zh-CN": {
    title: "FRQ 叙述式简历（CV-FRQ）：如何准备",
    description:
      "Fonds de recherche du Québec 的「CV descriptif」要求什么——三个部分，法文六页或英文五页，最多十项贡献并注明受众与影响——以及如何在不夸大的前提下，从您的研究记录出发准备它。",
    blocks: [
      {
        type: "p",
        text: "自 2025-2026 年度竞赛起，Fonds de recherche du Québec（FRQ）要求申请人提交叙述式简历——「CV descriptif」，即 CV-FRQ——以取代 Canadian Common CV。它篇幅短、只有三个固定部分，评审看的是您说明某项贡献改变了什么，而不是您罗列了多少行。本指南逐一说明 FRQ 指引的实际要求，以及如何用您已有的记录完成这份文件。",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "什么是 CV-FRQ" },
      {
        type: "p",
        text: "FRQ 将 CV-FRQ 描述为一份通过考量广泛的贡献与成就——而非仅限论文——来凸显您的专长与相关能力的文件。它在 FRQ 的 Word 模板中撰写，并以 PDF 附于 FRQnet 申请表；表单本身收集学历、任职经历、语言和当前职位，因此这些都无需在简历中重复。三个部分，顺序固定：",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate（英文模板：Section 1: Background and skills）——您的学术、职业或个人经历如何使您能够完成拟议研究并满足项目标准。",
          "Deuxième section : Contributions et expériences les plus importantes（Section 2: Most significant contributions and experiences）——最多十项贡献或经历，各自注明影响、您的角色、时期与受众。",
          "Troisième section : Activités de supervision et de mentorat（Section 3: Supervisory and mentorship activities）——您如何培养和指导学生、博士后研究人员与高素质人才。",
        ],
      },
      { type: "h2", id: "rules", text: "适用的规则" },
      {
        type: "ul",
        items: [
          "法文最多六页，英文最多五页。两个模板仅在语言和篇幅上不同。",
          "使用 FRQ 的 Word 模板，遵循 FRQnet 附件的排版规范，并以 PDF 上传。",
          "不限字数。FRQ 建议按项目评审标准划分小节；允许使用项目符号和表格。",
          "不适用的部分可直接写「s/o」（sans objet）——英文模板中写「N/A」。",
          "不得包含敏感个人信息（医疗、财务或其他私密信息）、照片，或任何可能对您或他人造成损害的内容。",
          "所有内容必须与您所申请项目的目标和评审标准一致——先阅读它们，再决定写什么。",
        ],
      },
      { type: "h2", id: "section-1", text: "第一部分：经历与能力" },
      {
        type: "p",
        text: "这里应写明证明您能完成项目的专长或亲身经历、体现领导力的活动、在该研究主题上的既往合作或成果、既往工作产生的具体而变革性的效果、奖项与奖学金等荣誉，以及从个人经历中获得的能力。针对眼前的项目来写：评审会对照征集标准阅读本部分，因此请沿用其顺序和用语。",
      },
      { type: "h2", id: "section-2", text: "第二部分：最多十项贡献" },
      {
        type: "p",
        text: "这是文件的核心。一项贡献不必是单篇论文，可以是一组紧密相关的成果——一篇文章、其背后的数据集、它所影响的指南。FRQ 列出了可计入的类型，清单很长：各类出版物、知识动员（媒体、播客、公开讲座）、评审与评估活动、社区服务、艺术创作、数据基础设施与队列、知识产权、会议组织、合作伙伴关系、影响政策或实践标准的建议书、软件与工具，以及符合 UNESCO 定义的开放科学贡献。每一项请注明：",
      },
      {
        type: "ul",
        items: [
          "该贡献的日期或时期；",
          "目标受众——A. 学术界，B. 实务界，C. 公众——一个或多个字母；",
          "您在其中扮演的角色，直白陈述；",
          "其影响、重要性与价值——附上读者可核查的依据：DOI、报告、注册条目、引用该工作的政策。",
        ],
      },
      {
        type: "p",
        text: "列出出版物时，FRQ 要求采用 APA 格式或您学科认可的其他标准，您本人的姓名加粗——申请中列名的共同研究者亦然——并在您所指导的每位人员姓名后加星号（Nom, Prénom*），从本科生到博士后研究人员和高素质人才皆适用。避免在本部分重复第一部分已述内容。",
      },
      { type: "h2", id: "section-3", text: "第三部分：指导与培养" },
      {
        type: "p",
        text: "说明您在多大程度上培养了下一代：对各层级大专院校学生、博士后研究人员和高素质人才的指导；教学与培训工作坊；对早期职业研究者、同事和合作伙伴的正式或非正式指导；让学生参与研究的推广活动；方法或知识体系（包括原住民知识）的培训；以及安全、公平、包容的研究环境的建设。学术界之外的职业发展与学术界内的同样重要。",
      },
      { type: "h2", id: "evidence", text: "证明影响，而不夸大" },
      {
        type: "p",
        text: "每位申请人对叙述式简历都会问同一个问题：如何「证明」某项贡献确有价值。初次接触这种格式的评审也会问。诚实的回答是：叙述性的主张靠读者可以追溯的东西来证明，而不是靠数字：「这篇论文记录了促使监管机构在 2023 年修订产品专论的信号」——只要论文有 DOI、专论有日期、监管决定是公开的，这就可以核查。引用次数或 h 指数对这条链条毫无说明，FRQ 的指引也从未要求过它们。",
      },
      {
        type: "p",
        text: "所以请写出这条链条——成果、它改变了什么、这一改变记录在哪里——并放入标识符。凡贡献触及实务界或公众（受众 B 和 C）之处，说明是通过什么：临床指南、部委报告、专业培训项目、系列媒体报道。凡无法记录效果之处，描述贡献的重要性和您的角色即可。一份懂得分辨这两者的简历更能赢得评审的信任。",
      },
      { type: "h2", id: "with-sigmacv", text: "用 SigmaCV 准备" },
      {
        type: "p",
        text: "SigmaCV 从开放研究数据——ORCID、OpenAlex、Crossref、DataCite 等——构建您的完整学术简历，并允许您以可逆方式套用资助机构版式。其中两种版式就是法文和英文的 CV-FRQ：各自只显示 FRQ 的三个部分、使用 FRQ 的原文标题，并隐藏其余一切，因为 FRQnet 表单会收集其余信息。在每个部分中您撰写正文，每一项主张都可以通过证据链接指向您记录中的真实条目，读者点开的是 DOI，而不是您的一句话。接着：",
      },
      {
        type: "ol",
        items: [
          "用 ORCID 登录并让记录自动构建；标记不属于您的条目，并按 DOI 补充缺失的成果。",
          "在简历模型选择器中套用 CV-FRQ 版式（法文或英文）。之前的版式会保存为预设，不会丢失。",
          "撰写三个部分。每个部分下方的证据面板列出您的出版物、数据集、指导记录和其他成果，供您以证据链接引用；对照六页或五页的限制留意字符计数和页数。",
          "导出为 DOCX，将各部分粘贴到 FRQ 的 Word 模板，核对排版规则，然后在 FRQnet 中附上 PDF。",
        ],
      },
      { type: "cta", label: "从您的 ORCID 记录构建简历——免费", href: "/" },
    ],
    faq: [
      {
        q: "在 FRQ 竞赛中，CV-FRQ 是否取代 Canadian Common CV？",
        a: "对已采用它的项目而言，是的——FRQ 要求在 FRQnet 中以 PDF 附件形式提交 CV-FRQ。请查阅您所申请具体项目的规则，因为采用是逐项目进行的。",
      },
      {
        q: "CV-FRQ 与联邦 Tri-agency CV 是同一份文件吗？",
        a: "不是。二者精神相同——叙述式、少量重要贡献、一个指导培养部分——但 Tri-agency CV 是 CIHR、NSERC 和 SSHRC 的文件，有自己的模板和推行时间表（NSERC 的 2027 年竞赛，CIHR 的 Project Grant 不早于 2027 年秋季）。请为提出要求的资助机构分别准备。",
      },
      {
        q: "我应该写入引用次数或 h 指数吗？",
        a: "FRQ 指引没有要求，它们也无法展示 CV-FRQ 所评估的内容：贡献的影响、重要性和价值，以及您在其中的角色。请改为记录贡献产生的效果，并附上读者可追溯的标识符。",
      },
      {
        q: "贡献可以是出版物之外的东西吗？",
        a: "可以，FRQ 的清单有意设得很宽：知识动员、政策建议书、数据基础设施、软件、艺术创作、合作伙伴关系、会议组织、知识产权、社区服务和开放科学贡献都可计入，单独列出或与相关成果合并均可。",
      },
    ],
  },
  "es-ES": {
    title: "El CV narrativo del FRQ (CV-FRQ): cómo prepararlo",
    description:
      "Qué pide el Fonds de recherche du Québec en su «CV descriptif» —tres secciones, seis páginas en francés o cinco en inglés, hasta diez contribuciones con su público y su impacto— y cómo prepararlo a partir de tu registro de investigación sin inflar nada.",
    blocks: [
      {
        type: "p",
        text: "Desde las convocatorias 2025-2026, el Fonds de recherche du Québec (FRQ) pide a los solicitantes un CV narrativo —el «CV descriptif», o CV-FRQ— en lugar del Canadian Common CV. Es breve, tiene tres secciones fijas y se evalúa por lo que dices que cambió una contribución, no por cuántas líneas enumeras. Esta guía expone lo que las instrucciones del FRQ exigen realmente, sección por sección, y cómo construir el documento a partir del registro que ya tienes.",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "Qué es el CV-FRQ" },
      {
        type: "p",
        text: "El FRQ describe el CV-FRQ como un documento que destaca tu experiencia y competencias pertinentes considerando una amplia gama de contribuciones y logros, no solo publicaciones. Se redacta en la plantilla Word del FRQ y se adjunta en PDF al formulario de solicitud FRQnet; el propio formulario recoge tu formación, historial laboral, idiomas y puesto actual, así que nada de eso hay que repetirlo en el CV. Tres secciones, siempre en este orden:",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate (plantilla inglesa: Section 1: Background and skills): cómo tu trayectoria académica, profesional o personal te permite realizar la investigación propuesta y cumplir los criterios del programa.",
          "Deuxième section : Contributions et expériences les plus importantes (Section 2: Most significant contributions and experiences): hasta diez contribuciones o experiencias, cada una con su impacto, tu papel, su periodo y su público.",
          "Troisième section : Activités de supervision et de mentorat (Section 3: Supervisory and mentorship activities): cómo has formado y acompañado a estudiantes, investigadores posdoctorales y personal altamente cualificado.",
        ],
      },
      { type: "h2", id: "rules", text: "Las reglas que se aplican" },
      {
        type: "ul",
        items: [
          "Seis páginas como máximo en francés, cinco en inglés. Las dos plantillas solo difieren en idioma y extensión.",
          "Usa la plantilla Word del FRQ, sigue las normas de presentación de FRQnet para los anexos y sube el resultado en PDF.",
          "Sin límite de palabras. El FRQ recomienda subsecciones que correspondan a los criterios de evaluación del programa; se permiten viñetas y tablas.",
          "Una sección que no se aplique puede decir simplemente «s/o» (sans objet), «N/A» en la plantilla inglesa.",
          "Ninguna información personal sensible (médica, financiera o privada), ninguna foto y nada que pueda perjudicarte a ti o a otras personas.",
          "Todo debe estar alineado con los objetivos y criterios de evaluación del programa al que te presentas: léelos primero y decide después qué incluir.",
        ],
      },
      { type: "h2", id: "section-1", text: "Sección 1: trayectoria y competencias" },
      {
        type: "p",
        text: "Es el lugar para la experiencia —vivida o profesional— que demuestra que puedes llevar a cabo el proyecto, las actividades que muestran liderazgo, las colaboraciones o logros previos sobre el tema de investigación, los efectos concretos y transformadores de tu trabajo anterior, los reconocimientos como premios y becas, y las competencias adquiridas por experiencia personal. Escríbela para el programa que tienes delante: el evaluador lee esta sección frente a los criterios de la convocatoria, así que sigue su orden y su vocabulario.",
      },
      { type: "h2", id: "section-2", text: "Sección 2: hasta diez contribuciones" },
      {
        type: "p",
        text: "El corazón del documento. Una contribución no tiene que ser una sola publicación; puede ser un conjunto de resultados estrechamente relacionados: un artículo, el conjunto de datos que lo sustenta, la guía a la que informó. El FRQ enumera lo que cuenta, y la lista es larga: publicaciones de todo tipo, movilización del conocimiento (medios, pódcast, conferencias públicas), actividades de evaluación y revisión, servicio a la comunidad, creación artística, infraestructuras de datos y cohortes, propiedad intelectual, organización de congresos, alianzas, informes que orientaron políticas o normas de práctica, software y herramientas, y contribuciones a la ciencia abierta en el sentido de la UNESCO. Para cada una, indica:",
      },
      {
        type: "ul",
        items: [
          "la fecha o el periodo de la contribución;",
          "su público destinatario —A. comunidad académica, B. comunidad de práctica, C. público general—, una letra o varias;",
          "el papel que desempeñaste, dicho con claridad;",
          "su impacto, importancia y valor, con algo que el lector pueda comprobar: un DOI, un informe, una entrada en un registro, una política que cite el trabajo.",
        ],
      },
      {
        type: "p",
        text: "Al listar publicaciones, el FRQ pide el estilo APA u otra norma reconocida en tu disciplina, tu propio nombre en negrita —junto con los coinvestigadores nombrados en la solicitud— y un asterisco tras el nombre de cada persona que hayas supervisado (Nom, Prénom*), desde estudiantes de grado hasta investigadores posdoctorales y personal altamente cualificado. Evita repetir en esta sección lo que ya dijiste en la primera.",
      },
      { type: "h2", id: "section-3", text: "Sección 3: supervisión y mentoría" },
      {
        type: "p",
        text: "Describe en qué medida has formado a la siguiente generación: supervisión de estudiantes de colegio y universidad en todos los niveles, de investigadores posdoctorales y de personal altamente cualificado; docencia y talleres de formación; mentoría formal o informal de investigadores en inicio de carrera, colegas y socios; actividades de divulgación que acercan a los estudiantes a la investigación; formación en métodos o sistemas de conocimiento, incluidos los saberes indígenas; y la creación de entornos de investigación seguros, equitativos e inclusivos. Las carreras fuera de la academia cuentan tanto como las de dentro.",
      },
      { type: "h2", id: "evidence", text: "Demostrar el impacto sin inflarlo" },
      {
        type: "p",
        text: "La pregunta que todo solicitante se hace ante un CV narrativo es cómo «demostrar» que una contribución importó. Los evaluadores nuevos en el formato también se la hacen. La respuesta honesta es que una afirmación narrativa se demuestra con algo que el lector pueda seguir, no con un número: «este artículo documentó la señal que llevó al regulador a modificar la monografía del producto en 2023» es comprobable si el artículo tiene DOI, la monografía tiene fecha y la decisión del regulador es pública. Un recuento de citas o un índice h no dicen nada de esa cadena, y las propias instrucciones del FRQ nunca los piden.",
      },
      {
        type: "p",
        text: "Así que escribe la cadena —el resultado, lo que cambió y dónde está registrado ese cambio— e incluye los identificadores. Donde una contribución llegó a profesionales o al público (públicos B y C), di a través de qué: una guía clínica, un informe ministerial, un programa de formación profesional, una serie en los medios. Donde no puedas documentar un efecto, describe la importancia de la contribución y tu papel, y déjalo ahí. Un evaluador confía en un CV que sabe distinguir ambas cosas.",
      },
      { type: "h2", id: "with-sigmacv", text: "Prepararlo con SigmaCV" },
      {
        type: "p",
        text: "SigmaCV construye tu CV académico completo a partir de datos abiertos de investigación —ORCID, OpenAlex, Crossref, DataCite y otros— y te permite aplicarle diseños de financiadores de forma reversible. Dos de esos diseños son el CV-FRQ en francés y en inglés: cada uno muestra exactamente las tres secciones del FRQ bajo sus propios encabezados y oculta todo lo demás, porque el formulario FRQnet recoge el resto. Dentro de cada sección escribes prosa, y cada afirmación puede apuntar a una entrada real de tu registro con un enlace de evidencia, de modo que el lector llega al DOI, no a tu palabra. Después:",
      },
      {
        type: "ol",
        items: [
          "Inicia sesión con ORCID y deja que el registro se construya; marca lo que no sea tuyo y añade por DOI lo que falte.",
          "Aplica el diseño CV-FRQ (francés o inglés) desde el selector de modelos de CV. Tu diseño anterior se guarda como preajuste, así que no se pierde nada.",
          "Escribe las tres secciones. Bajo cada una, el panel de evidencias lista tus publicaciones, conjuntos de datos, registros de supervisión y otros resultados para citarlos con un enlace de evidencia; vigila el contador de caracteres y el número de páginas frente al límite de seis o cinco.",
          "Exporta a DOCX, pega las secciones en la plantilla Word del FRQ, comprueba las normas de formato y adjunta el PDF en FRQnet.",
        ],
      },
      { type: "cta", label: "Construye tu CV desde tu registro ORCID — gratis", href: "/" },
    ],
    faq: [
      {
        q: "¿El CV-FRQ sustituye al Canadian Common CV en las convocatorias del FRQ?",
        a: "En los programas que lo han adoptado, sí: el FRQ pide el CV-FRQ como anexo PDF en FRQnet. Consulta las reglas del programa concreto al que te presentas, porque la adopción ha sido programa por programa.",
      },
      {
        q: "¿Es el CV-FRQ lo mismo que el Tri-agency CV federal?",
        a: "No. Comparten el mismo espíritu —una narrativa, pocas contribuciones significativas, una sección de mentoría—, pero el Tri-agency CV es el documento de CIHR, NSERC y SSHRC, con su propia plantilla y su propio calendario (las convocatorias 2027 de NSERC, el Project Grant de CIHR no antes del otoño de 2027). Prepara cada uno para el financiador que lo pide.",
      },
      {
        q: "¿Debo incluir recuentos de citas o mi índice h?",
        a: "Las instrucciones del FRQ no los piden, y no demuestran lo que el CV-FRQ evalúa: el impacto, la importancia y el valor de una contribución y tu papel en ella. Documenta en su lugar el efecto que tuvo la contribución, con identificadores que el lector pueda seguir.",
      },
      {
        q: "¿Una contribución puede ser algo distinto de una publicación?",
        a: "Sí, y la lista del FRQ es deliberadamente amplia: movilización del conocimiento, informes de política, infraestructuras de datos, software, creación artística, alianzas, organización de congresos, propiedad intelectual, servicio a la comunidad y contribuciones a la ciencia abierta cuentan, solas o agrupadas con resultados relacionados.",
      },
    ],
  },
  "fr-FR": {
    title: "Le CV-FRQ (CV descriptif) : comment le préparer",
    description:
      "Ce que le Fonds de recherche du Québec demande dans son CV descriptif — trois sections, six pages en français ou cinq en anglais, jusqu'à dix contributions avec leur clientèle et leurs retombées — et comment le préparer à partir de votre dossier de recherche sans rien gonfler.",
    blocks: [
      {
        type: "p",
        text: "Depuis les concours 2025-2026, le Fonds de recherche du Québec (FRQ) demande aux personnes candidates un CV descriptif — le CV-FRQ — à la place du CV commun canadien. Il est court, il compte trois sections fixes, et il est évalué sur ce que vous dites qu'une contribution a changé, non sur le nombre de lignes que vous alignez. Ce guide expose ce que les instructions du FRQ exigent réellement, section par section, et comment bâtir le document à partir du dossier que vous avez déjà.",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "Ce qu'est le CV-FRQ" },
      {
        type: "p",
        text: "Le FRQ décrit le CV-FRQ comme un document qui met en valeur votre expertise et vos compétences pertinentes en prenant en considération un large éventail de contributions et de réalisations — pas seulement des publications. Il se rédige dans le modèle Word du FRQ et se joint en PDF au formulaire de demande FRQnet ; le formulaire recueille lui-même votre formation, votre historique d'emploi, vos langues et votre occupation actuelle, si bien que rien de cela n'a à être répété dans le CV. Trois sections, toujours dans cet ordre :",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate (modèle anglais : Section 1: Background and skills) — comment votre parcours académique, professionnel ou personnel vous permet de réaliser la recherche proposée et de répondre aux critères du programme.",
          "Deuxième section : Contributions et expériences les plus importantes (Section 2: Most significant contributions and experiences) — jusqu'à dix contributions ou expériences, chacune avec ses retombées, votre rôle, sa période et sa clientèle.",
          "Troisième section : Activités de supervision et de mentorat (Section 3: Supervisory and mentorship activities) — comment vous avez formé et accompagné la relève étudiante et postdoctorale et le personnel hautement qualifié.",
        ],
      },
      { type: "h2", id: "rules", text: "Les règles qui s'appliquent" },
      {
        type: "ul",
        items: [
          "Six pages au maximum en français, cinq en anglais. Les deux modèles ne diffèrent que par la langue et la longueur.",
          "Utilisez le modèle Word du FRQ, respectez les normes de présentation des fichiers joints aux formulaires FRQnet, et téléversez le résultat en PDF.",
          "Aucune limite de mots. Le FRQ recommande des sous-sections qui reprennent les critères d'évaluation du programme ; les puces et les tableaux sont permis.",
          "Une section qui ne s'applique pas peut simplement porter « s/o » (sans objet) — « N/A » dans le modèle anglais.",
          "Aucune information personnelle sensible (médicale, financière ou autrement intime), aucune photo, et rien qui puisse vous causer ou causer à d'autres un préjudice.",
          "Tout doit être aligné sur les objectifs et les critères d'évaluation du programme visé — lisez-les d'abord, puis décidez de ce qui entre.",
        ],
      },
      { type: "h2", id: "section-1", text: "Première section : parcours et compétences" },
      {
        type: "p",
        text: "C'est la place de l'expertise ou de l'expérience concrète qui démontre votre capacité à réaliser le projet, des activités qui témoignent de votre leadership, des collaborations ou réalisations antérieures sur la thématique, des effets concrets et transformationnels de vos travaux passés, des reconnaissances comme les prix et les bourses, et des aptitudes acquises par vos expériences personnelles. Écrivez-la pour le programme que vous avez devant vous : la personne évaluatrice lit cette section à la lumière des critères du concours, alors reprenez leur ordre et leur vocabulaire.",
      },
      { type: "h2", id: "section-2", text: "Deuxième section : jusqu'à dix contributions" },
      {
        type: "p",
        text: "Le cœur du document. Une contribution n'a pas à être une seule publication ; elle peut réunir un ensemble d'éléments étroitement liés — un article, le jeu de données qui le sous-tend, la ligne directrice qu'il a éclairée. Le FRQ énumère ce qui compte, et la liste est longue : publications de toute nature, mobilisation des connaissances (médias, balados, conférences publiques), activités d'évaluation, services à la communauté, création artistique, infrastructures de données et cohortes, propriété intellectuelle, organisation de colloques, partenariats, avis et mémoires ayant contribué à des politiques ou à des normes de pratique, logiciels et outils, et contributions à la science ouverte au sens de la Recommandation de l'UNESCO. Pour chacune, précisez :",
      },
      {
        type: "ul",
        items: [
          "la date ou la période de la contribution ;",
          "sa clientèle ciblée — A. milieu académique, B. milieu de pratique, C. grand public — une lettre ou plusieurs ;",
          "le rôle que vous y avez joué, dit simplement ;",
          "ses retombées, son importance et sa valeur — avec quelque chose que le lecteur peut vérifier : un DOI, un rapport, une inscription à un registre, une politique qui cite le travail.",
        ],
      },
      {
        type: "p",
        text: "Si vous incluez des publications, le FRQ demande les normes APA ou toute autre norme reconnue dans votre discipline, vos nom et prénom en gras — ainsi que ceux des cochercheuses et cochercheurs identifiés dans la demande — et un astérisque à la suite du nom de chaque personne que vous supervisez (Nom, Prénom*), de la relève du premier cycle jusqu'aux postdoctorants et au personnel hautement qualifié. Évitez de répéter dans cette section ce que vous avez dit dans la première.",
      },
      { type: "h2", id: "section-3", text: "Troisième section : supervision et mentorat" },
      {
        type: "p",
        text: "Décrivez dans quelle mesure vous avez formé la relève : encadrement de la relève étudiante du collégial et des universités à tous les cycles, des postdoctorants et du personnel hautement qualifié ; enseignement et ateliers de formation ; mentorat formel ou informel de chercheuses et chercheurs en début de carrière, de collègues et de partenaires ; sensibilisation qui amène des étudiants vers la recherche ; formations aux méthodes ou aux systèmes de connaissances, y compris les savoirs autochtones ; et établissement de milieux de recherche sûrs, équitables et inclusifs. Les carrières hors du milieu académique comptent autant que celles qui s'y déroulent.",
      },
      { type: "h2", id: "evidence", text: "Prouver les retombées sans les gonfler" },
      {
        type: "p",
        text: "La question que toute personne candidate se pose devant un CV descriptif est comment « prouver » qu'une contribution a compté. Les évaluateurs nouveaux dans le format se la posent aussi. La réponse honnête est qu'une affirmation narrative se prouve par quelque chose que le lecteur peut suivre, non par un chiffre : « cet article a documenté le signal qui a conduit l'organisme de réglementation à modifier la monographie du produit en 2023 » se vérifie si l'article a un DOI, si la monographie a une date et si la décision de l'organisme est publique. Un nombre de citations ou un indice h ne dit rien de cette chaîne, et les instructions du FRQ n'en demandent jamais.",
      },
      {
        type: "p",
        text: "Écrivez donc la chaîne — le produit, puis ce qu'il a changé, puis où ce changement est consigné — et mettez les identifiants. Là où une contribution a rejoint le milieu de pratique ou le grand public (clientèles B et C), dites par quoi : une ligne directrice clinique, un rapport ministériel, un programme de formation professionnelle, une série dans les médias. Là où vous ne pouvez pas documenter un effet, décrivez l'importance de la contribution et votre rôle, et arrêtez-vous là. Une personne évaluatrice fait confiance à un CV qui connaît la différence.",
      },
      { type: "h2", id: "with-sigmacv", text: "Le préparer avec SigmaCV" },
      {
        type: "p",
        text: "SigmaCV bâtit votre CV académique complet à partir de données de recherche ouvertes — ORCID, OpenAlex, Crossref, DataCite et d'autres — et vous laisse y appliquer des mises en page de financeurs de façon réversible. Deux de ces mises en page sont le CV-FRQ en français et en anglais : chacune montre exactement les trois sections du FRQ sous ses propres intitulés et masque tout le reste, puisque le formulaire FRQnet recueille le reste. Dans chaque section vous écrivez en prose, et chaque affirmation peut pointer vers une entrée réelle de votre dossier par un lien de preuve, de sorte que le lecteur arrive sur le DOI, et non sur votre parole. Ensuite :",
      },
      {
        type: "ol",
        items: [
          "Connectez-vous avec ORCID et laissez le dossier se construire ; signalez ce qui n'est pas de vous, et ajoutez par DOI ce qui manque.",
          "Appliquez la mise en page CV-FRQ (français ou anglais) depuis le sélecteur de modèles de CV. Votre mise en page précédente est conservée comme préréglage, rien n'est perdu.",
          "Rédigez les trois sections. Sous chacune, le panneau de preuves liste vos publications, jeux de données, encadrements et autres produits à citer par un lien de preuve ; surveillez le compteur de caractères et le nombre de pages au regard de la limite de six ou cinq pages.",
          "Exportez en DOCX, collez les sections dans le modèle Word du FRQ, vérifiez les normes de présentation, et joignez le PDF dans FRQnet.",
        ],
      },
      { type: "cta", label: "Bâtir votre CV à partir de votre dossier ORCID — gratuit", href: "/" },
    ],
    faq: [
      {
        q: "Le CV-FRQ remplace-t-il le CV commun canadien dans les concours du FRQ ?",
        a: "Pour les programmes qui l'ont adopté, oui — le FRQ demande le CV-FRQ en pièce jointe PDF dans FRQnet. Vérifiez les règles du programme précis auquel vous postulez, l'adoption s'étant faite programme par programme.",
      },
      {
        q: "Le CV-FRQ est-il la même chose que le CV des trois organismes fédéraux (Tri-agency) ?",
        a: "Non. Ils partagent le même esprit — un récit, un petit nombre de contributions significatives, une section de mentorat — mais le Tri-agency CV est le document des IRSC, du CRSNG et du CRSH, avec son propre modèle et son propre calendrier (les concours 2027 du CRSNG, le Project Grant des IRSC au plus tôt à l'automne 2027). Préparez chacun pour le financeur qui le demande.",
      },
      {
        q: "Dois-je inclure des nombres de citations ou mon indice h ?",
        a: "Les instructions du FRQ ne les demandent pas, et ils ne démontrent pas ce que le CV-FRQ évalue : les retombées, l'importance et la valeur d'une contribution et le rôle que vous y avez joué. Documentez plutôt l'effet qu'une contribution a eu, avec des identifiants que le lecteur peut suivre.",
      },
      {
        q: "Une contribution peut-elle être autre chose qu'une publication ?",
        a: "Oui, et la liste du FRQ est délibérément large : mobilisation des connaissances, avis et mémoires, infrastructures de données, logiciels, création artistique, partenariats, organisation de colloques, propriété intellectuelle, services à la communauté et contributions à la science ouverte comptent tous, seuls ou regroupés avec des éléments liés.",
      },
    ],
  },
  "de-DE": {
    title: "Der narrative Lebenslauf des FRQ (CV-FRQ): so bereiten Sie ihn vor",
    description:
      "Was der Fonds de recherche du Québec in seinem „CV descriptif“ verlangt — drei Abschnitte, sechs Seiten auf Französisch oder fünf auf Englisch, bis zu zehn Beiträge mit Zielgruppe und Wirkung — und wie Sie ihn aus Ihrem Forschungsverzeichnis erstellen, ohne etwas aufzublähen.",
    blocks: [
      {
        type: "p",
        text: "Seit den Wettbewerben 2025-2026 verlangt der Fonds de recherche du Québec (FRQ) von Antragstellenden einen narrativen Lebenslauf — den „CV descriptif“ oder CV-FRQ — anstelle des Canadian Common CV. Er ist kurz, hat drei feste Abschnitte und wird danach beurteilt, was ein Beitrag Ihrer Darstellung nach verändert hat, nicht danach, wie viele Zeilen Sie auflisten. Dieser Leitfaden legt dar, was die FRQ-Anweisungen tatsächlich verlangen, Abschnitt für Abschnitt, und wie Sie das Dokument aus dem Verzeichnis aufbauen, das Sie bereits haben.",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "Was der CV-FRQ ist" },
      {
        type: "p",
        text: "Der FRQ beschreibt den CV-FRQ als ein Dokument, das Ihre Expertise und Ihre relevanten Kompetenzen hervorhebt, indem es ein breites Spektrum an Beiträgen und Leistungen berücksichtigt — nicht nur Publikationen. Er wird in der Word-Vorlage des FRQ verfasst und als PDF dem FRQnet-Antragsformular beigefügt; das Formular selbst erhebt Ausbildung, Beschäftigungsgeschichte, Sprachen und aktuelle Position, sodass nichts davon im Lebenslauf wiederholt werden muss. Drei Abschnitte, immer in dieser Reihenfolge:",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate (englische Vorlage: Section 1: Background and skills) — wie Ihr akademischer, beruflicher oder persönlicher Hintergrund Sie befähigt, die vorgeschlagene Forschung durchzuführen und die Kriterien des Programms zu erfüllen.",
          "Deuxième section : Contributions et expériences les plus importantes (Section 2: Most significant contributions and experiences) — bis zu zehn Beiträge oder Erfahrungen, jeweils mit Wirkung, Ihrer Rolle, Zeitraum und Zielgruppe.",
          "Troisième section : Activités de supervision et de mentorat (Section 3: Supervisory and mentorship activities) — wie Sie Studierende, Postdocs und hochqualifiziertes Personal ausgebildet und begleitet haben.",
        ],
      },
      { type: "h2", id: "rules", text: "Die geltenden Regeln" },
      {
        type: "ul",
        items: [
          "Höchstens sechs Seiten auf Französisch, fünf auf Englisch. Die beiden Vorlagen unterscheiden sich nur in Sprache und Länge.",
          "Verwenden Sie die Word-Vorlage des FRQ, halten Sie die FRQnet-Darstellungsstandards für Anhänge ein und laden Sie das Ergebnis als PDF hoch.",
          "Kein Wortlimit. Der FRQ empfiehlt Unterabschnitte, die den Bewertungskriterien des Programms folgen; Aufzählungspunkte und Tabellen sind erlaubt.",
          "Ein Abschnitt, der nicht zutrifft, kann einfach „s/o“ (sans objet) enthalten — „N/A“ in der englischen Vorlage.",
          "Keine sensiblen persönlichen Angaben (medizinisch, finanziell oder sonst privat), kein Foto und nichts, was Ihnen oder anderen schaden könnte.",
          "Alles muss auf die Ziele und Bewertungskriterien des Programms ausgerichtet sein, für das Sie sich bewerben — lesen Sie diese zuerst und entscheiden Sie dann, was hineinkommt.",
        ],
      },
      { type: "h2", id: "section-1", text: "Abschnitt 1: Hintergrund und Kompetenzen" },
      {
        type: "p",
        text: "Hier gehören hin: Expertise oder gelebte Erfahrung, die zeigt, dass Sie das Projekt durchführen können, Aktivitäten, die Führungsstärke belegen, frühere Kooperationen oder Leistungen zum Forschungsthema, die konkreten und transformativen Wirkungen Ihrer bisherigen Arbeit, Anerkennungen wie Preise und Stipendien sowie Kompetenzen aus persönlicher Erfahrung. Schreiben Sie ihn für das Programm, das vor Ihnen liegt: Die Gutachtenden lesen diesen Abschnitt gegen die Kriterien der Ausschreibung, also übernehmen Sie deren Reihenfolge und Vokabular.",
      },
      { type: "h2", id: "section-2", text: "Abschnitt 2: bis zu zehn Beiträge" },
      {
        type: "p",
        text: "Das Herzstück des Dokuments. Ein Beitrag muss keine einzelne Publikation sein; er kann ein Bündel eng verwandter Ergebnisse sein — ein Aufsatz, der Datensatz dahinter, die Leitlinie, die er beeinflusst hat. Der FRQ listet auf, was zählt, und die Liste ist lang: Publikationen jeder Art, Wissensmobilisierung (Medien, Podcasts, öffentliche Vorträge), Begutachtungs- und Bewertungstätigkeiten, Gemeinwesenarbeit, künstlerisches Schaffen, Dateninfrastrukturen und Kohorten, geistiges Eigentum, Tagungsorganisation, Partnerschaften, Stellungnahmen, die Politiken oder Praxisstandards geprägt haben, Software und Werkzeuge sowie Beiträge zur offenen Wissenschaft im Sinne der UNESCO. Geben Sie für jeden an:",
      },
      {
        type: "ul",
        items: [
          "das Datum oder den Zeitraum des Beitrags;",
          "seine Zielgruppe — A. wissenschaftliche Gemeinschaft, B. Praxisgemeinschaft, C. breite Öffentlichkeit — ein Buchstabe oder mehrere;",
          "die Rolle, die Sie dabei gespielt haben, klar benannt;",
          "seine Wirkung, Bedeutung und seinen Wert — mit etwas, das die Lesenden prüfen können: eine DOI, ein Bericht, ein Registereintrag, eine Politik, die die Arbeit zitiert.",
        ],
      },
      {
        type: "p",
        text: "Wenn Sie Publikationen auflisten, verlangt der FRQ den APA-Stil oder einen anderen in Ihrer Disziplin anerkannten Standard, Ihren eigenen Namen in Fettdruck — ebenso die im Antrag genannten Mitforschenden — und ein Sternchen hinter dem Namen jeder Person, die Sie betreut haben (Nom, Prénom*), von Studierenden im Grundstudium bis zu Postdocs und hochqualifiziertem Personal. Vermeiden Sie es, in diesem Abschnitt zu wiederholen, was Sie im ersten gesagt haben.",
      },
      { type: "h2", id: "section-3", text: "Abschnitt 3: Betreuung und Mentoring" },
      {
        type: "p",
        text: "Beschreiben Sie, in welchem Maß Sie die nächste Generation ausgebildet haben: Betreuung von College- und Universitätsstudierenden aller Stufen, von Postdocs und hochqualifiziertem Personal; Lehre und Schulungsworkshops; formelles oder informelles Mentoring von Nachwuchsforschenden, Kolleginnen und Kollegen und Partnern; Outreach, der Studierende an die Forschung heranführt; Schulungen in Methoden oder Wissenssystemen, einschließlich indigenen Wissens; und die Schaffung sicherer, gerechter und inklusiver Forschungsumgebungen. Karrieren außerhalb der Wissenschaft zählen ebenso wie Karrieren innerhalb.",
      },
      { type: "h2", id: "evidence", text: "Wirkung belegen, ohne sie aufzublähen" },
      {
        type: "p",
        text: "Die Frage, die sich jede Antragstellende bei einem narrativen Lebenslauf stellt, ist, wie man „beweist“, dass ein Beitrag von Bedeutung war. Gutachtende, die das Format neu kennenlernen, stellen sie ebenfalls. Die ehrliche Antwort lautet: Eine narrative Aussage wird durch etwas belegt, dem die Lesenden folgen können, nicht durch eine Zahl. „Dieser Aufsatz dokumentierte das Signal, das die Behörde 2023 zur Änderung der Produktmonographie veranlasste“ ist überprüfbar, wenn der Aufsatz eine DOI hat, die Monographie ein Datum trägt und die Entscheidung der Behörde öffentlich ist. Eine Zitationszahl oder ein h-Index sagt nichts über diese Kette, und die FRQ-Anweisungen verlangen sie an keiner Stelle.",
      },
      {
        type: "p",
        text: "Schreiben Sie also die Kette — das Ergebnis, dann was es verändert hat, dann wo diese Veränderung festgehalten ist — und setzen Sie die Identifikatoren ein. Wo ein Beitrag Praktiker oder die Öffentlichkeit erreicht hat (Zielgruppen B und C), sagen Sie, worüber: eine klinische Leitlinie, ein Ministeriumsbericht, ein berufliches Weiterbildungsprogramm, eine Medienserie. Wo Sie eine Wirkung nicht dokumentieren können, beschreiben Sie die Bedeutung des Beitrags und Ihre Rolle und belassen es dabei. Gutachtende vertrauen einem Lebenslauf, der den Unterschied kennt.",
      },
      { type: "h2", id: "with-sigmacv", text: "Vorbereitung mit SigmaCV" },
      {
        type: "p",
        text: "SigmaCV erstellt Ihren vollständigen akademischen Lebenslauf aus offenen Forschungsdaten — ORCID, OpenAlex, Crossref, DataCite und weiteren — und lässt Sie Förderer-Layouts reversibel darauf anwenden. Zwei dieser Layouts sind der CV-FRQ auf Französisch und auf Englisch: Jedes zeigt genau die drei FRQ-Abschnitte unter den Überschriften des FRQ und blendet alles andere aus, weil das FRQnet-Formular den Rest erhebt. In jedem Abschnitt schreiben Sie Prosa, und jede Aussage kann über einen Belegverweis auf einen echten Eintrag Ihres Verzeichnisses zeigen, sodass die Lesenden bei der DOI landen, nicht bei Ihrem Wort. Dann:",
      },
      {
        type: "ol",
        items: [
          "Melden Sie sich mit ORCID an und lassen Sie das Verzeichnis aufbauen; markieren Sie, was nicht von Ihnen ist, und ergänzen Sie per DOI, was fehlt.",
          "Wenden Sie das CV-FRQ-Layout (Französisch oder Englisch) aus der Auswahl der CV-Modelle an. Ihr bisheriges Layout wird als Voreinstellung gespeichert, nichts geht verloren.",
          "Schreiben Sie die drei Abschnitte. Unter jedem listet das Belegpanel Ihre Publikationen, Datensätze, Betreuungen und weitere Ergebnisse auf, die Sie per Belegverweis zitieren können; behalten Sie den Zeichenzähler und die Seitenzahl gegenüber dem Limit von sechs bzw. fünf Seiten im Blick.",
          "Exportieren Sie als DOCX, fügen Sie die Abschnitte in die Word-Vorlage des FRQ ein, prüfen Sie die Formatregeln und fügen Sie das PDF in FRQnet bei.",
        ],
      },
      {
        type: "cta",
        label: "Lebenslauf aus Ihrem ORCID-Verzeichnis erstellen — kostenlos",
        href: "/",
      },
    ],
    faq: [
      {
        q: "Ersetzt der CV-FRQ den Canadian Common CV in den FRQ-Wettbewerben?",
        a: "Für die Programme, die ihn übernommen haben, ja — der FRQ verlangt den CV-FRQ als PDF-Anhang in FRQnet. Prüfen Sie die Regeln des konkreten Programms, für das Sie sich bewerben, denn die Einführung erfolgte Programm für Programm.",
      },
      {
        q: "Ist der CV-FRQ dasselbe wie der föderale Tri-agency CV?",
        a: "Nein. Sie teilen denselben Geist — eine Erzählung, wenige bedeutende Beiträge, ein Mentoring-Abschnitt —, aber der Tri-agency CV ist das Dokument von CIHR, NSERC und SSHRC, mit eigener Vorlage und eigenem Zeitplan (NSERCs Wettbewerbe 2027, CIHRs Project Grant frühestens im Herbst 2027). Bereiten Sie jeden für den Förderer vor, der ihn verlangt.",
      },
      {
        q: "Soll ich Zitationszahlen oder meinen h-Index angeben?",
        a: "Die FRQ-Anweisungen verlangen sie nicht, und sie zeigen nicht, was der CV-FRQ bewertet: die Wirkung, Bedeutung und den Wert eines Beitrags und Ihre Rolle darin. Dokumentieren Sie stattdessen die Wirkung, die ein Beitrag hatte, mit Identifikatoren, denen die Lesenden folgen können.",
      },
      {
        q: "Kann ein Beitrag etwas anderes als eine Publikation sein?",
        a: "Ja, und die Liste des FRQ ist bewusst breit: Wissensmobilisierung, politische Stellungnahmen, Dateninfrastrukturen, Software, künstlerisches Schaffen, Partnerschaften, Tagungsorganisation, geistiges Eigentum, Gemeinwesenarbeit und Beiträge zur offenen Wissenschaft zählen alle, einzeln oder gebündelt mit verwandten Ergebnissen.",
      },
    ],
  },
  "ja-JP": {
    title: "FRQ ナラティブ CV（CV-FRQ）：準備のしかた",
    description:
      "Fonds de recherche du Québec が「CV descriptif」で求めるもの——3 つのセクション、フランス語 6 ページまたは英語 5 ページ、対象と成果を付した最多 10 件の貢献——と、何も誇張せずに自身の研究記録から準備する方法。",
    blocks: [
      {
        type: "p",
        text: "2025-2026 年度の公募以降、Fonds de recherche du Québec（FRQ）は Canadian Common CV に代えて、ナラティブ CV——「CV descriptif」すなわち CV-FRQ——の提出を申請者に求めています。短く、3 つの固定セクションから成り、列挙した行数ではなく、ある貢献が何を変えたとあなたが述べるかで評価されます。本ガイドは FRQ の指示が実際に何を求めているかをセクションごとに示し、すでにある記録からこの文書を組み立てる方法を説明します。",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "CV-FRQ とは何か" },
      {
        type: "p",
        text: "FRQ は CV-FRQ を、論文だけでなく幅広い貢献と実績を考慮して、あなたの専門性と関連する能力を際立たせる文書と説明しています。FRQ の Word テンプレートで作成し、FRQnet 申請フォームに PDF として添付します。フォーム自体が学歴、職歴、言語、現職を収集するため、それらを CV で繰り返す必要はありません。3 つのセクションを常にこの順で：",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate（英語テンプレート：Section 1: Background and skills）——学術的・職業的・個人的な経歴が、提案する研究の遂行とプログラムの基準の充足をどのように可能にするか。",
          "Deuxième section : Contributions et expériences les plus importantes（Section 2: Most significant contributions and experiences）——最多 10 件の貢献または経験。それぞれに成果、自身の役割、期間、対象を記載。",
          "Troisième section : Activités de supervision et de mentorat（Section 3: Supervisory and mentorship activities）——学生、ポストドクター、高度専門人材をどのように育成・指導してきたか。",
        ],
      },
      { type: "h2", id: "rules", text: "適用される規則" },
      {
        type: "ul",
        items: [
          "フランス語では最大 6 ページ、英語では 5 ページ。2 つのテンプレートは言語と長さのみが異なります。",
          "FRQ の Word テンプレートを使い、FRQnet の添付ファイル表記基準に従い、結果を PDF でアップロードします。",
          "語数制限なし。FRQ はプログラムの評価基準に対応する小節を設けることを推奨しています。箇条書きと表は使用可。",
          "該当しないセクションには単に「s/o」（sans objet）と記入できます——英語テンプレートでは「N/A」。",
          "機微な個人情報（医療、財務、その他私的な情報）、写真、あなたや他者に害を及ぼしうる内容は一切含めないこと。",
          "すべてを応募先プログラムの目的と評価基準に沿わせること——まずそれらを読み、それから何を入れるかを決めます。",
        ],
      },
      { type: "h2", id: "section-1", text: "セクション 1：経歴と能力" },
      {
        type: "p",
        text: "ここには、プロジェクトを遂行できることを示す専門性や実体験、リーダーシップを示す活動、研究テーマに関する過去の共同研究や実績、これまでの研究がもたらした具体的で変革的な効果、賞や奨学金などの評価、個人的経験から得た能力を書きます。目の前のプログラムに向けて書いてください。評価者は公募の基準と照らしてこのセクションを読むので、その順序と語彙を反映させます。",
      },
      { type: "h2", id: "section-2", text: "セクション 2：最多 10 件の貢献" },
      {
        type: "p",
        text: "文書の中核です。貢献は単一の論文である必要はなく、密接に関連する成果の集合——論文、その基盤となるデータセット、それが影響を与えたガイドライン——でもかまいません。FRQ は該当するものを列挙しており、そのリストは長いものです：あらゆる種類の出版物、知識動員（メディア、ポッドキャスト、公開講演）、審査・評価活動、コミュニティへの貢献、芸術創作、データ基盤とコホート、知的財産、学会の運営、パートナーシップ、政策や実践基準の形成に寄与した意見書、ソフトウェアとツール、そして UNESCO の意味でのオープンサイエンスへの貢献。それぞれについて次を示します：",
      },
      {
        type: "ul",
        items: [
          "貢献の日付または期間；",
          "対象——A. 学術コミュニティ、B. 実務コミュニティ、C. 一般市民——1 文字または複数；",
          "あなたが果たした役割を率直に；",
          "その成果・重要性・価値を、読者が確認できるものとともに：DOI、報告書、登録記録、その研究を引用する政策。",
        ],
      },
      {
        type: "p",
        text: "出版物を列挙する場合、FRQ は APA スタイルまたは自身の分野で認められた他の標準を用い、自身の氏名を太字にし——申請書に記載された共同研究者も同様——、指導した各人物の氏名の後にアスタリスクを付す（Nom, Prénom*）ことを求めています。対象は学部生からポストドクター、高度専門人材までです。第 1 セクションで述べたことをこのセクションで繰り返さないようにしてください。",
      },
      { type: "h2", id: "section-3", text: "セクション 3：指導とメンタリング" },
      {
        type: "p",
        text: "次世代をどの程度育成してきたかを記述します：あらゆる段階のカレッジ・大学の学生、ポストドクター、高度専門人材の指導；教育と研修ワークショップ；キャリア初期の研究者、同僚、パートナーへの公式・非公式のメンタリング；学生を研究に引き込むアウトリーチ；先住民の知識を含む方法論や知識体系の研修；安全で公正かつ包摂的な研究環境の構築。アカデミア外のキャリアはアカデミア内のキャリアと同等に評価されます。",
      },
      { type: "h2", id: "evidence", text: "誇張せずに成果を証明する" },
      {
        type: "p",
        text: "ナラティブ CV について申請者が必ず抱く疑問は、ある貢献が重要だったことをどう「証明」するかです。この形式に初めて触れる評価者も同じ問いを抱きます。誠実な答えは、ナラティブな主張は数字ではなく、読者がたどれるもので証明されるということです。「この論文は、規制当局が 2023 年に製品モノグラフを改訂するきっかけとなったシグナルを記録した」という記述は、論文に DOI があり、モノグラフに日付があり、規制当局の決定が公開されていれば検証できます。被引用数や h 指数はこの連鎖について何も語らず、FRQ 自身の指示もそれらを求めていません。",
      },
      {
        type: "p",
        text: "したがって連鎖を書いてください——成果、それが何を変えたか、その変化がどこに記録されているか——そして識別子を入れます。貢献が実務者や市民（対象 B と C）に届いた場合は、何を通じてかを述べます：臨床ガイドライン、省庁の報告書、専門職研修プログラム、メディアのシリーズ。効果を文書化できない場合は、貢献の重要性と自身の役割を記述し、そこで止めます。評価者は、その違いを知っている CV を信頼します。",
      },
      { type: "h2", id: "with-sigmacv", text: "SigmaCV で準備する" },
      {
        type: "p",
        text: "SigmaCV はオープンな研究データ——ORCID、OpenAlex、Crossref、DataCite など——から完全な学術 CV を構築し、助成機関のレイアウトを可逆的に適用できます。そのうち 2 つがフランス語と英語の CV-FRQ です。それぞれ FRQ の 3 セクションだけを FRQ 自身の見出しの下に表示し、他はすべて非表示にします。残りは FRQnet フォームが収集するからです。各セクションには散文を書き、すべての主張は証拠リンクで記録内の実在の項目を指すことができるので、読者はあなたの言葉ではなく DOI にたどり着きます。続いて：",
      },
      {
        type: "ol",
        items: [
          "ORCID でサインインして記録を構築させ、自分のものでない項目にマークを付け、欠けているものを DOI で追加します。",
          "CV モデルの選択から CV-FRQ レイアウト（フランス語または英語）を適用します。以前のレイアウトはプリセットとして保存され、何も失われません。",
          "3 つのセクションを書きます。各セクションの下の証拠パネルに、出版物、データセット、指導記録、その他の成果が証拠リンクで引用できるよう一覧されます。6 ページまたは 5 ページの上限に対して文字数カウンターとページ数に注意してください。",
          "DOCX にエクスポートし、各セクションを FRQ の Word テンプレートに貼り付け、書式規則を確認し、FRQnet に PDF を添付します。",
        ],
      },
      { type: "cta", label: "ORCID 記録から CV を構築——無料", href: "/" },
    ],
    faq: [
      {
        q: "FRQ の公募では CV-FRQ が Canadian Common CV に代わるのですか？",
        a: "採用したプログラムについては、はい——FRQ は FRQnet で CV-FRQ を PDF 添付として求めます。採用はプログラムごとに進められたため、応募する具体的なプログラムの規則を確認してください。",
      },
      {
        q: "CV-FRQ は連邦の Tri-agency CV と同じものですか？",
        a: "いいえ。同じ精神——物語、少数の重要な貢献、メンタリングのセクション——を共有しますが、Tri-agency CV は CIHR、NSERC、SSHRC の文書で、独自のテンプレートと導入スケジュール（NSERC の 2027 年公募、CIHR の Project Grant は早くとも 2027 年秋）を持ちます。それを求める助成機関ごとに準備してください。",
      },
      {
        q: "被引用数や h 指数を含めるべきですか？",
        a: "FRQ の指示はそれらを求めておらず、CV-FRQ が評価するもの——貢献の成果・重要性・価値と、そこでのあなたの役割——を示しません。代わりに、貢献がもたらした効果を、読者がたどれる識別子とともに記録してください。",
      },
      {
        q: "貢献は出版物以外のものでもよいですか？",
        a: "はい。FRQ のリストは意図的に幅広く、知識動員、政策意見書、データ基盤、ソフトウェア、芸術創作、パートナーシップ、学会運営、知的財産、コミュニティへの貢献、オープンサイエンスへの貢献はすべて、単独でも関連成果とまとめてでも該当します。",
      },
    ],
  },
  "pt-BR": {
    title: "O CV narrativo do FRQ (CV-FRQ): como prepará-lo",
    description:
      "O que o Fonds de recherche du Québec pede em seu «CV descriptif» — três seções, seis páginas em francês ou cinco em inglês, até dez contribuições com seu público e seu impacto — e como prepará-lo a partir do seu registro de pesquisa sem inflar nada.",
    blocks: [
      {
        type: "p",
        text: "Desde os editais 2025-2026, o Fonds de recherche du Québec (FRQ) pede aos candidatos um CV narrativo — o «CV descriptif», ou CV-FRQ — no lugar do Canadian Common CV. Ele é curto, tem três seções fixas e é avaliado pelo que você diz que uma contribuição mudou, não por quantas linhas você lista. Este guia expõe o que as instruções do FRQ realmente exigem, seção por seção, e como construir o documento a partir do registro que você já tem.",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "O que é o CV-FRQ" },
      {
        type: "p",
        text: "O FRQ descreve o CV-FRQ como um documento que destaca sua expertise e suas competências relevantes considerando uma ampla gama de contribuições e realizações — não apenas publicações. Ele é redigido no modelo Word do FRQ e anexado em PDF ao formulário de pedido FRQnet; o próprio formulário recolhe sua formação, histórico de empregos, idiomas e cargo atual, então nada disso precisa ser repetido no CV. Três seções, sempre nesta ordem:",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate (modelo em inglês: Section 1: Background and skills) — como sua trajetória acadêmica, profissional ou pessoal permite realizar a pesquisa proposta e atender aos critérios do programa.",
          "Deuxième section : Contributions et expériences les plus importantes (Section 2: Most significant contributions and experiences) — até dez contribuições ou experiências, cada uma com seu impacto, seu papel, seu período e seu público.",
          "Troisième section : Activités de supervision et de mentorat (Section 3: Supervisory and mentorship activities) — como você formou e orientou estudantes, pesquisadores de pós-doutorado e pessoal altamente qualificado.",
        ],
      },
      { type: "h2", id: "rules", text: "As regras que se aplicam" },
      {
        type: "ul",
        items: [
          "No máximo seis páginas em francês, cinco em inglês. Os dois modelos diferem apenas no idioma e na extensão.",
          "Use o modelo Word do FRQ, siga as normas de apresentação do FRQnet para anexos e envie o resultado em PDF.",
          "Sem limite de palavras. O FRQ recomenda subseções que correspondam aos critérios de avaliação do programa; marcadores e tabelas são permitidos.",
          "Uma seção que não se aplica pode simplesmente dizer «s/o» (sans objet) — «N/A» no modelo em inglês.",
          "Nenhuma informação pessoal sensível (médica, financeira ou privada), nenhuma foto e nada que possa prejudicar você ou outras pessoas.",
          "Tudo deve estar alinhado aos objetivos e critérios de avaliação do programa ao qual você se candidata — leia-os primeiro e só então decida o que entra.",
        ],
      },
      { type: "h2", id: "section-1", text: "Seção 1: trajetória e competências" },
      {
        type: "p",
        text: "É o lugar da expertise ou da experiência vivida que mostra que você pode realizar o projeto, das atividades que demonstram liderança, das colaborações ou realizações anteriores sobre o tema de pesquisa, dos efeitos concretos e transformadores do seu trabalho passado, dos reconhecimentos como prêmios e bolsas, e das competências adquiridas por experiência pessoal. Escreva-a para o programa à sua frente: o avaliador lê esta seção à luz dos critérios do edital, então siga a ordem e o vocabulário deles.",
      },
      { type: "h2", id: "section-2", text: "Seção 2: até dez contribuições" },
      {
        type: "p",
        text: "O coração do documento. Uma contribuição não precisa ser uma única publicação; pode ser um conjunto de resultados estreitamente relacionados — um artigo, o conjunto de dados por trás dele, a diretriz que ele informou. O FRQ enumera o que conta, e a lista é longa: publicações de todo tipo, mobilização do conhecimento (mídia, podcasts, palestras públicas), atividades de avaliação e revisão, serviço à comunidade, criação artística, infraestruturas de dados e coortes, propriedade intelectual, organização de congressos, parcerias, pareceres que moldaram políticas ou normas de prática, software e ferramentas, e contribuições à ciência aberta no sentido da UNESCO. Para cada uma, indique:",
      },
      {
        type: "ul",
        items: [
          "a data ou o período da contribuição;",
          "seu público-alvo — A. comunidade acadêmica, B. comunidade de prática, C. público em geral — uma letra ou várias;",
          "o papel que você desempenhou, dito com clareza;",
          "seu impacto, importância e valor — com algo que o leitor possa verificar: um DOI, um relatório, um registro, uma política que cite o trabalho.",
        ],
      },
      {
        type: "p",
        text: "Ao listar publicações, o FRQ pede o estilo APA ou outra norma reconhecida em sua disciplina, seu próprio nome em negrito — assim como os copesquisadores nomeados no pedido — e um asterisco após o nome de cada pessoa que você supervisionou (Nom, Prénom*), de estudantes de graduação a pesquisadores de pós-doutorado e pessoal altamente qualificado. Evite repetir nesta seção o que já disse na primeira.",
      },
      { type: "h2", id: "section-3", text: "Seção 3: supervisão e mentoria" },
      {
        type: "p",
        text: "Descreva em que medida você formou a próxima geração: supervisão de estudantes de colégio e universidade em todos os níveis, de pesquisadores de pós-doutorado e de pessoal altamente qualificado; ensino e oficinas de formação; mentoria formal ou informal de pesquisadores em início de carreira, colegas e parceiros; ações de divulgação que aproximam estudantes da pesquisa; formação em métodos ou sistemas de conhecimento, incluindo saberes indígenas; e a criação de ambientes de pesquisa seguros, equitativos e inclusivos. Carreiras fora da academia contam tanto quanto as de dentro.",
      },
      { type: "h2", id: "evidence", text: "Provar o impacto sem inflá-lo" },
      {
        type: "p",
        text: "A pergunta que todo candidato faz diante de um CV narrativo é como «provar» que uma contribuição importou. Avaliadores novos no formato também a fazem. A resposta honesta é que uma afirmação narrativa se prova com algo que o leitor pode seguir, não com um número: «este artigo documentou o sinal que levou o regulador a alterar a monografia do produto em 2023» é verificável se o artigo tem DOI, a monografia tem data e a decisão do regulador é pública. Uma contagem de citações ou um índice h não diz nada dessa cadeia, e as próprias instruções do FRQ nunca os pedem.",
      },
      {
        type: "p",
        text: "Então escreva a cadeia — o resultado, depois o que ele mudou, depois onde essa mudança está registrada — e coloque os identificadores. Onde uma contribuição chegou a profissionais ou ao público (públicos B e C), diga por meio de quê: uma diretriz clínica, um relatório ministerial, um programa de formação profissional, uma série na mídia. Onde não puder documentar um efeito, descreva a importância da contribuição e seu papel, e pare aí. Um avaliador confia em um CV que conhece a diferença.",
      },
      { type: "h2", id: "with-sigmacv", text: "Preparando-o com o SigmaCV" },
      {
        type: "p",
        text: "O SigmaCV constrói seu CV acadêmico completo a partir de dados abertos de pesquisa — ORCID, OpenAlex, Crossref, DataCite e outros — e permite aplicar layouts de financiadores de forma reversível. Dois desses layouts são o CV-FRQ em francês e em inglês: cada um mostra exatamente as três seções do FRQ sob os títulos do próprio FRQ e oculta todo o resto, porque o formulário FRQnet recolhe o restante. Dentro de cada seção você escreve em prosa, e cada afirmação pode apontar para uma entrada real do seu registro com um link de evidência, de modo que o leitor chega ao DOI, não à sua palavra. Depois:",
      },
      {
        type: "ol",
        items: [
          "Entre com o ORCID e deixe o registro se construir; marque o que não é seu e adicione por DOI o que estiver faltando.",
          "Aplique o layout CV-FRQ (francês ou inglês) no seletor de modelos de CV. Seu layout anterior é salvo como predefinição, então nada se perde.",
          "Escreva as três seções. Sob cada uma, o painel de evidências lista suas publicações, conjuntos de dados, registros de supervisão e outros resultados para citar com um link de evidência; acompanhe o contador de caracteres e o número de páginas em relação ao limite de seis ou cinco.",
          "Exporte para DOCX, cole as seções no modelo Word do FRQ, verifique as normas de formatação e anexe o PDF no FRQnet.",
        ],
      },
      { type: "cta", label: "Construa seu CV a partir do seu registro ORCID — grátis", href: "/" },
    ],
    faq: [
      {
        q: "O CV-FRQ substitui o Canadian Common CV nos editais do FRQ?",
        a: "Para os programas que o adotaram, sim — o FRQ pede o CV-FRQ como anexo PDF no FRQnet. Verifique as regras do programa específico ao qual você se candidata, pois a adoção foi feita programa por programa.",
      },
      {
        q: "O CV-FRQ é o mesmo que o Tri-agency CV federal?",
        a: "Não. Eles compartilham o mesmo espírito — uma narrativa, poucas contribuições significativas, uma seção de mentoria —, mas o Tri-agency CV é o documento de CIHR, NSERC e SSHRC, com seu próprio modelo e cronograma (os editais 2027 da NSERC, o Project Grant do CIHR não antes do outono de 2027). Prepare cada um para o financiador que o pede.",
      },
      {
        q: "Devo incluir contagens de citações ou meu índice h?",
        a: "As instruções do FRQ não os pedem, e eles não demonstram o que o CV-FRQ avalia: o impacto, a importância e o valor de uma contribuição e seu papel nela. Documente em vez disso o efeito que a contribuição teve, com identificadores que o leitor possa seguir.",
      },
      {
        q: "Uma contribuição pode ser algo diferente de uma publicação?",
        a: "Sim, e a lista do FRQ é deliberadamente ampla: mobilização do conhecimento, pareceres de política, infraestruturas de dados, software, criação artística, parcerias, organização de congressos, propriedade intelectual, serviço à comunidade e contribuições à ciência aberta contam, isoladamente ou agrupadas com resultados relacionados.",
      },
    ],
  },
  "it-IT": {
    title: "Il CV narrativo del FRQ (CV-FRQ): come prepararlo",
    description:
      "Cosa chiede il Fonds de recherche du Québec nel suo «CV descriptif» — tre sezioni, sei pagine in francese o cinque in inglese, fino a dieci contributi con il loro pubblico e il loro impatto — e come prepararlo a partire dal proprio registro di ricerca senza gonfiare nulla.",
    blocks: [
      {
        type: "p",
        text: "Dai bandi 2025-2026, il Fonds de recherche du Québec (FRQ) chiede ai candidati un CV narrativo — il «CV descriptif», o CV-FRQ — al posto del Canadian Common CV. È breve, ha tre sezioni fisse e viene valutato per ciò che dichiari che un contributo ha cambiato, non per quante righe elenchi. Questa guida espone ciò che le istruzioni del FRQ richiedono davvero, sezione per sezione, e come costruire il documento a partire dal registro che già possiedi.",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "Che cos'è il CV-FRQ" },
      {
        type: "p",
        text: "Il FRQ descrive il CV-FRQ come un documento che mette in luce la tua competenza e le tue abilità pertinenti considerando un'ampia gamma di contributi e risultati — non solo pubblicazioni. Si redige nel modello Word del FRQ e si allega in PDF al modulo di domanda FRQnet; il modulo stesso raccoglie formazione, storia lavorativa, lingue e posizione attuale, quindi nulla di ciò va ripetuto nel CV. Tre sezioni, sempre in quest'ordine:",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate (modello inglese: Section 1: Background and skills) — come il tuo percorso accademico, professionale o personale ti consente di realizzare la ricerca proposta e di soddisfare i criteri del programma.",
          "Deuxième section : Contributions et expériences les plus importantes (Section 2: Most significant contributions and experiences) — fino a dieci contributi o esperienze, ciascuno con il suo impatto, il tuo ruolo, il suo periodo e il suo pubblico.",
          "Troisième section : Activités de supervision et de mentorat (Section 3: Supervisory and mentorship activities) — come hai formato e accompagnato studenti, ricercatori post-dottorato e personale altamente qualificato.",
        ],
      },
      { type: "h2", id: "rules", text: "Le regole che si applicano" },
      {
        type: "ul",
        items: [
          "Al massimo sei pagine in francese, cinque in inglese. I due modelli differiscono solo per lingua e lunghezza.",
          "Usa il modello Word del FRQ, segui gli standard di presentazione FRQnet per gli allegati e carica il risultato in PDF.",
          "Nessun limite di parole. Il FRQ raccomanda sottosezioni che rispecchino i criteri di valutazione del programma; elenchi puntati e tabelle sono ammessi.",
          "Una sezione che non si applica può semplicemente riportare «s/o» (sans objet) — «N/A» nel modello inglese.",
          "Nessuna informazione personale sensibile (medica, finanziaria o comunque privata), nessuna foto e nulla che possa nuocere a te o ad altri.",
          "Tutto deve essere allineato agli obiettivi e ai criteri di valutazione del programma a cui ti candidi — leggili prima, poi decidi cosa inserire.",
        ],
      },
      { type: "h2", id: "section-1", text: "Sezione 1: percorso e competenze" },
      {
        type: "p",
        text: "È il posto per la competenza o l'esperienza vissuta che dimostra che puoi realizzare il progetto, per le attività che mostrano leadership, per le collaborazioni o i risultati precedenti sul tema di ricerca, per gli effetti concreti e trasformativi del tuo lavoro passato, per i riconoscimenti come premi e borse, e per le abilità acquisite con l'esperienza personale. Scrivila per il programma che hai davanti: il valutatore legge questa sezione alla luce dei criteri del bando, quindi riprendi il loro ordine e il loro vocabolario.",
      },
      { type: "h2", id: "section-2", text: "Sezione 2: fino a dieci contributi" },
      {
        type: "p",
        text: "Il cuore del documento. Un contributo non deve essere una singola pubblicazione; può essere un insieme di risultati strettamente collegati — un articolo, il dataset che lo sostiene, la linea guida che ha informato. Il FRQ elenca ciò che conta, e la lista è lunga: pubblicazioni di ogni tipo, mobilitazione della conoscenza (media, podcast, conferenze pubbliche), attività di valutazione e revisione, servizio alla comunità, creazione artistica, infrastrutture di dati e coorti, proprietà intellettuale, organizzazione di convegni, partenariati, memorie che hanno orientato politiche o standard di pratica, software e strumenti, e contributi alla scienza aperta nel senso dell'UNESCO. Per ciascuno, indica:",
      },
      {
        type: "ul",
        items: [
          "la data o il periodo del contributo;",
          "il suo pubblico di riferimento — A. comunità accademica, B. comunità di pratica, C. pubblico generale — una lettera o più;",
          "il ruolo che hai svolto, detto con chiarezza;",
          "il suo impatto, la sua rilevanza e il suo valore — con qualcosa che il lettore possa verificare: un DOI, un rapporto, una voce di registro, una politica che citi il lavoro.",
        ],
      },
      {
        type: "p",
        text: "Quando elenchi pubblicazioni, il FRQ chiede lo stile APA o un altro standard riconosciuto nella tua disciplina, il tuo nome in grassetto — insieme ai co-ricercatori indicati nella domanda — e un asterisco dopo il nome di ogni persona che hai supervisionato (Nom, Prénom*), dagli studenti di primo livello ai ricercatori post-dottorato e al personale altamente qualificato. Evita di ripetere in questa sezione ciò che hai già detto nella prima.",
      },
      { type: "h2", id: "section-3", text: "Sezione 3: supervisione e mentoring" },
      {
        type: "p",
        text: "Descrivi in che misura hai formato la prossima generazione: supervisione di studenti di college e università a ogni livello, di ricercatori post-dottorato e di personale altamente qualificato; insegnamento e laboratori di formazione; mentoring formale o informale di ricercatori a inizio carriera, colleghi e partner; attività di divulgazione che avvicinano gli studenti alla ricerca; formazione su metodi o sistemi di conoscenza, comprese le conoscenze indigene; e la creazione di ambienti di ricerca sicuri, equi e inclusivi. Le carriere fuori dall'accademia contano quanto quelle al suo interno.",
      },
      { type: "h2", id: "evidence", text: "Dimostrare l'impatto senza gonfiarlo" },
      {
        type: "p",
        text: "La domanda che ogni candidato si pone davanti a un CV narrativo è come «dimostrare» che un contributo ha contato. Se la pongono anche i valutatori nuovi al formato. La risposta onesta è che un'affermazione narrativa si dimostra con qualcosa che il lettore può seguire, non con un numero: «questo articolo ha documentato il segnale che ha portato l'autorità regolatoria a modificare la monografia del prodotto nel 2023» è verificabile se l'articolo ha un DOI, la monografia ha una data e la decisione dell'autorità è pubblica. Un conteggio di citazioni o un h-index non dice nulla di quella catena, e le stesse istruzioni del FRQ non li chiedono mai.",
      },
      {
        type: "p",
        text: "Scrivi quindi la catena — il risultato, poi ciò che ha cambiato, poi dove quel cambiamento è registrato — e inserisci gli identificatori. Dove un contributo ha raggiunto professionisti o pubblico (pubblici B e C), di' attraverso cosa: una linea guida clinica, un rapporto ministeriale, un programma di formazione professionale, una serie sui media. Dove non puoi documentare un effetto, descrivi la rilevanza del contributo e il tuo ruolo, e fermati lì. Un valutatore si fida di un CV che conosce la differenza.",
      },
      { type: "h2", id: "with-sigmacv", text: "Prepararlo con SigmaCV" },
      {
        type: "p",
        text: "SigmaCV costruisce il tuo CV accademico completo a partire da dati di ricerca aperti — ORCID, OpenAlex, Crossref, DataCite e altri — e ti permette di applicarvi in modo reversibile i layout dei finanziatori. Due di questi layout sono il CV-FRQ in francese e in inglese: ciascuno mostra esattamente le tre sezioni del FRQ sotto le intestazioni del FRQ stesso e nasconde tutto il resto, perché il modulo FRQnet raccoglie il resto. In ogni sezione scrivi in prosa, e ogni affermazione può puntare a una voce reale del tuo registro con un collegamento di evidenza, così il lettore arriva al DOI, non alla tua parola. Poi:",
      },
      {
        type: "ol",
        items: [
          "Accedi con ORCID e lascia che il registro si costruisca; segnala ciò che non è tuo e aggiungi per DOI ciò che manca.",
          "Applica il layout CV-FRQ (francese o inglese) dal selettore dei modelli di CV. Il layout precedente viene salvato come preset, quindi nulla va perso.",
          "Scrivi le tre sezioni. Sotto ciascuna, il pannello delle evidenze elenca le tue pubblicazioni, i dataset, le supervisioni e gli altri risultati da citare con un collegamento di evidenza; tieni d'occhio il contatore di caratteri e il numero di pagine rispetto al limite di sei o cinque.",
          "Esporta in DOCX, incolla le sezioni nel modello Word del FRQ, verifica le regole di formattazione e allega il PDF in FRQnet.",
        ],
      },
      { type: "cta", label: "Costruisci il tuo CV dal tuo registro ORCID — gratis", href: "/" },
    ],
    faq: [
      {
        q: "Il CV-FRQ sostituisce il Canadian Common CV nei bandi del FRQ?",
        a: "Per i programmi che l'hanno adottato, sì — il FRQ chiede il CV-FRQ come allegato PDF in FRQnet. Verifica le regole del programma specifico a cui ti candidi, perché l'adozione è avvenuta programma per programma.",
      },
      {
        q: "Il CV-FRQ è la stessa cosa del Tri-agency CV federale?",
        a: "No. Condividono lo stesso spirito — una narrazione, pochi contributi significativi, una sezione di mentoring — ma il Tri-agency CV è il documento di CIHR, NSERC e SSHRC, con il proprio modello e il proprio calendario (i bandi 2027 di NSERC, il Project Grant di CIHR non prima dell'autunno 2027). Prepara ciascuno per il finanziatore che lo richiede.",
      },
      {
        q: "Devo includere i conteggi di citazioni o il mio h-index?",
        a: "Le istruzioni del FRQ non li chiedono, e non dimostrano ciò che il CV-FRQ valuta: l'impatto, la rilevanza e il valore di un contributo e il tuo ruolo in esso. Documenta invece l'effetto che il contributo ha avuto, con identificatori che il lettore possa seguire.",
      },
      {
        q: "Un contributo può essere qualcosa di diverso da una pubblicazione?",
        a: "Sì, e la lista del FRQ è deliberatamente ampia: mobilitazione della conoscenza, memorie di policy, infrastrutture di dati, software, creazione artistica, partenariati, organizzazione di convegni, proprietà intellettuale, servizio alla comunità e contributi alla scienza aperta contano tutti, da soli o raggruppati con risultati collegati.",
      },
    ],
  },
  "ko-KR": {
    title: "FRQ 내러티브 CV(CV-FRQ): 준비하는 방법",
    description:
      "Fonds de recherche du Québec가 «CV descriptif»에서 요구하는 것 — 세 부분, 프랑스어 6쪽 또는 영어 5쪽, 대상과 영향을 명시한 최대 열 개의 기여 — 그리고 아무것도 과장하지 않고 자신의 연구 기록으로부터 준비하는 방법.",
    blocks: [
      {
        type: "p",
        text: "2025-2026년 공모부터 Fonds de recherche du Québec(FRQ)는 Canadian Common CV 대신 내러티브 CV — «CV descriptif», 즉 CV-FRQ — 를 지원자에게 요구합니다. 짧고, 세 개의 고정된 부분으로 이루어지며, 몇 줄을 나열했는지가 아니라 어떤 기여가 무엇을 바꾸었다고 말하는지로 평가됩니다. 이 가이드는 FRQ 지침이 실제로 요구하는 바를 부분별로 설명하고, 이미 가지고 있는 기록으로 문서를 만드는 방법을 안내합니다.",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "CV-FRQ란 무엇인가" },
      {
        type: "p",
        text: "FRQ는 CV-FRQ를 논문뿐 아니라 폭넓은 기여와 성과를 고려하여 지원자의 전문성과 관련 역량을 부각하는 문서로 설명합니다. FRQ의 Word 서식으로 작성해 FRQnet 지원 양식에 PDF로 첨부하며, 양식 자체가 학력, 경력, 언어, 현재 직위를 수집하므로 그 어느 것도 CV에서 반복할 필요가 없습니다. 세 부분은 항상 다음 순서입니다:",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate(영어 서식: Section 1: Background and skills) — 학문적·직업적·개인적 배경이 제안한 연구를 수행하고 프로그램 기준을 충족하는 데 어떻게 도움이 되는지.",
          "Deuxième section : Contributions et expériences les plus importantes(Section 2: Most significant contributions and experiences) — 최대 열 개의 기여 또는 경험, 각각 영향, 본인의 역할, 기간, 대상을 명시.",
          "Troisième section : Activités de supervision et de mentorat(Section 3: Supervisory and mentorship activities) — 학생, 박사후연구원, 고급 인력을 어떻게 양성하고 지도했는지.",
        ],
      },
      { type: "h2", id: "rules", text: "적용되는 규칙" },
      {
        type: "ul",
        items: [
          "프랑스어는 최대 6쪽, 영어는 5쪽. 두 서식은 언어와 길이만 다릅니다.",
          "FRQ의 Word 서식을 사용하고, 첨부 파일에 대한 FRQnet 표기 기준을 따르며, 결과물을 PDF로 업로드합니다.",
          "단어 수 제한 없음. FRQ는 프로그램의 평가 기준에 대응하는 소절을 권장하며, 글머리 기호와 표를 사용할 수 있습니다.",
          "해당하지 않는 부분에는 단순히 «s/o»(sans objet)라고 적을 수 있습니다 — 영어 서식에서는 «N/A».",
          "민감한 개인정보(의료, 재정 또는 기타 사적인 정보), 사진, 본인이나 타인에게 해가 될 수 있는 내용은 넣지 않습니다.",
          "모든 내용은 지원하는 프로그램의 목표와 평가 기준에 맞아야 합니다 — 먼저 그것을 읽고, 그다음 무엇을 넣을지 결정하세요.",
        ],
      },
      { type: "h2", id: "section-1", text: "1부: 배경과 역량" },
      {
        type: "p",
        text: "프로젝트를 수행할 수 있음을 보여 주는 전문성이나 직접 경험, 리더십을 보여 주는 활동, 연구 주제에 관한 이전의 협력이나 성과, 과거 연구의 구체적이고 변혁적인 효과, 상과 장학금 같은 인정, 개인적 경험에서 얻은 역량을 쓰는 자리입니다. 눈앞의 프로그램을 위해 쓰세요. 평가자는 공모의 기준에 비추어 이 부분을 읽으므로, 그 순서와 용어를 따르세요.",
      },
      { type: "h2", id: "section-2", text: "2부: 최대 열 개의 기여" },
      {
        type: "p",
        text: "문서의 핵심입니다. 기여는 단일 논문일 필요가 없으며, 밀접하게 연관된 성과의 묶음 — 논문, 그 기반 데이터셋, 그것이 영향을 준 지침 — 일 수 있습니다. FRQ는 인정되는 것을 열거하는데, 그 목록은 길습니다: 모든 종류의 출판물, 지식 동원(미디어, 팟캐스트, 공개 강연), 심사·평가 활동, 공동체 봉사, 예술 창작, 데이터 인프라와 코호트, 지식재산, 학회 조직, 파트너십, 정책이나 실무 기준을 형성한 의견서, 소프트웨어와 도구, 그리고 UNESCO가 정의하는 오픈 사이언스 기여. 각 기여마다 다음을 밝히세요:",
      },
      {
        type: "ul",
        items: [
          "기여의 날짜 또는 기간;",
          "대상 — A. 학술 공동체, B. 실무 공동체, C. 일반 대중 — 하나 또는 여러 글자;",
          "본인이 맡은 역할을 분명하게;",
          "그 영향, 중요성, 가치 — 독자가 확인할 수 있는 것과 함께: DOI, 보고서, 등록 항목, 해당 연구를 인용한 정책.",
        ],
      },
      {
        type: "p",
        text: "출판물을 나열할 때 FRQ는 APA 양식이나 해당 분야에서 인정되는 다른 표준을 사용하고, 본인 이름을 굵게 표시하며 — 지원서에 명시된 공동연구자도 마찬가지 — 지도한 모든 사람의 이름 뒤에 별표를 붙이도록(Nom, Prénom*) 요구합니다. 학부생부터 박사후연구원과 고급 인력까지 해당됩니다. 1부에서 이미 말한 내용을 이 부분에서 반복하지 마세요.",
      },
      { type: "h2", id: "section-3", text: "3부: 지도와 멘토링" },
      {
        type: "p",
        text: "차세대를 어느 정도 양성했는지 설명하세요: 모든 단계의 칼리지·대학 학생, 박사후연구원, 고급 인력의 지도; 강의와 교육 워크숍; 초기 경력 연구자, 동료, 파트너에 대한 공식·비공식 멘토링; 학생을 연구로 이끄는 아웃리치; 토착 지식을 포함한 방법론이나 지식 체계에 관한 교육; 안전하고 공평하며 포용적인 연구 환경 조성. 학계 밖의 경력도 학계 안의 경력과 똑같이 인정됩니다.",
      },
      { type: "h2", id: "evidence", text: "과장 없이 영향을 입증하기" },
      {
        type: "p",
        text: "내러티브 CV 앞에서 모든 지원자가 묻는 질문은 어떤 기여가 중요했다는 것을 어떻게 «입증»하느냐입니다. 이 형식을 처음 접하는 평가자도 같은 질문을 합니다. 정직한 답은, 내러티브 주장은 숫자가 아니라 독자가 따라갈 수 있는 것으로 입증된다는 것입니다. «이 논문은 규제기관이 2023년에 제품 모노그래프를 개정하도록 이끈 신호를 기록했다»는 서술은 논문에 DOI가 있고, 모노그래프에 날짜가 있으며, 규제기관의 결정이 공개되어 있다면 확인할 수 있습니다. 인용 횟수나 h-지수는 그 연쇄에 대해 아무것도 말해 주지 않으며, FRQ 지침도 그것을 요구한 적이 없습니다.",
      },
      {
        type: "p",
        text: "그러므로 연쇄를 쓰세요 — 성과, 그것이 바꾼 것, 그 변화가 기록된 곳 — 그리고 식별자를 넣으세요. 기여가 실무자나 대중(대상 B와 C)에게 도달한 경우, 무엇을 통해서인지 말하세요: 임상 지침, 부처 보고서, 전문 교육 프로그램, 미디어 시리즈. 효과를 문서화할 수 없는 경우에는 기여의 중요성과 본인의 역할을 기술하고 거기서 멈추세요. 평가자는 그 차이를 아는 CV를 신뢰합니다.",
      },
      { type: "h2", id: "with-sigmacv", text: "SigmaCV로 준비하기" },
      {
        type: "p",
        text: "SigmaCV는 개방형 연구 데이터 — ORCID, OpenAlex, Crossref, DataCite 등 — 로부터 완전한 학술 CV를 구축하고, 지원기관 레이아웃을 되돌릴 수 있게 적용하도록 합니다. 그 레이아웃 중 둘이 프랑스어와 영어의 CV-FRQ입니다. 각각 FRQ의 세 부분만을 FRQ 자체의 제목 아래 보여 주고 나머지는 모두 숨깁니다. 나머지는 FRQnet 양식이 수집하기 때문입니다. 각 부분에는 산문을 쓰고, 모든 주장은 증거 링크로 기록의 실제 항목을 가리킬 수 있으므로 독자는 당신의 말이 아니라 DOI에 도달합니다. 그다음:",
      },
      {
        type: "ol",
        items: [
          "ORCID로 로그인하고 기록이 구축되게 하세요. 본인의 것이 아닌 항목을 표시하고, 빠진 것은 DOI로 추가하세요.",
          "CV 모델 선택기에서 CV-FRQ 레이아웃(프랑스어 또는 영어)을 적용하세요. 이전 레이아웃은 프리셋으로 저장되므로 아무것도 잃지 않습니다.",
          "세 부분을 작성하세요. 각 부분 아래의 증거 패널이 출판물, 데이터셋, 지도 기록, 기타 성과를 증거 링크로 인용할 수 있게 나열합니다. 6쪽 또는 5쪽 제한에 대해 글자 수 카운터와 쪽수를 확인하세요.",
          "DOCX로 내보내고, 각 부분을 FRQ의 Word 서식에 붙여 넣고, 서식 규칙을 확인한 뒤 FRQnet에 PDF를 첨부하세요.",
        ],
      },
      { type: "cta", label: "ORCID 기록으로 CV 만들기 — 무료", href: "/" },
    ],
    faq: [
      {
        q: "FRQ 공모에서 CV-FRQ가 Canadian Common CV를 대체하나요?",
        a: "채택한 프로그램에서는 그렇습니다 — FRQ는 FRQnet에서 CV-FRQ를 PDF 첨부로 요구합니다. 채택이 프로그램별로 이루어졌으므로, 지원하는 구체적인 프로그램의 규칙을 확인하세요.",
      },
      {
        q: "CV-FRQ는 연방 Tri-agency CV와 같은 것인가요?",
        a: "아닙니다. 같은 정신 — 내러티브, 소수의 중요한 기여, 멘토링 부분 — 을 공유하지만, Tri-agency CV는 CIHR, NSERC, SSHRC의 문서로 고유한 서식과 도입 일정(NSERC의 2027년 공모, CIHR의 Project Grant는 2027년 가을 이후)을 가집니다. 요구하는 지원기관별로 각각 준비하세요.",
      },
      {
        q: "인용 횟수나 h-지수를 포함해야 하나요?",
        a: "FRQ 지침은 그것을 요구하지 않으며, CV-FRQ가 평가하는 것 — 기여의 영향, 중요성, 가치와 그 안에서의 본인의 역할 — 을 보여 주지도 못합니다. 대신 기여가 낳은 효과를, 독자가 따라갈 수 있는 식별자와 함께 기록하세요.",
      },
      {
        q: "기여가 출판물 이외의 것일 수 있나요?",
        a: "예. FRQ의 목록은 의도적으로 넓습니다. 지식 동원, 정책 의견서, 데이터 인프라, 소프트웨어, 예술 창작, 파트너십, 학회 조직, 지식재산, 공동체 봉사, 오픈 사이언스 기여가 모두 단독으로 또는 관련 성과와 묶어서 인정됩니다.",
      },
    ],
  },
  "ru-RU": {
    title: "Нарративное резюме FRQ (CV-FRQ): как его подготовить",
    description:
      "Что Fonds de recherche du Québec требует в своём «CV descriptif» — три раздела, шесть страниц на французском или пять на английском, до десяти вкладов с указанием аудитории и эффекта — и как подготовить его на основе вашей научной записи, ничего не преувеличивая.",
    blocks: [
      {
        type: "p",
        text: "Начиная с конкурсов 2025-2026 годов Fonds de recherche du Québec (FRQ) требует от заявителей нарративное резюме — «CV descriptif», или CV-FRQ — вместо Canadian Common CV. Оно короткое, состоит из трёх фиксированных разделов и оценивается по тому, что, по вашим словам, изменил тот или иной вклад, а не по числу перечисленных строк. Это руководство излагает, чего на деле требуют инструкции FRQ, раздел за разделом, и как собрать документ из записи, которая у вас уже есть.",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "Что такое CV-FRQ" },
      {
        type: "p",
        text: "FRQ описывает CV-FRQ как документ, который подчёркивает вашу экспертизу и релевантные компетенции, учитывая широкий спектр вкладов и достижений — не только публикации. Он составляется в шаблоне Word FRQ и прилагается в PDF к форме заявки FRQnet; сама форма собирает сведения об образовании, трудовой истории, языках и текущей должности, поэтому ничего из этого в резюме повторять не нужно. Три раздела, всегда в таком порядке:",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate (английский шаблон: Section 1: Background and skills) — как ваш академический, профессиональный или личный опыт позволяет выполнить предлагаемое исследование и соответствовать критериям программы.",
          "Deuxième section : Contributions et expériences les plus importantes (Section 2: Most significant contributions and experiences) — до десяти вкладов или опытов, каждый с эффектом, вашей ролью, периодом и аудиторией.",
          "Troisième section : Activités de supervision et de mentorat (Section 3: Supervisory and mentorship activities) — как вы обучали и наставляли студентов, постдоков и высококвалифицированный персонал.",
        ],
      },
      { type: "h2", id: "rules", text: "Действующие правила" },
      {
        type: "ul",
        items: [
          "Не более шести страниц на французском, пяти на английском. Два шаблона различаются только языком и объёмом.",
          "Используйте шаблон Word FRQ, соблюдайте стандарты оформления приложений FRQnet и загружайте результат в PDF.",
          "Без лимита слов. FRQ рекомендует подразделы, соответствующие критериям оценки программы; маркированные списки и таблицы допускаются.",
          "В неприменимом разделе можно просто написать «s/o» (sans objet) — «N/A» в английском шаблоне.",
          "Никакой чувствительной личной информации (медицинской, финансовой или иной частной), никаких фотографий и ничего, что могло бы навредить вам или другим.",
          "Всё должно соответствовать целям и критериям оценки программы, на которую вы подаётесь — сначала прочитайте их, затем решайте, что включить.",
        ],
      },
      { type: "h2", id: "section-1", text: "Раздел 1: опыт и компетенции" },
      {
        type: "p",
        text: "Здесь место экспертизе или пережитому опыту, показывающему, что вы способны выполнить проект, деятельности, демонстрирующей лидерство, предыдущим коллаборациям или достижениям по теме исследования, конкретным и преобразующим эффектам вашей прошлой работы, признанию в виде премий и стипендий, а также компетенциям, приобретённым через личный опыт. Пишите его для конкретной программы: эксперт читает этот раздел, сверяясь с критериями конкурса, поэтому следуйте их порядку и словарю.",
      },
      { type: "h2", id: "section-2", text: "Раздел 2: до десяти вкладов" },
      {
        type: "p",
        text: "Сердце документа. Вклад не обязан быть одной публикацией; это может быть связка тесно связанных результатов — статья, набор данных под ней, руководство, на которое она повлияла. FRQ перечисляет, что засчитывается, и список длинный: публикации всех видов, мобилизация знаний (медиа, подкасты, публичные лекции), экспертная и оценочная деятельность, служение сообществу, художественное творчество, инфраструктуры данных и когорты, интеллектуальная собственность, организация конференций, партнёрства, записки, повлиявшие на политику или стандарты практики, программное обеспечение и инструменты, а также вклад в открытую науку в понимании ЮНЕСКО. Для каждого укажите:",
      },
      {
        type: "ul",
        items: [
          "дату или период вклада;",
          "целевую аудиторию — A. академическое сообщество, B. практическое сообщество, C. широкая публика — одну букву или несколько;",
          "роль, которую вы сыграли, изложенную прямо;",
          "его эффект, значимость и ценность — с чем-то, что читатель может проверить: DOI, отчёт, запись в реестре, документ политики, цитирующий работу.",
        ],
      },
      {
        type: "p",
        text: "При перечислении публикаций FRQ требует стиль APA или иной признанный в вашей дисциплине стандарт, ваше имя жирным шрифтом — как и имена соисследователей, указанных в заявке — и звёздочку после имени каждого человека, которого вы курировали (Nom, Prénom*), от студентов бакалавриата до постдоков и высококвалифицированного персонала. Избегайте повторять в этом разделе то, что уже сказано в первом.",
      },
      { type: "h2", id: "section-3", text: "Раздел 3: руководство и наставничество" },
      {
        type: "p",
        text: "Опишите, в какой мере вы подготовили следующее поколение: руководство студентами колледжей и университетов всех уровней, постдоками и высококвалифицированным персоналом; преподавание и обучающие семинары; формальное или неформальное наставничество молодых исследователей, коллег и партнёров; просветительская работа, приводящая студентов в науку; обучение методам или системам знаний, включая знания коренных народов; и создание безопасной, справедливой и инклюзивной исследовательской среды. Карьеры вне академии засчитываются так же, как и внутри неё.",
      },
      { type: "h2", id: "evidence", text: "Доказать эффект, не преувеличивая" },
      {
        type: "p",
        text: "Вопрос, который задаёт каждый заявитель перед нарративным резюме, — как «доказать», что вклад имел значение. Его задают и эксперты, впервые сталкивающиеся с форматом. Честный ответ: нарративное утверждение доказывается тем, что читатель может проследить, а не числом. «Эта статья задокументировала сигнал, побудивший регулятор изменить монографию продукта в 2023 году» проверяемо, если у статьи есть DOI, у монографии — дата, а решение регулятора публично. Число цитирований или индекс Хирша ничего не говорят об этой цепочке, и сами инструкции FRQ никогда их не требуют.",
      },
      {
        type: "p",
        text: "Поэтому напишите цепочку — результат, затем что он изменил, затем где это изменение зафиксировано — и вставьте идентификаторы. Там, где вклад дошёл до практиков или публики (аудитории B и C), скажите, через что: клиническое руководство, отчёт министерства, программу профессиональной подготовки, серию в медиа. Там, где эффект задокументировать нельзя, опишите значимость вклада и вашу роль и остановитесь. Эксперт доверяет резюме, которое знает разницу.",
      },
      { type: "h2", id: "with-sigmacv", text: "Подготовка с SigmaCV" },
      {
        type: "p",
        text: "SigmaCV собирает ваше полное академическое резюме из открытых научных данных — ORCID, OpenAlex, Crossref, DataCite и других — и позволяет обратимо применять к нему макеты фондов. Два из этих макетов — CV-FRQ на французском и на английском: каждый показывает ровно три раздела FRQ под заголовками самого FRQ и скрывает всё остальное, потому что остальное собирает форма FRQnet. Внутри каждого раздела вы пишете прозу, и каждое утверждение может указывать на реальную запись вашего досье через ссылку-доказательство, так что читатель попадает на DOI, а не на ваше слово. Затем:",
      },
      {
        type: "ol",
        items: [
          "Войдите через ORCID и дайте записи собраться; отметьте то, что не ваше, и добавьте по DOI то, чего не хватает.",
          "Примените макет CV-FRQ (французский или английский) в селекторе моделей резюме. Предыдущий макет сохраняется как пресет, ничего не теряется.",
          "Напишите три раздела. Под каждым панель доказательств перечисляет ваши публикации, наборы данных, записи о руководстве и другие результаты для цитирования ссылкой-доказательством; следите за счётчиком символов и числом страниц относительно лимита в шесть или пять страниц.",
          "Экспортируйте в DOCX, вставьте разделы в шаблон Word FRQ, проверьте правила оформления и приложите PDF в FRQnet.",
        ],
      },
      { type: "cta", label: "Собрать резюме из вашей записи ORCID — бесплатно", href: "/" },
    ],
    faq: [
      {
        q: "Заменяет ли CV-FRQ Canadian Common CV в конкурсах FRQ?",
        a: "Для программ, которые его приняли, да — FRQ требует CV-FRQ как PDF-приложение в FRQnet. Проверьте правила конкретной программы, на которую подаётесь, поскольку внедрение шло программа за программой.",
      },
      {
        q: "CV-FRQ — это то же самое, что федеральное Tri-agency CV?",
        a: "Нет. У них общий дух — нарратив, небольшое число значимых вкладов, раздел о наставничестве — но Tri-agency CV является документом CIHR, NSERC и SSHRC со своим шаблоном и графиком внедрения (конкурсы NSERC 2027 года, Project Grant CIHR не ранее осени 2027). Готовьте каждое для того фонда, который его требует.",
      },
      {
        q: "Стоит ли включать число цитирований или индекс Хирша?",
        a: "Инструкции FRQ их не требуют, и они не показывают того, что оценивает CV-FRQ: эффект, значимость и ценность вклада и вашу роль в нём. Вместо этого задокументируйте эффект, который произвёл вклад, с идентификаторами, которые читатель может проследить.",
      },
      {
        q: "Может ли вклад быть чем-то иным, чем публикация?",
        a: "Да, и список FRQ намеренно широк: мобилизация знаний, записки о политике, инфраструктуры данных, программное обеспечение, художественное творчество, партнёрства, организация конференций, интеллектуальная собственность, служение сообществу и вклад в открытую науку — всё это засчитывается, отдельно или в связке со смежными результатами.",
      },
    ],
  },
};
