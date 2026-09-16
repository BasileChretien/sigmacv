// Localized content of the "frq-narrative-cv" guide: the Fonds de recherche du
// Québec "CV descriptif", mandatory in FRQ competitions since 2025-2026. Kept in
// its own module so `content.ts` stays navigable; `GUIDE_CONTENT` spreads it in
// under every locale, and the parity test in tests/guides.test.ts holds the block
// structure identical across the ten. Facts come from the FRQ instructions (French
// edition July 2025, English edition November 2025); the FRQ's own headings stay
// verbatim in every locale because an applicant needs the funder's wording. The
// English and French copy are written by hand, in short plain sentences and
// without dashes; the other eight follow the English and are flagged for a
// native-speaker pass (cf. `content.ts`).
import type { Locale } from "@/lib/i18n";
import type { GuideBlock, GuideContent } from "./guides";

/** The official documents, one list per language of the FRQ material. */
const FRQ_LINKS_EN: GuideBlock = {
  type: "links",
  items: [
    { label: "FRQ CV: the FRQ's page (English)", href: "https://frq.gouv.qc.ca/en/frq-cv/" },
    {
      label: "FRQ CV instructions, English edition (PDF, November 2025)",
      href: "https://frq.gouv.qc.ca/app/uploads/2026/03/cv-frq_instructions_en.pdf",
    },
    {
      label: "FRQ CV Word template, English",
      href: "https://frqnet.frq.gouv.qc.ca/Documents/CV-FRQ_modele_EN.docx",
    },
    {
      label: "CV-FRQ instructions, French edition (PDF, July 2025)",
      href: "https://frq.gouv.qc.ca/app/uploads/2025/10/cv-frq_instructions.pdf",
    },
    {
      label: "Tri-agency CV (SSHRC page, with the template and instructions)",
      href: "https://sshrc-crsh.canada.ca/en/funding/forms-and-online-application-tools/tri-agency-cv.aspx",
    },
    {
      label: "Tri-agency CV at CIHR, and the granting councils' message on the transition",
      href: "https://cihr-irsc.gc.ca/e/53574.html",
    },
  ],
};
const FRQ_LINKS_FR: GuideBlock = {
  type: "links",
  items: [
    { label: "CV-FRQ : la page du FRQ", href: "https://frq.gouv.qc.ca/cv-frq/" },
    {
      label: "Instructions du CV-FRQ (PDF, juillet 2025)",
      href: "https://frq.gouv.qc.ca/app/uploads/2025/10/cv-frq_instructions.pdf",
    },
    {
      label: "Modèle Word du CV-FRQ (français)",
      href: "https://frqnet.frq.gouv.qc.ca/Documents/CV-FRQ_modele.docx",
    },
    {
      label: "Instructions du FRQ CV, édition anglaise (PDF, novembre 2025)",
      href: "https://frq.gouv.qc.ca/app/uploads/2026/03/cv-frq_instructions_en.pdf",
    },
    {
      label: "CV des trois organismes fédéraux (page des IRSC, en français)",
      href: "https://cihr-irsc.gc.ca/f/53574.html",
    },
    {
      label: "Tri-agency CV (page du CRSH, en anglais, avec le modèle et les instructions)",
      href: "https://sshrc-crsh.canada.ca/en/funding/forms-and-online-application-tools/tri-agency-cv.aspx",
    },
  ],
};

export const FRQ_GUIDE: Record<Locale, GuideContent> = {
  "en-US": {
    title: "The FRQ narrative CV (CV-FRQ): how to prepare it",
    description:
      "What the Fonds de recherche du Québec asks for in its CV descriptif: three sections, six pages in French or five in English, up to ten contributions with an audience and an impact for each. And how to write one from the research record you already have.",
    blocks: [
      {
        type: "p",
        text: "Since its 2025-2026 competitions the Fonds de recherche du Québec (FRQ) has asked applicants for a narrative CV, called the CV descriptif or CV-FRQ, in place of the Canadian Common CV. The document is short. It has three fixed sections, and the committee reads it for what you say a piece of work changed rather than for how much you list. This guide goes through the FRQ instructions section by section, links the official documents, and then explains how to write the CV from the record you already have.",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "What the CV-FRQ is" },
      {
        type: "p",
        text: "The FRQ presents the CV-FRQ as a way to show your expertise and relevant skills through a broad range of contributions, not only publications. You write it in the FRQ Word template and attach it as a PDF to the FRQnet application form. The form itself collects your education, employment history, languages and current position, so the CV does not repeat them. The three sections always come in this order:",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate (in the English template, Section 1: Background and skills). How your academic, professional or personal background prepares you to carry out the proposed research and to meet the programme's criteria.",
          "Deuxième section : Contributions et expériences les plus importantes (Section 2: Most significant contributions and experiences). Up to ten contributions or experiences, each with its impact, your role, its period and its audience.",
          "Troisième section : Activités de supervision et de mentorat (Section 3: Supervisory and mentorship activities). How you have trained and mentored students, postdoctoral researchers and highly qualified personnel.",
        ],
      },
      { type: "h2", id: "rules", text: "The rules" },
      {
        type: "ul",
        items: [
          "Six pages at most in French, five in English. The two templates differ only in language and length.",
          "Use the FRQ Word template, follow the FRQnet presentation standards for attachments, and upload a PDF.",
          "There is no word limit. The FRQ suggests subsections that follow the programme's evaluation criteria. Bullet points and tables are allowed.",
          "If a section does not apply to you, write s/o (sans objet), or N/A in the English template.",
          "Leave out sensitive personal information (medical, financial or otherwise private), photos, and anything that could harm you or someone else.",
          "Read the objectives and evaluation criteria of the programme before you write. Everything in the CV should answer them.",
        ],
      },
      { type: "h2", id: "official-documents", text: "Official documents" },
      FRQ_LINKS_EN,
      { type: "h2", id: "section-1", text: "Section 1: background and skills" },
      {
        type: "p",
        text: "Put here the expertise or experience that shows you can carry out the project, the activities that show leadership, earlier collaborations or results on the research theme, the concrete effects of your past work, prizes and scholarships, and skills you acquired through personal experience. Write it for the programme in front of you. The evaluator reads this section against the call's criteria, so use their order and their vocabulary.",
      },
      { type: "h2", id: "section-2", text: "Section 2: up to ten contributions" },
      {
        type: "p",
        text: "This section carries the document. A contribution need not be one publication. It can be a set of closely related outputs, for example a paper, the dataset behind it and the guideline that used it. The FRQ list of what counts is long: publications of every kind, knowledge mobilisation such as media work, podcasts and public lectures, review and assessment work, community service, artistic creation, data infrastructure and cohorts, intellectual property, conference organisation, partnerships, memoranda that shaped a policy or a standard of practice, software and tools, and open science in the UNESCO sense. For each contribution give:",
      },
      {
        type: "ul",
        items: [
          "the date or period;",
          "the audience: A for the academic community, B for the practice community, C for the general public, one letter or several;",
          "your role, stated plainly;",
          "the impact, significance and value of the work, with something the reader can check, such as a DOI, a report, a registry entry or a policy that cites it.",
        ],
      },
      {
        type: "p",
        text: "For publications the FRQ asks for APA style or another standard recognised in your discipline. Put your own name in bold, and the names of the co-investigators on the application. Add an asterisk after the name of every person you supervised (Nom, Prénom*), from undergraduates to postdoctoral researchers and highly qualified personnel. Do not repeat here what you said in the first section.",
      },
      { type: "h2", id: "section-3", text: "Section 3: supervision and mentorship" },
      {
        type: "p",
        text: "Describe how you have trained the next generation: supervision of college and university students at every level, of postdoctoral researchers and of highly qualified personnel; teaching and training workshops; formal or informal mentorship of early-career researchers, colleagues and partners; outreach that brings students into research; training in methods or knowledge systems, Indigenous knowledge included; and work on safe, equitable and inclusive research environments. A career outside academia counts as much as one inside it.",
      },
      { type: "h2", id: "evidence", text: "Showing impact without inflating it" },
      {
        type: "p",
        text: 'Applicants new to narrative CVs ask how to prove that a contribution mattered, and evaluators new to the format ask the same thing. A narrative claim is checked by something the reader can follow, not by a number. Take the sentence "this paper documented the signal that led the regulator to amend the product monograph in 2023". A reader can verify it if the paper has a DOI, the monograph has a date and the regulator\'s decision is public. A citation count or an h-index says nothing about that chain, and the FRQ instructions never ask for one.',
      },
      {
        type: "p",
        text: "So write the chain: the output, what it changed, and where that change is recorded, with the identifiers. Where a contribution reached practitioners or the public (audiences B and C), say through what: a clinical guideline, a ministry report, a training programme, a series of interviews. Where you cannot document an effect, describe the significance of the work and your role in it, and stop there. An evaluator can tell a documented effect from a claimed one.",
      },
      { type: "h2", id: "with-sigmacv", text: "Preparing it with SigmaCV" },
      {
        type: "p",
        text: "SigmaCV builds your full academic CV from open research data (ORCID, OpenAlex, Crossref, DataCite and others) and lets you apply funder layouts to it, reversibly. Two of those layouts are the CV-FRQ in French and in English. Each shows the three FRQ sections under the FRQ's own headings and hides everything else, since the FRQnet form collects the rest. You write prose in each section, and a claim can point at an entry of your record through an evidence link, so the reader lands on the DOI.",
      },
      {
        type: "ol",
        items: [
          "Sign in with ORCID and let the record build. Mark what is not yours and add missing works by DOI.",
          "Apply the CV-FRQ layout, French or English, from the CV model picker. The previous layout is saved as a preset.",
          "Write the three sections. Under each one the evidence panel lists your publications, datasets, supervision records and other outputs you can cite with an evidence link. Keep an eye on the character count and the page count against the six or five page limit.",
          "Export to DOCX, paste the sections into the FRQ Word template, check the presentation rules, and attach the PDF in FRQnet.",
        ],
      },
      { type: "cta", label: "Build your CV from your ORCID record, free", href: "/" },
    ],
    faq: [
      {
        q: "Does the CV-FRQ replace the Canadian Common CV for FRQ competitions?",
        a: "For the programmes that have adopted it, yes. The FRQ asks for the CV-FRQ as a PDF attachment in FRQnet. Adoption has gone programme by programme, so check the rules of the programme you are applying to.",
      },
      {
        q: "Is the CV-FRQ the same as the federal Tri-agency CV?",
        a: "No. The two documents have the same spirit, a narrative with a small number of significant contributions and a section on mentorship, but the Tri-agency CV belongs to CIHR, NSERC and SSHRC. It has its own template and its own timetable: NSERC's 2027 competitions, and CIHR's Project Grant no sooner than fall 2027. Prepare each one for the funder that asks for it.",
      },
      {
        q: "Should I include citation counts or my h-index?",
        a: "The FRQ instructions do not ask for them, and they do not show what the CV-FRQ is judged on, which is the impact, significance and value of a contribution and your role in it. Document the effect a contribution had instead, with identifiers a reader can follow.",
      },
      {
        q: "Can a contribution be something other than a publication?",
        a: "Yes. The FRQ list is broad on purpose. Knowledge mobilisation, policy memoranda, data infrastructure, software, artistic creation, partnerships, conference organisation, intellectual property, community service and open science all count, on their own or grouped with related outputs.",
      },
    ],
  },
  "zh-CN": {
    title: "FRQ 叙述式简历（CV-FRQ）：如何准备",
    description:
      "Fonds de recherche du Québec 在其 CV descriptif 中要求什么：三个部分，法文六页或英文五页，最多十项贡献，每项注明受众与影响。以及如何从您已有的研究记录写出这份文件。",
    blocks: [
      {
        type: "p",
        text: "自 2025-2026 年度竞赛起，Fonds de recherche du Québec（FRQ）要求申请人提交一份叙述式简历，称为 CV descriptif 或 CV-FRQ，以取代 Canadian Common CV。这份文件很短。它有三个固定的部分，评审委员会看的是您说明某项工作改变了什么，而不是您列了多少条。本指南逐个部分说明 FRQ 的指引，给出官方文件的链接，然后说明如何用您已有的记录写出这份简历。",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "什么是 CV-FRQ" },
      {
        type: "p",
        text: "FRQ 把 CV-FRQ 定位为通过广泛的贡献来展示您的专长和相关能力的方式，而不只是论文。您在 FRQ 的 Word 模板中撰写，并以 PDF 形式附在 FRQnet 申请表上。表单本身收集您的学历、任职经历、语言和现职，所以简历不必重复这些内容。三个部分的顺序固定如下：",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate（英文模板为 Section 1: Background and skills）。您的学术、职业或个人经历如何让您能够完成拟议研究并满足项目的标准。",
          "Deuxième section : Contributions et expériences les plus importantes（Section 2: Most significant contributions and experiences）。最多十项贡献或经历，每项写明影响、您的角色、时期和受众。",
          "Troisième section : Activités de supervision et de mentorat（Section 3: Supervisory and mentorship activities）。您如何培养和指导学生、博士后研究人员和高素质人才。",
        ],
      },
      { type: "h2", id: "rules", text: "规则" },
      {
        type: "ul",
        items: [
          "法文最多六页，英文最多五页。两个模板只在语言和篇幅上不同。",
          "使用 FRQ 的 Word 模板，遵循 FRQnet 对附件的排版规范，并上传 PDF。",
          "没有字数限制。FRQ 建议按项目的评审标准划分小节。可以使用项目符号和表格。",
          "如果某个部分不适用于您，写 s/o（sans objet），英文模板中写 N/A。",
          "不要写入敏感的个人信息（医疗、财务或其他私密信息）、照片，以及任何可能伤害您或他人的内容。",
          "动笔前先阅读项目的目标和评审标准。简历中的每一项都应当回应它们。",
        ],
      },
      { type: "h2", id: "official-documents", text: "官方文件" },
      FRQ_LINKS_EN,
      { type: "h2", id: "section-1", text: "第一部分：经历与能力" },
      {
        type: "p",
        text: "在这里写下证明您能完成项目的专长或经历、体现领导力的活动、在该研究主题上的既往合作或成果、既往工作的具体效果、奖项与奖学金，以及您从个人经历中获得的能力。针对眼前的项目来写。评审会对照征集标准阅读这一部分，所以请沿用他们的顺序和用语。",
      },
      { type: "h2", id: "section-2", text: "第二部分：最多十项贡献" },
      {
        type: "p",
        text: "这一部分是文件的主体。一项贡献不必是一篇论文。它可以是一组紧密相关的成果，例如一篇文章、其背后的数据集和采用了它的指南。FRQ 列出的可计入类型很长：各类出版物，媒体工作、播客和公开讲座等知识动员，评审与评估工作，社区服务，艺术创作，数据基础设施与队列，知识产权，会议组织，合作关系，影响了政策或实践标准的建议书，软件与工具，以及 UNESCO 意义上的开放科学。每一项贡献请写明：",
      },
      {
        type: "ul",
        items: [
          "日期或时期；",
          "受众：A 为学术界，B 为实务界，C 为公众，一个或多个字母；",
          "您的角色，直白陈述；",
          "该工作的影响、重要性和价值，并附上读者可以核查的依据，例如 DOI、报告、注册条目或引用它的政策。",
        ],
      },
      {
        type: "p",
        text: "列出出版物时，FRQ 要求使用 APA 格式或您学科认可的其他标准。您本人的姓名加粗，申请中的共同研究者姓名也加粗。在您指导过的每个人的姓名后加星号（Nom, Prénom*），从本科生到博士后研究人员和高素质人才都适用。不要在这里重复第一部分已经说过的内容。",
      },
      { type: "h2", id: "section-3", text: "第三部分：指导与培养" },
      {
        type: "p",
        text: "说明您如何培养下一代：对各层级大专院校学生、博士后研究人员和高素质人才的指导；教学与培训工作坊；对早期职业研究者、同事和合作伙伴的正式或非正式指导；把学生带入研究的推广活动；方法或知识体系的培训，包括原住民知识；以及建设安全、公平、包容的研究环境。学术界之外的职业与学术界之内的同样计入。",
      },
      { type: "h2", id: "evidence", text: "展示影响而不夸大" },
      {
        type: "p",
        text: "初次接触叙述式简历的申请人会问，如何证明某项贡献确有价值；初次接触这种格式的评审也会问同样的问题。一项叙述性主张靠读者能够追溯的东西来核查，而不是靠一个数字。以这句话为例：“这篇论文记录了促使监管机构在 2023 年修订产品专论的信号。”只要论文有 DOI、专论有日期、监管决定是公开的，读者就能核实。引用次数或 h 指数对这条链条毫无说明，FRQ 的指引也从未要求它们。",
      },
      {
        type: "p",
        text: "所以请写出这条链条：成果、它改变了什么、这一改变记录在哪里，并附上标识符。凡贡献触及实务界或公众（受众 B 和 C）之处，说明是通过什么：临床指南、部委报告、培训项目、系列访谈。凡无法记录效果之处，描述该工作的重要性和您的角色，然后就此打住。评审分得清有记录的效果和声称的效果。",
      },
      { type: "h2", id: "with-sigmacv", text: "用 SigmaCV 准备" },
      {
        type: "p",
        text: "SigmaCV 从开放研究数据（ORCID、OpenAlex、Crossref、DataCite 等）构建您的完整学术简历，并允许您可逆地套用资助机构版式。其中两种版式是法文和英文的 CV-FRQ。每种版式在 FRQ 的原文标题下只显示 FRQ 的三个部分，隐藏其余一切，因为 FRQnet 表单会收集其余信息。您在每个部分中撰写正文，一项主张可以通过证据链接指向您记录中的条目，读者点开的就是 DOI。",
      },
      {
        type: "ol",
        items: [
          "用 ORCID 登录并让记录自动构建。标记不属于您的条目，并按 DOI 补充缺失的成果。",
          "在简历模型选择器中套用 CV-FRQ 版式（法文或英文）。之前的版式会保存为预设。",
          "撰写三个部分。每个部分下方的证据面板列出您的出版物、数据集、指导记录和其他成果，供您以证据链接引用。对照六页或五页的限制留意字符数和页数。",
          "导出为 DOCX，将各部分粘贴到 FRQ 的 Word 模板，核对排版规则，然后在 FRQnet 中附上 PDF。",
        ],
      },
      { type: "cta", label: "从您的 ORCID 记录构建简历，免费", href: "/" },
    ],
    faq: [
      {
        q: "在 FRQ 竞赛中，CV-FRQ 是否取代 Canadian Common CV？",
        a: "对已采用它的项目而言，是的。FRQ 要求在 FRQnet 中以 PDF 附件形式提交 CV-FRQ。采用是逐项目进行的，所以请查阅您所申请项目的规则。",
      },
      {
        q: "CV-FRQ 与联邦 Tri-agency CV 是同一份文件吗？",
        a: "不是。两份文件精神相同，都是叙述式、少量重要贡献加一个指导培养部分，但 Tri-agency CV 属于 CIHR、NSERC 和 SSHRC。它有自己的模板和时间表：NSERC 的 2027 年竞赛，以及 CIHR 的 Project Grant 不早于 2027 年秋季。请为提出要求的资助机构分别准备。",
      },
      {
        q: "我应该写入引用次数或 h 指数吗？",
        a: "FRQ 的指引没有要求，它们也无法展示 CV-FRQ 所评判的内容，即贡献的影响、重要性和价值，以及您在其中的角色。请改为记录贡献产生的效果，并附上读者可追溯的标识符。",
      },
      {
        q: "贡献可以是出版物之外的东西吗？",
        a: "可以。FRQ 的清单有意设得很宽。知识动员、政策建议书、数据基础设施、软件、艺术创作、合作关系、会议组织、知识产权、社区服务和开放科学都可计入，单独列出或与相关成果合并均可。",
      },
    ],
  },
  "es-ES": {
    title: "El CV narrativo del FRQ (CV-FRQ): cómo prepararlo",
    description:
      "Qué pide el Fonds de recherche du Québec en su CV descriptif: tres secciones, seis páginas en francés o cinco en inglés, hasta diez contribuciones con un público y un impacto para cada una. Y cómo escribirlo a partir del registro de investigación que ya tienes.",
    blocks: [
      {
        type: "p",
        text: "Desde sus convocatorias 2025-2026, el Fonds de recherche du Québec (FRQ) pide a los solicitantes un CV narrativo, llamado CV descriptif o CV-FRQ, en lugar del Canadian Common CV. El documento es breve. Tiene tres secciones fijas, y el comité lo lee por lo que dices que cambió un trabajo, no por cuánto enumeras. Esta guía recorre las instrucciones del FRQ sección por sección, enlaza los documentos oficiales y luego explica cómo escribir el CV a partir del registro que ya tienes.",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "Qué es el CV-FRQ" },
      {
        type: "p",
        text: "El FRQ presenta el CV-FRQ como una forma de mostrar tu experiencia y competencias pertinentes a través de una amplia gama de contribuciones, no solo publicaciones. Lo escribes en la plantilla Word del FRQ y lo adjuntas en PDF al formulario de solicitud FRQnet. El propio formulario recoge tu formación, historial laboral, idiomas y puesto actual, así que el CV no los repite. Las tres secciones van siempre en este orden:",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate (en la plantilla inglesa, Section 1: Background and skills). Cómo tu trayectoria académica, profesional o personal te prepara para realizar la investigación propuesta y cumplir los criterios del programa.",
          "Deuxième section : Contributions et expériences les plus importantes (Section 2: Most significant contributions and experiences). Hasta diez contribuciones o experiencias, cada una con su impacto, tu papel, su periodo y su público.",
          "Troisième section : Activités de supervision et de mentorat (Section 3: Supervisory and mentorship activities). Cómo has formado y acompañado a estudiantes, investigadores posdoctorales y personal altamente cualificado.",
        ],
      },
      { type: "h2", id: "rules", text: "Las reglas" },
      {
        type: "ul",
        items: [
          "Seis páginas como máximo en francés, cinco en inglés. Las dos plantillas solo difieren en idioma y extensión.",
          "Usa la plantilla Word del FRQ, sigue las normas de presentación de FRQnet para los anexos y sube un PDF.",
          "No hay límite de palabras. El FRQ sugiere subsecciones que sigan los criterios de evaluación del programa. Se permiten viñetas y tablas.",
          "Si una sección no se aplica a tu caso, escribe s/o (sans objet), o N/A en la plantilla inglesa.",
          "Deja fuera la información personal sensible (médica, financiera o privada), las fotos y cualquier cosa que pueda perjudicarte a ti o a otra persona.",
          "Lee los objetivos y criterios de evaluación del programa antes de escribir. Todo lo que pongas en el CV debe responder a ellos.",
        ],
      },
      { type: "h2", id: "official-documents", text: "Documentos oficiales" },
      FRQ_LINKS_EN,
      { type: "h2", id: "section-1", text: "Sección 1: trayectoria y competencias" },
      {
        type: "p",
        text: "Pon aquí la experiencia que demuestra que puedes realizar el proyecto, las actividades que muestran liderazgo, las colaboraciones o resultados anteriores sobre el tema de investigación, los efectos concretos de tu trabajo pasado, los premios y becas, y las competencias adquiridas por experiencia personal. Escríbela para el programa que tienes delante. El evaluador lee esta sección frente a los criterios de la convocatoria, así que usa su orden y su vocabulario.",
      },
      { type: "h2", id: "section-2", text: "Sección 2: hasta diez contribuciones" },
      {
        type: "p",
        text: "Esta sección sostiene el documento. Una contribución no tiene que ser una sola publicación. Puede ser un conjunto de resultados estrechamente relacionados, por ejemplo un artículo, el conjunto de datos que lo sustenta y la guía que lo utilizó. La lista del FRQ de lo que cuenta es larga: publicaciones de todo tipo, movilización del conocimiento como trabajo con medios, pódcast y conferencias públicas, evaluación y revisión, servicio a la comunidad, creación artística, infraestructuras de datos y cohortes, propiedad intelectual, organización de congresos, alianzas, informes que orientaron una política o una norma de práctica, software y herramientas, y ciencia abierta en el sentido de la UNESCO. Para cada contribución indica:",
      },
      {
        type: "ul",
        items: [
          "la fecha o el periodo;",
          "el público: A para la comunidad académica, B para la comunidad de práctica, C para el público general, una letra o varias;",
          "tu papel, dicho con claridad;",
          "el impacto, la importancia y el valor del trabajo, con algo que el lector pueda comprobar, como un DOI, un informe, una entrada en un registro o una política que lo cite.",
        ],
      },
      {
        type: "p",
        text: "Para las publicaciones el FRQ pide el estilo APA u otra norma reconocida en tu disciplina. Pon tu nombre en negrita, y los nombres de los coinvestigadores de la solicitud. Añade un asterisco tras el nombre de cada persona que hayas supervisado (Nom, Prénom*), desde estudiantes de grado hasta investigadores posdoctorales y personal altamente cualificado. No repitas aquí lo que dijiste en la primera sección.",
      },
      { type: "h2", id: "section-3", text: "Sección 3: supervisión y mentoría" },
      {
        type: "p",
        text: "Describe cómo has formado a la siguiente generación: supervisión de estudiantes de colegio y universidad en todos los niveles, de investigadores posdoctorales y de personal altamente cualificado; docencia y talleres de formación; mentoría formal o informal de investigadores en inicio de carrera, colegas y socios; divulgación que acerca a los estudiantes a la investigación; formación en métodos o sistemas de conocimiento, incluidos los saberes indígenas; y trabajo por entornos de investigación seguros, equitativos e inclusivos. Una carrera fuera de la academia cuenta tanto como una dentro.",
      },
      { type: "h2", id: "evidence", text: "Mostrar el impacto sin inflarlo" },
      {
        type: "p",
        text: 'Los solicitantes nuevos en los CV narrativos preguntan cómo demostrar que una contribución importó, y los evaluadores nuevos en el formato preguntan lo mismo. Una afirmación narrativa se comprueba con algo que el lector pueda seguir, no con un número. Toma la frase "este artículo documentó la señal que llevó al regulador a modificar la monografía del producto en 2023". Un lector puede verificarla si el artículo tiene DOI, la monografía tiene fecha y la decisión del regulador es pública. Un recuento de citas o un índice h no dice nada de esa cadena, y las instrucciones del FRQ nunca lo piden.',
      },
      {
        type: "p",
        text: "Así que escribe la cadena: el resultado, lo que cambió y dónde está registrado ese cambio, con los identificadores. Donde una contribución llegó a profesionales o al público (públicos B y C), di a través de qué: una guía clínica, un informe ministerial, un programa de formación, una serie de entrevistas. Donde no puedas documentar un efecto, describe la importancia del trabajo y tu papel en él, y detente ahí. Un evaluador distingue un efecto documentado de uno afirmado.",
      },
      { type: "h2", id: "with-sigmacv", text: "Prepararlo con SigmaCV" },
      {
        type: "p",
        text: "SigmaCV construye tu CV académico completo a partir de datos abiertos de investigación (ORCID, OpenAlex, Crossref, DataCite y otros) y te permite aplicarle diseños de financiadores de forma reversible. Dos de esos diseños son el CV-FRQ en francés y en inglés. Cada uno muestra las tres secciones del FRQ bajo sus propios encabezados y oculta todo lo demás, ya que el formulario FRQnet recoge el resto. Escribes prosa en cada sección, y una afirmación puede apuntar a una entrada de tu registro mediante un enlace de evidencia, de modo que el lector llega al DOI.",
      },
      {
        type: "ol",
        items: [
          "Inicia sesión con ORCID y deja que el registro se construya. Marca lo que no sea tuyo y añade por DOI lo que falte.",
          "Aplica el diseño CV-FRQ, francés o inglés, desde el selector de modelos de CV. El diseño anterior se guarda como preajuste.",
          "Escribe las tres secciones. Bajo cada una, el panel de evidencias lista tus publicaciones, conjuntos de datos, registros de supervisión y otros resultados que puedes citar con un enlace de evidencia. Vigila el número de caracteres y de páginas frente al límite de seis o cinco.",
          "Exporta a DOCX, pega las secciones en la plantilla Word del FRQ, comprueba las normas de presentación y adjunta el PDF en FRQnet.",
        ],
      },
      { type: "cta", label: "Construye tu CV desde tu registro ORCID, gratis", href: "/" },
    ],
    faq: [
      {
        q: "¿El CV-FRQ sustituye al Canadian Common CV en las convocatorias del FRQ?",
        a: "En los programas que lo han adoptado, sí. El FRQ pide el CV-FRQ como anexo PDF en FRQnet. La adopción ha ido programa por programa, así que consulta las reglas del programa al que te presentas.",
      },
      {
        q: "¿Es el CV-FRQ lo mismo que el Tri-agency CV federal?",
        a: "No. Los dos documentos tienen el mismo espíritu, una narrativa con pocas contribuciones significativas y una sección de mentoría, pero el Tri-agency CV pertenece a CIHR, NSERC y SSHRC. Tiene su propia plantilla y su propio calendario: las convocatorias 2027 de NSERC y el Project Grant de CIHR no antes del otoño de 2027. Prepara cada uno para el financiador que lo pide.",
      },
      {
        q: "¿Debo incluir recuentos de citas o mi índice h?",
        a: "Las instrucciones del FRQ no los piden, y no muestran lo que se juzga en el CV-FRQ, que es el impacto, la importancia y el valor de una contribución y tu papel en ella. Documenta en su lugar el efecto que tuvo la contribución, con identificadores que el lector pueda seguir.",
      },
      {
        q: "¿Una contribución puede ser algo distinto de una publicación?",
        a: "Sí. La lista del FRQ es amplia a propósito. Movilización del conocimiento, informes de política, infraestructuras de datos, software, creación artística, alianzas, organización de congresos, propiedad intelectual, servicio a la comunidad y ciencia abierta cuentan, solas o agrupadas con resultados relacionados.",
      },
    ],
  },
  "fr-FR": {
    title: "Le CV-FRQ (CV descriptif) : comment le préparer",
    description:
      "Ce que le Fonds de recherche du Québec demande dans son CV descriptif : trois sections, six pages en français ou cinq en anglais, jusqu'à dix contributions avec une clientèle et des retombées pour chacune. Et comment l'écrire à partir du dossier de recherche que vous avez déjà.",
    blocks: [
      {
        type: "p",
        text: "Depuis ses concours 2025-2026, le Fonds de recherche du Québec (FRQ) demande aux personnes candidates un CV descriptif, aussi appelé CV-FRQ, à la place du CV commun canadien. Le document est court. Il compte trois sections fixes, et le comité le lit pour ce que vous dites qu'un travail a changé, non pour la longueur de vos listes. Ce guide reprend les instructions du FRQ section par section, donne les liens vers les documents officiels, puis explique comment écrire le CV à partir du dossier que vous avez déjà.",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "Ce qu'est le CV-FRQ" },
      {
        type: "p",
        text: "Le FRQ présente le CV-FRQ comme un moyen de mettre en valeur votre expertise et vos compétences pertinentes à travers un large éventail de contributions, et pas seulement des publications. Vous le rédigez dans le modèle Word du FRQ et vous le joignez en PDF au formulaire de demande FRQnet. Le formulaire recueille lui-même votre formation, votre historique d'emploi, vos langues et votre occupation actuelle, donc le CV ne les répète pas. Les trois sections viennent toujours dans cet ordre :",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate (dans le modèle anglais, Section 1: Background and skills). Comment votre parcours académique, professionnel ou personnel vous prépare à réaliser la recherche proposée et à répondre aux critères du programme.",
          "Deuxième section : Contributions et expériences les plus importantes (Section 2: Most significant contributions and experiences). Jusqu'à dix contributions ou expériences, chacune avec ses retombées, votre rôle, sa période et sa clientèle.",
          "Troisième section : Activités de supervision et de mentorat (Section 3: Supervisory and mentorship activities). Comment vous avez formé et accompagné la relève étudiante et postdoctorale et le personnel hautement qualifié.",
        ],
      },
      { type: "h2", id: "rules", text: "Les règles" },
      {
        type: "ul",
        items: [
          "Six pages au maximum en français, cinq en anglais. Les deux modèles ne diffèrent que par la langue et la longueur.",
          "Utilisez le modèle Word du FRQ, respectez les normes de présentation des fichiers joints aux formulaires FRQnet, et téléversez un PDF.",
          "Il n'y a pas de limite de mots. Le FRQ suggère des sous-sections qui suivent les critères d'évaluation du programme. Les puces et les tableaux sont permis.",
          "Si une section ne s'applique pas à vous, écrivez s/o (sans objet), ou N/A dans le modèle anglais.",
          "Laissez de côté les informations personnelles sensibles (médicales, financières ou autrement intimes), les photos, et tout ce qui pourrait vous causer ou causer à quelqu'un d'autre un préjudice.",
          "Lisez les objectifs et les critères d'évaluation du programme avant d'écrire. Tout ce que contient le CV doit y répondre.",
        ],
      },
      { type: "h2", id: "official-documents", text: "Documents officiels" },
      FRQ_LINKS_FR,
      { type: "h2", id: "section-1", text: "Première section : parcours et compétences" },
      {
        type: "p",
        text: "Mettez ici l'expertise ou l'expérience qui montre que vous pouvez réaliser le projet, les activités qui témoignent de votre leadership, les collaborations ou résultats antérieurs sur la thématique, les effets concrets de vos travaux passés, les prix et les bourses, et les aptitudes acquises par vos expériences personnelles. Écrivez-la pour le programme que vous avez devant vous. La personne évaluatrice lit cette section à la lumière des critères du concours, alors reprenez leur ordre et leur vocabulaire.",
      },
      { type: "h2", id: "section-2", text: "Deuxième section : jusqu'à dix contributions" },
      {
        type: "p",
        text: "Cette section porte le document. Une contribution n'a pas à être une seule publication. Elle peut réunir plusieurs éléments étroitement liés, par exemple un article, le jeu de données qui le sous-tend et la ligne directrice qui s'en est servie. La liste du FRQ de ce qui compte est longue : publications de toute nature, mobilisation des connaissances comme les entrevues, les balados et les conférences publiques, activités d'évaluation, services à la communauté, création artistique, infrastructures de données et cohortes, propriété intellectuelle, organisation de colloques, partenariats, avis et mémoires qui ont contribué à une politique ou à une norme de pratique, logiciels et outils, et science ouverte au sens de la Recommandation de l'UNESCO. Pour chaque contribution, précisez :",
      },
      {
        type: "ul",
        items: [
          "la date ou la période ;",
          "la clientèle : A pour le milieu académique, B pour le milieu de pratique, C pour le grand public, une lettre ou plusieurs ;",
          "votre rôle, dit simplement ;",
          "les retombées, l'importance et la valeur du travail, avec quelque chose que le lecteur peut vérifier, comme un DOI, un rapport, une inscription à un registre ou une politique qui le cite.",
        ],
      },
      {
        type: "p",
        text: "Pour les publications, le FRQ demande les normes APA ou toute autre norme reconnue dans votre discipline. Mettez vos nom et prénom en gras, ainsi que ceux des cochercheuses et cochercheurs de la demande. Ajoutez un astérisque après le nom de chaque personne que vous avez supervisée (Nom, Prénom*), de la relève du premier cycle jusqu'aux postdoctorants et au personnel hautement qualifié. Ne répétez pas ici ce que vous avez dit dans la première section.",
      },
      { type: "h2", id: "section-3", text: "Troisième section : supervision et mentorat" },
      {
        type: "p",
        text: "Décrivez comment vous avez formé la relève : encadrement de la relève étudiante du collégial et des universités à tous les cycles, des postdoctorants et du personnel hautement qualifié ; enseignement et ateliers de formation ; mentorat formel ou informel de chercheuses et chercheurs en début de carrière, de collègues et de partenaires ; sensibilisation qui amène des étudiants vers la recherche ; formations aux méthodes ou aux systèmes de connaissances, savoirs autochtones compris ; et travail pour des milieux de recherche sûrs, équitables et inclusifs. Une carrière hors du milieu académique compte autant qu'une carrière à l'intérieur.",
      },
      { type: "h2", id: "evidence", text: "Montrer les retombées sans les gonfler" },
      {
        type: "p",
        text: "Les personnes candidates qui découvrent le CV descriptif demandent comment prouver qu'une contribution a compté, et les évaluateurs qui découvrent le format posent la même question. Une affirmation narrative se vérifie par quelque chose que le lecteur peut suivre, pas par un chiffre. Prenez la phrase « cet article a documenté le signal qui a conduit l'organisme de réglementation à modifier la monographie du produit en 2023 ». Un lecteur peut la vérifier si l'article a un DOI, si la monographie a une date et si la décision de l'organisme est publique. Un nombre de citations ou un indice h ne dit rien de cette chaîne, et les instructions du FRQ n'en demandent jamais.",
      },
      {
        type: "p",
        text: "Écrivez donc la chaîne : le produit, ce qu'il a changé, et où ce changement est consigné, avec les identifiants. Là où une contribution a rejoint le milieu de pratique ou le grand public (clientèles B et C), dites par quoi : une ligne directrice clinique, un rapport ministériel, un programme de formation, une série d'entrevues. Là où vous ne pouvez pas documenter un effet, décrivez l'importance du travail et votre rôle, et arrêtez-vous là. Une personne évaluatrice distingue un effet documenté d'un effet affirmé.",
      },
      { type: "h2", id: "with-sigmacv", text: "Le préparer avec SigmaCV" },
      {
        type: "p",
        text: "SigmaCV bâtit votre CV académique complet à partir de données de recherche ouvertes (ORCID, OpenAlex, Crossref, DataCite et d'autres) et vous laisse y appliquer des mises en page de financeurs, de façon réversible. Deux de ces mises en page sont le CV-FRQ en français et en anglais. Chacune montre les trois sections du FRQ sous ses propres intitulés et masque tout le reste, puisque le formulaire FRQnet recueille le reste. Vous écrivez en prose dans chaque section, et une affirmation peut pointer vers une entrée de votre dossier par un lien de preuve, de sorte que le lecteur arrive sur le DOI.",
      },
      {
        type: "ol",
        items: [
          "Connectez-vous avec ORCID et laissez le dossier se construire. Signalez ce qui n'est pas de vous et ajoutez par DOI ce qui manque.",
          "Appliquez la mise en page CV-FRQ, français ou anglais, depuis le sélecteur de modèles de CV. La mise en page précédente est conservée comme préréglage.",
          "Rédigez les trois sections. Sous chacune, le panneau de preuves liste vos publications, jeux de données, encadrements et autres produits que vous pouvez citer par un lien de preuve. Surveillez le nombre de caractères et le nombre de pages au regard de la limite de six ou cinq pages.",
          "Exportez en DOCX, collez les sections dans le modèle Word du FRQ, vérifiez les normes de présentation, et joignez le PDF dans FRQnet.",
        ],
      },
      {
        type: "cta",
        label: "Bâtir votre CV à partir de votre dossier ORCID, gratuitement",
        href: "/",
      },
    ],
    faq: [
      {
        q: "Le CV-FRQ remplace-t-il le CV commun canadien dans les concours du FRQ ?",
        a: "Pour les programmes qui l'ont adopté, oui. Le FRQ demande le CV-FRQ en pièce jointe PDF dans FRQnet. L'adoption s'est faite programme par programme, alors vérifiez les règles du programme auquel vous postulez.",
      },
      {
        q: "Le CV-FRQ est-il la même chose que le CV des trois organismes fédéraux (Tri-agency) ?",
        a: "Non. Les deux documents ont le même esprit, un récit avec un petit nombre de contributions significatives et une section sur le mentorat, mais le Tri-agency CV appartient aux IRSC, au CRSNG et au CRSH. Il a son propre modèle et son propre calendrier : les concours 2027 du CRSNG, et le Project Grant des IRSC au plus tôt à l'automne 2027. Préparez chacun pour le financeur qui le demande.",
      },
      {
        q: "Dois-je inclure des nombres de citations ou mon indice h ?",
        a: "Les instructions du FRQ ne les demandent pas, et ils ne montrent pas ce sur quoi le CV-FRQ est jugé, c'est-à-dire les retombées, l'importance et la valeur d'une contribution et le rôle que vous y avez joué. Documentez plutôt l'effet qu'une contribution a eu, avec des identifiants que le lecteur peut suivre.",
      },
      {
        q: "Une contribution peut-elle être autre chose qu'une publication ?",
        a: "Oui. La liste du FRQ est large à dessein. Mobilisation des connaissances, avis et mémoires, infrastructures de données, logiciels, création artistique, partenariats, organisation de colloques, propriété intellectuelle, services à la communauté et science ouverte comptent tous, seuls ou regroupés avec des éléments liés.",
      },
    ],
  },
  "de-DE": {
    title: "Der narrative Lebenslauf des FRQ (CV-FRQ): so bereiten Sie ihn vor",
    description:
      "Was der Fonds de recherche du Québec in seinem CV descriptif verlangt: drei Abschnitte, sechs Seiten auf Französisch oder fünf auf Englisch, bis zu zehn Beiträge mit Zielgruppe und Wirkung. Und wie Sie ihn aus dem Forschungsverzeichnis schreiben, das Sie bereits haben.",
    blocks: [
      {
        type: "p",
        text: "Seit seinen Wettbewerben 2025-2026 verlangt der Fonds de recherche du Québec (FRQ) von Antragstellenden einen narrativen Lebenslauf, CV descriptif oder CV-FRQ genannt, anstelle des Canadian Common CV. Das Dokument ist kurz. Es hat drei feste Abschnitte, und das Gremium liest es daraufhin, was eine Arbeit Ihrer Darstellung nach verändert hat, nicht daraufhin, wie viel Sie aufzählen. Dieser Leitfaden geht die FRQ-Anweisungen Abschnitt für Abschnitt durch, verlinkt die offiziellen Dokumente und erklärt dann, wie Sie den Lebenslauf aus dem Verzeichnis schreiben, das Sie schon haben.",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "Was der CV-FRQ ist" },
      {
        type: "p",
        text: "Der FRQ beschreibt den CV-FRQ als Weg, Ihre Expertise und relevanten Kompetenzen über ein breites Spektrum von Beiträgen zu zeigen, nicht nur über Publikationen. Sie schreiben ihn in der Word-Vorlage des FRQ und fügen ihn als PDF dem FRQnet-Antragsformular bei. Das Formular selbst erhebt Ausbildung, Beschäftigungsgeschichte, Sprachen und aktuelle Position, deshalb wiederholt der Lebenslauf sie nicht. Die drei Abschnitte kommen immer in dieser Reihenfolge:",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate (in der englischen Vorlage Section 1: Background and skills). Wie Ihr akademischer, beruflicher oder persönlicher Hintergrund Sie darauf vorbereitet, die vorgeschlagene Forschung durchzuführen und die Kriterien des Programms zu erfüllen.",
          "Deuxième section : Contributions et expériences les plus importantes (Section 2: Most significant contributions and experiences). Bis zu zehn Beiträge oder Erfahrungen, jeweils mit Wirkung, Ihrer Rolle, Zeitraum und Zielgruppe.",
          "Troisième section : Activités de supervision et de mentorat (Section 3: Supervisory and mentorship activities). Wie Sie Studierende, Postdocs und hochqualifiziertes Personal ausgebildet und begleitet haben.",
        ],
      },
      { type: "h2", id: "rules", text: "Die Regeln" },
      {
        type: "ul",
        items: [
          "Höchstens sechs Seiten auf Französisch, fünf auf Englisch. Die beiden Vorlagen unterscheiden sich nur in Sprache und Länge.",
          "Verwenden Sie die Word-Vorlage des FRQ, halten Sie die FRQnet-Darstellungsstandards für Anhänge ein und laden Sie ein PDF hoch.",
          "Es gibt kein Wortlimit. Der FRQ empfiehlt Unterabschnitte, die den Bewertungskriterien des Programms folgen. Aufzählungspunkte und Tabellen sind erlaubt.",
          "Trifft ein Abschnitt auf Sie nicht zu, schreiben Sie s/o (sans objet), in der englischen Vorlage N/A.",
          "Lassen Sie sensible persönliche Angaben (medizinisch, finanziell oder sonst privat), Fotos und alles weg, was Ihnen oder anderen schaden könnte.",
          "Lesen Sie die Ziele und Bewertungskriterien des Programms, bevor Sie schreiben. Alles im Lebenslauf soll darauf antworten.",
        ],
      },
      { type: "h2", id: "official-documents", text: "Offizielle Dokumente" },
      FRQ_LINKS_EN,
      { type: "h2", id: "section-1", text: "Abschnitt 1: Hintergrund und Kompetenzen" },
      {
        type: "p",
        text: "Hier gehören die Expertise oder Erfahrung hin, die zeigt, dass Sie das Projekt durchführen können, Aktivitäten, die Führungsstärke belegen, frühere Kooperationen oder Ergebnisse zum Forschungsthema, die konkreten Wirkungen Ihrer bisherigen Arbeit, Preise und Stipendien sowie Kompetenzen aus persönlicher Erfahrung. Schreiben Sie ihn für das Programm, das vor Ihnen liegt. Die Gutachtenden lesen diesen Abschnitt gegen die Kriterien der Ausschreibung, also übernehmen Sie deren Reihenfolge und Vokabular.",
      },
      { type: "h2", id: "section-2", text: "Abschnitt 2: bis zu zehn Beiträge" },
      {
        type: "p",
        text: "Dieser Abschnitt trägt das Dokument. Ein Beitrag muss keine einzelne Publikation sein. Er kann ein Bündel eng verwandter Ergebnisse sein, etwa ein Aufsatz, der Datensatz dahinter und die Leitlinie, die ihn genutzt hat. Die Liste des FRQ, was zählt, ist lang: Publikationen jeder Art, Wissensmobilisierung wie Medienarbeit, Podcasts und öffentliche Vorträge, Begutachtung und Bewertung, Gemeinwesenarbeit, künstlerisches Schaffen, Dateninfrastrukturen und Kohorten, geistiges Eigentum, Tagungsorganisation, Partnerschaften, Stellungnahmen, die eine Politik oder einen Praxisstandard geprägt haben, Software und Werkzeuge sowie offene Wissenschaft im Sinne der UNESCO. Geben Sie für jeden Beitrag an:",
      },
      {
        type: "ul",
        items: [
          "das Datum oder den Zeitraum;",
          "die Zielgruppe: A für die wissenschaftliche Gemeinschaft, B für die Praxisgemeinschaft, C für die breite Öffentlichkeit, ein Buchstabe oder mehrere;",
          "Ihre Rolle, klar benannt;",
          "Wirkung, Bedeutung und Wert der Arbeit, mit etwas, das die Lesenden prüfen können, etwa einer DOI, einem Bericht, einem Registereintrag oder einer Politik, die sie zitiert.",
        ],
      },
      {
        type: "p",
        text: "Für Publikationen verlangt der FRQ den APA-Stil oder einen anderen in Ihrer Disziplin anerkannten Standard. Setzen Sie Ihren eigenen Namen fett, ebenso die Namen der Mitforschenden im Antrag. Fügen Sie hinter dem Namen jeder Person, die Sie betreut haben, ein Sternchen an (Nom, Prénom*), von Studierenden im Grundstudium bis zu Postdocs und hochqualifiziertem Personal. Wiederholen Sie hier nicht, was Sie im ersten Abschnitt gesagt haben.",
      },
      { type: "h2", id: "section-3", text: "Abschnitt 3: Betreuung und Mentoring" },
      {
        type: "p",
        text: "Beschreiben Sie, wie Sie die nächste Generation ausgebildet haben: Betreuung von College- und Universitätsstudierenden aller Stufen, von Postdocs und hochqualifiziertem Personal; Lehre und Schulungsworkshops; formelles oder informelles Mentoring von Nachwuchsforschenden, Kolleginnen und Kollegen und Partnern; Outreach, der Studierende an die Forschung heranführt; Schulungen in Methoden oder Wissenssystemen, indigenes Wissen eingeschlossen; und Arbeit an sicheren, gerechten und inklusiven Forschungsumgebungen. Eine Karriere außerhalb der Wissenschaft zählt so viel wie eine innerhalb.",
      },
      { type: "h2", id: "evidence", text: "Wirkung zeigen, ohne sie aufzublähen" },
      {
        type: "p",
        text: 'Wer neu bei narrativen Lebensläufen ist, fragt, wie man beweist, dass ein Beitrag von Bedeutung war, und Gutachtende, die das Format neu kennen, fragen dasselbe. Eine narrative Aussage wird durch etwas geprüft, dem die Lesenden folgen können, nicht durch eine Zahl. Nehmen Sie den Satz "dieser Aufsatz dokumentierte das Signal, das die Behörde 2023 zur Änderung der Produktmonographie veranlasste". Lesende können ihn prüfen, wenn der Aufsatz eine DOI hat, die Monographie ein Datum trägt und die Entscheidung der Behörde öffentlich ist. Eine Zitationszahl oder ein h-Index sagt nichts über diese Kette, und die FRQ-Anweisungen verlangen sie nie.',
      },
      {
        type: "p",
        text: "Schreiben Sie also die Kette: das Ergebnis, was es verändert hat und wo diese Veränderung festgehalten ist, mit den Identifikatoren. Wo ein Beitrag Praktiker oder die Öffentlichkeit erreicht hat (Zielgruppen B und C), sagen Sie, worüber: eine klinische Leitlinie, ein Ministeriumsbericht, ein Weiterbildungsprogramm, eine Interviewreihe. Wo Sie eine Wirkung nicht dokumentieren können, beschreiben Sie die Bedeutung der Arbeit und Ihre Rolle darin und hören dort auf. Gutachtende unterscheiden eine dokumentierte Wirkung von einer behaupteten.",
      },
      { type: "h2", id: "with-sigmacv", text: "Vorbereitung mit SigmaCV" },
      {
        type: "p",
        text: "SigmaCV erstellt Ihren vollständigen akademischen Lebenslauf aus offenen Forschungsdaten (ORCID, OpenAlex, Crossref, DataCite und weitere) und lässt Sie Förderer-Layouts reversibel darauf anwenden. Zwei dieser Layouts sind der CV-FRQ auf Französisch und auf Englisch. Jedes zeigt die drei FRQ-Abschnitte unter den Überschriften des FRQ und blendet alles andere aus, da das FRQnet-Formular den Rest erhebt. Sie schreiben in jedem Abschnitt Prosa, und eine Aussage kann über einen Belegverweis auf einen Eintrag Ihres Verzeichnisses zeigen, sodass die Lesenden bei der DOI landen.",
      },
      {
        type: "ol",
        items: [
          "Melden Sie sich mit ORCID an und lassen Sie das Verzeichnis aufbauen. Markieren Sie, was nicht von Ihnen ist, und ergänzen Sie fehlende Arbeiten per DOI.",
          "Wenden Sie das CV-FRQ-Layout, Französisch oder Englisch, aus der Auswahl der CV-Modelle an. Das bisherige Layout wird als Voreinstellung gespeichert.",
          "Schreiben Sie die drei Abschnitte. Unter jedem listet das Belegpanel Ihre Publikationen, Datensätze, Betreuungen und weiteren Ergebnisse auf, die Sie per Belegverweis zitieren können. Behalten Sie Zeichenzahl und Seitenzahl gegenüber dem Limit von sechs bzw. fünf Seiten im Blick.",
          "Exportieren Sie als DOCX, fügen Sie die Abschnitte in die Word-Vorlage des FRQ ein, prüfen Sie die Darstellungsregeln und fügen Sie das PDF in FRQnet bei.",
        ],
      },
      {
        type: "cta",
        label: "Lebenslauf aus Ihrem ORCID-Verzeichnis erstellen, kostenlos",
        href: "/",
      },
    ],
    faq: [
      {
        q: "Ersetzt der CV-FRQ den Canadian Common CV in den FRQ-Wettbewerben?",
        a: "Für die Programme, die ihn übernommen haben, ja. Der FRQ verlangt den CV-FRQ als PDF-Anhang in FRQnet. Die Einführung erfolgte Programm für Programm, prüfen Sie also die Regeln des Programms, für das Sie sich bewerben.",
      },
      {
        q: "Ist der CV-FRQ dasselbe wie der föderale Tri-agency CV?",
        a: "Nein. Die beiden Dokumente haben denselben Geist, eine Erzählung mit wenigen bedeutenden Beiträgen und einem Abschnitt zum Mentoring, aber der Tri-agency CV gehört CIHR, NSERC und SSHRC. Er hat eine eigene Vorlage und einen eigenen Zeitplan: NSERCs Wettbewerbe 2027 und CIHRs Project Grant frühestens im Herbst 2027. Bereiten Sie jeden für den Förderer vor, der ihn verlangt.",
      },
      {
        q: "Soll ich Zitationszahlen oder meinen h-Index angeben?",
        a: "Die FRQ-Anweisungen verlangen sie nicht, und sie zeigen nicht, wonach der CV-FRQ beurteilt wird, nämlich Wirkung, Bedeutung und Wert eines Beitrags und Ihre Rolle darin. Dokumentieren Sie stattdessen die Wirkung, die ein Beitrag hatte, mit Identifikatoren, denen die Lesenden folgen können.",
      },
      {
        q: "Kann ein Beitrag etwas anderes als eine Publikation sein?",
        a: "Ja. Die Liste des FRQ ist mit Absicht breit. Wissensmobilisierung, politische Stellungnahmen, Dateninfrastrukturen, Software, künstlerisches Schaffen, Partnerschaften, Tagungsorganisation, geistiges Eigentum, Gemeinwesenarbeit und offene Wissenschaft zählen alle, einzeln oder gebündelt mit verwandten Ergebnissen.",
      },
    ],
  },
  "ja-JP": {
    title: "FRQ ナラティブ CV（CV-FRQ）：準備のしかた",
    description:
      "Fonds de recherche du Québec が CV descriptif で求めるもの：3 つのセクション、フランス語 6 ページまたは英語 5 ページ、対象と成果を付した最多 10 件の貢献。そして、すでにある研究記録からそれを書く方法。",
    blocks: [
      {
        type: "p",
        text: "2025-2026 年度の公募から、Fonds de recherche du Québec（FRQ）は Canadian Common CV に代えて、CV descriptif または CV-FRQ と呼ばれるナラティブ CV の提出を申請者に求めています。文書は短いものです。3 つの固定されたセクションから成り、審査委員会は列挙の量ではなく、ある研究が何を変えたとあなたが述べるかを読みます。本ガイドは FRQ の指示をセクションごとに見ていき、公式文書へのリンクを示し、それからすでにある記録から CV を書く方法を説明します。",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "CV-FRQ とは何か" },
      {
        type: "p",
        text: "FRQ は CV-FRQ を、論文だけでなく幅広い貢献を通じて専門性と関連する能力を示す手段として位置づけています。FRQ の Word テンプレートで作成し、FRQnet 申請フォームに PDF として添付します。フォーム自体が学歴、職歴、言語、現職を収集するので、CV ではそれらを繰り返しません。3 つのセクションは常にこの順序です：",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate（英語テンプレートでは Section 1: Background and skills）。学術的・職業的・個人的な経歴が、提案する研究の遂行とプログラムの基準の充足にどう備えているか。",
          "Deuxième section : Contributions et expériences les plus importantes（Section 2: Most significant contributions and experiences）。最多 10 件の貢献または経験。それぞれに成果、自身の役割、期間、対象を記載。",
          "Troisième section : Activités de supervision et de mentorat（Section 3: Supervisory and mentorship activities）。学生、ポストドクター、高度専門人材をどう育成し指導してきたか。",
        ],
      },
      { type: "h2", id: "rules", text: "規則" },
      {
        type: "ul",
        items: [
          "フランス語では最大 6 ページ、英語では 5 ページ。2 つのテンプレートは言語と長さだけが異なります。",
          "FRQ の Word テンプレートを使い、FRQnet の添付ファイル表記基準に従い、PDF をアップロードします。",
          "語数制限はありません。FRQ はプログラムの評価基準に沿った小節を勧めています。箇条書きと表は使えます。",
          "該当しないセクションには s/o（sans objet）、英語テンプレートでは N/A と書きます。",
          "機微な個人情報（医療、財務、その他私的な情報）、写真、あなたや他者に害を及ぼしうる内容は入れません。",
          "書く前にプログラムの目的と評価基準を読んでください。CV の内容はすべてそれに答えるものであるべきです。",
        ],
      },
      { type: "h2", id: "official-documents", text: "公式文書" },
      FRQ_LINKS_EN,
      { type: "h2", id: "section-1", text: "セクション 1：経歴と能力" },
      {
        type: "p",
        text: "ここには、プロジェクトを遂行できることを示す専門性や経験、リーダーシップを示す活動、研究テーマに関する過去の共同研究や成果、これまでの研究の具体的な効果、賞と奨学金、個人的経験から得た能力を書きます。目の前のプログラムに向けて書いてください。評価者は公募の基準と照らしてこのセクションを読むので、その順序と語彙を使います。",
      },
      { type: "h2", id: "section-2", text: "セクション 2：最多 10 件の貢献" },
      {
        type: "p",
        text: "このセクションが文書の柱です。貢献は 1 本の論文である必要はありません。密接に関連する成果の集合、たとえば論文とその基盤データセットとそれを用いたガイドラインでもかまいません。FRQ が挙げる該当項目のリストは長いものです：あらゆる種類の出版物、メディア出演やポッドキャストや公開講演といった知識動員、審査と評価の仕事、コミュニティへの貢献、芸術創作、データ基盤とコホート、知的財産、学会の運営、パートナーシップ、政策や実践基準を形づくった意見書、ソフトウェアとツール、そして UNESCO の意味でのオープンサイエンス。各貢献について次を示します：",
      },
      {
        type: "ul",
        items: [
          "日付または期間；",
          "対象：A は学術コミュニティ、B は実務コミュニティ、C は一般市民、1 文字または複数；",
          "あなたの役割を率直に；",
          "その研究の成果・重要性・価値を、DOI、報告書、登録記録、それを引用する政策など、読者が確認できるものとともに。",
        ],
      },
      {
        type: "p",
        text: "出版物については、FRQ は APA スタイルまたは自身の分野で認められた他の標準を求めています。自身の氏名を太字にし、申請書に記載された共同研究者の氏名も太字にします。指導した各人物の氏名の後にアスタリスクを付します（Nom, Prénom*）。学部生からポストドクター、高度専門人材までが対象です。第 1 セクションで述べたことをここで繰り返さないでください。",
      },
      { type: "h2", id: "section-3", text: "セクション 3：指導とメンタリング" },
      {
        type: "p",
        text: "次世代をどう育成してきたかを記述します：あらゆる段階のカレッジ・大学の学生、ポストドクター、高度専門人材の指導；教育と研修ワークショップ；キャリア初期の研究者、同僚、パートナーへの公式・非公式のメンタリング；学生を研究に引き込むアウトリーチ；先住民の知識を含む方法論や知識体系の研修；安全で公正かつ包摂的な研究環境づくり。アカデミア外のキャリアはアカデミア内のキャリアと同じだけ評価されます。",
      },
      { type: "h2", id: "evidence", text: "誇張せずに成果を示す" },
      {
        type: "p",
        text: "ナラティブ CV に初めて取り組む申請者は、ある貢献が重要だったことをどう証明するかを尋ね、この形式に初めて触れる評価者も同じことを尋ねます。ナラティブな主張は、数字ではなく、読者がたどれるもので確認されます。「この論文は、規制当局が 2023 年に製品モノグラフを改訂するきっかけとなったシグナルを記録した」という文を例にとりましょう。論文に DOI があり、モノグラフに日付があり、規制当局の決定が公開されていれば、読者はそれを検証できます。被引用数や h 指数はこの連鎖について何も語らず、FRQ の指示もそれらを求めていません。",
      },
      {
        type: "p",
        text: "だから連鎖を書いてください：成果、それが何を変えたか、その変化がどこに記録されているか、そして識別子。貢献が実務者や市民（対象 B と C）に届いた場合は、何を通じてかを述べます：臨床ガイドライン、省庁の報告書、研修プログラム、一連のインタビュー。効果を文書化できない場合は、その研究の重要性と自身の役割を記述し、そこで止めます。評価者は、記録された効果と主張された効果を見分けます。",
      },
      { type: "h2", id: "with-sigmacv", text: "SigmaCV で準備する" },
      {
        type: "p",
        text: "SigmaCV はオープンな研究データ（ORCID、OpenAlex、Crossref、DataCite など）から完全な学術 CV を構築し、助成機関のレイアウトを可逆的に適用できます。そのうち 2 つがフランス語と英語の CV-FRQ です。それぞれ FRQ の 3 セクションを FRQ 自身の見出しの下に表示し、他はすべて非表示にします。残りは FRQnet フォームが収集するからです。各セクションに散文を書き、主張は証拠リンクで記録内の項目を指すことができるので、読者は DOI にたどり着きます。",
      },
      {
        type: "ol",
        items: [
          "ORCID でサインインして記録を構築させます。自分のものでない項目にマークを付け、欠けている研究を DOI で追加します。",
          "CV モデルの選択から CV-FRQ レイアウト（フランス語または英語）を適用します。以前のレイアウトはプリセットとして保存されます。",
          "3 つのセクションを書きます。各セクションの下の証拠パネルに、証拠リンクで引用できる出版物、データセット、指導記録、その他の成果が一覧されます。6 ページまたは 5 ページの上限に対して文字数とページ数に注意してください。",
          "DOCX にエクスポートし、各セクションを FRQ の Word テンプレートに貼り付け、表記規則を確認し、FRQnet に PDF を添付します。",
        ],
      },
      { type: "cta", label: "ORCID 記録から CV を構築、無料", href: "/" },
    ],
    faq: [
      {
        q: "FRQ の公募では CV-FRQ が Canadian Common CV に代わるのですか？",
        a: "採用したプログラムについては、はい。FRQ は FRQnet で CV-FRQ を PDF 添付として求めます。採用はプログラムごとに進んだので、応募するプログラムの規則を確認してください。",
      },
      {
        q: "CV-FRQ は連邦の Tri-agency CV と同じものですか？",
        a: "いいえ。2 つの文書は同じ精神、すなわち少数の重要な貢献とメンタリングのセクションを持つ物語形式を共有しますが、Tri-agency CV は CIHR、NSERC、SSHRC のものです。独自のテンプレートと独自のスケジュールがあります：NSERC の 2027 年公募、CIHR の Project Grant は早くとも 2027 年秋。それを求める助成機関ごとに準備してください。",
      },
      {
        q: "被引用数や h 指数を含めるべきですか？",
        a: "FRQ の指示はそれらを求めておらず、CV-FRQ が評価するもの、すなわち貢献の成果・重要性・価値とそこでのあなたの役割を示しません。代わりに、貢献がもたらした効果を、読者がたどれる識別子とともに記録してください。",
      },
      {
        q: "貢献は出版物以外のものでもよいですか？",
        a: "はい。FRQ のリストは意図的に幅広いものです。知識動員、政策意見書、データ基盤、ソフトウェア、芸術創作、パートナーシップ、学会運営、知的財産、コミュニティへの貢献、オープンサイエンスはすべて、単独でも関連成果とまとめてでも該当します。",
      },
    ],
  },
  "pt-BR": {
    title: "O CV narrativo do FRQ (CV-FRQ): como prepará-lo",
    description:
      "O que o Fonds de recherche du Québec pede em seu CV descriptif: três seções, seis páginas em francês ou cinco em inglês, até dez contribuições com um público e um impacto para cada uma. E como escrevê-lo a partir do registro de pesquisa que você já tem.",
    blocks: [
      {
        type: "p",
        text: "Desde seus editais 2025-2026, o Fonds de recherche du Québec (FRQ) pede aos candidatos um CV narrativo, chamado CV descriptif ou CV-FRQ, no lugar do Canadian Common CV. O documento é curto. Tem três seções fixas, e o comitê o lê pelo que você diz que um trabalho mudou, não por quanto você lista. Este guia percorre as instruções do FRQ seção por seção, traz os links dos documentos oficiais e depois explica como escrever o CV a partir do registro que você já tem.",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "O que é o CV-FRQ" },
      {
        type: "p",
        text: "O FRQ apresenta o CV-FRQ como uma forma de mostrar sua expertise e suas competências relevantes por meio de uma ampla gama de contribuições, não só publicações. Você o escreve no modelo Word do FRQ e o anexa em PDF ao formulário de pedido FRQnet. O próprio formulário recolhe sua formação, histórico de empregos, idiomas e cargo atual, então o CV não os repete. As três seções vêm sempre nesta ordem:",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate (no modelo em inglês, Section 1: Background and skills). Como sua trajetória acadêmica, profissional ou pessoal o prepara para realizar a pesquisa proposta e atender aos critérios do programa.",
          "Deuxième section : Contributions et expériences les plus importantes (Section 2: Most significant contributions and experiences). Até dez contribuições ou experiências, cada uma com seu impacto, seu papel, seu período e seu público.",
          "Troisième section : Activités de supervision et de mentorat (Section 3: Supervisory and mentorship activities). Como você formou e orientou estudantes, pesquisadores de pós-doutorado e pessoal altamente qualificado.",
        ],
      },
      { type: "h2", id: "rules", text: "As regras" },
      {
        type: "ul",
        items: [
          "No máximo seis páginas em francês, cinco em inglês. Os dois modelos diferem apenas no idioma e na extensão.",
          "Use o modelo Word do FRQ, siga as normas de apresentação do FRQnet para anexos e envie um PDF.",
          "Não há limite de palavras. O FRQ sugere subseções que sigam os critérios de avaliação do programa. Marcadores e tabelas são permitidos.",
          "Se uma seção não se aplica a você, escreva s/o (sans objet), ou N/A no modelo em inglês.",
          "Deixe de fora informações pessoais sensíveis (médicas, financeiras ou privadas), fotos e qualquer coisa que possa prejudicar você ou outra pessoa.",
          "Leia os objetivos e os critérios de avaliação do programa antes de escrever. Tudo no CV deve responder a eles.",
        ],
      },
      { type: "h2", id: "official-documents", text: "Documentos oficiais" },
      FRQ_LINKS_EN,
      { type: "h2", id: "section-1", text: "Seção 1: trajetória e competências" },
      {
        type: "p",
        text: "Coloque aqui a expertise ou experiência que mostra que você pode realizar o projeto, as atividades que mostram liderança, colaborações ou resultados anteriores sobre o tema de pesquisa, os efeitos concretos do seu trabalho passado, prêmios e bolsas, e competências adquiridas por experiência pessoal. Escreva-a para o programa à sua frente. O avaliador lê esta seção à luz dos critérios do edital, então use a ordem e o vocabulário deles.",
      },
      { type: "h2", id: "section-2", text: "Seção 2: até dez contribuições" },
      {
        type: "p",
        text: "Esta seção sustenta o documento. Uma contribuição não precisa ser uma única publicação. Pode ser um conjunto de resultados estreitamente relacionados, por exemplo um artigo, o conjunto de dados por trás dele e a diretriz que o utilizou. A lista do FRQ do que conta é longa: publicações de todo tipo, mobilização do conhecimento como trabalho com a mídia, podcasts e palestras públicas, avaliação e revisão, serviço à comunidade, criação artística, infraestruturas de dados e coortes, propriedade intelectual, organização de congressos, parcerias, pareceres que moldaram uma política ou uma norma de prática, software e ferramentas, e ciência aberta no sentido da UNESCO. Para cada contribuição, indique:",
      },
      {
        type: "ul",
        items: [
          "a data ou o período;",
          "o público: A para a comunidade acadêmica, B para a comunidade de prática, C para o público em geral, uma letra ou várias;",
          "seu papel, dito com clareza;",
          "o impacto, a importância e o valor do trabalho, com algo que o leitor possa verificar, como um DOI, um relatório, um registro ou uma política que o cite.",
        ],
      },
      {
        type: "p",
        text: "Para publicações, o FRQ pede o estilo APA ou outra norma reconhecida em sua disciplina. Coloque seu próprio nome em negrito, e os nomes dos copesquisadores do pedido. Acrescente um asterisco após o nome de cada pessoa que você supervisionou (Nom, Prénom*), de estudantes de graduação a pesquisadores de pós-doutorado e pessoal altamente qualificado. Não repita aqui o que você disse na primeira seção.",
      },
      { type: "h2", id: "section-3", text: "Seção 3: supervisão e mentoria" },
      {
        type: "p",
        text: "Descreva como você formou a próxima geração: supervisão de estudantes de colégio e universidade em todos os níveis, de pesquisadores de pós-doutorado e de pessoal altamente qualificado; ensino e oficinas de formação; mentoria formal ou informal de pesquisadores em início de carreira, colegas e parceiros; divulgação que aproxima estudantes da pesquisa; formação em métodos ou sistemas de conhecimento, incluindo saberes indígenas; e trabalho por ambientes de pesquisa seguros, equitativos e inclusivos. Uma carreira fora da academia conta tanto quanto uma dentro.",
      },
      { type: "h2", id: "evidence", text: "Mostrar o impacto sem inflá-lo" },
      {
        type: "p",
        text: 'Candidatos novos em CVs narrativos perguntam como provar que uma contribuição importou, e avaliadores novos no formato perguntam a mesma coisa. Uma afirmação narrativa se verifica com algo que o leitor pode seguir, não com um número. Tome a frase "este artigo documentou o sinal que levou o regulador a alterar a monografia do produto em 2023". Um leitor pode verificá-la se o artigo tem DOI, a monografia tem data e a decisão do regulador é pública. Uma contagem de citações ou um índice h não diz nada sobre essa cadeia, e as instruções do FRQ nunca a pedem.',
      },
      {
        type: "p",
        text: "Então escreva a cadeia: o resultado, o que ele mudou e onde essa mudança está registrada, com os identificadores. Onde uma contribuição chegou a profissionais ou ao público (públicos B e C), diga por meio de quê: uma diretriz clínica, um relatório ministerial, um programa de formação, uma série de entrevistas. Onde não puder documentar um efeito, descreva a importância do trabalho e seu papel nele, e pare aí. Um avaliador distingue um efeito documentado de um efeito afirmado.",
      },
      { type: "h2", id: "with-sigmacv", text: "Preparando-o com o SigmaCV" },
      {
        type: "p",
        text: "O SigmaCV constrói seu CV acadêmico completo a partir de dados abertos de pesquisa (ORCID, OpenAlex, Crossref, DataCite e outros) e permite aplicar layouts de financiadores de forma reversível. Dois desses layouts são o CV-FRQ em francês e em inglês. Cada um mostra as três seções do FRQ sob os títulos do próprio FRQ e oculta todo o resto, já que o formulário FRQnet recolhe o restante. Você escreve em prosa em cada seção, e uma afirmação pode apontar para uma entrada do seu registro por um link de evidência, de modo que o leitor chega ao DOI.",
      },
      {
        type: "ol",
        items: [
          "Entre com o ORCID e deixe o registro se construir. Marque o que não é seu e adicione por DOI o que estiver faltando.",
          "Aplique o layout CV-FRQ, francês ou inglês, no seletor de modelos de CV. O layout anterior é salvo como predefinição.",
          "Escreva as três seções. Sob cada uma, o painel de evidências lista suas publicações, conjuntos de dados, registros de supervisão e outros resultados que você pode citar com um link de evidência. Acompanhe a contagem de caracteres e de páginas em relação ao limite de seis ou cinco.",
          "Exporte para DOCX, cole as seções no modelo Word do FRQ, verifique as normas de apresentação e anexe o PDF no FRQnet.",
        ],
      },
      { type: "cta", label: "Construa seu CV a partir do seu registro ORCID, grátis", href: "/" },
    ],
    faq: [
      {
        q: "O CV-FRQ substitui o Canadian Common CV nos editais do FRQ?",
        a: "Para os programas que o adotaram, sim. O FRQ pede o CV-FRQ como anexo PDF no FRQnet. A adoção foi feita programa por programa, então verifique as regras do programa ao qual você se candidata.",
      },
      {
        q: "O CV-FRQ é o mesmo que o Tri-agency CV federal?",
        a: "Não. Os dois documentos têm o mesmo espírito, uma narrativa com poucas contribuições significativas e uma seção de mentoria, mas o Tri-agency CV pertence a CIHR, NSERC e SSHRC. Ele tem seu próprio modelo e seu próprio cronograma: os editais 2027 da NSERC e o Project Grant do CIHR não antes do outono de 2027. Prepare cada um para o financiador que o pede.",
      },
      {
        q: "Devo incluir contagens de citações ou meu índice h?",
        a: "As instruções do FRQ não os pedem, e eles não mostram o que o CV-FRQ avalia, que é o impacto, a importância e o valor de uma contribuição e seu papel nela. Documente em vez disso o efeito que a contribuição teve, com identificadores que o leitor possa seguir.",
      },
      {
        q: "Uma contribuição pode ser algo diferente de uma publicação?",
        a: "Sim. A lista do FRQ é ampla de propósito. Mobilização do conhecimento, pareceres de política, infraestruturas de dados, software, criação artística, parcerias, organização de congressos, propriedade intelectual, serviço à comunidade e ciência aberta contam, isoladamente ou agrupadas com resultados relacionados.",
      },
    ],
  },
  "it-IT": {
    title: "Il CV narrativo del FRQ (CV-FRQ): come prepararlo",
    description:
      "Cosa chiede il Fonds de recherche du Québec nel suo CV descriptif: tre sezioni, sei pagine in francese o cinque in inglese, fino a dieci contributi con un pubblico e un impatto per ciascuno. E come scriverlo a partire dal registro di ricerca che già possiedi.",
    blocks: [
      {
        type: "p",
        text: "Dai bandi 2025-2026, il Fonds de recherche du Québec (FRQ) chiede ai candidati un CV narrativo, chiamato CV descriptif o CV-FRQ, al posto del Canadian Common CV. Il documento è breve. Ha tre sezioni fisse, e la commissione lo legge per ciò che dichiari che un lavoro ha cambiato, non per quanto elenchi. Questa guida ripercorre le istruzioni del FRQ sezione per sezione, collega i documenti ufficiali e poi spiega come scrivere il CV a partire dal registro che già hai.",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "Che cos'è il CV-FRQ" },
      {
        type: "p",
        text: "Il FRQ presenta il CV-FRQ come un modo per mostrare la tua competenza e le tue abilità pertinenti attraverso un'ampia gamma di contributi, non solo pubblicazioni. Lo scrivi nel modello Word del FRQ e lo alleghi in PDF al modulo di domanda FRQnet. Il modulo stesso raccoglie formazione, storia lavorativa, lingue e posizione attuale, quindi il CV non li ripete. Le tre sezioni vengono sempre in quest'ordine:",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate (nel modello inglese, Section 1: Background and skills). Come il tuo percorso accademico, professionale o personale ti prepara a realizzare la ricerca proposta e a soddisfare i criteri del programma.",
          "Deuxième section : Contributions et expériences les plus importantes (Section 2: Most significant contributions and experiences). Fino a dieci contributi o esperienze, ciascuno con il suo impatto, il tuo ruolo, il suo periodo e il suo pubblico.",
          "Troisième section : Activités de supervision et de mentorat (Section 3: Supervisory and mentorship activities). Come hai formato e accompagnato studenti, ricercatori post-dottorato e personale altamente qualificato.",
        ],
      },
      { type: "h2", id: "rules", text: "Le regole" },
      {
        type: "ul",
        items: [
          "Al massimo sei pagine in francese, cinque in inglese. I due modelli differiscono solo per lingua e lunghezza.",
          "Usa il modello Word del FRQ, segui gli standard di presentazione FRQnet per gli allegati e carica un PDF.",
          "Non c'è limite di parole. Il FRQ suggerisce sottosezioni che seguano i criteri di valutazione del programma. Elenchi puntati e tabelle sono ammessi.",
          "Se una sezione non ti riguarda, scrivi s/o (sans objet), oppure N/A nel modello inglese.",
          "Tralascia le informazioni personali sensibili (mediche, finanziarie o comunque private), le foto e qualunque cosa possa nuocere a te o ad altri.",
          "Leggi gli obiettivi e i criteri di valutazione del programma prima di scrivere. Tutto ciò che metti nel CV deve rispondere a essi.",
        ],
      },
      { type: "h2", id: "official-documents", text: "Documenti ufficiali" },
      FRQ_LINKS_EN,
      { type: "h2", id: "section-1", text: "Sezione 1: percorso e competenze" },
      {
        type: "p",
        text: "Metti qui la competenza o l'esperienza che dimostra che puoi realizzare il progetto, le attività che mostrano leadership, le collaborazioni o i risultati precedenti sul tema di ricerca, gli effetti concreti del tuo lavoro passato, premi e borse, e le abilità acquisite con l'esperienza personale. Scrivila per il programma che hai davanti. Il valutatore legge questa sezione alla luce dei criteri del bando, quindi usa il loro ordine e il loro vocabolario.",
      },
      { type: "h2", id: "section-2", text: "Sezione 2: fino a dieci contributi" },
      {
        type: "p",
        text: "Questa sezione regge il documento. Un contributo non deve essere una sola pubblicazione. Può essere un insieme di risultati strettamente collegati, per esempio un articolo, il dataset che lo sostiene e la linea guida che lo ha utilizzato. L'elenco del FRQ di ciò che conta è lungo: pubblicazioni di ogni tipo, mobilitazione della conoscenza come lavoro con i media, podcast e conferenze pubbliche, valutazione e revisione, servizio alla comunità, creazione artistica, infrastrutture di dati e coorti, proprietà intellettuale, organizzazione di convegni, partenariati, memorie che hanno orientato una politica o uno standard di pratica, software e strumenti, e scienza aperta nel senso dell'UNESCO. Per ciascun contributo indica:",
      },
      {
        type: "ul",
        items: [
          "la data o il periodo;",
          "il pubblico: A per la comunità accademica, B per la comunità di pratica, C per il pubblico generale, una lettera o più;",
          "il tuo ruolo, detto con chiarezza;",
          "l'impatto, la rilevanza e il valore del lavoro, con qualcosa che il lettore possa verificare, come un DOI, un rapporto, una voce di registro o una politica che lo citi.",
        ],
      },
      {
        type: "p",
        text: "Per le pubblicazioni il FRQ chiede lo stile APA o un altro standard riconosciuto nella tua disciplina. Metti il tuo nome in grassetto, e i nomi dei co-ricercatori indicati nella domanda. Aggiungi un asterisco dopo il nome di ogni persona che hai supervisionato (Nom, Prénom*), dagli studenti di primo livello ai ricercatori post-dottorato e al personale altamente qualificato. Non ripetere qui ciò che hai detto nella prima sezione.",
      },
      { type: "h2", id: "section-3", text: "Sezione 3: supervisione e mentoring" },
      {
        type: "p",
        text: "Descrivi come hai formato la prossima generazione: supervisione di studenti di college e università a ogni livello, di ricercatori post-dottorato e di personale altamente qualificato; insegnamento e laboratori di formazione; mentoring formale o informale di ricercatori a inizio carriera, colleghi e partner; divulgazione che avvicina gli studenti alla ricerca; formazione su metodi o sistemi di conoscenza, comprese le conoscenze indigene; e lavoro per ambienti di ricerca sicuri, equi e inclusivi. Una carriera fuori dall'accademia conta quanto una al suo interno.",
      },
      { type: "h2", id: "evidence", text: "Mostrare l'impatto senza gonfiarlo" },
      {
        type: "p",
        text: "I candidati nuovi ai CV narrativi chiedono come dimostrare che un contributo ha contato, e i valutatori nuovi al formato chiedono la stessa cosa. Un'affermazione narrativa si verifica con qualcosa che il lettore può seguire, non con un numero. Prendi la frase \"questo articolo ha documentato il segnale che ha portato l'autorità regolatoria a modificare la monografia del prodotto nel 2023\". Un lettore può verificarla se l'articolo ha un DOI, la monografia ha una data e la decisione dell'autorità è pubblica. Un conteggio di citazioni o un h-index non dice nulla di quella catena, e le istruzioni del FRQ non li chiedono mai.",
      },
      {
        type: "p",
        text: "Scrivi quindi la catena: il risultato, ciò che ha cambiato e dove quel cambiamento è registrato, con gli identificatori. Dove un contributo ha raggiunto professionisti o pubblico (pubblici B e C), di' attraverso cosa: una linea guida clinica, un rapporto ministeriale, un programma di formazione, una serie di interviste. Dove non puoi documentare un effetto, descrivi la rilevanza del lavoro e il tuo ruolo, e fermati lì. Un valutatore distingue un effetto documentato da uno affermato.",
      },
      { type: "h2", id: "with-sigmacv", text: "Prepararlo con SigmaCV" },
      {
        type: "p",
        text: "SigmaCV costruisce il tuo CV accademico completo a partire da dati di ricerca aperti (ORCID, OpenAlex, Crossref, DataCite e altri) e ti permette di applicarvi in modo reversibile i layout dei finanziatori. Due di questi layout sono il CV-FRQ in francese e in inglese. Ciascuno mostra le tre sezioni del FRQ sotto le intestazioni del FRQ stesso e nasconde tutto il resto, dato che il modulo FRQnet raccoglie il resto. Scrivi in prosa in ogni sezione, e un'affermazione può puntare a una voce del tuo registro con un collegamento di evidenza, così il lettore arriva al DOI.",
      },
      {
        type: "ol",
        items: [
          "Accedi con ORCID e lascia che il registro si costruisca. Segnala ciò che non è tuo e aggiungi per DOI ciò che manca.",
          "Applica il layout CV-FRQ, francese o inglese, dal selettore dei modelli di CV. Il layout precedente viene salvato come preset.",
          "Scrivi le tre sezioni. Sotto ciascuna, il pannello delle evidenze elenca pubblicazioni, dataset, supervisioni e altri risultati che puoi citare con un collegamento di evidenza. Tieni d'occhio il numero di caratteri e di pagine rispetto al limite di sei o cinque.",
          "Esporta in DOCX, incolla le sezioni nel modello Word del FRQ, verifica le regole di presentazione e allega il PDF in FRQnet.",
        ],
      },
      { type: "cta", label: "Costruisci il tuo CV dal tuo registro ORCID, gratis", href: "/" },
    ],
    faq: [
      {
        q: "Il CV-FRQ sostituisce il Canadian Common CV nei bandi del FRQ?",
        a: "Per i programmi che l'hanno adottato, sì. Il FRQ chiede il CV-FRQ come allegato PDF in FRQnet. L'adozione è avvenuta programma per programma, quindi verifica le regole del programma a cui ti candidi.",
      },
      {
        q: "Il CV-FRQ è la stessa cosa del Tri-agency CV federale?",
        a: "No. I due documenti hanno lo stesso spirito, una narrazione con pochi contributi significativi e una sezione sul mentoring, ma il Tri-agency CV appartiene a CIHR, NSERC e SSHRC. Ha il proprio modello e il proprio calendario: i bandi 2027 di NSERC e il Project Grant di CIHR non prima dell'autunno 2027. Prepara ciascuno per il finanziatore che lo richiede.",
      },
      {
        q: "Devo includere i conteggi di citazioni o il mio h-index?",
        a: "Le istruzioni del FRQ non li chiedono, e non mostrano ciò su cui il CV-FRQ viene giudicato, cioè l'impatto, la rilevanza e il valore di un contributo e il tuo ruolo in esso. Documenta invece l'effetto che il contributo ha avuto, con identificatori che il lettore possa seguire.",
      },
      {
        q: "Un contributo può essere qualcosa di diverso da una pubblicazione?",
        a: "Sì. L'elenco del FRQ è ampio di proposito. Mobilitazione della conoscenza, memorie di policy, infrastrutture di dati, software, creazione artistica, partenariati, organizzazione di convegni, proprietà intellettuale, servizio alla comunità e scienza aperta contano tutti, da soli o raggruppati con risultati collegati.",
      },
    ],
  },
  "ko-KR": {
    title: "FRQ 내러티브 CV(CV-FRQ): 준비하는 방법",
    description:
      "Fonds de recherche du Québec가 CV descriptif에서 요구하는 것: 세 부분, 프랑스어 6쪽 또는 영어 5쪽, 각각 대상과 영향을 명시한 최대 열 개의 기여. 그리고 이미 가지고 있는 연구 기록으로 그것을 쓰는 방법.",
    blocks: [
      {
        type: "p",
        text: "2025-2026년 공모부터 Fonds de recherche du Québec(FRQ)는 Canadian Common CV 대신 CV descriptif 또는 CV-FRQ라 불리는 내러티브 CV를 지원자에게 요구합니다. 문서는 짧습니다. 세 개의 고정된 부분으로 이루어져 있고, 위원회는 몇 줄을 나열했는지가 아니라 어떤 연구가 무엇을 바꾸었다고 말하는지를 읽습니다. 이 가이드는 FRQ 지침을 부분별로 살피고, 공식 문서로 연결하며, 이미 가지고 있는 기록으로 CV를 쓰는 방법을 설명합니다.",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "CV-FRQ란 무엇인가" },
      {
        type: "p",
        text: "FRQ는 CV-FRQ를 논문뿐 아니라 폭넓은 기여를 통해 전문성과 관련 역량을 보여 주는 방법으로 제시합니다. FRQ의 Word 서식으로 작성해 FRQnet 지원 양식에 PDF로 첨부합니다. 양식 자체가 학력, 경력, 언어, 현재 직위를 수집하므로 CV는 그것을 반복하지 않습니다. 세 부분은 항상 다음 순서입니다:",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate(영어 서식에서는 Section 1: Background and skills). 학문적·직업적·개인적 배경이 제안한 연구를 수행하고 프로그램 기준을 충족하도록 어떻게 준비시켰는지.",
          "Deuxième section : Contributions et expériences les plus importantes(Section 2: Most significant contributions and experiences). 최대 열 개의 기여 또는 경험, 각각 영향, 본인의 역할, 기간, 대상을 명시.",
          "Troisième section : Activités de supervision et de mentorat(Section 3: Supervisory and mentorship activities). 학생, 박사후연구원, 고급 인력을 어떻게 양성하고 지도했는지.",
        ],
      },
      { type: "h2", id: "rules", text: "규칙" },
      {
        type: "ul",
        items: [
          "프랑스어는 최대 6쪽, 영어는 5쪽. 두 서식은 언어와 길이만 다릅니다.",
          "FRQ의 Word 서식을 사용하고, 첨부 파일에 대한 FRQnet 표기 기준을 따르며, PDF를 업로드합니다.",
          "단어 수 제한은 없습니다. FRQ는 프로그램의 평가 기준을 따르는 소절을 권합니다. 글머리 기호와 표를 사용할 수 있습니다.",
          "해당하지 않는 부분에는 s/o(sans objet), 영어 서식에서는 N/A라고 적습니다.",
          "민감한 개인정보(의료, 재정 또는 기타 사적인 정보), 사진, 본인이나 타인에게 해가 될 수 있는 내용은 넣지 않습니다.",
          "쓰기 전에 프로그램의 목표와 평가 기준을 읽으세요. CV의 모든 내용은 그것에 답해야 합니다.",
        ],
      },
      { type: "h2", id: "official-documents", text: "공식 문서" },
      FRQ_LINKS_EN,
      { type: "h2", id: "section-1", text: "1부: 배경과 역량" },
      {
        type: "p",
        text: "프로젝트를 수행할 수 있음을 보여 주는 전문성이나 경험, 리더십을 보여 주는 활동, 연구 주제에 관한 이전의 협력이나 성과, 과거 연구의 구체적 효과, 상과 장학금, 개인적 경험으로 얻은 역량을 여기에 쓰세요. 눈앞의 프로그램을 위해 쓰세요. 평가자는 공모의 기준에 비추어 이 부분을 읽으므로 그 순서와 용어를 사용하세요.",
      },
      { type: "h2", id: "section-2", text: "2부: 최대 열 개의 기여" },
      {
        type: "p",
        text: "이 부분이 문서를 떠받칩니다. 기여는 하나의 출판물일 필요가 없습니다. 밀접하게 연관된 성과의 묶음, 예컨대 논문과 그 기반 데이터셋과 그것을 사용한 지침일 수 있습니다. FRQ가 인정하는 것의 목록은 길습니다: 모든 종류의 출판물, 미디어 활동·팟캐스트·공개 강연 같은 지식 동원, 심사와 평가, 공동체 봉사, 예술 창작, 데이터 인프라와 코호트, 지식재산, 학회 조직, 파트너십, 정책이나 실무 기준을 형성한 의견서, 소프트웨어와 도구, 그리고 UNESCO가 정의하는 오픈 사이언스. 각 기여마다 다음을 밝히세요:",
      },
      {
        type: "ul",
        items: [
          "날짜 또는 기간;",
          "대상: 학술 공동체는 A, 실무 공동체는 B, 일반 대중은 C, 하나 또는 여러 글자;",
          "본인의 역할을 분명하게;",
          "그 연구의 영향, 중요성, 가치를, DOI, 보고서, 등록 항목, 그것을 인용한 정책처럼 독자가 확인할 수 있는 것과 함께.",
        ],
      },
      {
        type: "p",
        text: "출판물에 대해 FRQ는 APA 양식이나 해당 분야에서 인정되는 다른 표준을 요구합니다. 본인 이름을 굵게 표시하고, 지원서에 명시된 공동연구자의 이름도 굵게 표시하세요. 지도한 모든 사람의 이름 뒤에 별표를 붙이세요(Nom, Prénom*). 학부생부터 박사후연구원과 고급 인력까지 해당됩니다. 1부에서 말한 내용을 여기서 반복하지 마세요.",
      },
      { type: "h2", id: "section-3", text: "3부: 지도와 멘토링" },
      {
        type: "p",
        text: "차세대를 어떻게 양성했는지 설명하세요: 모든 단계의 칼리지·대학 학생, 박사후연구원, 고급 인력의 지도; 강의와 교육 워크숍; 초기 경력 연구자, 동료, 파트너에 대한 공식·비공식 멘토링; 학생을 연구로 이끄는 아웃리치; 토착 지식을 포함한 방법론이나 지식 체계 교육; 안전하고 공평하며 포용적인 연구 환경을 위한 노력. 학계 밖의 경력도 학계 안의 경력과 똑같이 인정됩니다.",
      },
      { type: "h2", id: "evidence", text: "과장 없이 영향을 보여 주기" },
      {
        type: "p",
        text: '내러티브 CV를 처음 쓰는 지원자는 어떤 기여가 중요했음을 어떻게 입증하느냐고 묻고, 이 형식을 처음 접하는 평가자도 같은 것을 묻습니다. 내러티브 주장은 숫자가 아니라 독자가 따라갈 수 있는 것으로 확인됩니다. "이 논문은 규제기관이 2023년에 제품 모노그래프를 개정하도록 이끈 신호를 기록했다"라는 문장을 보세요. 논문에 DOI가 있고, 모노그래프에 날짜가 있으며, 규제기관의 결정이 공개되어 있으면 독자는 이를 확인할 수 있습니다. 인용 횟수나 h-지수는 그 연쇄에 대해 아무것도 말하지 않으며, FRQ 지침은 그것을 요구한 적이 없습니다.',
      },
      {
        type: "p",
        text: "그러므로 연쇄를 쓰세요: 성과, 그것이 바꾼 것, 그 변화가 기록된 곳, 그리고 식별자. 기여가 실무자나 대중(대상 B와 C)에게 도달했다면 무엇을 통해서인지 말하세요: 임상 지침, 부처 보고서, 교육 프로그램, 일련의 인터뷰. 효과를 문서화할 수 없다면 연구의 중요성과 본인의 역할을 기술하고 거기서 멈추세요. 평가자는 문서화된 효과와 주장된 효과를 구별합니다.",
      },
      { type: "h2", id: "with-sigmacv", text: "SigmaCV로 준비하기" },
      {
        type: "p",
        text: "SigmaCV는 개방형 연구 데이터(ORCID, OpenAlex, Crossref, DataCite 등)로부터 완전한 학술 CV를 만들고, 지원기관 레이아웃을 되돌릴 수 있게 적용하도록 합니다. 그 레이아웃 중 둘이 프랑스어와 영어의 CV-FRQ입니다. 각각 FRQ의 세 부분을 FRQ 자체의 제목 아래 보여 주고 나머지는 모두 숨깁니다. 나머지는 FRQnet 양식이 수집하기 때문입니다. 각 부분에 산문을 쓰고, 주장은 증거 링크로 기록의 항목을 가리킬 수 있으므로 독자는 DOI에 도달합니다.",
      },
      {
        type: "ol",
        items: [
          "ORCID로 로그인하고 기록이 구축되게 하세요. 본인의 것이 아닌 항목을 표시하고, 빠진 연구는 DOI로 추가하세요.",
          "CV 모델 선택기에서 CV-FRQ 레이아웃(프랑스어 또는 영어)을 적용하세요. 이전 레이아웃은 프리셋으로 저장됩니다.",
          "세 부분을 작성하세요. 각 부분 아래의 증거 패널이 증거 링크로 인용할 수 있는 출판물, 데이터셋, 지도 기록, 기타 성과를 나열합니다. 6쪽 또는 5쪽 제한에 대해 글자 수와 쪽수를 확인하세요.",
          "DOCX로 내보내고, 각 부분을 FRQ의 Word 서식에 붙여 넣고, 표기 규칙을 확인한 뒤 FRQnet에 PDF를 첨부하세요.",
        ],
      },
      { type: "cta", label: "ORCID 기록으로 CV 만들기, 무료", href: "/" },
    ],
    faq: [
      {
        q: "FRQ 공모에서 CV-FRQ가 Canadian Common CV를 대체하나요?",
        a: "채택한 프로그램에서는 그렇습니다. FRQ는 FRQnet에서 CV-FRQ를 PDF 첨부로 요구합니다. 채택은 프로그램별로 진행되었으므로, 지원하는 프로그램의 규칙을 확인하세요.",
      },
      {
        q: "CV-FRQ는 연방 Tri-agency CV와 같은 것인가요?",
        a: "아닙니다. 두 문서는 같은 정신, 즉 소수의 중요한 기여와 멘토링 부분을 가진 내러티브를 공유하지만, Tri-agency CV는 CIHR, NSERC, SSHRC의 것입니다. 고유한 서식과 일정이 있습니다: NSERC의 2027년 공모, 그리고 CIHR의 Project Grant는 2027년 가을 이후. 요구하는 지원기관별로 각각 준비하세요.",
      },
      {
        q: "인용 횟수나 h-지수를 포함해야 하나요?",
        a: "FRQ 지침은 그것을 요구하지 않으며, CV-FRQ가 평가하는 것, 즉 기여의 영향·중요성·가치와 그 안에서의 본인의 역할을 보여 주지도 못합니다. 대신 기여가 낳은 효과를, 독자가 따라갈 수 있는 식별자와 함께 기록하세요.",
      },
      {
        q: "기여가 출판물 이외의 것일 수 있나요?",
        a: "예. FRQ의 목록은 의도적으로 넓습니다. 지식 동원, 정책 의견서, 데이터 인프라, 소프트웨어, 예술 창작, 파트너십, 학회 조직, 지식재산, 공동체 봉사, 오픈 사이언스가 모두 단독으로 또는 관련 성과와 묶어서 인정됩니다.",
      },
    ],
  },
  "ru-RU": {
    title: "Нарративное резюме FRQ (CV-FRQ): как его подготовить",
    description:
      "Что Fonds de recherche du Québec требует в своём CV descriptif: три раздела, шесть страниц на французском или пять на английском, до десяти вкладов с аудиторией и эффектом для каждого. И как написать его на основе научной записи, которая у вас уже есть.",
    blocks: [
      {
        type: "p",
        text: "Начиная с конкурсов 2025-2026 годов Fonds de recherche du Québec (FRQ) требует от заявителей нарративное резюме, называемое CV descriptif или CV-FRQ, вместо Canadian Common CV. Документ короткий. У него три фиксированных раздела, и комиссия читает его ради того, что, по вашим словам, изменила работа, а не ради длины списков. Это руководство проходит по инструкциям FRQ раздел за разделом, даёт ссылки на официальные документы, а затем объясняет, как написать резюме на основе записи, которая у вас уже есть.",
      },
      { type: "h2", id: "what-is-the-cv-frq", text: "Что такое CV-FRQ" },
      {
        type: "p",
        text: "FRQ представляет CV-FRQ как способ показать вашу экспертизу и релевантные компетенции через широкий спектр вкладов, а не только публикации. Вы пишете его в шаблоне Word FRQ и прилагаете в PDF к форме заявки FRQnet. Сама форма собирает сведения об образовании, трудовой истории, языках и текущей должности, поэтому резюме их не повторяет. Три раздела всегда идут в таком порядке:",
      },
      {
        type: "ul",
        items: [
          "Première section : Parcours et compétences de la personne candidate (в английском шаблоне Section 1: Background and skills). Как ваш академический, профессиональный или личный опыт подготовил вас к выполнению предлагаемого исследования и к соответствию критериям программы.",
          "Deuxième section : Contributions et expériences les plus importantes (Section 2: Most significant contributions and experiences). До десяти вкладов или опытов, каждый с эффектом, вашей ролью, периодом и аудиторией.",
          "Troisième section : Activités de supervision et de mentorat (Section 3: Supervisory and mentorship activities). Как вы обучали и наставляли студентов, постдоков и высококвалифицированный персонал.",
        ],
      },
      { type: "h2", id: "rules", text: "Правила" },
      {
        type: "ul",
        items: [
          "Не более шести страниц на французском, пяти на английском. Два шаблона различаются только языком и объёмом.",
          "Используйте шаблон Word FRQ, соблюдайте стандарты оформления приложений FRQnet и загружайте PDF.",
          "Лимита слов нет. FRQ предлагает подразделы, следующие критериям оценки программы. Маркированные списки и таблицы допускаются.",
          "Если раздел к вам не относится, напишите s/o (sans objet), в английском шаблоне N/A.",
          "Не включайте чувствительную личную информацию (медицинскую, финансовую или иную частную), фотографии и всё, что могло бы навредить вам или другим.",
          "Прочитайте цели и критерии оценки программы, прежде чем писать. Всё в резюме должно отвечать на них.",
        ],
      },
      { type: "h2", id: "official-documents", text: "Официальные документы" },
      FRQ_LINKS_EN,
      { type: "h2", id: "section-1", text: "Раздел 1: опыт и компетенции" },
      {
        type: "p",
        text: "Поместите сюда экспертизу или опыт, показывающие, что вы способны выполнить проект, деятельность, демонстрирующую лидерство, предыдущие коллаборации или результаты по теме исследования, конкретные эффекты вашей прошлой работы, премии и стипендии, а также компетенции, приобретённые через личный опыт. Пишите его для конкретной программы. Эксперт читает этот раздел, сверяясь с критериями конкурса, поэтому используйте их порядок и словарь.",
      },
      { type: "h2", id: "section-2", text: "Раздел 2: до десяти вкладов" },
      {
        type: "p",
        text: "Этот раздел держит документ. Вклад не обязан быть одной публикацией. Это может быть набор тесно связанных результатов, например статья, набор данных под ней и руководство, которое её использовало. Список FRQ того, что засчитывается, длинный: публикации всех видов, мобилизация знаний, например работа с медиа, подкасты и публичные лекции, экспертная и оценочная работа, служение сообществу, художественное творчество, инфраструктуры данных и когорты, интеллектуальная собственность, организация конференций, партнёрства, записки, повлиявшие на политику или стандарт практики, программное обеспечение и инструменты, а также открытая наука в понимании ЮНЕСКО. Для каждого вклада укажите:",
      },
      {
        type: "ul",
        items: [
          "дату или период;",
          "аудиторию: A для академического сообщества, B для практического сообщества, C для широкой публики, одну букву или несколько;",
          "вашу роль, изложенную прямо;",
          "эффект, значимость и ценность работы с чем-то, что читатель может проверить, например DOI, отчётом, записью в реестре или документом политики, который её цитирует.",
        ],
      },
      {
        type: "p",
        text: "Для публикаций FRQ требует стиль APA или иной признанный в вашей дисциплине стандарт. Выделите жирным своё имя и имена соисследователей, указанных в заявке. Поставьте звёздочку после имени каждого человека, которого вы курировали (Nom, Prénom*), от студентов бакалавриата до постдоков и высококвалифицированного персонала. Не повторяйте здесь то, что сказано в первом разделе.",
      },
      { type: "h2", id: "section-3", text: "Раздел 3: руководство и наставничество" },
      {
        type: "p",
        text: "Опишите, как вы подготовили следующее поколение: руководство студентами колледжей и университетов всех уровней, постдоками и высококвалифицированным персоналом; преподавание и обучающие семинары; формальное или неформальное наставничество молодых исследователей, коллег и партнёров; просветительская работа, приводящая студентов в науку; обучение методам или системам знаний, включая знания коренных народов; и работа над безопасной, справедливой и инклюзивной исследовательской средой. Карьера вне академии засчитывается так же, как и внутри неё.",
      },
      { type: "h2", id: "evidence", text: "Показать эффект, не преувеличивая" },
      {
        type: "p",
        text: 'Заявители, впервые пишущие нарративное резюме, спрашивают, как доказать, что вклад имел значение, и эксперты, впервые сталкивающиеся с форматом, спрашивают то же самое. Нарративное утверждение проверяется тем, что читатель может проследить, а не числом. Возьмите фразу "эта статья задокументировала сигнал, побудивший регулятор изменить монографию продукта в 2023 году". Читатель может проверить её, если у статьи есть DOI, у монографии есть дата, а решение регулятора публично. Число цитирований или индекс Хирша ничего не говорят об этой цепочке, и инструкции FRQ никогда их не требуют.',
      },
      {
        type: "p",
        text: "Поэтому напишите цепочку: результат, что он изменил и где это изменение зафиксировано, с идентификаторами. Там, где вклад дошёл до практиков или публики (аудитории B и C), скажите, через что: клиническое руководство, отчёт министерства, программу подготовки, серию интервью. Там, где эффект задокументировать нельзя, опишите значимость работы и вашу роль в ней и остановитесь. Эксперт отличает задокументированный эффект от заявленного.",
      },
      { type: "h2", id: "with-sigmacv", text: "Подготовка с SigmaCV" },
      {
        type: "p",
        text: "SigmaCV собирает ваше полное академическое резюме из открытых научных данных (ORCID, OpenAlex, Crossref, DataCite и другие) и позволяет обратимо применять к нему макеты фондов. Два из этих макетов, это CV-FRQ на французском и на английском. Каждый показывает три раздела FRQ под заголовками самого FRQ и скрывает всё остальное, поскольку остальное собирает форма FRQnet. В каждом разделе вы пишете прозу, и утверждение может указывать на запись вашего досье через ссылку-доказательство, так что читатель попадает на DOI.",
      },
      {
        type: "ol",
        items: [
          "Войдите через ORCID и дайте записи собраться. Отметьте то, что не ваше, и добавьте недостающие работы по DOI.",
          "Примените макет CV-FRQ, французский или английский, в селекторе моделей резюме. Предыдущий макет сохраняется как пресет.",
          "Напишите три раздела. Под каждым панель доказательств перечисляет публикации, наборы данных, записи о руководстве и другие результаты, которые вы можете цитировать ссылкой-доказательством. Следите за числом символов и страниц относительно лимита в шесть или пять страниц.",
          "Экспортируйте в DOCX, вставьте разделы в шаблон Word FRQ, проверьте правила оформления и приложите PDF в FRQnet.",
        ],
      },
      { type: "cta", label: "Собрать резюме из вашей записи ORCID, бесплатно", href: "/" },
    ],
    faq: [
      {
        q: "Заменяет ли CV-FRQ Canadian Common CV в конкурсах FRQ?",
        a: "Для программ, которые его приняли, да. FRQ требует CV-FRQ как PDF-приложение в FRQnet. Внедрение шло программа за программой, поэтому проверьте правила программы, на которую подаётесь.",
      },
      {
        q: "CV-FRQ это то же самое, что федеральное Tri-agency CV?",
        a: "Нет. У двух документов общий дух, нарратив с небольшим числом значимых вкладов и разделом о наставничестве, но Tri-agency CV принадлежит CIHR, NSERC и SSHRC. У него свой шаблон и свой график: конкурсы NSERC 2027 года и Project Grant CIHR не ранее осени 2027. Готовьте каждое для того фонда, который его требует.",
      },
      {
        q: "Стоит ли включать число цитирований или индекс Хирша?",
        a: "Инструкции FRQ их не требуют, и они не показывают того, по чему оценивается CV-FRQ, а именно эффект, значимость и ценность вклада и вашу роль в нём. Вместо этого задокументируйте эффект, который произвёл вклад, с идентификаторами, которые читатель может проследить.",
      },
      {
        q: "Может ли вклад быть чем-то иным, чем публикация?",
        a: "Да. Список FRQ намеренно широк. Мобилизация знаний, записки о политике, инфраструктуры данных, программное обеспечение, художественное творчество, партнёрства, организация конференций, интеллектуальная собственность, служение сообществу и открытая наука засчитываются все, отдельно или в связке со смежными результатами.",
      },
    ],
  },
};
