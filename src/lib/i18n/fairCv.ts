import { asLocale, type Locale } from "./index";

/**
 * "FAIR for your CV" explainer page copy, localized for all 10 supported
 * languages. Typed as Record<Locale, FairCvStrings> so a missing translation is
 * a compile error. Used by the default `/fair` and the localized `/[locale]/fair`
 * routes.
 *
 * Format NAMES + technical proper nouns (FAIR, JSON, JSON Schema, RO-Crate,
 * CSL-JSON, BibTeX, OAI-PMH, Dublin Core, Signposting, schema.org, JSON-LD,
 * ORCID, Apache-2.0, GitHub, PDF/Word/LaTeX/Markdown/HTML) live untranslated in
 * the `FairCv` component; only the "what it is for" descriptions are localized
 * here. `navLabel` is the short footer label.
 *
 * NOTE: non-English copy is an initial translation pending native review (same
 * convention as the SEO landing pages and the /principles page).
 */
export interface FairCvStrings {
  metaTitle: string;
  metaDescription: string;
  heading: string;
  intro: string;
  lead: string;
  /** One-line "what it is for" per published format. */
  fmtCanonical: string;
  fmtCitations: string;
  fmtRoCrate: string;
  fmtDocuments: string;
  fmtJsonLd: string;
  fmtHarvest: string;
  cite: string;
  repositories: string;
  selfHost: string;
  more: string;
  navLabel: string;
  backLink: string;
}

const FAIR_CV_I18N: Record<Locale, FairCvStrings> = {
  "en-US": {
    metaTitle: "FAIR for your CV",
    metaDescription:
      "How SigmaCV publishes your academic CV as open, machine-readable data — the formats it offers, how to cite a CV, how repositories can harvest it, and how to self-host.",
    heading: "FAIR for your CV",
    intro:
      "Your CV on SigmaCV isn't only a document to download. Every CV is also published as open, machine-readable data — Findable, Accessible, Interoperable and Reusable (FAIR) — so other tools, search engines and repositories can read, cite and reuse it.",
    lead: "The formats your CV comes in, and what each is for:",
    fmtCanonical:
      "the complete CV as structured JSON, validated against a published, versioned schema — the single source of truth every other format derives from.",
    fmtCitations:
      "your publication list as citation data, ready to import into reference managers.",
    fmtRoCrate:
      "a Research Object Crate bundling the CV with its author identifier, licence and provenance in one archive.",
    fmtDocuments:
      "the everyday outputs for applications and sharing — with identical citations across all of them.",
    fmtJsonLd:
      "structured data embedded in your public page so search engines understand who and what it describes.",
    fmtHarvest:
      "discovery for machines — typed-format links in the page headers, and a standard harvesting endpoint for repositories.",
    cite: "A published CV has a stable web address and carries your author identifier (ORCID), so it can be cited like any online research object — and a machine following the page's Signposting links finds every typed format on its own.",
    repositories:
      "If you let your public CV be indexed, repositories and aggregators can harvest it as Dublin Core over OAI-PMH, and the canonical CV schema is published openly so any tool can validate and adopt the format.",
    selfHost:
      "SigmaCV is open source under the Apache-2.0 licence. You can run the whole application yourself, audit how it works, or build on it — nothing here is locked in.",
    more: "See the standards we align with and the full open-science statement, or read the source on GitHub:",
    navLabel: "FAIR",
    backLink: "← Back to SigmaCV",
  },
  "zh-CN": {
    metaTitle: "为你的简历实现 FAIR",
    metaDescription:
      "SigmaCV 如何将你的学术简历发布为开放、机器可读的数据——提供哪些格式、如何引用简历、知识库如何收割，以及如何自托管。",
    heading: "为你的简历实现 FAIR",
    intro:
      "SigmaCV 上的简历不仅仅是一份可下载的文档。每份简历同时以开放、机器可读的数据形式发布——可发现、可访问、可互操作、可重用（FAIR）——因此其他工具、搜索引擎和知识库都能读取、引用和重用它。",
    lead: "你的简历提供的格式，以及它们各自的用途：",
    fmtCanonical:
      "完整的简历，采用结构化 JSON，并依据已发布、带版本的 schema 进行校验——它是其他所有格式所派生的唯一可信来源。",
    fmtCitations: "你的论文列表，作为引文数据，可直接导入文献管理软件。",
    fmtRoCrate:
      "一个 Research Object Crate，将简历及其作者标识符、许可证和来源信息打包到一个归档中。",
    fmtDocuments: "用于申请和分享的日常输出——所有格式中的引文完全一致。",
    fmtJsonLd: "嵌入你的公开页面中的结构化数据，让搜索引擎理解它所描述的人和内容。",
    fmtHarvest: "面向机器的发现——页面头部中带类型的格式链接，以及供知识库使用的标准收割端点。",
    cite: "已发布的简历拥有稳定的网址，并携带你的作者标识符（ORCID），因此可以像引用任何在线研究对象一样引用它——而跟随页面 Signposting 链接的机器能够自行找到每一种带类型的格式。",
    repositories:
      "如果你允许公开简历被索引，知识库和聚合器就能通过 OAI-PMH 以 Dublin Core 格式收割它；而规范的简历 schema 已公开发布，任何工具都可以校验并采用该格式。",
    selfHost:
      "SigmaCV 是基于 Apache-2.0 许可证的开源软件。你可以自行运行整个应用、审查其工作方式，或在其基础上进行开发——这里没有任何锁定。",
    more: "查看我们所遵循的标准和完整的开放科学声明，或在 GitHub 上阅读源代码：",
    navLabel: "FAIR",
    backLink: "← 返回 SigmaCV",
  },
  "es-ES": {
    metaTitle: "FAIR para tu CV",
    metaDescription:
      "Cómo SigmaCV publica tu CV académico como datos abiertos y legibles por máquinas: los formatos que ofrece, cómo citar un CV, cómo lo pueden recolectar los repositorios y cómo autoalojarlo.",
    heading: "FAIR para tu CV",
    intro:
      "Tu CV en SigmaCV no es solo un documento para descargar. Cada CV se publica también como datos abiertos y legibles por máquinas —Localizables, Accesibles, Interoperables y Reutilizables (FAIR)— para que otras herramientas, los motores de búsqueda y los repositorios puedan leerlo, citarlo y reutilizarlo.",
    lead: "Los formatos en los que se publica tu CV, y para qué sirve cada uno:",
    fmtCanonical:
      "el CV completo como JSON estructurado, validado frente a un esquema publicado y versionado: la única fuente de verdad de la que derivan todos los demás formatos.",
    fmtCitations:
      "tu lista de publicaciones como datos de cita, listos para importar en gestores de referencias.",
    fmtRoCrate:
      "un Research Object Crate que agrupa el CV con su identificador de autor, su licencia y su procedencia en un solo archivo.",
    fmtDocuments:
      "los resultados de uso diario para solicitudes y para compartir, con citas idénticas en todos ellos.",
    fmtJsonLd:
      "datos estructurados incrustados en tu página pública para que los motores de búsqueda entiendan a quién y qué describe.",
    fmtHarvest:
      "descubrimiento para máquinas: enlaces a los formatos tipados en las cabeceras de la página y un punto de recolección estándar para repositorios.",
    cite: "Un CV publicado tiene una dirección web estable y lleva tu identificador de autor (ORCID), por lo que puede citarse como cualquier objeto de investigación en línea; y una máquina que siga los enlaces de Signposting de la página encuentra por sí sola todos los formatos tipados.",
    repositories:
      "Si permites que tu CV público se indexe, los repositorios y agregadores pueden recolectarlo como Dublin Core mediante OAI-PMH, y el esquema canónico del CV se publica abiertamente para que cualquier herramienta pueda validar y adoptar el formato.",
    selfHost:
      "SigmaCV es software de código abierto bajo la licencia Apache-2.0. Puedes ejecutar toda la aplicación por tu cuenta, auditar cómo funciona o construir sobre ella: aquí no hay nada cautivo.",
    more: "Consulta las normas que seguimos y la declaración completa de ciencia abierta, o lee el código fuente en GitHub:",
    navLabel: "FAIR",
    backLink: "← Volver a SigmaCV",
  },
  "fr-FR": {
    metaTitle: "FAIR pour votre CV",
    metaDescription:
      "Comment SigmaCV publie votre CV académique sous forme de données ouvertes et lisibles par machine : les formats proposés, comment citer un CV, comment les entrepôts peuvent le moissonner et comment l'héberger soi-même.",
    heading: "FAIR pour votre CV",
    intro:
      "Sur SigmaCV, votre CV n'est pas qu'un document à télécharger. Chaque CV est aussi publié sous forme de données ouvertes et lisibles par machine — Faciles à trouver, Accessibles, Interopérables et Réutilisables (FAIR) — pour que d'autres outils, les moteurs de recherche et les entrepôts puissent le lire, le citer et le réutiliser.",
    lead: "Les formats dans lesquels votre CV est publié, et à quoi sert chacun :",
    fmtCanonical:
      "le CV complet en JSON structuré, validé selon un schéma publié et versionné — la source de vérité unique dont dérivent tous les autres formats.",
    fmtCitations:
      "votre liste de publications sous forme de données de citation, prêtes à importer dans les gestionnaires de références.",
    fmtRoCrate:
      "un Research Object Crate regroupant le CV avec son identifiant d'auteur, sa licence et sa provenance dans une seule archive.",
    fmtDocuments:
      "les sorties du quotidien pour les candidatures et le partage — avec des citations identiques dans tous les formats.",
    fmtJsonLd:
      "des données structurées intégrées à votre page publique pour que les moteurs de recherche comprennent qui et quoi elle décrit.",
    fmtHarvest:
      "la découverte par les machines : des liens vers les formats typés dans les en-têtes de la page et un point de moissonnage standard pour les entrepôts.",
    cite: "Un CV publié possède une adresse web stable et porte votre identifiant d'auteur (ORCID) : il peut donc être cité comme tout objet de recherche en ligne — et une machine qui suit les liens Signposting de la page retrouve d'elle-même chaque format typé.",
    repositories:
      "Si vous autorisez l'indexation de votre CV public, les entrepôts et agrégateurs peuvent le moissonner en Dublin Core via OAI-PMH, et le schéma canonique du CV est publié ouvertement afin que tout outil puisse valider et adopter le format.",
    selfHost:
      "SigmaCV est un logiciel libre sous licence Apache-2.0. Vous pouvez exécuter l'application entière vous-même, auditer son fonctionnement ou bâtir dessus — rien n'est verrouillé ici.",
    more: "Consultez les normes que nous suivons et la déclaration complète de science ouverte, ou lisez le code source sur GitHub :",
    navLabel: "FAIR",
    backLink: "← Retour à SigmaCV",
  },
  "de-DE": {
    metaTitle: "FAIR für deinen Lebenslauf",
    metaDescription:
      "Wie SigmaCV deinen akademischen Lebenslauf als offene, maschinenlesbare Daten veröffentlicht – die angebotenen Formate, wie man einen Lebenslauf zitiert, wie Repositorien ihn ernten können und wie man ihn selbst hostet.",
    heading: "FAIR für deinen Lebenslauf",
    intro:
      "Dein Lebenslauf auf SigmaCV ist nicht nur ein Dokument zum Herunterladen. Jeder Lebenslauf wird auch als offene, maschinenlesbare Daten veröffentlicht – auffindbar, zugänglich, interoperabel und wiederverwendbar (FAIR) –, damit andere Werkzeuge, Suchmaschinen und Repositorien ihn lesen, zitieren und wiederverwenden können.",
    lead: "Die Formate, in denen dein Lebenslauf erscheint, und wozu jedes dient:",
    fmtCanonical:
      "der vollständige Lebenslauf als strukturiertes JSON, validiert gegen ein veröffentlichtes, versioniertes Schema – die einzige Quelle der Wahrheit, aus der alle anderen Formate abgeleitet werden.",
    fmtCitations:
      "deine Publikationsliste als Zitationsdaten, bereit zum Import in Literaturverwaltungsprogramme.",
    fmtRoCrate:
      "ein Research Object Crate, das den Lebenslauf mit Autoren-Kennung, Lizenz und Provenienz in einem Archiv bündelt.",
    fmtDocuments:
      "die alltäglichen Ausgaben für Bewerbungen und zum Teilen – mit identischen Zitaten in allen.",
    fmtJsonLd:
      "strukturierte Daten, eingebettet in deine öffentliche Seite, damit Suchmaschinen verstehen, wen und was sie beschreibt.",
    fmtHarvest:
      "Auffindbarkeit für Maschinen: typisierte Format-Links in den Seiten-Headern und ein Standard-Endpunkt zum Ernten für Repositorien.",
    cite: "Ein veröffentlichter Lebenslauf hat eine stabile Webadresse und trägt deine Autoren-Kennung (ORCID), sodass er wie jedes Online-Forschungsobjekt zitiert werden kann – und eine Maschine, die den Signposting-Links der Seite folgt, findet jedes typisierte Format von selbst.",
    repositories:
      "Wenn du die Indexierung deines öffentlichen Lebenslaufs zulässt, können Repositorien und Aggregatoren ihn als Dublin Core über OAI-PMH ernten, und das kanonische Lebenslauf-Schema ist offen veröffentlicht, sodass jedes Werkzeug das Format validieren und übernehmen kann.",
    selfHost:
      "SigmaCV ist quelloffene Software unter der Apache-2.0-Lizenz. Du kannst die gesamte Anwendung selbst betreiben, ihre Funktionsweise prüfen oder darauf aufbauen – hier ist nichts eingesperrt.",
    more: "Sieh dir die Standards an, die wir befolgen, und die vollständige Open-Science-Erklärung, oder lies den Quellcode auf GitHub:",
    navLabel: "FAIR",
    backLink: "← Zurück zu SigmaCV",
  },
  "ja-JP": {
    metaTitle: "あなたの履歴書を FAIR に",
    metaDescription:
      "SigmaCV があなたの学術 CV をオープンで機械可読なデータとして公開する仕組み——提供する形式、CV の引用方法、リポジトリによる収集、そして自己ホスティングの方法。",
    heading: "あなたの履歴書を FAIR に",
    intro:
      "SigmaCV の CV は、ダウンロードするだけの文書ではありません。すべての CV は、オープンで機械可読なデータとしても公開され——見つけやすく（Findable）、アクセスでき（Accessible）、相互運用でき（Interoperable）、再利用できる（Reusable）（FAIR）——他のツールや検索エンジン、リポジトリが読み取り、引用し、再利用できます。",
    lead: "あなたの CV が提供される形式と、それぞれの用途：",
    fmtCanonical:
      "完全な CV を構造化 JSON として表現し、公開されたバージョン管理付きスキーマで検証——他のすべての形式が派生する唯一の信頼できる情報源です。",
    fmtCitations:
      "あなたの論文一覧を引用データとして提供し、文献管理ソフトにそのまま取り込めます。",
    fmtRoCrate:
      "CV を著者識別子・ライセンス・来歴とともに一つのアーカイブにまとめた Research Object Crate。",
    fmtDocuments: "応募や共有のための日常的な出力——どの形式でも引用は同一です。",
    fmtJsonLd:
      "公開ページに埋め込まれた構造化データで、検索エンジンがそれが誰の何を記述しているかを理解できます。",
    fmtHarvest:
      "機械による発見——ページヘッダー内の型付き形式リンクと、リポジトリ向けの標準的な収集エンドポイント。",
    cite: "公開された CV は安定した URL を持ち、あなたの著者識別子（ORCID）を備えているため、オンラインの研究対象と同じように引用できます——ページの Signposting リンクをたどる機械は、型付きの各形式を自ら見つけられます。",
    repositories:
      "公開 CV のインデックス登録を許可すると、リポジトリやアグリゲーターは OAI-PMH 経由で Dublin Core として収集でき、正規の CV スキーマはオープンに公開されているため、どのツールでも形式を検証して採用できます。",
    selfHost:
      "SigmaCV は Apache-2.0 ライセンスのオープンソースです。アプリケーション全体を自分で運用し、その仕組みを検証し、あるいはその上に構築できます——ここにロックインはありません。",
    more: "私たちが従う基準と完全なオープンサイエンス声明をご覧いただくか、GitHub でソースコードをお読みください：",
    navLabel: "FAIR",
    backLink: "← SigmaCV に戻る",
  },
  "pt-BR": {
    metaTitle: "FAIR para o seu currículo",
    metaDescription:
      "Como o SigmaCV publica o seu currículo acadêmico como dados abertos e legíveis por máquina — os formatos oferecidos, como citar um currículo, como repositórios podem coletá-lo e como hospedá-lo por conta própria.",
    heading: "FAIR para o seu currículo",
    intro:
      "Seu currículo no SigmaCV não é apenas um documento para baixar. Cada currículo também é publicado como dados abertos e legíveis por máquina — Localizáveis, Acessíveis, Interoperáveis e Reutilizáveis (FAIR) — para que outras ferramentas, mecanismos de busca e repositórios possam lê-lo, citá-lo e reutilizá-lo.",
    lead: "Os formatos em que o seu currículo é publicado, e para que serve cada um:",
    fmtCanonical:
      "o currículo completo como JSON estruturado, validado contra um esquema publicado e versionado — a única fonte de verdade da qual todos os outros formatos derivam.",
    fmtCitations:
      "sua lista de publicações como dados de citação, prontos para importar em gerenciadores de referências.",
    fmtRoCrate:
      "um Research Object Crate que reúne o currículo com seu identificador de autor, licença e proveniência em um único arquivo.",
    fmtDocuments:
      "as saídas do dia a dia para candidaturas e compartilhamento — com citações idênticas em todas elas.",
    fmtJsonLd:
      "dados estruturados embutidos na sua página pública para que os mecanismos de busca entendam quem e o que ela descreve.",
    fmtHarvest:
      "descoberta para máquinas — links para os formatos tipados nos cabeçalhos da página e um endpoint padrão de coleta para repositórios.",
    cite: "Um currículo publicado tem um endereço web estável e carrega seu identificador de autor (ORCID), de modo que pode ser citado como qualquer objeto de pesquisa on-line — e uma máquina que segue os links de Signposting da página encontra cada formato tipado sozinha.",
    repositories:
      "Se você permitir que seu currículo público seja indexado, repositórios e agregadores podem coletá-lo como Dublin Core via OAI-PMH, e o esquema canônico do currículo é publicado abertamente para que qualquer ferramenta possa validar e adotar o formato.",
    selfHost:
      "O SigmaCV é software de código aberto sob a licença Apache-2.0. Você pode executar todo o aplicativo por conta própria, auditar como ele funciona ou construir sobre ele — nada aqui fica preso.",
    more: "Veja os padrões que seguimos e a declaração completa de ciência aberta, ou leia o código-fonte no GitHub:",
    navLabel: "FAIR",
    backLink: "← Voltar ao SigmaCV",
  },
  "it-IT": {
    metaTitle: "FAIR per il tuo CV",
    metaDescription:
      "Come SigmaCV pubblica il tuo CV accademico come dati aperti e leggibili dalle macchine: i formati offerti, come citare un CV, come i repository possono raccoglierlo e come ospitarlo in autonomia.",
    heading: "FAIR per il tuo CV",
    intro:
      "Il tuo CV su SigmaCV non è solo un documento da scaricare. Ogni CV viene pubblicato anche come dati aperti e leggibili dalle macchine — Reperibili, Accessibili, Interoperabili e Riutilizzabili (FAIR) — così che altri strumenti, i motori di ricerca e i repository possano leggerlo, citarlo e riutilizzarlo.",
    lead: "I formati in cui viene pubblicato il tuo CV, e a cosa serve ciascuno:",
    fmtCanonical:
      "il CV completo come JSON strutturato, validato rispetto a uno schema pubblicato e versionato — l'unica fonte di verità da cui derivano tutti gli altri formati.",
    fmtCitations:
      "il tuo elenco di pubblicazioni come dati di citazione, pronti per essere importati nei gestori di riferimenti bibliografici.",
    fmtRoCrate:
      "un Research Object Crate che raccoglie il CV con il suo identificativo d'autore, la licenza e la provenienza in un unico archivio.",
    fmtDocuments:
      "gli output di tutti i giorni per candidature e condivisione — con citazioni identiche in tutti.",
    fmtJsonLd:
      "dati strutturati incorporati nella tua pagina pubblica affinché i motori di ricerca capiscano chi e cosa descrive.",
    fmtHarvest:
      "scoperta per le macchine: collegamenti ai formati tipizzati nelle intestazioni della pagina e un endpoint standard di raccolta per i repository.",
    cite: "Un CV pubblicato ha un indirizzo web stabile e porta con sé il tuo identificativo d'autore (ORCID), quindi può essere citato come qualsiasi oggetto di ricerca online — e una macchina che segue i collegamenti Signposting della pagina trova da sola ogni formato tipizzato.",
    repositories:
      "Se consenti l'indicizzazione del tuo CV pubblico, i repository e gli aggregatori possono raccoglierlo come Dublin Core tramite OAI-PMH, e lo schema canonico del CV è pubblicato apertamente così che qualsiasi strumento possa validare e adottare il formato.",
    selfHost:
      "SigmaCV è software open source con licenza Apache-2.0. Puoi eseguire l'intera applicazione da solo, verificarne il funzionamento o costruirci sopra — qui non c'è nulla di vincolato.",
    more: "Consulta gli standard che seguiamo e la dichiarazione completa sulla scienza aperta, oppure leggi il codice sorgente su GitHub:",
    navLabel: "FAIR",
    backLink: "← Torna a SigmaCV",
  },
  "ko-KR": {
    metaTitle: "당신의 이력서를 위한 FAIR",
    metaDescription:
      "SigmaCV가 당신의 학술 CV를 개방적이고 기계가 읽을 수 있는 데이터로 게시하는 방법 — 제공하는 형식, CV를 인용하는 방법, 리포지토리가 수집하는 방법, 그리고 직접 호스팅하는 방법.",
    heading: "당신의 이력서를 위한 FAIR",
    intro:
      "SigmaCV의 CV는 단순히 내려받는 문서가 아닙니다. 모든 CV는 개방적이고 기계가 읽을 수 있는 데이터로도 게시됩니다 — 검색 가능(Findable)하고, 접근 가능(Accessible)하며, 상호운용 가능(Interoperable)하고, 재사용 가능(Reusable)한(FAIR) — 그래서 다른 도구와 검색 엔진, 리포지토리가 이를 읽고 인용하고 재사용할 수 있습니다.",
    lead: "당신의 CV가 제공되는 형식과 각각의 용도:",
    fmtCanonical:
      "전체 CV를 구조화된 JSON으로 표현하고, 게시된 버전 관리 스키마로 검증합니다 — 다른 모든 형식이 파생되는 단일 진실 공급원입니다.",
    fmtCitations:
      "당신의 논문 목록을 인용 데이터로 제공하여 참고문헌 관리 도구에 바로 가져올 수 있습니다.",
    fmtRoCrate:
      "CV를 저자 식별자, 라이선스, 출처와 함께 하나의 아카이브로 묶은 Research Object Crate.",
    fmtDocuments: "지원과 공유를 위한 일상적인 출력물 — 모든 형식에서 인용이 동일합니다.",
    fmtJsonLd:
      "공개 페이지에 내장된 구조화 데이터로, 검색 엔진이 그것이 누구의 무엇을 설명하는지 이해하도록 합니다.",
    fmtHarvest:
      "기계를 위한 발견 — 페이지 헤더의 형식 지정 링크와 리포지토리를 위한 표준 수집 엔드포인트.",
    cite: "게시된 CV는 안정적인 웹 주소를 가지며 당신의 저자 식별자(ORCID)를 담고 있어, 다른 온라인 연구 객체처럼 인용할 수 있습니다 — 페이지의 Signposting 링크를 따라가는 기계는 형식이 지정된 각 형식을 스스로 찾아냅니다.",
    repositories:
      "공개 CV의 색인 생성을 허용하면, 리포지토리와 수집기가 OAI-PMH를 통해 Dublin Core로 수집할 수 있으며, 표준 CV 스키마가 공개되어 있어 어떤 도구든 형식을 검증하고 채택할 수 있습니다.",
    selfHost:
      "SigmaCV는 Apache-2.0 라이선스의 오픈 소스입니다. 전체 애플리케이션을 직접 실행하고, 작동 방식을 검토하거나, 그 위에 구축할 수 있습니다 — 여기에는 어떤 종속도 없습니다.",
    more: "우리가 따르는 표준과 전체 오픈 사이언스 선언을 확인하거나, GitHub에서 소스 코드를 읽어 보세요:",
    navLabel: "FAIR",
    backLink: "← SigmaCV로 돌아가기",
  },
  "ru-RU": {
    metaTitle: "FAIR для вашего резюме",
    metaDescription:
      "Как SigmaCV публикует ваше академическое резюме в виде открытых, машиночитаемых данных — предлагаемые форматы, как цитировать резюме, как его могут собирать репозитории и как развернуть его самостоятельно.",
    heading: "FAIR для вашего резюме",
    intro:
      "Ваше резюме в SigmaCV — это не просто документ для скачивания. Каждое резюме также публикуется как открытые, машиночитаемые данные — находимые, доступные, совместимые и пригодные для повторного использования (FAIR), — чтобы другие инструменты, поисковые системы и репозитории могли его читать, цитировать и повторно использовать.",
    lead: "Форматы, в которых публикуется ваше резюме, и для чего нужен каждый из них:",
    fmtCanonical:
      "полное резюме в виде структурированного JSON, проверяемого по опубликованной версионируемой схеме, — единый источник истины, из которого выводятся все остальные форматы.",
    fmtCitations:
      "ваш список публикаций в виде библиографических данных, готовых к импорту в менеджеры ссылок.",
    fmtRoCrate:
      "Research Object Crate, объединяющий резюме с идентификатором автора, лицензией и происхождением в одном архиве.",
    fmtDocuments: "повседневные форматы для заявок и обмена — с одинаковыми ссылками во всех них.",
    fmtJsonLd:
      "структурированные данные, встроенные в вашу публичную страницу, чтобы поисковые системы понимали, кого и что она описывает.",
    fmtHarvest:
      "обнаружение для машин — ссылки на типизированные форматы в заголовках страницы и стандартная конечная точка сбора для репозиториев.",
    cite: "У опубликованного резюме есть стабильный веб-адрес, и оно несёт ваш идентификатор автора (ORCID), поэтому его можно цитировать, как любой онлайн-объект исследования, — а машина, следующая по ссылкам Signposting на странице, сама находит каждый типизированный формат.",
    repositories:
      "Если вы разрешите индексировать ваше публичное резюме, репозитории и агрегаторы смогут собирать его как Dublin Core через OAI-PMH, а каноническая схема резюме опубликована открыто, чтобы любой инструмент мог проверять и принимать этот формат.",
    selfHost:
      "SigmaCV — программное обеспечение с открытым исходным кодом под лицензией Apache-2.0. Вы можете запустить всё приложение самостоятельно, проверить, как оно работает, или развивать его — здесь ничего не заблокировано.",
    more: "Ознакомьтесь со стандартами, которым мы следуем, и с полным заявлением об открытой науке, или прочитайте исходный код на GitHub:",
    navLabel: "FAIR",
    backLink: "← Назад к SigmaCV",
  },
};

/** Localized "FAIR for your CV" page copy (falls back to English). */
export function fairCvStrings(locale: string): FairCvStrings {
  return FAIR_CV_I18N[asLocale(locale)];
}
