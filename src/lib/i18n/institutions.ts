import { asLocale, type Locale } from "./index";

/**
 * Institution-page copy (`/i`, `/i/[ror]`), localized for all 10 supported
 * languages. Typed as Record<Locale, InstitutionStrings> so a missing
 * translation is a compile error.
 *
 * The pages state counts only. The copy therefore never ranks, scores or
 * compares, never uses compliance vocabulary, and never says an institution
 * "evaluates its researchers" — it says: read a verifiable CV a researcher
 * chooses to send you. Placeholders: `{name}` (institution), `{count}`
 * (listed researchers), `{id}` (the `ror:<id>` OAI set spec). Proper nouns
 * (SigmaCV, ROR, OAI-PMH, Dublin Core, Basile Chrétien) stay untranslated.
 */
export interface InstitutionStrings {
  indexMetaTitle: string;
  indexMetaDescription: string;
  indexHeading: string;
  indexIntro: string;
  indexEmpty: string;
  /** Page meta description; `{name}`. */
  metaDescription: string;
  listedOne: string;
  /** `{count}`. */
  listedMany: string;
  rorLabel: string;
  selfDeclared: string;
  oaiHeading: string;
  oaiBody: string;
  /** `{id}`. */
  oaiLink: string;
  aboutHeading: string;
  aboutController: string;
  aboutReader: string;
  aboutVoluntary: string;
  aboutNoRanking: string;
  aboutRequestLink: string;
  backToIndex: string;
  backLink: string;
  rateLimitedHeading: string;
  rateLimitedBody: string;
}

const INSTITUTIONS_I18N: Record<Locale, InstitutionStrings> = {
  "en-US": {
    indexMetaTitle: "Institutions",
    indexMetaDescription:
      "Institutions under which researchers chose to list their public SigmaCV CV — a count per institution, no roster, no ranking.",
    indexHeading: "Institutions",
    indexIntro:
      "Each institution below has at least one researcher who chose to list their public CV under it. The page shows how many did — a count only, never who, and never a comparison between institutions.",
    indexEmpty: "No researcher has chosen to be listed under an institution yet.",
    metaDescription:
      "Researchers who chose to list their public SigmaCV CV under {name}: a count only — no roster, no ranking, no score.",
    listedOne: "1 researcher lists this affiliation",
    listedMany: "{count} researchers list this affiliation",
    rorLabel: "ROR record",
    selfDeclared:
      "Each of them declared this affiliation on their own CV and chose to be listed here. The count is theirs, not the institution's: it is not a staff list and says nothing about anyone who is absent.",
    oaiHeading: "Machine access",
    oaiBody:
      "The listed CVs can be harvested as an OAI-PMH set (Dublin Core, one record per CV and per work):",
    oaiLink: "OAI-PMH set {id}",
    aboutHeading: "About this page",
    aboutController:
      "SigmaCV is operated by Basile Chrétien as an independent personal project — not by, or on behalf of, any university or employer — and he is the sole data controller for the personal data behind this page.",
    aboutReader:
      "The institution named here is a reader like anyone else: it receives nothing from SigmaCV, has no account, and instructs nothing about what is processed or shown.",
    aboutVoluntary:
      "Being listed is each researcher's own, revocable choice. Absence from this page means nothing: most researchers are not on SigmaCV, and those who are may simply not have opted in.",
    aboutNoRanking:
      "SigmaCV does not rank, score or compare researchers, here or anywhere. To read a verifiable CV, ask the researcher for a request link — they choose what to send you.",
    aboutRequestLink: "How request links work",
    backToIndex: "← All institutions",
    backLink: "← Back to SigmaCV",
    rateLimitedHeading: "Too many requests",
    rateLimitedBody:
      "There have been a lot of requests to this page in a short time. Please wait a moment and try again.",
  },
  "zh-CN": {
    indexMetaTitle: "机构",
    indexMetaDescription:
      "研究者选择将其 SigmaCV 公开简历列于其下的机构——每个机构一个数字，没有名单，没有排名。",
    indexHeading: "机构",
    indexIntro:
      "下列每个机构都至少有一位研究者选择将其公开简历列于该机构之下。页面只显示人数——仅为数量，绝不显示是谁，也绝不在机构之间进行比较。",
    indexEmpty: "尚无研究者选择列于某个机构之下。",
    metaDescription:
      "选择将其 SigmaCV 公开简历列于 {name} 之下的研究者：仅为数量——没有名单，没有排名，没有评分。",
    listedOne: "1 位研究者列出了此所属机构",
    listedMany: "{count} 位研究者列出了此所属机构",
    rorLabel: "ROR 记录",
    selfDeclared:
      "他们每一位都在自己的简历中申明了此所属机构，并选择在此列出。这个数字属于他们，而非机构：它不是员工名单，也不说明任何未出现在此的人。",
    oaiHeading: "机器访问",
    oaiBody: "已列出的简历可作为 OAI-PMH 集合采集（Dublin Core，每份简历及每项成果各一条记录）：",
    oaiLink: "OAI-PMH 集合 {id}",
    aboutHeading: "关于本页面",
    aboutController:
      "SigmaCV 由 Basile Chrétien 作为独立的个人项目运营——不属于也不代表任何大学或雇主——他是本页面背后个人数据的唯一数据控制者。",
    aboutReader:
      "此处列名的机构与任何人一样只是读者：它不从 SigmaCV 接收任何东西，没有账户，也不对处理或显示的内容作任何指示。",
    aboutVoluntary:
      "是否列出是每位研究者本人可撤回的选择。未出现在本页面不说明任何问题：大多数研究者并不使用 SigmaCV，而使用者也可能只是未选择加入。",
    aboutNoRanking:
      "SigmaCV 在此处或任何地方都不对研究者进行排名、评分或比较。要阅读可核验的简历，请向研究者索取请求链接——由他们决定发送给你什么。",
    aboutRequestLink: "请求链接如何运作",
    backToIndex: "← 所有机构",
    backLink: "← 返回 SigmaCV",
    rateLimitedHeading: "请求过多",
    rateLimitedBody: "短时间内对本页面的请求过多。请稍候再试。",
  },
  "es-ES": {
    indexMetaTitle: "Instituciones",
    indexMetaDescription:
      "Instituciones bajo las que los investigadores eligieron listar su CV público de SigmaCV: una cifra por institución, sin lista de personas, sin clasificación.",
    indexHeading: "Instituciones",
    indexIntro:
      "Cada institución de abajo tiene al menos un investigador que eligió listar su CV público bajo ella. La página muestra cuántos lo hicieron: solo una cifra, nunca quiénes, y nunca una comparación entre instituciones.",
    indexEmpty: "Ningún investigador ha elegido todavía ser listado bajo una institución.",
    metaDescription:
      "Investigadores que eligieron listar su CV público de SigmaCV bajo {name}: solo una cifra, sin lista de personas, sin clasificación, sin puntuación.",
    listedOne: "1 investigador lista esta afiliación",
    listedMany: "{count} investigadores listan esta afiliación",
    rorLabel: "Registro ROR",
    selfDeclared:
      "Cada uno de ellos declaró esta afiliación en su propio CV y eligió aparecer aquí. La cifra es suya, no de la institución: no es una lista de personal y no dice nada de quien no aparece.",
    oaiHeading: "Acceso automatizado",
    oaiBody:
      "Los CV listados pueden recolectarse como un conjunto OAI-PMH (Dublin Core, un registro por CV y por obra):",
    oaiLink: "Conjunto OAI-PMH {id}",
    aboutHeading: "Sobre esta página",
    aboutController:
      "SigmaCV lo opera Basile Chrétien como proyecto personal independiente —no por ni en nombre de ninguna universidad o empleador— y él es el único responsable del tratamiento de los datos personales que hay detrás de esta página.",
    aboutReader:
      "La institución aquí nombrada es un lector como cualquier otro: no recibe nada de SigmaCV, no tiene cuenta y no da instrucciones sobre qué se trata o se muestra.",
    aboutVoluntary:
      "Aparecer aquí es una decisión propia y revocable de cada investigador. No figurar en esta página no significa nada: la mayoría de los investigadores no están en SigmaCV, y quienes están pueden simplemente no haber activado la opción.",
    aboutNoRanking:
      "SigmaCV no clasifica, puntúa ni compara investigadores, ni aquí ni en ningún otro sitio. Para leer un CV verificable, pida al investigador un enlace de solicitud: él decide qué le envía.",
    aboutRequestLink: "Cómo funcionan los enlaces de solicitud",
    backToIndex: "← Todas las instituciones",
    backLink: "← Volver a SigmaCV",
    rateLimitedHeading: "Demasiadas solicitudes",
    rateLimitedBody:
      "Ha habido muchas solicitudes a esta página en poco tiempo. Espere un momento e inténtelo de nuevo.",
  },
  "fr-FR": {
    indexMetaTitle: "Établissements",
    indexMetaDescription:
      "Établissements sous lesquels des chercheurs ont choisi de lister leur CV public SigmaCV : un décompte par établissement, sans liste nominative, sans classement.",
    indexHeading: "Établissements",
    indexIntro:
      "Chaque établissement ci-dessous compte au moins un chercheur qui a choisi d'y lister son CV public. La page indique combien l'ont fait : un simple décompte, jamais qui, et jamais de comparaison entre établissements.",
    indexEmpty: "Aucun chercheur n'a encore choisi d'être listé sous un établissement.",
    metaDescription:
      "Chercheurs ayant choisi de lister leur CV public SigmaCV sous {name} : un simple décompte, sans liste nominative, sans classement, sans score.",
    listedOne: "1 chercheur liste cette affiliation",
    listedMany: "{count} chercheurs listent cette affiliation",
    rorLabel: "Fiche ROR",
    selfDeclared:
      "Chacun d'eux a déclaré cette affiliation sur son propre CV et a choisi de figurer ici. Le décompte est le leur, pas celui de l'établissement : ce n'est pas une liste du personnel et il ne dit rien de qui n'y figure pas.",
    oaiHeading: "Accès machine",
    oaiBody:
      "Les CV listés peuvent être moissonnés comme un ensemble OAI-PMH (Dublin Core, une notice par CV et par travail) :",
    oaiLink: "Ensemble OAI-PMH {id}",
    aboutHeading: "À propos de cette page",
    aboutController:
      "SigmaCV est exploité par Basile Chrétien dans le cadre d'un projet personnel indépendant — ni par, ni pour le compte d'une université ou d'un employeur — et il est l'unique responsable du traitement des données personnelles derrière cette page.",
    aboutReader:
      "L'établissement nommé ici est un lecteur comme un autre : il ne reçoit rien de SigmaCV, n'a pas de compte et ne donne aucune instruction sur ce qui est traité ou affiché.",
    aboutVoluntary:
      "Figurer ici est le choix propre et révocable de chaque chercheur. Ne pas y figurer ne signifie rien : la plupart des chercheurs ne sont pas sur SigmaCV, et ceux qui y sont peuvent simplement ne pas avoir activé l'option.",
    aboutNoRanking:
      "SigmaCV ne classe, ne note et ne compare pas les chercheurs, ici ou ailleurs. Pour lire un CV vérifiable, demandez au chercheur un lien de demande : c'est lui qui choisit ce qu'il vous envoie.",
    aboutRequestLink: "Comment fonctionnent les liens de demande",
    backToIndex: "← Tous les établissements",
    backLink: "← Retour à SigmaCV",
    rateLimitedHeading: "Trop de requêtes",
    rateLimitedBody:
      "Cette page a reçu beaucoup de requêtes en peu de temps. Patientez un instant, puis réessayez.",
  },
  "de-DE": {
    indexMetaTitle: "Einrichtungen",
    indexMetaDescription:
      "Einrichtungen, unter denen Forschende ihren öffentlichen SigmaCV-Lebenslauf listen ließen – eine Zahl je Einrichtung, keine Namensliste, kein Ranking.",
    indexHeading: "Einrichtungen",
    indexIntro:
      "Jede Einrichtung unten hat mindestens eine forschende Person, die ihren öffentlichen Lebenslauf darunter listen ließ. Die Seite zeigt, wie viele es sind – nur eine Zahl, nie wer, und nie ein Vergleich zwischen Einrichtungen.",
    indexEmpty: "Noch keine forschende Person hat sich unter einer Einrichtung listen lassen.",
    metaDescription:
      "Forschende, die ihren öffentlichen SigmaCV-Lebenslauf unter {name} listen ließen: nur eine Zahl – keine Namensliste, kein Ranking, keine Bewertung.",
    listedOne: "1 forschende Person gibt diese Zugehörigkeit an",
    listedMany: "{count} Forschende geben diese Zugehörigkeit an",
    rorLabel: "ROR-Eintrag",
    selfDeclared:
      "Jede dieser Personen hat diese Zugehörigkeit im eigenen Lebenslauf angegeben und sich entschieden, hier zu erscheinen. Die Zahl ist ihre, nicht die der Einrichtung: Sie ist keine Personalliste und sagt nichts über jemanden, der fehlt.",
    oaiHeading: "Maschineller Zugriff",
    oaiBody:
      "Die gelisteten Lebensläufe können als OAI-PMH-Set geerntet werden (Dublin Core, ein Datensatz je Lebenslauf und je Arbeit):",
    oaiLink: "OAI-PMH-Set {id}",
    aboutHeading: "Über diese Seite",
    aboutController:
      "SigmaCV wird von Basile Chrétien als unabhängiges persönliches Projekt betrieben – nicht von oder im Auftrag einer Universität oder eines Arbeitgebers – und er ist der alleinige Verantwortliche für die personenbezogenen Daten hinter dieser Seite.",
    aboutReader:
      "Die hier genannte Einrichtung ist eine Leserin wie jede andere: Sie erhält nichts von SigmaCV, hat kein Konto und gibt keine Anweisungen dazu, was verarbeitet oder angezeigt wird.",
    aboutVoluntary:
      "Gelistet zu werden ist die eigene, widerrufliche Entscheidung jeder forschenden Person. Das Fehlen auf dieser Seite bedeutet nichts: Die meisten Forschenden sind nicht auf SigmaCV, und wer es ist, hat die Option vielleicht einfach nicht aktiviert.",
    aboutNoRanking:
      "SigmaCV erstellt weder hier noch anderswo Rankings, Bewertungen oder Vergleiche von Forschenden. Um einen überprüfbaren Lebenslauf zu lesen, bitten Sie die forschende Person um einen Anfragelink – sie entscheidet, was sie Ihnen schickt.",
    aboutRequestLink: "So funktionieren Anfragelinks",
    backToIndex: "← Alle Einrichtungen",
    backLink: "← Zurück zu SigmaCV",
    rateLimitedHeading: "Zu viele Anfragen",
    rateLimitedBody:
      "Diese Seite hat in kurzer Zeit sehr viele Anfragen erhalten. Bitte warten Sie einen Moment und versuchen Sie es erneut.",
  },
  "ja-JP": {
    indexMetaTitle: "研究機関",
    indexMetaDescription:
      "研究者が自分の SigmaCV 公開 CV を掲載することを選んだ研究機関の一覧。機関ごとの人数のみで、名簿も順位付けもありません。",
    indexHeading: "研究機関",
    indexIntro:
      "以下の各機関には、その機関の下に公開 CV を掲載することを選んだ研究者が少なくとも 1 人います。このページに表示されるのは人数だけで、誰かは表示されず、機関同士の比較も行いません。",
    indexEmpty: "まだ、機関の下への掲載を選んだ研究者はいません。",
    metaDescription:
      "{name} の下に SigmaCV 公開 CV を掲載することを選んだ研究者：人数のみ。名簿も順位付けもスコアもありません。",
    listedOne: "1 人の研究者がこの所属を掲載しています",
    listedMany: "{count} 人の研究者がこの所属を掲載しています",
    rorLabel: "ROR レコード",
    selfDeclared:
      "各研究者は自分の CV でこの所属を申告し、ここに掲載されることを選びました。この人数は研究者自身のものであり、機関のものではありません。職員名簿ではなく、掲載されていない人については何も意味しません。",
    oaiHeading: "機械アクセス",
    oaiBody:
      "掲載された CV は OAI-PMH セットとして収集できます（Dublin Core、CV ごと・業績ごとに 1 レコード）：",
    oaiLink: "OAI-PMH セット {id}",
    aboutHeading: "このページについて",
    aboutController:
      "SigmaCV は Basile Chrétien が独立した個人プロジェクトとして運営しており、いかなる大学や雇用主によるもの、またはその代理でもありません。このページの背後にある個人データの唯一の管理者は本人です。",
    aboutReader:
      "ここに名前のある機関は、他の誰とも同じ読者にすぎません。SigmaCV から何も受け取らず、アカウントも持たず、何を処理・表示するかについて指示することもありません。",
    aboutVoluntary:
      "掲載は各研究者本人の、撤回可能な選択です。このページに載っていないことは何も意味しません。ほとんどの研究者は SigmaCV を使っておらず、使っている人も単にオプトインしていないだけかもしれません。",
    aboutNoRanking:
      "SigmaCV は、ここでも他のどこでも、研究者を順位付け・採点・比較しません。検証可能な CV を読むには、研究者本人にリクエストリンクを依頼してください。何を送るかは本人が決めます。",
    aboutRequestLink: "リクエストリンクの仕組み",
    backToIndex: "← すべての研究機関",
    backLink: "← SigmaCV に戻る",
    rateLimitedHeading: "リクエストが多すぎます",
    rateLimitedBody:
      "短時間にこのページへのリクエストが集中しました。少し待ってからもう一度お試しください。",
  },
  "pt-BR": {
    indexMetaTitle: "Instituições",
    indexMetaDescription:
      "Instituições sob as quais pesquisadores escolheram listar seu CV público do SigmaCV: uma contagem por instituição, sem lista de nomes, sem ranking.",
    indexHeading: "Instituições",
    indexIntro:
      "Cada instituição abaixo tem pelo menos um pesquisador que escolheu listar seu CV público sob ela. A página mostra quantos o fizeram: apenas uma contagem, nunca quem, e nunca uma comparação entre instituições.",
    indexEmpty: "Nenhum pesquisador escolheu ainda ser listado sob uma instituição.",
    metaDescription:
      "Pesquisadores que escolheram listar seu CV público do SigmaCV sob {name}: apenas uma contagem, sem lista de nomes, sem ranking, sem pontuação.",
    listedOne: "1 pesquisador lista esta afiliação",
    listedMany: "{count} pesquisadores listam esta afiliação",
    rorLabel: "Registro ROR",
    selfDeclared:
      "Cada um deles declarou esta afiliação em seu próprio CV e escolheu aparecer aqui. A contagem é deles, não da instituição: não é uma lista de pessoal e nada diz sobre quem não aparece.",
    oaiHeading: "Acesso por máquina",
    oaiBody:
      "Os CVs listados podem ser coletados como um conjunto OAI-PMH (Dublin Core, um registro por CV e por trabalho):",
    oaiLink: "Conjunto OAI-PMH {id}",
    aboutHeading: "Sobre esta página",
    aboutController:
      "O SigmaCV é operado por Basile Chrétien como um projeto pessoal independente — não por nenhuma universidade ou empregador, nem em nome deles — e ele é o único controlador dos dados pessoais por trás desta página.",
    aboutReader:
      "A instituição aqui nomeada é uma leitora como qualquer outra: não recebe nada do SigmaCV, não tem conta e não instrui nada sobre o que é processado ou exibido.",
    aboutVoluntary:
      "Ser listado é uma escolha própria e revogável de cada pesquisador. A ausência desta página não significa nada: a maioria dos pesquisadores não está no SigmaCV, e os que estão podem simplesmente não ter ativado a opção.",
    aboutNoRanking:
      "O SigmaCV não classifica, pontua nem compara pesquisadores, aqui ou em qualquer outro lugar. Para ler um CV verificável, peça ao pesquisador um link de solicitação: ele escolhe o que lhe enviar.",
    aboutRequestLink: "Como funcionam os links de solicitação",
    backToIndex: "← Todas as instituições",
    backLink: "← Voltar ao SigmaCV",
    rateLimitedHeading: "Muitas solicitações",
    rateLimitedBody:
      "Houve muitas solicitações a esta página em pouco tempo. Aguarde um momento e tente novamente.",
  },
  "it-IT": {
    indexMetaTitle: "Istituzioni",
    indexMetaDescription:
      "Istituzioni sotto cui i ricercatori hanno scelto di elencare il proprio CV pubblico SigmaCV: un conteggio per istituzione, nessun elenco di nomi, nessuna classifica.",
    indexHeading: "Istituzioni",
    indexIntro:
      "Ogni istituzione qui sotto ha almeno un ricercatore che ha scelto di elencarvi il proprio CV pubblico. La pagina mostra quanti lo hanno fatto: solo un conteggio, mai chi, e mai un confronto tra istituzioni.",
    indexEmpty: "Nessun ricercatore ha ancora scelto di essere elencato sotto un'istituzione.",
    metaDescription:
      "Ricercatori che hanno scelto di elencare il proprio CV pubblico SigmaCV sotto {name}: solo un conteggio, nessun elenco di nomi, nessuna classifica, nessun punteggio.",
    listedOne: "1 ricercatore elenca questa affiliazione",
    listedMany: "{count} ricercatori elencano questa affiliazione",
    rorLabel: "Scheda ROR",
    selfDeclared:
      "Ciascuno di loro ha dichiarato questa affiliazione nel proprio CV e ha scelto di comparire qui. Il conteggio è loro, non dell'istituzione: non è un elenco del personale e non dice nulla di chi non compare.",
    oaiHeading: "Accesso automatico",
    oaiBody:
      "I CV elencati possono essere raccolti come set OAI-PMH (Dublin Core, un record per CV e per lavoro):",
    oaiLink: "Set OAI-PMH {id}",
    aboutHeading: "Informazioni su questa pagina",
    aboutController:
      "SigmaCV è gestito da Basile Chrétien come progetto personale indipendente — non da né per conto di alcuna università o datore di lavoro — ed è l'unico titolare del trattamento dei dati personali dietro questa pagina.",
    aboutReader:
      "L'istituzione qui nominata è un lettore come chiunque altro: non riceve nulla da SigmaCV, non ha un account e non dà istruzioni su cosa viene trattato o mostrato.",
    aboutVoluntary:
      "Comparire qui è una scelta propria e revocabile di ogni ricercatore. L'assenza da questa pagina non significa nulla: la maggior parte dei ricercatori non è su SigmaCV, e chi c'è potrebbe semplicemente non aver attivato l'opzione.",
    aboutNoRanking:
      "SigmaCV non classifica, non valuta con punteggi e non confronta i ricercatori, né qui né altrove. Per leggere un CV verificabile, chiedi al ricercatore un link di richiesta: è lui a scegliere cosa inviarti.",
    aboutRequestLink: "Come funzionano i link di richiesta",
    backToIndex: "← Tutte le istituzioni",
    backLink: "← Torna a SigmaCV",
    rateLimitedHeading: "Troppe richieste",
    rateLimitedBody:
      "Questa pagina ha ricevuto molte richieste in poco tempo. Attendi un momento e riprova.",
  },
  "ko-KR": {
    indexMetaTitle: "기관",
    indexMetaDescription:
      "연구자가 자신의 SigmaCV 공개 CV를 등록하기로 선택한 기관 목록. 기관별 인원수만 표시되며, 명단도 순위도 없습니다.",
    indexHeading: "기관",
    indexIntro:
      "아래 각 기관에는 그 기관 아래 공개 CV를 등록하기로 선택한 연구자가 최소 한 명 있습니다. 이 페이지는 그 인원수만 보여 줍니다. 누구인지는 표시하지 않으며, 기관 간 비교도 하지 않습니다.",
    indexEmpty: "아직 기관 아래 등록을 선택한 연구자가 없습니다.",
    metaDescription:
      "{name} 아래 SigmaCV 공개 CV를 등록하기로 선택한 연구자: 인원수만 표시됩니다. 명단도, 순위도, 점수도 없습니다.",
    listedOne: "1명의 연구자가 이 소속을 등록했습니다",
    listedMany: "{count}명의 연구자가 이 소속을 등록했습니다",
    rorLabel: "ROR 레코드",
    selfDeclared:
      "각 연구자는 자신의 CV에 이 소속을 직접 신고하고 여기에 등록되기를 선택했습니다. 이 숫자는 연구자들의 것이지 기관의 것이 아닙니다. 직원 명단이 아니며, 여기에 없는 사람에 대해서는 아무것도 말해 주지 않습니다.",
    oaiHeading: "기계 접근",
    oaiBody:
      "등록된 CV는 OAI-PMH 세트로 수집할 수 있습니다(Dublin Core, CV별·연구 성과별 레코드 1건):",
    oaiLink: "OAI-PMH 세트 {id}",
    aboutHeading: "이 페이지에 대하여",
    aboutController:
      "SigmaCV는 Basile Chrétien이 독립적인 개인 프로젝트로 운영하며, 어떤 대학이나 고용주에 의해서도, 그를 대신해서도 운영되지 않습니다. 이 페이지 뒤에 있는 개인정보의 유일한 관리자는 본인입니다.",
    aboutReader:
      "여기에 이름이 있는 기관은 다른 누구와 마찬가지로 독자일 뿐입니다. SigmaCV로부터 아무것도 받지 않고, 계정도 없으며, 무엇을 처리하거나 표시할지 지시하지 않습니다.",
    aboutVoluntary:
      "등록 여부는 각 연구자 본인의 철회 가능한 선택입니다. 이 페이지에 없다는 것은 아무 의미도 없습니다. 대부분의 연구자는 SigmaCV를 사용하지 않으며, 사용하는 사람도 단지 옵트인하지 않았을 수 있습니다.",
    aboutNoRanking:
      "SigmaCV는 여기서도, 다른 어디서도 연구자를 순위 매기거나 점수화하거나 비교하지 않습니다. 검증 가능한 CV를 읽으려면 연구자에게 요청 링크를 요청하세요. 무엇을 보낼지는 연구자가 정합니다.",
    aboutRequestLink: "요청 링크 작동 방식",
    backToIndex: "← 모든 기관",
    backLink: "← SigmaCV로 돌아가기",
    rateLimitedHeading: "요청이 너무 많습니다",
    rateLimitedBody:
      "짧은 시간에 이 페이지에 요청이 많이 몰렸습니다. 잠시 기다린 후 다시 시도해 주세요.",
  },
  "ru-RU": {
    indexMetaTitle: "Учреждения",
    indexMetaDescription:
      "Учреждения, под которыми исследователи решили разместить своё публичное резюме SigmaCV: число по каждому учреждению, без списка имён, без рейтинга.",
    indexHeading: "Учреждения",
    indexIntro:
      "У каждого учреждения ниже есть хотя бы один исследователь, решивший разместить под ним своё публичное резюме. Страница показывает, сколько их: только число, никогда не имена и никогда не сравнение учреждений.",
    indexEmpty: "Пока ни один исследователь не решил быть указанным под учреждением.",
    metaDescription:
      "Исследователи, решившие разместить своё публичное резюме SigmaCV под {name}: только число — без списка имён, без рейтинга, без оценки.",
    listedOne: "1 исследователь указывает эту аффилиацию",
    listedMany: "{count} исследователей указывают эту аффилиацию",
    rorLabel: "Запись ROR",
    selfDeclared:
      "Каждый из них заявил эту аффилиацию в собственном резюме и решил быть указанным здесь. Это число принадлежит им, а не учреждению: это не список сотрудников, и оно ничего не говорит о тех, кого здесь нет.",
    oaiHeading: "Машинный доступ",
    oaiBody:
      "Указанные резюме можно собирать как набор OAI-PMH (Dublin Core, по одной записи на резюме и на работу):",
    oaiLink: "Набор OAI-PMH {id}",
    aboutHeading: "Об этой странице",
    aboutController:
      "SigmaCV ведёт Basile Chrétien как независимый личный проект — не от имени и не по поручению какого-либо университета или работодателя — и он является единственным контролёром персональных данных, стоящих за этой страницей.",
    aboutReader:
      "Названное здесь учреждение — такой же читатель, как и все остальные: оно ничего не получает от SigmaCV, не имеет учётной записи и не даёт указаний о том, что обрабатывается или показывается.",
    aboutVoluntary:
      "Быть указанным — собственный, отзываемый выбор каждого исследователя. Отсутствие на этой странице ничего не значит: большинство исследователей не пользуются SigmaCV, а те, кто пользуется, могли просто не включить эту опцию.",
    aboutNoRanking:
      "SigmaCV не ранжирует, не оценивает и не сравнивает исследователей — ни здесь, ни где-либо ещё. Чтобы прочитать проверяемое резюме, попросите у исследователя ссылку-запрос: он сам решает, что вам отправить.",
    aboutRequestLink: "Как работают ссылки-запросы",
    backToIndex: "← Все учреждения",
    backLink: "← Назад к SigmaCV",
    rateLimitedHeading: "Слишком много запросов",
    rateLimitedBody:
      "За короткое время к этой странице поступило много запросов. Подождите немного и попробуйте снова.",
  },
};

/** Localized institution-page copy (falls back to English for unknown locales). */
export function institutionStrings(locale: string): InstitutionStrings {
  return INSTITUTIONS_I18N[asLocale(locale)];
}

/** Fill `{name}`-style placeholders; every occurrence of each key is replaced,
 *  and a placeholder with no value is left as-is. */
export function fillInstitutionString(
  template: string,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce(
    (out, [key, value]) => out.split(`{${key}}`).join(String(value)),
    template,
  );
}
