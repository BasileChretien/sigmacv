import { asLocale, type Locale } from "./index";

/**
 * "Transparency" page copy, localized for all 10 supported languages. Typed as
 * Record<Locale, TransparencyStrings> so a missing translation is a compile
 * error. Used by the default `/transparency` and the localized
 * `/[locale]/transparency` routes.
 *
 * Source NAMES + technical proper nouns (OpenAlex, ORCID, Crossref, DataCite,
 * OpenAIRE, DBLP, UKRI/NIH/NSF, ClinicalTrials.gov, EU CTIS, WHO ICTRP, Open
 * Editors Plus, EPO, ROR, Wikidata, DOI, IRB, GitHub) live untranslated in the
 * `Transparency` component; only the prose is localized here. `navLabel` is the
 * short footer label.
 *
 * NOTE: non-English copy is an initial translation pending native review (same
 * convention as the SEO landing pages, /principles and /fair).
 */
export interface TransparencyStrings {
  metaTitle: string;
  metaDescription: string;
  heading: string;
  intro: string;
  sourcesHeading: string;
  sourcesLead: string;
  /** One-line "what we pull" per grouped source. */
  srcPublications: string;
  srcIdentity: string;
  srcOutputs: string;
  srcGrants: string;
  srcTrials: string;
  srcOther: string;
  matchingHeading: string;
  matchingBody: string;
  refreshHeading: string;
  refreshBody: string;
  logHeading: string;
  logBody: string;
  controlHeading: string;
  controlBody: string;
  more: string;
  navLabel: string;
  backLink: string;
}

const TRANSPARENCY_I18N: Record<Locale, TransparencyStrings> = {
  "en-US": {
    metaTitle: "Transparency",
    metaDescription:
      "Where SigmaCV gets your CV data, how it decides what to include, how often a published CV refreshes, and what it logs — nothing, by default.",
    heading: "Transparency",
    intro:
      "SigmaCV builds your CV from open research databases and is honest about exactly where every entry comes from, how it decides what's yours, and what it stores about you. The short version: it logs nothing about how you use it by default.",
    sourcesHeading: "Where your CV data comes from",
    sourcesLead:
      "All of these are open, public sources. SigmaCV reads from them on your behalf — it never writes back to them:",
    srcPublications: "your publications, with citation metadata and field-normalized indicators.",
    srcIdentity: "your verified author identifier, institution names, and public profile links.",
    srcOutputs: "datasets, software and conference papers linked to your identifier.",
    srcGrants: "funding and grants.",
    srcTrials: "clinical trials you are listed on.",
    srcOther: "editorial roles and patents.",
    matchingHeading: "How it decides what's yours",
    matchingBody:
      "Anything matched by a unique identifier — your ORCID or a publication's DOI — is included automatically. Anything matched only by name and organization (some funders and registries have no identifier) is never added silently: it is flagged as a review candidate for you to confirm or reject. Your own name is highlighted by identifier, never by matching the text of a name.",
    refreshHeading: "How often it refreshes",
    refreshBody:
      "Your working CV updates whenever you re-sync. A CV you publish as a living page re-syncs from the sources automatically on a regular schedule, so it stays current without any action from you — and you can trigger a refresh yourself at any time.",
    logHeading: "What we log",
    logBody:
      "By default, nothing about how you use the app. Optional, consent-gated research logging (for studies on author disambiguation and CV composition) stays switched off until an ethics/IRB protocol is in place, and only records anything after you explicitly opt in. Site analytics are cookieless, first-party and aggregate-only — they never profile individuals.",
    controlHeading: "Your control",
    controlBody:
      "You choose what is published, field by field. You can export all your data at any time, and deleting your account removes it. Display choices (what to show, what to hide as “not mine”) are yours and stay local to your CV.",
    more: "Read the full privacy policy and the standards we follow, or inspect the source on GitHub:",
    navLabel: "Transparency",
    backLink: "← Back to SigmaCV",
  },
  "zh-CN": {
    metaTitle: "透明度",
    metaDescription:
      "SigmaCV 从哪里获取你的简历数据、如何决定包含哪些内容、已发布简历多久刷新一次，以及它记录了什么——默认情况下什么都不记录。",
    heading: "透明度",
    intro:
      "SigmaCV 从开放的研究数据库构建你的简历，并如实说明每一条目究竟来自哪里、如何判断哪些属于你，以及它保存了关于你的哪些信息。简而言之：默认情况下，它不会记录你如何使用它。",
    sourcesHeading: "你的简历数据来自哪里",
    sourcesLead: "以下都是开放、公开的来源。SigmaCV 代表你从中读取——它从不向其回写：",
    srcPublications: "你的论文，及其引用元数据和领域归一化指标。",
    srcIdentity: "你经过验证的作者标识符、机构名称和公开主页链接。",
    srcOutputs: "与你的标识符关联的数据集、软件和会议论文。",
    srcGrants: "资助和经费。",
    srcTrials: "登记有你的临床试验。",
    srcOther: "编辑角色和专利。",
    matchingHeading: "它如何判断哪些属于你",
    matchingBody:
      "凡是通过唯一标识符匹配的——你的 ORCID 或论文的 DOI——都会自动包含。仅通过姓名和机构匹配的（某些资助方和登记处没有标识符）绝不会被悄悄添加：它们会被标记为待审候选，由你确认或拒绝。你自己的名字通过标识符高亮，绝不通过匹配姓名文本。",
    refreshHeading: "它多久刷新一次",
    refreshBody:
      "每当你重新同步时，你的工作简历都会更新。你作为动态页面发布的简历会按固定计划自动从来源重新同步，因此无需你做任何操作即可保持最新——而且你随时可以自行触发刷新。",
    logHeading: "我们记录什么",
    logBody:
      "默认情况下，关于你如何使用应用的内容一概不记录。可选的、需经同意的研究记录（用于作者消歧和简历构成的研究）在伦理／IRB 方案到位之前一直处于关闭状态，并且只有在你明确选择加入之后才会记录任何内容。站点分析是无 Cookie 的、第一方的，且仅为聚合数据——它们绝不会对个人进行画像。",
    controlHeading: "你的掌控",
    controlBody:
      "你逐字段地选择发布哪些内容。你可以随时导出你的全部数据，删除账户即可移除它。显示选择（显示什么、将什么隐藏为“非我所有”）由你决定，并仅保留在你的简历本地。",
    more: "阅读完整的隐私政策和我们所遵循的标准，或在 GitHub 上查看源代码：",
    navLabel: "透明度",
    backLink: "← 返回 SigmaCV",
  },
  "es-ES": {
    metaTitle: "Transparencia",
    metaDescription:
      "De dónde obtiene SigmaCV los datos de tu CV, cómo decide qué incluir, con qué frecuencia se actualiza un CV publicado y qué registra: nada, por defecto.",
    heading: "Transparencia",
    intro:
      "SigmaCV construye tu CV a partir de bases de datos abiertas de investigación y es honesto sobre de dónde procede exactamente cada entrada, cómo decide qué es tuyo y qué almacena sobre ti. En resumen: por defecto no registra nada sobre cómo lo usas.",
    sourcesHeading: "De dónde proceden los datos de tu CV",
    sourcesLead:
      "Todas estas son fuentes abiertas y públicas. SigmaCV lee de ellas en tu nombre; nunca escribe en ellas:",
    srcPublications:
      "tus publicaciones, con metadatos de cita e indicadores normalizados por campo.",
    srcIdentity:
      "tu identificador de autor verificado, los nombres de tus instituciones y los enlaces a tus perfiles públicos.",
    srcOutputs:
      "conjuntos de datos, software y artículos de congresos vinculados a tu identificador.",
    srcGrants: "financiación y subvenciones.",
    srcTrials: "ensayos clínicos en los que figuras.",
    srcOther: "funciones editoriales y patentes.",
    matchingHeading: "Cómo decide qué es tuyo",
    matchingBody:
      "Todo lo que coincide por un identificador único —tu ORCID o el DOI de una publicación— se incluye automáticamente. Todo lo que coincide solo por nombre y organización (algunos financiadores y registros no tienen identificador) nunca se añade en silencio: se marca como candidato a revisión para que lo confirmes o lo rechaces. Tu propio nombre se resalta por identificador, nunca por coincidencia del texto del nombre.",
    refreshHeading: "Con qué frecuencia se actualiza",
    refreshBody:
      "Tu CV de trabajo se actualiza cada vez que vuelves a sincronizar. Un CV que publicas como página viva se resincroniza desde las fuentes automáticamente según una programación regular, de modo que se mantiene al día sin que hagas nada, y puedes lanzar una actualización tú mismo en cualquier momento.",
    logHeading: "Qué registramos",
    logBody:
      "Por defecto, nada sobre cómo usas la aplicación. El registro de investigación opcional y sujeto a consentimiento (para estudios sobre desambiguación de autores y composición de CV) permanece desactivado hasta que exista un protocolo ético/IRB, y solo registra algo después de que lo aceptes explícitamente. La analítica del sitio es sin cookies, de origen propio y solo agregada: nunca perfila a personas.",
    controlHeading: "Tu control",
    controlBody:
      "Tú eliges qué se publica, campo por campo. Puedes exportar todos tus datos en cualquier momento, y eliminar tu cuenta los borra. Las opciones de visualización (qué mostrar, qué ocultar como «no es mío») son tuyas y permanecen locales en tu CV.",
    more: "Lee la política de privacidad completa y las normas que seguimos, o inspecciona el código fuente en GitHub:",
    navLabel: "Transparencia",
    backLink: "← Volver a SigmaCV",
  },
  "fr-FR": {
    metaTitle: "Transparence",
    metaDescription:
      "D'où SigmaCV tire les données de votre CV, comment il décide quoi inclure, à quelle fréquence un CV publié se met à jour et ce qu'il enregistre : rien, par défaut.",
    heading: "Transparence",
    intro:
      "SigmaCV construit votre CV à partir de bases de données de recherche ouvertes et indique honnêtement d'où provient exactement chaque entrée, comment il détermine ce qui est à vous et ce qu'il conserve sur vous. En bref : par défaut, il n'enregistre rien sur la façon dont vous l'utilisez.",
    sourcesHeading: "D'où proviennent les données de votre CV",
    sourcesLead:
      "Ce sont toutes des sources ouvertes et publiques. SigmaCV les lit en votre nom — il n'y réécrit jamais :",
    srcPublications:
      "vos publications, avec leurs métadonnées de citation et des indicateurs normalisés par domaine.",
    srcIdentity:
      "votre identifiant d'auteur vérifié, les noms de vos institutions et les liens vers vos profils publics.",
    srcOutputs: "les jeux de données, logiciels et actes de conférence liés à votre identifiant.",
    srcGrants: "les financements et subventions.",
    srcTrials: "les essais cliniques où vous figurez.",
    srcOther: "les rôles éditoriaux et les brevets.",
    matchingHeading: "Comment il détermine ce qui est à vous",
    matchingBody:
      "Tout ce qui correspond à un identifiant unique — votre ORCID ou le DOI d'une publication — est inclus automatiquement. Tout ce qui ne correspond que par le nom et l'organisation (certains financeurs et registres n'ont pas d'identifiant) n'est jamais ajouté en silence : c'est signalé comme candidat à examiner, que vous confirmez ou rejetez. Votre propre nom est mis en évidence par identifiant, jamais par correspondance du texte d'un nom.",
    refreshHeading: "À quelle fréquence il se met à jour",
    refreshBody:
      "Votre CV de travail se met à jour à chaque resynchronisation. Un CV que vous publiez en page vivante se resynchronise depuis les sources automatiquement selon un calendrier régulier, et reste donc à jour sans aucune action de votre part — et vous pouvez déclencher une mise à jour vous-même à tout moment.",
    logHeading: "Ce que nous enregistrons",
    logBody:
      "Par défaut, rien sur la façon dont vous utilisez l'application. La journalisation de recherche facultative et soumise au consentement (pour des études sur la désambiguïsation des auteurs et la composition des CV) reste désactivée tant qu'un protocole éthique/IRB n'est pas en place, et n'enregistre quoi que ce soit qu'après votre accord explicite. Les statistiques du site sont sans cookies, propriétaires et uniquement agrégées — elles ne profilent jamais les individus.",
    controlHeading: "Votre contrôle",
    controlBody:
      "Vous choisissez ce qui est publié, champ par champ. Vous pouvez exporter toutes vos données à tout moment, et supprimer votre compte les efface. Les choix d'affichage (ce qu'il faut montrer, ce qu'il faut masquer comme « pas à moi ») vous appartiennent et restent locaux à votre CV.",
    more: "Lisez la politique de confidentialité complète et les normes que nous suivons, ou inspectez le code source sur GitHub :",
    navLabel: "Transparence",
    backLink: "← Retour à SigmaCV",
  },
  "de-DE": {
    metaTitle: "Transparenz",
    metaDescription:
      "Woher SigmaCV die Daten deines Lebenslaufs bezieht, wie es entscheidet, was aufgenommen wird, wie oft ein veröffentlichter Lebenslauf aktualisiert wird und was es protokolliert – standardmäßig nichts.",
    heading: "Transparenz",
    intro:
      "SigmaCV erstellt deinen Lebenslauf aus offenen Forschungsdatenbanken und legt offen, woher genau jeder Eintrag stammt, wie es entscheidet, was zu dir gehört, und was es über dich speichert. Kurz gesagt: Standardmäßig protokolliert es nichts darüber, wie du es nutzt.",
    sourcesHeading: "Woher die Daten deines Lebenslaufs stammen",
    sourcesLead:
      "All dies sind offene, öffentliche Quellen. SigmaCV liest sie in deinem Namen – es schreibt nie in sie zurück:",
    srcPublications: "deine Publikationen, mit Zitations-Metadaten und feldnormierten Indikatoren.",
    srcIdentity:
      "deine verifizierte Autoren-Kennung, Institutionsnamen und Links zu öffentlichen Profilen.",
    srcOutputs:
      "Datensätze, Software und Konferenzbeiträge, die mit deiner Kennung verknüpft sind.",
    srcGrants: "Förderungen und Drittmittel.",
    srcTrials: "klinische Studien, in denen du aufgeführt bist.",
    srcOther: "redaktionelle Rollen und Patente.",
    matchingHeading: "Wie es entscheidet, was zu dir gehört",
    matchingBody:
      "Alles, was über eine eindeutige Kennung übereinstimmt – deine ORCID oder die DOI einer Publikation – wird automatisch aufgenommen. Alles, was nur über Name und Organisation übereinstimmt (manche Förderer und Register haben keine Kennung), wird nie stillschweigend hinzugefügt: Es wird als Prüfkandidat markiert, den du bestätigst oder ablehnst. Dein eigener Name wird über die Kennung hervorgehoben, nie durch Abgleich des Namenstextes.",
    refreshHeading: "Wie oft er aktualisiert wird",
    refreshBody:
      "Dein Arbeits-Lebenslauf wird bei jeder Resynchronisierung aktualisiert. Ein als lebende Seite veröffentlichter Lebenslauf synchronisiert sich automatisch nach einem regelmäßigen Zeitplan erneut mit den Quellen und bleibt so ohne dein Zutun aktuell – und du kannst jederzeit selbst eine Aktualisierung auslösen.",
    logHeading: "Was wir protokollieren",
    logBody:
      "Standardmäßig nichts darüber, wie du die App nutzt. Die optionale, einwilligungsgebundene Forschungsprotokollierung (für Studien zur Autoren-Disambiguierung und zur Zusammenstellung von Lebensläufen) bleibt ausgeschaltet, bis ein Ethik-/IRB-Protokoll vorliegt, und zeichnet erst nach deiner ausdrücklichen Zustimmung etwas auf. Die Website-Analyse ist cookielos, eigenbetrieben und ausschließlich aggregiert – sie erstellt nie Profile von Einzelpersonen.",
    controlHeading: "Deine Kontrolle",
    controlBody:
      "Du entscheidest Feld für Feld, was veröffentlicht wird. Du kannst all deine Daten jederzeit exportieren, und das Löschen deines Kontos entfernt sie. Anzeige-Entscheidungen (was angezeigt wird, was als „nicht von mir“ verborgen wird) gehören dir und bleiben lokal in deinem Lebenslauf.",
    more: "Lies die vollständige Datenschutzerklärung und die Standards, die wir befolgen, oder sieh dir den Quellcode auf GitHub an:",
    navLabel: "Transparenz",
    backLink: "← Zurück zu SigmaCV",
  },
  "ja-JP": {
    metaTitle: "透明性",
    metaDescription:
      "SigmaCV があなたの CV データをどこから取得し、何を含めるかをどう判断し、公開された CV がどのくらいの頻度で更新され、何を記録するか——既定では何も記録しません。",
    heading: "透明性",
    intro:
      "SigmaCV はオープンな研究データベースからあなたの CV を構築し、各項目が正確にどこから来たのか、何があなたのものかをどう判断するのか、そしてあなたについて何を保存するのかを率直に示します。要するに、既定ではあなたの利用方法について何も記録しません。",
    sourcesHeading: "あなたの CV データはどこから来るのか",
    sourcesLead:
      "これらはすべてオープンで公開された情報源です。SigmaCV はあなたに代わってそこから読み取ります——決して書き戻しません：",
    srcPublications: "あなたの論文と、その引用メタデータおよび分野正規化指標。",
    srcIdentity: "検証済みの著者識別子、所属機関名、公開プロフィールへのリンク。",
    srcOutputs: "あなたの識別子に紐づくデータセット・ソフトウェア・会議論文。",
    srcGrants: "助成金と研究資金。",
    srcTrials: "あなたが登録されている臨床試験。",
    srcOther: "編集者としての役割と特許。",
    matchingHeading: "何があなたのものかをどう判断するか",
    matchingBody:
      "一意の識別子——あなたの ORCID や論文の DOI——で一致したものは自動的に含まれます。氏名と所属のみで一致したもの（一部の助成機関や登録機関には識別子がありません）は決して黙って追加されません。レビュー候補として印が付き、あなたが承認または却下します。あなた自身の名前は識別子によって強調され、名前の文字列の一致では決して強調されません。",
    refreshHeading: "更新の頻度",
    refreshBody:
      "作業中の CV は、あなたが再同期するたびに更新されます。ライブページとして公開した CV は、定期的なスケジュールで自動的に情報源から再同期されるため、あなたが何もしなくても最新の状態に保たれます——また、いつでも自分で更新を実行できます。",
    logHeading: "私たちが記録するもの",
    logBody:
      "既定では、あなたのアプリの使い方については何も記録しません。任意で同意が必要な研究ログ（著者の名寄せと CV 構成に関する研究のため）は、倫理／IRB の手続きが整うまでオフのままであり、あなたが明示的に同意した後にのみ記録します。サイトの分析は Cookie を使わず、ファーストパーティで集計のみ——個人をプロファイリングすることは決してありません。",
    controlHeading: "あなたの管理",
    controlBody:
      "何を公開するかをフィールドごとに選べます。いつでも全データをエクスポートでき、アカウントを削除すればデータも削除されます。表示の選択（何を表示し、何を「自分のものではない」として非表示にするか）はあなたのもので、あなたの CV 内にローカルに保持されます。",
    more: "完全なプライバシーポリシーと私たちが従う基準をお読みいただくか、GitHub でソースコードをご確認ください：",
    navLabel: "透明性",
    backLink: "← SigmaCV に戻る",
  },
  "pt-BR": {
    metaTitle: "Transparência",
    metaDescription:
      "De onde o SigmaCV obtém os dados do seu currículo, como decide o que incluir, com que frequência um currículo publicado é atualizado e o que registra — nada, por padrão.",
    heading: "Transparência",
    intro:
      "O SigmaCV monta o seu currículo a partir de bases de dados abertas de pesquisa e é honesto sobre de onde vem exatamente cada entrada, como decide o que é seu e o que armazena sobre você. Em resumo: por padrão, não registra nada sobre como você o usa.",
    sourcesHeading: "De onde vêm os dados do seu currículo",
    sourcesLead:
      "Todas estas são fontes abertas e públicas. O SigmaCV lê delas em seu nome — nunca grava de volta nelas:",
    srcPublications:
      "suas publicações, com metadados de citação e indicadores normalizados por área.",
    srcIdentity:
      "seu identificador de autor verificado, nomes de instituições e links de perfis públicos.",
    srcOutputs:
      "conjuntos de dados, software e artigos de conferência vinculados ao seu identificador.",
    srcGrants: "financiamentos e auxílios.",
    srcTrials: "ensaios clínicos em que você consta.",
    srcOther: "funções editoriais e patentes.",
    matchingHeading: "Como ele decide o que é seu",
    matchingBody:
      "Tudo que corresponde por um identificador único — seu ORCID ou o DOI de uma publicação — é incluído automaticamente. Tudo que corresponde apenas por nome e organização (alguns financiadores e registros não têm identificador) nunca é adicionado silenciosamente: é marcado como candidato a revisão para que você confirme ou rejeite. Seu próprio nome é destacado por identificador, nunca por correspondência do texto de um nome.",
    refreshHeading: "Com que frequência é atualizado",
    refreshBody:
      "Seu currículo de trabalho é atualizado sempre que você sincroniza novamente. Um currículo que você publica como página viva ressincroniza das fontes automaticamente em uma programação regular, mantendo-se atual sem nenhuma ação sua — e você pode disparar uma atualização por conta própria a qualquer momento.",
    logHeading: "O que registramos",
    logBody:
      "Por padrão, nada sobre como você usa o aplicativo. O registro de pesquisa opcional e sujeito a consentimento (para estudos sobre desambiguação de autores e composição de currículos) permanece desligado até que exista um protocolo ético/IRB e só registra algo depois que você optar explicitamente por participar. A análise do site é sem cookies, de origem própria e apenas agregada — nunca cria perfis de indivíduos.",
    controlHeading: "Seu controle",
    controlBody:
      "Você escolhe o que é publicado, campo por campo. Pode exportar todos os seus dados a qualquer momento, e excluir sua conta os remove. As escolhas de exibição (o que mostrar, o que ocultar como «não é meu») são suas e permanecem locais ao seu currículo.",
    more: "Leia a política de privacidade completa e os padrões que seguimos, ou inspecione o código-fonte no GitHub:",
    navLabel: "Transparência",
    backLink: "← Voltar ao SigmaCV",
  },
  "it-IT": {
    metaTitle: "Trasparenza",
    metaDescription:
      "Da dove SigmaCV ottiene i dati del tuo CV, come decide cosa includere, con quale frequenza un CV pubblicato si aggiorna e cosa registra: nulla, per impostazione predefinita.",
    heading: "Trasparenza",
    intro:
      "SigmaCV costruisce il tuo CV a partire da banche dati di ricerca aperte ed è onesto su da dove proviene esattamente ogni voce, su come decide cosa è tuo e su cosa memorizza su di te. In breve: per impostazione predefinita non registra nulla su come lo usi.",
    sourcesHeading: "Da dove provengono i dati del tuo CV",
    sourcesLead:
      "Sono tutte fonti aperte e pubbliche. SigmaCV legge da esse per tuo conto — non vi riscrive mai:",
    srcPublications:
      "le tue pubblicazioni, con i metadati di citazione e indicatori normalizzati per campo.",
    srcIdentity:
      "il tuo identificativo d'autore verificato, i nomi delle istituzioni e i link ai profili pubblici.",
    srcOutputs: "set di dati, software e atti di convegno collegati al tuo identificativo.",
    srcGrants: "finanziamenti e fondi.",
    srcTrials: "le sperimentazioni cliniche in cui compari.",
    srcOther: "ruoli editoriali e brevetti.",
    matchingHeading: "Come decide cosa è tuo",
    matchingBody:
      "Tutto ciò che corrisponde tramite un identificativo univoco — il tuo ORCID o il DOI di una pubblicazione — viene incluso automaticamente. Tutto ciò che corrisponde solo per nome e organizzazione (alcuni finanziatori e registri non hanno un identificativo) non viene mai aggiunto in silenzio: viene segnalato come candidato da rivedere, che tu confermi o rifiuti. Il tuo nome viene evidenziato tramite l'identificativo, mai per corrispondenza del testo di un nome.",
    refreshHeading: "Con quale frequenza si aggiorna",
    refreshBody:
      "Il tuo CV di lavoro si aggiorna ogni volta che esegui una nuova sincronizzazione. Un CV che pubblichi come pagina viva si risincronizza dalle fonti automaticamente secondo una pianificazione regolare, restando così aggiornato senza alcuna azione da parte tua — e puoi avviare un aggiornamento tu stesso in qualsiasi momento.",
    logHeading: "Cosa registriamo",
    logBody:
      "Per impostazione predefinita, nulla su come usi l'applicazione. La registrazione a fini di ricerca, facoltativa e soggetta a consenso (per studi sulla disambiguazione degli autori e sulla composizione dei CV), resta disattivata finché non esiste un protocollo etico/IRB e registra qualcosa solo dopo che hai aderito esplicitamente. Le statistiche del sito sono senza cookie, di prima parte e solo aggregate — non profilano mai le persone.",
    controlHeading: "Il tuo controllo",
    controlBody:
      "Scegli cosa viene pubblicato, campo per campo. Puoi esportare tutti i tuoi dati in qualsiasi momento, e l'eliminazione del tuo account li rimuove. Le scelte di visualizzazione (cosa mostrare, cosa nascondere come «non è mio») sono tue e restano locali al tuo CV.",
    more: "Leggi l'informativa sulla privacy completa e gli standard che seguiamo, oppure ispeziona il codice sorgente su GitHub:",
    navLabel: "Trasparenza",
    backLink: "← Torna a SigmaCV",
  },
  "ko-KR": {
    metaTitle: "투명성",
    metaDescription:
      "SigmaCV가 당신의 CV 데이터를 어디서 가져오는지, 무엇을 포함할지 어떻게 결정하는지, 게시된 CV가 얼마나 자주 갱신되는지, 그리고 무엇을 기록하는지 — 기본적으로는 아무것도 기록하지 않습니다.",
    heading: "투명성",
    intro:
      "SigmaCV는 개방형 연구 데이터베이스에서 당신의 CV를 구성하며, 각 항목이 정확히 어디서 왔는지, 무엇이 당신의 것인지 어떻게 판단하는지, 그리고 당신에 대해 무엇을 저장하는지 솔직하게 밝힙니다. 요약하면, 기본적으로 당신이 앱을 어떻게 사용하는지에 대해 아무것도 기록하지 않습니다.",
    sourcesHeading: "당신의 CV 데이터는 어디서 오는가",
    sourcesLead:
      "이들은 모두 개방되고 공개된 출처입니다. SigmaCV는 당신을 대신해 이들로부터 읽기만 하며, 절대 되쓰지 않습니다:",
    srcPublications: "당신의 논문과 그 인용 메타데이터 및 분야 정규화 지표.",
    srcIdentity: "검증된 저자 식별자, 소속 기관명, 공개 프로필 링크.",
    srcOutputs: "당신의 식별자에 연결된 데이터셋, 소프트웨어, 학술대회 논문.",
    srcGrants: "연구비와 보조금.",
    srcTrials: "당신이 등재된 임상시험.",
    srcOther: "편집 역할과 특허.",
    matchingHeading: "무엇이 당신의 것인지 어떻게 판단하는가",
    matchingBody:
      "고유 식별자 — 당신의 ORCID나 논문의 DOI — 로 일치하는 것은 자동으로 포함됩니다. 이름과 소속으로만 일치하는 것(일부 지원 기관과 등록처에는 식별자가 없습니다)은 결코 조용히 추가되지 않습니다. 검토 후보로 표시되어 당신이 확인하거나 거부합니다. 당신 자신의 이름은 식별자로 강조되며, 이름 문자열의 일치로는 결코 강조되지 않습니다.",
    refreshHeading: "얼마나 자주 갱신되는가",
    refreshBody:
      "작업 중인 CV는 다시 동기화할 때마다 갱신됩니다. 살아 있는 페이지로 게시한 CV는 정기적인 일정에 따라 출처에서 자동으로 다시 동기화되어, 당신이 아무 작업을 하지 않아도 최신 상태로 유지됩니다 — 그리고 언제든지 직접 갱신을 실행할 수 있습니다.",
    logHeading: "우리가 기록하는 것",
    logBody:
      "기본적으로, 당신이 앱을 어떻게 사용하는지에 대해서는 아무것도 기록하지 않습니다. 선택적이고 동의가 필요한 연구 기록(저자 식별 모호성 해소 및 CV 구성에 관한 연구를 위한)은 윤리/IRB 프로토콜이 마련될 때까지 꺼져 있으며, 당신이 명시적으로 동의한 후에만 무언가를 기록합니다. 사이트 분석은 쿠키를 사용하지 않고, 자체적이며, 집계 전용입니다 — 결코 개인을 프로파일링하지 않습니다.",
    controlHeading: "당신의 통제권",
    controlBody:
      "무엇을 게시할지 항목별로 선택합니다. 언제든지 모든 데이터를 내보낼 수 있으며, 계정을 삭제하면 데이터도 제거됩니다. 표시 선택(무엇을 보이고, 무엇을 '내 것이 아님'으로 숨길지)은 당신의 것이며 당신의 CV에 로컬로 유지됩니다.",
    more: "전체 개인정보 처리방침과 우리가 따르는 표준을 읽어 보거나, GitHub에서 소스 코드를 확인하세요:",
    navLabel: "투명성",
    backLink: "← SigmaCV로 돌아가기",
  },
  "ru-RU": {
    metaTitle: "Прозрачность",
    metaDescription:
      "Откуда SigmaCV берёт данные вашего резюме, как решает, что включить, как часто обновляется опубликованное резюме и что он регистрирует — по умолчанию ничего.",
    heading: "Прозрачность",
    intro:
      "SigmaCV формирует ваше резюме из открытых исследовательских баз данных и честно сообщает, откуда именно взята каждая запись, как он определяет, что принадлежит вам, и что он хранит о вас. Если коротко: по умолчанию он не регистрирует ничего о том, как вы им пользуетесь.",
    sourcesHeading: "Откуда берутся данные вашего резюме",
    sourcesLead:
      "Всё это — открытые, общедоступные источники. SigmaCV читает из них от вашего имени и никогда не записывает в них обратно:",
    srcPublications:
      "ваши публикации с библиографическими метаданными и нормированными по области показателями.",
    srcIdentity:
      "ваш подтверждённый идентификатор автора, названия организаций и ссылки на публичные профили.",
    srcOutputs:
      "наборы данных, программное обеспечение и материалы конференций, связанные с вашим идентификатором.",
    srcGrants: "финансирование и гранты.",
    srcTrials: "клинические испытания, в которых вы указаны.",
    srcOther: "редакционные роли и патенты.",
    matchingHeading: "Как он определяет, что принадлежит вам",
    matchingBody:
      "Всё, что сопоставлено по уникальному идентификатору — вашему ORCID или DOI публикации — включается автоматически. Всё, что сопоставлено только по имени и организации (у некоторых фондов и реестров нет идентификатора), никогда не добавляется молча: оно помечается как кандидат на проверку, который вы подтверждаете или отклоняете. Ваше собственное имя выделяется по идентификатору, а не по совпадению текста имени.",
    refreshHeading: "Как часто оно обновляется",
    refreshBody:
      "Ваше рабочее резюме обновляется при каждой повторной синхронизации. Резюме, опубликованное как «живая» страница, автоматически повторно синхронизируется из источников по регулярному расписанию, поэтому остаётся актуальным без каких-либо действий с вашей стороны — и вы можете запустить обновление сами в любой момент.",
    logHeading: "Что мы регистрируем",
    logBody:
      "По умолчанию — ничего о том, как вы пользуетесь приложением. Необязательная регистрация для исследований, требующая согласия (для исследований по разрешению неоднозначности авторов и составу резюме), остаётся отключённой до тех пор, пока не появится этический протокол/IRB, и записывает что-либо только после вашего явного согласия. Аналитика сайта не использует cookie, является собственной и только агрегированной — она никогда не профилирует отдельных людей.",
    controlHeading: "Ваш контроль",
    controlBody:
      "Вы выбираете, что публикуется, поле за полем. Вы можете в любой момент экспортировать все свои данные, а удаление учётной записи их стирает. Выбор отображения (что показывать, что скрыть как «не моё») принадлежит вам и остаётся локальным для вашего резюме.",
    more: "Прочитайте полную политику конфиденциальности и стандарты, которым мы следуем, или изучите исходный код на GitHub:",
    navLabel: "Прозрачность",
    backLink: "← Назад к SigmaCV",
  },
};

/** Localized "Transparency" page copy (falls back to English). */
export function transparencyStrings(locale: string): TransparencyStrings {
  return TRANSPARENCY_I18N[asLocale(locale)];
}
