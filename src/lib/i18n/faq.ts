import { asLocale, type Locale } from "./index";

/**
 * FAQ copy, localized for all 10 supported languages. Typed as
 * Record<Locale, FaqStrings> so a missing translation is a compile error.
 * Used by the default `/faq` and the localized `/[locale]/faq` routes, and the
 * FAQPage JSON-LD builder.
 *
 * Every locale has the SAME 6 questions in the SAME order; proper nouns
 * (SigmaCV, OpenAlex, ORCID, Crossref, DataCite, Open Editors Plus) are kept
 * untranslated. `navLabel` is the short footer label.
 */
export interface FaqStrings {
  metaTitle: string;
  metaDescription: string;
  heading: string;
  navLabel: string;
  backLink: string;
  items: { q: string; a: string }[];
}

const FAQ_I18N: Record<Locale, FaqStrings> = {
  "en-US": {
    metaTitle: "FAQ",
    metaDescription:
      "Frequently asked questions about SigmaCV: what it is, whether it's free, where the data comes from, how publications are matched, metrics, and privacy.",
    heading: "Frequently asked questions",
    navLabel: "FAQ",
    backLink: "← Back to SigmaCV",
    items: [
      {
        q: "What is SigmaCV?",
        a: "SigmaCV is open infrastructure for responsible research assessment. It auto-generates clean, customizable academic CVs from open research data and keeps them in sync with the open record — you curate what shows, choose the style, and export to PDF, DOCX, LaTeX or Markdown.",
      },
      {
        q: "Is it free?",
        a: "Yes. SigmaCV is free for individuals and open source under the Apache-2.0 licence. You can self-host it or use the hosted instance at no cost.",
      },
      {
        q: "Where does the data come from?",
        a: "From open research data sources: OpenAlex for publications and metrics, ORCID for your verified identity, Crossref and DataCite for metadata, and Open Editors Plus for editorial roles. SigmaCV reads only public metadata.",
      },
      {
        q: "How do you know which publications are mine?",
        a: "Your work is matched by identifier — your ORCID iD or OpenAlex author ID — never by name string, which avoids the name-collision errors that plague name-based matching. You then curate the list, marking anything wrongly attributed as “not mine”.",
      },
      {
        q: "Will citation metrics or the Impact Factor be shown?",
        a: "No metrics are shown by default. Metrics are opt-in and you choose them; we prefer field-normalized indicators over raw counts, and we never display a journal's Impact Factor on your CV.",
      },
      {
        q: "How is my privacy protected, and can I export or delete my data?",
        a: "SigmaCV reads only public research metadata, asks for per-field consent before anything is published, and never logs your curation choices for research without your explicit consent. You can export your data and delete your account at any time.",
      },
    ],
  },
  "zh-CN": {
    metaTitle: "常见问题",
    metaDescription:
      "关于 SigmaCV 的常见问题：它是什么、是否免费、数据来源、如何匹配论文、指标以及隐私。",
    heading: "常见问题",
    navLabel: "常见问题",
    backLink: "← 返回 SigmaCV",
    items: [
      {
        q: "SigmaCV 是什么？",
        a: "SigmaCV 是负责任研究评价的开放基础设施。它根据开放研究数据自动生成简洁、可定制的学术简历，并使其与公开记录保持同步——您可以策划显示的内容、选择样式，并导出为 PDF、DOCX、LaTeX 或 Markdown。",
      },
      {
        q: "它是免费的吗？",
        a: "是的。SigmaCV 对个人免费，并在 Apache-2.0 许可下开源。您可以自行部署，或免费使用托管实例。",
      },
      {
        q: "数据来自哪里？",
        a: "来自开放研究数据源：OpenAlex 提供论文和指标，ORCID 提供您的已验证身份，Crossref 和 DataCite 提供元数据，Open Editors Plus 提供编辑职务。SigmaCV 仅读取公开的元数据。",
      },
      {
        q: "你们如何知道哪些论文是我的？",
        a: "您的成果通过标识符匹配——您的 ORCID iD 或 OpenAlex 作者 ID——而绝不通过姓名字符串，从而避免了基于姓名匹配常见的同名冲突错误。随后由您策划该列表，将任何被错误归属的条目标记为“不是我的”。",
      },
      {
        q: "会显示引用指标或影响因子吗？",
        a: "默认不显示任何指标。指标为可选项，由您选择；我们更倾向使用领域归一化的指标而非原始计数，并且绝不会在您的简历上显示期刊的影响因子。",
      },
      {
        q: "我的隐私如何受到保护？我可以导出或删除我的数据吗？",
        a: "SigmaCV 仅读取公开的研究元数据，在发布任何内容前会逐字段征求同意，并且未经您的明确同意绝不会为研究目的记录您的策划选择。您可以随时导出您的数据并删除您的账户。",
      },
    ],
  },
  "es-ES": {
    metaTitle: "Preguntas frecuentes",
    metaDescription:
      "Preguntas frecuentes sobre SigmaCV: qué es, si es gratuito, de dónde proceden los datos, cómo se identifican las publicaciones, las métricas y la privacidad.",
    heading: "Preguntas frecuentes",
    navLabel: "Preguntas frecuentes",
    backLink: "← Volver a SigmaCV",
    items: [
      {
        q: "¿Qué es SigmaCV?",
        a: "SigmaCV es infraestructura abierta para la evaluación responsable de la investigación. Genera automáticamente CV académicos limpios y personalizables a partir de datos de investigación abiertos y los mantiene sincronizados con el registro abierto: tú decides qué se muestra, eliges el estilo y exportas a PDF, DOCX, LaTeX o Markdown.",
      },
      {
        q: "¿Es gratuito?",
        a: "Sí. SigmaCV es gratuito para particulares y de código abierto bajo la licencia Apache-2.0. Puedes autoalojarlo o usar la instancia alojada sin coste.",
      },
      {
        q: "¿De dónde proceden los datos?",
        a: "De fuentes de datos de investigación abiertos: OpenAlex para publicaciones y métricas, ORCID para tu identidad verificada, Crossref y DataCite para los metadatos, y Open Editors Plus para las funciones editoriales. SigmaCV solo lee metadatos públicos.",
      },
      {
        q: "¿Cómo sabéis qué publicaciones son mías?",
        a: "Tu trabajo se identifica mediante identificador —tu iD ORCID o tu ID de autor de OpenAlex—, nunca por la cadena del nombre, lo que evita los errores de homonimia propios de la coincidencia por nombre. Después tú revisas la lista y marcas como «no es mío» todo lo atribuido por error.",
      },
      {
        q: "¿Se mostrarán métricas de citación o el factor de impacto?",
        a: "No se muestra ninguna métrica de forma predeterminada. Las métricas son opcionales y las eliges tú; preferimos indicadores normalizados por campo frente a los recuentos brutos, y nunca mostramos el factor de impacto de una revista en tu CV.",
      },
      {
        q: "¿Cómo se protege mi privacidad y puedo exportar o eliminar mis datos?",
        a: "SigmaCV solo lee metadatos públicos de investigación, pide consentimiento campo por campo antes de publicar nada y nunca registra tus decisiones de curación con fines de investigación sin tu consentimiento explícito. Puedes exportar tus datos y eliminar tu cuenta en cualquier momento.",
      },
    ],
  },
  "fr-FR": {
    metaTitle: "FAQ",
    metaDescription:
      "Questions fréquentes sur SigmaCV : ce que c'est, sa gratuité, l'origine des données, l'association des publications, les métriques et la confidentialité.",
    heading: "Questions fréquentes",
    navLabel: "FAQ",
    backLink: "← Retour à SigmaCV",
    items: [
      {
        q: "Qu'est-ce que SigmaCV ?",
        a: "SigmaCV est une infrastructure ouverte au service d'une évaluation responsable de la recherche. Elle génère automatiquement des CV académiques épurés et personnalisables à partir de données de recherche ouvertes et les garde synchronisés avec le corpus ouvert : vous choisissez ce qui s'affiche, le style, et exportez en PDF, DOCX, LaTeX ou Markdown.",
      },
      {
        q: "Est-ce gratuit ?",
        a: "Oui. SigmaCV est gratuit pour les particuliers et open source sous licence Apache-2.0. Vous pouvez l'héberger vous-même ou utiliser l'instance hébergée sans frais.",
      },
      {
        q: "D'où proviennent les données ?",
        a: "De sources de données de recherche ouvertes : OpenAlex pour les publications et les métriques, ORCID pour votre identité vérifiée, Crossref et DataCite pour les métadonnées, et Open Editors Plus pour les fonctions éditoriales. SigmaCV ne lit que des métadonnées publiques.",
      },
      {
        q: "Comment savez-vous quelles publications sont les miennes ?",
        a: "Vos travaux sont associés par identifiant — votre iD ORCID ou votre identifiant auteur OpenAlex —, jamais par la chaîne du nom, ce qui évite les erreurs d'homonymie inhérentes à l'association par nom. Vous révisez ensuite la liste et marquez « pas de moi » tout ce qui est attribué à tort.",
      },
      {
        q: "Des métriques de citation ou le facteur d'impact seront-ils affichés ?",
        a: "Aucune métrique n'est affichée par défaut. Les métriques sont optionnelles et c'est vous qui les choisissez ; nous privilégions les indicateurs normalisés par champ aux comptages bruts, et nous n'affichons jamais le facteur d'impact d'une revue sur votre CV.",
      },
      {
        q: "Comment ma vie privée est-elle protégée, et puis-je exporter ou supprimer mes données ?",
        a: "SigmaCV ne lit que les métadonnées publiques de recherche, demande un consentement champ par champ avant toute publication et n'enregistre jamais vos choix de curation à des fins de recherche sans votre consentement explicite. Vous pouvez exporter vos données et supprimer votre compte à tout moment.",
      },
    ],
  },
  "de-DE": {
    metaTitle: "FAQ",
    metaDescription:
      "Häufige Fragen zu SigmaCV: was es ist, ob es kostenlos ist, woher die Daten stammen, wie Publikationen zugeordnet werden, Metriken und Datenschutz.",
    heading: "Häufig gestellte Fragen",
    navLabel: "FAQ",
    backLink: "← Zurück zu SigmaCV",
    items: [
      {
        q: "Was ist SigmaCV?",
        a: "SigmaCV ist offene Infrastruktur für verantwortungsvolle Forschungsbewertung. Es erstellt automatisch übersichtliche, anpassbare akademische Lebensläufe aus offenen Forschungsdaten und hält sie mit dem offenen Verzeichnis synchron — Sie kuratieren, was angezeigt wird, wählen den Stil und exportieren als PDF, DOCX, LaTeX oder Markdown.",
      },
      {
        q: "Ist es kostenlos?",
        a: "Ja. SigmaCV ist für Einzelpersonen kostenlos und quelloffen unter der Apache-2.0-Lizenz. Sie können es selbst hosten oder die gehostete Instanz kostenlos nutzen.",
      },
      {
        q: "Woher stammen die Daten?",
        a: "Aus offenen Forschungsdatenquellen: OpenAlex für Publikationen und Metriken, ORCID für Ihre verifizierte Identität, Crossref und DataCite für Metadaten und Open Editors Plus für Herausgebertätigkeiten. SigmaCV liest ausschließlich öffentliche Metadaten.",
      },
      {
        q: "Woher wissen Sie, welche Publikationen von mir sind?",
        a: "Ihre Arbeiten werden anhand einer Kennung zugeordnet — Ihrer ORCID iD oder Ihrer OpenAlex-Autoren-ID —, niemals anhand der Namenszeichenkette, was die Namensverwechslungen vermeidet, die der namensbasierten Zuordnung anhaften. Anschließend kuratieren Sie die Liste und markieren fälschlich Zugeordnetes als „nicht von mir“.",
      },
      {
        q: "Werden Zitationsmetriken oder der Impact-Faktor angezeigt?",
        a: "Standardmäßig werden keine Metriken angezeigt. Metriken sind optional und Sie wählen sie aus; wir bevorzugen feldnormierte Indikatoren gegenüber Rohzählungen und zeigen niemals den Impact-Faktor einer Zeitschrift in Ihrem Lebenslauf an.",
      },
      {
        q: "Wie wird meine Privatsphäre geschützt, und kann ich meine Daten exportieren oder löschen?",
        a: "SigmaCV liest ausschließlich öffentliche Forschungsmetadaten, fragt vor jeder Veröffentlichung feldweise um Einwilligung und protokolliert Ihre Kuratierungsentscheidungen niemals ohne Ihre ausdrückliche Einwilligung zu Forschungszwecken. Sie können Ihre Daten jederzeit exportieren und Ihr Konto löschen.",
      },
    ],
  },
  "ja-JP": {
    metaTitle: "よくある質問",
    metaDescription:
      "SigmaCV に関するよくある質問：何ができるか、無料かどうか、データの出所、論文の照合方法、指標、プライバシーについて。",
    heading: "よくある質問",
    navLabel: "よくある質問",
    backLink: "← SigmaCV に戻る",
    items: [
      {
        q: "SigmaCV とは何ですか？",
        a: "SigmaCV は、責任ある研究評価のためのオープンインフラです。オープンな研究データから洗練されたカスタマイズ可能な学術用 CV を自動生成し、公開記録と同期させます。表示する内容を取捨選択し、スタイルを選び、PDF・DOCX・LaTeX・Markdown に書き出せます。",
      },
      {
        q: "無料ですか？",
        a: "はい。SigmaCV は個人には無料で、Apache-2.0 ライセンスのオープンソースです。ご自身でホスティングすることも、ホスト版を無料で利用することもできます。",
      },
      {
        q: "データはどこから来ますか？",
        a: "オープンな研究データソースからです。論文と指標は OpenAlex、検証済みの本人確認は ORCID、メタデータは Crossref と DataCite、編集者としての役割は Open Editors Plus を利用します。SigmaCV は公開されたメタデータのみを読み取ります。",
      },
      {
        q: "どの論文が自分のものか、どうやって判断しているのですか？",
        a: "あなたの業績は識別子（ORCID iD または OpenAlex の著者 ID）で照合され、名前の文字列では一切照合しません。これにより、名前ベースの照合につきものの同姓同名による誤りを避けられます。その後、あなたが一覧を確認し、誤って帰属されたものを「自分のではない」と印付けします。",
      },
      {
        q: "引用指標やインパクトファクターは表示されますか？",
        a: "既定では指標は一切表示しません。指標はオプトインで、あなたが選びます。私たちは生のカウントよりも分野で正規化された指標を重視し、ジャーナルのインパクトファクターを CV に表示することは決してありません。",
      },
      {
        q: "プライバシーはどのように保護されますか。データのエクスポートや削除はできますか？",
        a: "SigmaCV は公開された研究メタデータのみを読み取り、公開前に項目ごとに同意を求め、明示的な同意なしに研究目的であなたの取捨選択を記録することは決してありません。データのエクスポートやアカウントの削除はいつでも可能です。",
      },
    ],
  },
  "pt-BR": {
    metaTitle: "Perguntas frequentes",
    metaDescription:
      "Perguntas frequentes sobre o SigmaCV: o que é, se é gratuito, de onde vêm os dados, como as publicações são identificadas, métricas e privacidade.",
    heading: "Perguntas frequentes",
    navLabel: "Perguntas frequentes",
    backLink: "← Voltar ao SigmaCV",
    items: [
      {
        q: "O que é o SigmaCV?",
        a: "O SigmaCV é uma infraestrutura aberta para a avaliação responsável da pesquisa. Ele gera automaticamente currículos acadêmicos limpos e personalizáveis a partir de dados abertos de pesquisa e os mantém sincronizados com o registro aberto — você cura o que aparece, escolhe o estilo e exporta para PDF, DOCX, LaTeX ou Markdown.",
      },
      {
        q: "É gratuito?",
        a: "Sim. O SigmaCV é gratuito para indivíduos e de código aberto sob a licença Apache-2.0. Você pode hospedá-lo por conta própria ou usar a instância hospedada sem custo.",
      },
      {
        q: "De onde vêm os dados?",
        a: "De fontes de dados abertos de pesquisa: OpenAlex para publicações e métricas, ORCID para a sua identidade verificada, Crossref e DataCite para metadados, e Open Editors Plus para funções editoriais. O SigmaCV lê apenas metadados públicos.",
      },
      {
        q: "Como vocês sabem quais publicações são minhas?",
        a: "Seu trabalho é identificado por identificador — seu iD ORCID ou seu ID de autor do OpenAlex —, nunca pela cadeia do nome, o que evita os erros de homonímia típicos da correspondência por nome. Depois você cura a lista e marca como «não é meu» tudo o que for atribuído por engano.",
      },
      {
        q: "Métricas de citação ou o Fator de Impacto serão exibidos?",
        a: "Nenhuma métrica é exibida por padrão. As métricas são opcionais e você as escolhe; preferimos indicadores normalizados por área a contagens brutas, e nunca exibimos o Fator de Impacto de um periódico no seu currículo.",
      },
      {
        q: "Como minha privacidade é protegida e posso exportar ou excluir meus dados?",
        a: "O SigmaCV lê apenas metadados públicos de pesquisa, pede consentimento campo a campo antes de publicar qualquer coisa e nunca registra suas escolhas de curadoria para pesquisa sem o seu consentimento explícito. Você pode exportar seus dados e excluir sua conta a qualquer momento.",
      },
    ],
  },
  "it-IT": {
    metaTitle: "FAQ",
    metaDescription:
      "Domande frequenti su SigmaCV: cos'è, se è gratuito, da dove provengono i dati, come vengono abbinate le pubblicazioni, le metriche e la privacy.",
    heading: "Domande frequenti",
    navLabel: "FAQ",
    backLink: "← Torna a SigmaCV",
    items: [
      {
        q: "Che cos'è SigmaCV?",
        a: "SigmaCV è un'infrastruttura aperta per la valutazione responsabile della ricerca. Genera automaticamente CV accademici curati e personalizzabili a partire da dati di ricerca aperti e li mantiene sincronizzati con i dati aperti: tu decidi cosa mostrare, scegli lo stile ed esporti in PDF, DOCX, LaTeX o Markdown.",
      },
      {
        q: "È gratuito?",
        a: "Sì. SigmaCV è gratuito per i singoli individui e open source con licenza Apache-2.0. Puoi ospitarlo autonomamente oppure usare l'istanza ospitata senza costi.",
      },
      {
        q: "Da dove provengono i dati?",
        a: "Da fonti di dati di ricerca aperti: OpenAlex per pubblicazioni e metriche, ORCID per la tua identità verificata, Crossref e DataCite per i metadati e Open Editors Plus per gli incarichi editoriali. SigmaCV legge solo metadati pubblici.",
      },
      {
        q: "Come fate a sapere quali pubblicazioni sono mie?",
        a: "I tuoi lavori vengono abbinati tramite identificativo — il tuo iD ORCID o il tuo ID autore OpenAlex —, mai tramite la stringa del nome, evitando così gli errori di omonimia tipici dell'abbinamento per nome. Poi sei tu a curare l'elenco, contrassegnando come «non è mio» tutto ciò che è attribuito per errore.",
      },
      {
        q: "Verranno mostrate metriche di citazione o l'Impact Factor?",
        a: "Per impostazione predefinita non viene mostrata alcuna metrica. Le metriche sono facoltative e le scegli tu; preferiamo indicatori normalizzati per disciplina ai conteggi grezzi e non mostriamo mai l'Impact Factor di una rivista sul tuo CV.",
      },
      {
        q: "Come viene protetta la mia privacy e posso esportare o eliminare i miei dati?",
        a: "SigmaCV legge solo metadati pubblici di ricerca, chiede il consenso campo per campo prima di pubblicare qualsiasi cosa e non registra mai le tue scelte di curatela per la ricerca senza il tuo consenso esplicito. Puoi esportare i tuoi dati ed eliminare il tuo account in qualsiasi momento.",
      },
    ],
  },
  "ko-KR": {
    metaTitle: "자주 묻는 질문",
    metaDescription:
      "SigmaCV에 대한 자주 묻는 질문: 무엇인지, 무료인지, 데이터 출처, 논문 매칭 방식, 지표, 개인정보 보호.",
    heading: "자주 묻는 질문",
    navLabel: "자주 묻는 질문",
    backLink: "← SigmaCV로 돌아가기",
    items: [
      {
        q: "SigmaCV란 무엇인가요?",
        a: "SigmaCV는 책임 있는 연구 평가를 위한 오픈 인프라입니다. 공개 연구 데이터로부터 깔끔하고 맞춤 설정이 가능한 학술 이력서를 자동 생성하고 공개 기록과 동기화합니다. 무엇을 표시할지 직접 선별하고, 스타일을 고르고, PDF·DOCX·LaTeX·Markdown으로 내보낼 수 있습니다.",
      },
      {
        q: "무료인가요?",
        a: "네. SigmaCV는 개인에게 무료이며 Apache-2.0 라이선스의 오픈 소스입니다. 직접 호스팅하거나 호스팅 인스턴스를 무료로 이용할 수 있습니다.",
      },
      {
        q: "데이터는 어디에서 오나요?",
        a: "공개 연구 데이터 소스에서 가져옵니다. 논문과 지표는 OpenAlex, 검증된 신원은 ORCID, 메타데이터는 Crossref와 DataCite, 편집 활동은 Open Editors Plus를 이용합니다. SigmaCV는 공개된 메타데이터만 읽습니다.",
      },
      {
        q: "어떤 논문이 제 것인지 어떻게 아나요?",
        a: "회원님의 업적은 식별자(ORCID iD 또는 OpenAlex 저자 ID)로 매칭되며, 이름 문자열로는 절대 매칭하지 않습니다. 덕분에 이름 기반 매칭에서 흔한 동명이인 충돌 오류를 피할 수 있습니다. 이후 회원님이 목록을 선별하여 잘못 귀속된 항목을 ‘내 것이 아님’으로 표시합니다.",
      },
      {
        q: "인용 지표나 임팩트 팩터가 표시되나요?",
        a: "기본적으로 어떤 지표도 표시하지 않습니다. 지표는 선택 사항이며 회원님이 직접 고릅니다. 저희는 단순 집계보다 분야 정규화 지표를 선호하며, 학술지의 임팩트 팩터를 이력서에 표시하는 일은 결코 없습니다.",
      },
      {
        q: "제 개인정보는 어떻게 보호되며, 데이터를 내보내거나 삭제할 수 있나요?",
        a: "SigmaCV는 공개 연구 메타데이터만 읽고, 무언가를 게시하기 전에 항목별로 동의를 구하며, 명시적 동의 없이는 연구 목적으로 회원님의 선별 선택을 기록하지 않습니다. 언제든지 데이터를 내보내고 계정을 삭제할 수 있습니다.",
      },
    ],
  },
  "ru-RU": {
    metaTitle: "Частые вопросы",
    metaDescription:
      "Часто задаваемые вопросы о SigmaCV: что это, бесплатно ли, откуда берутся данные, как сопоставляются публикации, метрики и конфиденциальность.",
    heading: "Часто задаваемые вопросы",
    navLabel: "Частые вопросы",
    backLink: "← Назад к SigmaCV",
    items: [
      {
        q: "Что такое SigmaCV?",
        a: "SigmaCV — это открытая инфраструктура для ответственной оценки научных исследований. Сервис автоматически создаёт аккуратные, настраиваемые академические резюме на основе открытых научных данных и поддерживает их синхронизацию с открытыми записями: вы решаете, что отображать, выбираете стиль и экспортируете в PDF, DOCX, LaTeX или Markdown.",
      },
      {
        q: "Это бесплатно?",
        a: "Да. SigmaCV бесплатен для частных лиц и имеет открытый исходный код под лицензией Apache-2.0. Вы можете развернуть его самостоятельно или бесплатно использовать размещённый экземпляр.",
      },
      {
        q: "Откуда берутся данные?",
        a: "Из открытых источников научных данных: OpenAlex для публикаций и метрик, ORCID для вашей подтверждённой личности, Crossref и DataCite для метаданных и Open Editors Plus для редакционных ролей. SigmaCV считывает только публичные метаданные.",
      },
      {
        q: "Как вы определяете, какие публикации принадлежат мне?",
        a: "Ваши работы сопоставляются по идентификатору — вашему ORCID iD или идентификатору автора OpenAlex — и никогда по строке имени, что позволяет избежать ошибок совпадения имён, свойственных сопоставлению по имени. Затем вы просматриваете список и помечаете всё ошибочно приписанное как «не моё».",
      },
      {
        q: "Будут ли показываться метрики цитирования или импакт-фактор?",
        a: "По умолчанию метрики не отображаются. Метрики подключаются по желанию, и вы выбираете их сами; мы предпочитаем нормированные по области показатели сырым подсчётам и никогда не показываем импакт-фактор журнала в вашем резюме.",
      },
      {
        q: "Как защищена моя конфиденциальность и могу ли я экспортировать или удалить свои данные?",
        a: "SigmaCV считывает только публичные научные метаданные, запрашивает согласие по каждому полю перед публикацией и никогда не записывает ваши решения по курированию для исследований без вашего явного согласия. Вы можете экспортировать свои данные и удалить свою учётную запись в любое время.",
      },
    ],
  },
};

/** Localized FAQ copy (falls back to English for unknown locales). */
export function faqStrings(locale: string): FaqStrings {
  return FAQ_I18N[asLocale(locale)];
}
