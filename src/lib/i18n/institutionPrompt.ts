import { asLocale, type Locale } from "./index";

/**
 * Copy for the one-time, inline "List yourself under {institution}?" prompt in
 * the editor — an ASK, not a default: nothing is pre-ticked, "Not now" sends
 * nothing, and the two buttons carry equal weight. The disclosure says what
 * appears where (the OAI-PMH set for repositories; the institution page and
 * its figures), that nothing is listed until chosen, that absence means
 * nothing, and that withdrawal is immediate. The vocabulary is test-enforced
 * across the ten locales (no compliance words, no mandate, no percentage, no
 * ratio, nothing that implies the institution asked). Non-English strings are
 * machine-drafted; flag for native review.
 */
export interface InstitutionPromptStrings {
  /** Heading with a single affiliation; {institution}. */
  heading: string;
  /** Heading with several affiliations (the picker follows). */
  headingMany: string;
  /** What appears where if the answer is yes; {institution}. */
  what: string;
  /** Nothing until chosen; voluntary; absence means nothing. */
  nothingUntil: string;
  /** Withdrawal: where, and that it is immediate. */
  withdraw: string;
  /** One sentence on the SEPARATE reconciliation-rows choice; {versions} is
   *  replaced by the Versions link. */
  reconciliation: string;
  /** The Versions link text. */
  versions: string;
  /** The consent button — names the institution(s); {institution}. */
  yes: string;
  /** The consent button while no institution is ticked yet (disabled). */
  yesNone: string;
  /** Closes the prompt and remembers it for this set of institutions. */
  notNow: string;
  /** Link to the privacy notice (the institution-page paragraph). */
  learnMore: string;
}

const INSTITUTION_PROMPT_I18N: Record<Locale, InstitutionPromptStrings> = {
  "en-US": {
    heading: "List yourself under {institution}?",
    headingMany: "List yourself under your institutions?",
    what: "If you say yes: your CV joins the OAI-PMH set for {institution}, so a repository or CRIS harvesting by institution can find it; and your name, ORCID iD, current position and the works your public page lists appear on the institution's public page on SigmaCV, counted in its figures (how many researchers are listed, and how many of their works have an open copy).",
    nothingUntil:
      "Nothing is listed until you choose. Listing is voluntary and absence means nothing.",
    withdraw: "You can withdraw at any time from the Publish menu, with immediate effect.",
    reconciliation:
      "Sharing per-work reconciliation rows with your institution is a separate choice, offered in the Publish menu once you designate a frozen version in {versions}.",
    versions: "Versions",
    yes: "Yes, list me under {institution}",
    yesNone: "Yes, list me under the institutions I tick",
    notNow: "Not now",
    learnMore: "What this means",
  },
  "zh-CN": {
    heading: "将自己列入 {institution}？",
    headingMany: "将自己列入你所属的机构？",
    what: "如果你选择是：你的简历将加入 {institution} 的 OAI-PMH 集合，按机构采集的知识库或 CRIS 系统便能找到它；同时你的姓名、ORCID iD、当前职位以及公开页面列出的作品会显示在该机构在 SigmaCV 上的公开页面，并计入其数字（列入的研究者人数，以及其中有开放副本的作品数量）。",
    nothingUntil: "在你做出选择之前，不会列入任何内容。列入完全自愿，未列入不代表任何含义。",
    withdraw: "你可以随时在“发布”菜单中撤回，立即生效。",
    reconciliation:
      "与所属机构共享逐篇核对行是另一项单独的选择：在{versions}中指定一个冻结版本后，“发布”菜单会提供该选项。",
    versions: "版本",
    yes: "是，将我列入 {institution}",
    yesNone: "是，将我列入我勾选的机构",
    notNow: "暂不",
    learnMore: "这意味着什么",
  },
  "es-ES": {
    heading: "¿Aparecer bajo {institution}?",
    headingMany: "¿Aparecer bajo tus instituciones?",
    what: "Si dices que sí: tu CV entra en el conjunto OAI-PMH de {institution}, de modo que un repositorio o CRIS que recolecte por institución pueda encontrarlo; y tu nombre, tu ORCID iD, tu puesto actual y los trabajos que muestra tu página pública aparecen en la página pública de la institución en SigmaCV y se cuentan en sus cifras (cuántas personas investigadoras figuran y cuántos de sus trabajos tienen una copia abierta).",
    nothingUntil:
      "Nada se lista hasta que tú lo decidas. Figurar es voluntario y no figurar no significa nada.",
    withdraw: "Puedes retirarlo en cualquier momento desde el menú Publicar, con efecto inmediato.",
    reconciliation:
      "Compartir tus filas de conciliación con tu institución es una decisión aparte, que el menú Publicar ofrece cuando designas una versión congelada en {versions}.",
    versions: "Versiones",
    yes: "Sí, listarme bajo {institution}",
    yesNone: "Sí, listarme bajo las instituciones que marque",
    notNow: "Ahora no",
    learnMore: "Qué significa esto",
  },
  "fr-FR": {
    heading: "Figurer sous {institution} ?",
    headingMany: "Figurer sous vos établissements ?",
    what: "Si vous dites oui : votre CV rejoint l'ensemble OAI-PMH de {institution}, afin qu'un dépôt ou un CRIS moissonnant par établissement puisse le trouver ; et votre nom, votre iD ORCID, votre poste actuel et les travaux listés sur votre page publique apparaissent sur la page publique de l'établissement sur SigmaCV, comptés dans ses chiffres (combien de chercheurs y figurent, et combien de leurs travaux ont une copie ouverte).",
    nothingUntil:
      "Rien n'est listé tant que vous n'avez pas choisi. Figurer est volontaire, et ne pas figurer ne signifie rien.",
    withdraw: "Vous pouvez vous retirer à tout moment depuis le menu Publier, avec effet immédiat.",
    reconciliation:
      "Partager vos lignes de rapprochement avec votre établissement est un choix distinct, proposé dans le menu Publier une fois qu'une version figée est désignée dans {versions}.",
    versions: "Versions",
    yes: "Oui, me lister sous {institution}",
    yesNone: "Oui, me lister sous les établissements cochés",
    notNow: "Pas maintenant",
    learnMore: "Ce que cela implique",
  },
  "de-DE": {
    heading: "Unter {institution} aufgeführt werden?",
    headingMany: "Unter Ihren Einrichtungen aufgeführt werden?",
    what: "Wenn Sie ja sagen: Ihr Lebenslauf kommt in das OAI-PMH-Set von {institution}, sodass ein Repositorium oder CRIS, das nach Einrichtung erntet, ihn finden kann; und Ihr Name, Ihre ORCID iD, Ihre aktuelle Position und die auf Ihrer öffentlichen Seite aufgeführten Arbeiten erscheinen auf der öffentlichen Seite der Einrichtung auf SigmaCV und werden in deren Zahlen mitgezählt (wie viele Forschende aufgeführt sind und wie viele ihrer Arbeiten eine offene Kopie haben).",
    nothingUntil:
      "Nichts wird aufgeführt, bevor Sie sich entscheiden. Die Auflistung ist freiwillig, und ihr Fehlen bedeutet nichts.",
    withdraw:
      "Sie können sie jederzeit im Menü Veröffentlichen zurücknehmen, mit sofortiger Wirkung.",
    reconciliation:
      "Ihre Abgleichszeilen mit Ihrer Einrichtung zu teilen ist eine eigene Entscheidung, die das Menü Veröffentlichen anbietet, sobald Sie unter {versions} eine eingefrorene Version bestimmen.",
    versions: "Versionen",
    yes: "Ja, mich unter {institution} aufführen",
    yesNone: "Ja, mich unter den angekreuzten Einrichtungen aufführen",
    notNow: "Nicht jetzt",
    learnMore: "Was das bedeutet",
  },
  "ja-JP": {
    heading: "{institution} の下に掲載しますか？",
    headingMany: "所属機関の下に掲載しますか？",
    what: "「はい」を選ぶと、あなたの CV は {institution} の OAI-PMH セットに加わり、機関ごとに収集するリポジトリや CRIS がそれを見つけられるようになります。また、あなたの氏名、ORCID iD、現在の職位、公開ページに掲載された業績がその機関の SigmaCV 上の公開ページに表示され、その数字（掲載された研究者の人数、およびオープンなコピーのある業績の件数）に数えられます。",
    nothingUntil:
      "あなたが選ぶまで何も掲載されません。掲載は任意であり、掲載がないことは何も意味しません。",
    withdraw: "「公開」メニューからいつでも取り下げることができ、即時に反映されます。",
    reconciliation:
      "業績ごとの照合行を所属機関と共有するかどうかは別の選択です。{versions}で固定バージョンを指定すると、「公開」メニューに表示されます。",
    versions: "バージョン",
    yes: "はい、{institution} の下に掲載する",
    yesNone: "はい、チェックした機関の下に掲載する",
    notNow: "後で",
    learnMore: "これが意味すること",
  },
  "pt-BR": {
    heading: "Aparecer sob {institution}?",
    headingMany: "Aparecer sob suas instituições?",
    what: "Se você disser sim: seu CV entra no conjunto OAI-PMH de {institution}, para que um repositório ou CRIS que coleta por instituição possa encontrá-lo; e seu nome, seu ORCID iD, seu cargo atual e os trabalhos que sua página pública lista aparecem na página pública da instituição no SigmaCV e são contados em seus números (quantos pesquisadores estão listados e quantos de seus trabalhos têm uma cópia aberta).",
    nothingUntil:
      "Nada é listado até você escolher. Aparecer é voluntário, e não aparecer não significa nada.",
    withdraw: "Você pode retirar a qualquer momento no menu Publicar, com efeito imediato.",
    reconciliation:
      "Compartilhar suas linhas de conciliação com sua instituição é uma escolha separada, oferecida no menu Publicar quando você designa uma versão congelada em {versions}.",
    versions: "Versões",
    yes: "Sim, listar-me sob {institution}",
    yesNone: "Sim, listar-me sob as instituições que eu marcar",
    notNow: "Agora não",
    learnMore: "O que isso significa",
  },
  "it-IT": {
    heading: "Comparire sotto {institution}?",
    headingMany: "Comparire sotto le tue istituzioni?",
    what: "Se dici di sì: il tuo CV entra nel set OAI-PMH di {institution}, così che un repository o un CRIS che raccoglie per istituzione possa trovarlo; e il tuo nome, il tuo ORCID iD, la tua posizione attuale e i lavori elencati sulla tua pagina pubblica compaiono sulla pagina pubblica dell'istituzione su SigmaCV e sono contati nei suoi numeri (quante persone sono elencate e quanti dei loro lavori hanno una copia aperta).",
    nothingUntil:
      "Nulla viene elencato finché non scegli. Comparire è volontario, e non comparire non significa nulla.",
    withdraw: "Puoi ritirarti in qualsiasi momento dal menu Pubblica, con effetto immediato.",
    reconciliation:
      "Condividere le tue righe di riconciliazione con la tua istituzione è una scelta a parte, offerta nel menu Pubblica quando designi una versione congelata in {versions}.",
    versions: "Versioni",
    yes: "Sì, elencami sotto {institution}",
    yesNone: "Sì, elencami sotto le istituzioni che spunto",
    notNow: "Non ora",
    learnMore: "Cosa significa",
  },
  "ko-KR": {
    heading: "{institution} 아래에 등재할까요?",
    headingMany: "소속 기관 아래에 등재할까요?",
    what: "예를 선택하면: 회원님의 CV가 {institution}의 OAI-PMH 세트에 포함되어 기관별로 수집하는 리포지토리나 CRIS가 찾을 수 있게 되고, 이름, ORCID iD, 현재 직위, 공개 페이지에 표시된 연구 성과가 SigmaCV의 해당 기관 공개 페이지에 표시되며 그 수치(등재된 연구자 수, 그리고 열린 사본이 있는 성과 수)에 포함됩니다.",
    nothingUntil:
      "회원님이 선택하기 전에는 아무것도 등재되지 않습니다. 등재는 자발적이며, 등재되지 않았다는 것은 아무 의미도 없습니다.",
    withdraw: "언제든지 게시 메뉴에서 철회할 수 있으며 즉시 반영됩니다.",
    reconciliation:
      "성과별 대조 행을 소속 기관과 공유하는 것은 별도의 선택으로, {versions}에서 고정 버전을 지정하면 게시 메뉴에 표시됩니다.",
    versions: "버전",
    yes: "예, {institution} 아래에 등재",
    yesNone: "예, 체크한 기관 아래에 등재",
    notNow: "나중에",
    learnMore: "이것이 의미하는 것",
  },
  "ru-RU": {
    heading: "Указать вас под {institution}?",
    headingMany: "Указать вас под вашими организациями?",
    what: "Если вы ответите «да»: ваше CV войдёт в набор OAI-PMH организации {institution}, чтобы репозиторий или CRIS, собирающий записи по организациям, мог его найти; а ваше имя, ORCID iD, текущая должность и работы, перечисленные на вашей публичной странице, появятся на публичной странице организации в SigmaCV и будут учтены в её числах (сколько исследователей указано и у скольких их работ есть открытая копия).",
    nothingUntil:
      "Ничего не указывается, пока вы не выберете. Указание добровольно, а его отсутствие ничего не значит.",
    withdraw: "Вы можете отозвать его в любой момент в меню «Публикация», с немедленным эффектом.",
    reconciliation:
      "Передать организации ваши строки сверки — отдельное решение, которое меню «Публикация» предлагает после того, как вы назначите замороженную версию в разделе {versions}.",
    versions: "Версии",
    yes: "Да, указать меня под {institution}",
    yesNone: "Да, указать меня под отмеченными организациями",
    notNow: "Не сейчас",
    learnMore: "Что это значит",
  },
};

/** Localized prompt copy (falls back to English for unknown locales). */
export function institutionPromptStrings(locale: string): InstitutionPromptStrings {
  return INSTITUTION_PROMPT_I18N[asLocale(locale)];
}
