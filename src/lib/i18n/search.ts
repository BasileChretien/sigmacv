import { asLocale, type Locale } from "./index";

/**
 * Copy for `/search` — find a researcher by name and open the automatic
 * preview. Ten locales, typed so a missing translation is a compile error.
 * The promise sentence is the page's contract: what a researcher has
 * published, not how they score. OpenAlex / ORCID / SigmaCV stay untranslated.
 */
export interface SearchStrings {
  metaTitle: string;
  heading: string;
  /** The one-sentence promise of the lookup. */
  promise: string;
  inputLabel: string;
  placeholder: string;
  submit: string;
  /** Under the form: what is searched, and the length bounds. */
  hint: string;
  /** Under the results: source + the identifier-only rule + what a click opens. */
  sourceNote: string;
  noResults: string;
  invalid: string;
  rateLimited: string;
  /** The ORCID mark on every row. */
  orcidMark: string;
  /** Link to the objection route. */
  objectLink: string;
  back: string;
}

const SEARCH_I18N: Record<Locale, SearchStrings> = {
  "en-US": {
    metaTitle: "Find a researcher",
    heading: "Find a researcher",
    promise: "Look up what a researcher has published — not how they score.",
    inputLabel: "Name",
    placeholder: "Family name, or full name",
    submit: "Search",
    hint: "Searches OpenAlex for researchers who have an ORCID iD. Three to eighty characters.",
    sourceNote:
      "Names and affiliations as OpenAlex publishes them, in OpenAlex's order; only researchers with an ORCID iD are listed, and nothing here is a figure. Opening a result builds an automatic preview from open sources — unreviewed by the researcher, and possibly mixing in a namesake's work.",
    noResults: "No researcher with an ORCID iD matched that name.",
    invalid:
      "Enter three to eighty characters of a name — letters, spaces, hyphens and apostrophes.",
    rateLimited: "Too many searches just now. Please wait a moment and try again.",
    orcidMark: "ORCID iD",
    objectLink: "Don't want your record previewed? How to object",
    back: "Back to SigmaCV",
  },
  "zh-CN": {
    metaTitle: "查找研究者",
    heading: "查找研究者",
    promise: "查看研究者发表了什么——而不是给他们打分。",
    inputLabel: "姓名",
    placeholder: "姓氏或全名",
    submit: "搜索",
    hint: "在 OpenAlex 中搜索拥有 ORCID iD 的研究者。3 到 80 个字符。",
    sourceNote:
      "姓名和所属机构按 OpenAlex 发布的内容及顺序显示；仅列出拥有 ORCID iD 的研究者，此处没有任何数字指标。打开结果会依据公开数据源生成自动预览——未经研究者审核，且可能混入同名他人的成果。",
    noResults: "没有拥有 ORCID iD 的研究者与该姓名匹配。",
    invalid: "请输入 3 到 80 个字符的姓名——字母、空格、连字符和撇号。",
    rateLimited: "当前搜索过多。请稍候片刻后重试。",
    orcidMark: "ORCID iD",
    objectLink: "不希望您的记录被预览？了解如何提出反对",
    back: "返回 SigmaCV",
  },
  "es-ES": {
    metaTitle: "Buscar a un investigador",
    heading: "Buscar a un investigador",
    promise: "Consulta qué ha publicado un investigador, no cómo puntúa.",
    inputLabel: "Nombre",
    placeholder: "Apellido, o nombre completo",
    submit: "Buscar",
    hint: "Busca en OpenAlex investigadores que tienen un ORCID iD. De tres a ochenta caracteres.",
    sourceNote:
      "Nombres y afiliaciones tal como los publica OpenAlex, en el orden de OpenAlex; solo se listan investigadores con ORCID iD y aquí no hay ninguna cifra. Abrir un resultado genera una vista previa automática a partir de fuentes abiertas, no revisada por el investigador y que puede mezclar obras de un homónimo.",
    noResults: "Ningún investigador con ORCID iD coincide con ese nombre.",
    invalid:
      "Escribe de tres a ochenta caracteres de un nombre: letras, espacios, guiones y apóstrofos.",
    rateLimited: "Demasiadas búsquedas ahora mismo. Espera un momento e inténtalo de nuevo.",
    orcidMark: "ORCID iD",
    objectLink: "¿No quieres que se muestre tu registro? Cómo oponerte",
    back: "Volver a SigmaCV",
  },
  "fr-FR": {
    metaTitle: "Trouver un chercheur",
    heading: "Trouver un chercheur",
    promise: "Voir ce qu'un chercheur a publié — pas comment il est noté.",
    inputLabel: "Nom",
    placeholder: "Nom de famille, ou nom complet",
    submit: "Rechercher",
    hint: "Recherche dans OpenAlex les chercheurs qui ont un ORCID iD. De trois à quatre-vingts caractères.",
    sourceNote:
      "Noms et affiliations tels qu'OpenAlex les publie, dans l'ordre d'OpenAlex ; seuls les chercheurs disposant d'un ORCID iD sont listés, et rien ici n'est un chiffre. Ouvrir un résultat construit un aperçu automatique à partir de sources ouvertes — non vérifié par le chercheur, et pouvant mêler les travaux d'un homonyme.",
    noResults: "Aucun chercheur disposant d'un ORCID iD ne correspond à ce nom.",
    invalid:
      "Saisissez de trois à quatre-vingts caractères d'un nom : lettres, espaces, traits d'union et apostrophes.",
    rateLimited: "Trop de recherches en ce moment. Patientez un instant puis réessayez.",
    orcidMark: "ORCID iD",
    objectLink: "Vous ne souhaitez pas que votre notice soit affichée ? Comment vous y opposer",
    back: "Retour à SigmaCV",
  },
  "de-DE": {
    metaTitle: "Forschende finden",
    heading: "Forschende finden",
    promise:
      "Nachschlagen, was eine forschende Person veröffentlicht hat – nicht, wie sie abschneidet.",
    inputLabel: "Name",
    placeholder: "Nachname oder vollständiger Name",
    submit: "Suchen",
    hint: "Durchsucht OpenAlex nach Forschenden mit einer ORCID iD. Drei bis achtzig Zeichen.",
    sourceNote:
      "Namen und Zugehörigkeiten, wie OpenAlex sie veröffentlicht, in OpenAlex' Reihenfolge; gelistet werden nur Forschende mit ORCID iD, und nichts hier ist eine Kennzahl. Das Öffnen eines Treffers erstellt eine automatische Vorschau aus offenen Quellen – von der Person nicht geprüft und möglicherweise mit Werken eines Namensvetters vermischt.",
    noResults: "Keine forschende Person mit ORCID iD passt zu diesem Namen.",
    invalid:
      "Geben Sie drei bis achtzig Zeichen eines Namens ein – Buchstaben, Leerzeichen, Bindestriche und Apostrophe.",
    rateLimited:
      "Gerade zu viele Suchanfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.",
    orcidMark: "ORCID iD",
    objectLink: "Sie möchten keine Vorschau Ihres Nachweises? So widersprechen Sie",
    back: "Zurück zu SigmaCV",
  },
  "ja-JP": {
    metaTitle: "研究者を探す",
    heading: "研究者を探す",
    promise: "研究者が何を発表したかを調べる — 点数ではなく。",
    inputLabel: "氏名",
    placeholder: "姓、または氏名",
    submit: "検索",
    hint: "ORCID iD を持つ研究者を OpenAlex で検索します。3〜80 文字。",
    sourceNote:
      "氏名と所属は OpenAlex が公開しているとおり、OpenAlex の順序で表示します。ORCID iD を持つ研究者のみを掲載し、ここに数値指標はありません。結果を開くと、公開ソースから自動プレビューが構築されます — 研究者本人の確認を経ておらず、同姓同名の他者の業績が混じることがあります。",
    noResults: "その氏名に一致する ORCID iD を持つ研究者は見つかりませんでした。",
    invalid: "氏名を 3〜80 文字で入力してください — 文字、空白、ハイフン、アポストロフィ。",
    rateLimited: "現在検索が集中しています。しばらく待ってからもう一度お試しください。",
    orcidMark: "ORCID iD",
    objectLink: "自分の記録をプレビューされたくない場合は？ 異議の申し立て方法",
    back: "SigmaCV に戻る",
  },
  "pt-BR": {
    metaTitle: "Encontrar um pesquisador",
    heading: "Encontrar um pesquisador",
    promise: "Consulte o que um pesquisador publicou — não a pontuação dele.",
    inputLabel: "Nome",
    placeholder: "Sobrenome, ou nome completo",
    submit: "Buscar",
    hint: "Busca no OpenAlex pesquisadores que têm um ORCID iD. De três a oitenta caracteres.",
    sourceNote:
      "Nomes e afiliações como o OpenAlex os publica, na ordem do OpenAlex; só pesquisadores com ORCID iD são listados, e nada aqui é um número. Abrir um resultado monta uma prévia automática a partir de fontes abertas — não revisada pelo pesquisador, e que pode misturar trabalhos de um homônimo.",
    noResults: "Nenhum pesquisador com ORCID iD corresponde a esse nome.",
    invalid:
      "Digite de três a oitenta caracteres de um nome: letras, espaços, hifens e apóstrofos.",
    rateLimited: "Buscas demais agora. Aguarde um momento e tente de novo.",
    orcidMark: "ORCID iD",
    objectLink: "Não quer que seu registro seja exibido? Como se opor",
    back: "Voltar ao SigmaCV",
  },
  "it-IT": {
    metaTitle: "Trova un ricercatore",
    heading: "Trova un ricercatore",
    promise: "Scopri cosa ha pubblicato un ricercatore — non il suo punteggio.",
    inputLabel: "Nome",
    placeholder: "Cognome, o nome completo",
    submit: "Cerca",
    hint: "Cerca su OpenAlex i ricercatori che hanno un ORCID iD. Da tre a ottanta caratteri.",
    sourceNote:
      "Nomi e affiliazioni come li pubblica OpenAlex, nell'ordine di OpenAlex; sono elencati solo i ricercatori con ORCID iD, e qui non c'è alcun numero. Aprire un risultato costruisce un'anteprima automatica da fonti aperte — non verificata dal ricercatore, e che può mescolare lavori di un omonimo.",
    noResults: "Nessun ricercatore con ORCID iD corrisponde a quel nome.",
    invalid:
      "Inserisci da tre a ottanta caratteri di un nome: lettere, spazi, trattini e apostrofi.",
    rateLimited: "Troppe ricerche in questo momento. Attendi un attimo e riprova.",
    orcidMark: "ORCID iD",
    objectLink: "Non vuoi che la tua registrazione venga mostrata? Come opporsi",
    back: "Torna a SigmaCV",
  },
  "ko-KR": {
    metaTitle: "연구자 찾기",
    heading: "연구자 찾기",
    promise: "연구자가 무엇을 발표했는지 조회하십시오 — 점수가 아니라.",
    inputLabel: "이름",
    placeholder: "성 또는 전체 이름",
    submit: "검색",
    hint: "ORCID iD가 있는 연구자를 OpenAlex에서 검색합니다. 3~80자.",
    sourceNote:
      "이름과 소속은 OpenAlex가 공개한 그대로, OpenAlex의 순서로 표시됩니다. ORCID iD가 있는 연구자만 나열되며, 여기에는 어떤 수치도 없습니다. 결과를 열면 공개 소스로 자동 미리보기가 구성됩니다 — 연구자 본인의 검토를 거치지 않았으며 동명이인의 성과가 섞일 수 있습니다.",
    noResults: "그 이름과 일치하는 ORCID iD 보유 연구자가 없습니다.",
    invalid: "이름을 3~80자로 입력하십시오 — 문자, 공백, 하이픈, 아포스트로피.",
    rateLimited: "지금 검색이 너무 많습니다. 잠시 후 다시 시도해 주십시오.",
    orcidMark: "ORCID iD",
    objectLink: "본인 기록이 미리보기되는 것을 원하지 않으십니까? 이의 제기 방법",
    back: "SigmaCV로 돌아가기",
  },
  "ru-RU": {
    metaTitle: "Найти исследователя",
    heading: "Найти исследователя",
    promise: "Узнайте, что опубликовал исследователь, — а не сколько у него баллов.",
    inputLabel: "Имя",
    placeholder: "Фамилия или полное имя",
    submit: "Искать",
    hint: "Ищет в OpenAlex исследователей с ORCID iD. От трёх до восьмидесяти символов.",
    sourceNote:
      "Имена и аффилиации в том виде, в каком их публикует OpenAlex, и в порядке OpenAlex; показаны только исследователи с ORCID iD, и здесь нет никаких показателей. Открыв результат, вы получите автоматический предпросмотр из открытых источников — не проверенный исследователем и, возможно, с работами однофамильца.",
    noResults: "Ни один исследователь с ORCID iD не соответствует этому имени.",
    invalid: "Введите от трёх до восьмидесяти символов имени — буквы, пробелы, дефисы и апострофы.",
    rateLimited: "Слишком много запросов. Подождите немного и попробуйте снова.",
    orcidMark: "ORCID iD",
    objectLink: "Не хотите, чтобы вашу запись показывали? Как возразить",
    back: "Вернуться на SigmaCV",
  },
};

export function searchStrings(locale: string): SearchStrings {
  return SEARCH_I18N[asLocale(locale)];
}
