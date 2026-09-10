import { asLocale, type Locale } from "./index";

/**
 * Copy for the active-choice indexing prompt ("Should search engines index
 * your page?") — an ASK, never a default. Ten locales, typed so a missing
 * translation is a compile error. Proper nouns (SigmaCV, OAI-PMH, ORCID) stay
 * untranslated.
 */
export interface IndexingPromptStrings {
  heading: string;
  /** What a "yes" does: search engines, plus the OAI-PMH harvest an indexable page allows. */
  what: string;
  /** Listing under an institution is a separate choice, asked afterwards. */
  separate: string;
  nothingUntil: string;
  withdraw: string;
  yes: string;
  notNow: string;
  learnMore: string;
  /** The confirmation that replaces the ask. */
  done: string;
}

const INDEXING_PROMPT_I18N: Record<Locale, IndexingPromptStrings> = {
  "en-US": {
    heading: "Should search engines index your page?",
    what: "If you say yes: Google and other search engines may list your public page, which is how colleagues and employers find your work; and open repositories and aggregators may harvest it through SigmaCV's OAI-PMH endpoint — your CV record and the works it lists. Nothing else changes: your page shows exactly what you already chose to show.",
    separate: "Being listed under your institution is a separate choice, asked next.",
    nothingUntil: "Nothing is indexed until you choose. Not choosing means not indexed.",
    withdraw: "You can turn it off at any time from the Publish menu, with immediate effect.",
    yes: "Yes, let search engines index my page",
    notNow: "Not now",
    learnMore: "What this means",
    done: "Search engines may now index your page.",
  },
  "zh-CN": {
    heading: "是否允许搜索引擎收录您的页面？",
    what: "如果您选择“是”：Google 及其他搜索引擎可以收录您的公开页面，这正是同事和雇主找到您成果的方式；开放知识库和聚合服务也可以通过 SigmaCV 的 OAI-PMH 端点采集它——您的简历记录及其列出的成果。其他一切不变：页面只显示您已选择展示的内容。",
    separate: "在您的机构名下列出是另一项选择，随后会单独询问。",
    nothingUntil: "在您做出选择之前不会被收录。不做选择即不收录。",
    withdraw: "您可以随时在“发布”菜单中关闭，立即生效。",
    yes: "是，允许搜索引擎收录我的页面",
    notNow: "暂不",
    learnMore: "这意味着什么",
    done: "搜索引擎现在可以收录您的页面。",
  },
  "es-ES": {
    heading: "¿Deben los motores de búsqueda indexar tu página?",
    what: "Si dices que sí: Google y otros motores de búsqueda pueden listar tu página pública, que es como colegas y empleadores encuentran tu trabajo; y los repositorios abiertos y agregadores pueden recolectarla a través del punto de acceso OAI-PMH de SigmaCV: tu registro de CV y las obras que enumera. Nada más cambia: tu página muestra exactamente lo que ya decidiste mostrar.",
    separate: "Figurar bajo tu institución es una decisión aparte, que se te planteará a continuación.",
    nothingUntil: "Nada se indexa hasta que elijas. No elegir significa no indexar.",
    withdraw: "Puedes desactivarlo en cualquier momento desde el menú Publicar, con efecto inmediato.",
    yes: "Sí, que los motores de búsqueda indexen mi página",
    notNow: "Ahora no",
    learnMore: "Qué significa esto",
    done: "Los motores de búsqueda ya pueden indexar tu página.",
  },
  "fr-FR": {
    heading: "Les moteurs de recherche doivent-ils indexer votre page ?",
    what: "Si vous dites oui : Google et les autres moteurs de recherche peuvent référencer votre page publique — c'est ainsi que collègues et employeurs trouvent vos travaux ; et les entrepôts ouverts et agrégateurs peuvent la moissonner via le point d'accès OAI-PMH de SigmaCV : votre notice de CV et les travaux qu'elle liste. Rien d'autre ne change : votre page montre exactement ce que vous avez déjà choisi de montrer.",
    separate: "Figurer sous votre institution est un choix distinct, posé juste après.",
    nothingUntil: "Rien n'est indexé tant que vous n'avez pas choisi. Ne pas choisir, c'est ne pas être indexé.",
    withdraw: "Vous pouvez le désactiver à tout moment depuis le menu Publier, avec effet immédiat.",
    yes: "Oui, laisser les moteurs de recherche indexer ma page",
    notNow: "Pas maintenant",
    learnMore: "Ce que cela signifie",
    done: "Les moteurs de recherche peuvent désormais indexer votre page.",
  },
  "de-DE": {
    heading: "Sollen Suchmaschinen Ihre Seite indexieren?",
    what: "Wenn Sie ja sagen: Google und andere Suchmaschinen dürfen Ihre öffentliche Seite listen – so finden Kolleginnen, Kollegen und Arbeitgeber Ihre Arbeit; und offene Repositorien und Aggregatoren dürfen sie über SigmaCVs OAI-PMH-Schnittstelle ernten – Ihren Lebenslauf-Datensatz und die darin gelisteten Werke. Sonst ändert sich nichts: Ihre Seite zeigt genau das, was Sie bereits zu zeigen gewählt haben.",
    separate: "Unter Ihrer Einrichtung gelistet zu werden ist eine eigene Entscheidung, die als Nächstes gestellt wird.",
    nothingUntil: "Nichts wird indexiert, bis Sie sich entscheiden. Keine Entscheidung heißt: nicht indexiert.",
    withdraw: "Sie können es jederzeit im Menü „Veröffentlichen“ abschalten, mit sofortiger Wirkung.",
    yes: "Ja, Suchmaschinen dürfen meine Seite indexieren",
    notNow: "Jetzt nicht",
    learnMore: "Was das bedeutet",
    done: "Suchmaschinen dürfen Ihre Seite jetzt indexieren.",
  },
  "ja-JP": {
    heading: "検索エンジンにページを索引させますか？",
    what: "「はい」を選ぶと、Google などの検索エンジンがあなたの公開ページを掲載できるようになります。同僚や雇用主があなたの業績を見つけるのはこの経路です。また、オープンリポジトリや集約サービスが SigmaCV の OAI-PMH エンドポイントを通じて、あなたの CV レコードとそこに列挙された業績を収集できるようになります。それ以外は何も変わりません。ページには、あなたが既に表示すると決めた内容だけが表示されます。",
    separate: "所属機関の下に掲載するかどうかは別の選択で、この後に改めてお尋ねします。",
    nothingUntil: "選択するまで索引されることはありません。選択しないことは索引しないことを意味します。",
    withdraw: "「公開」メニューからいつでも無効にでき、即時に反映されます。",
    yes: "はい、検索エンジンにページを索引させる",
    notNow: "今はしない",
    learnMore: "これが意味すること",
    done: "検索エンジンがあなたのページを索引できるようになりました。",
  },
  "pt-BR": {
    heading: "Os mecanismos de busca devem indexar sua página?",
    what: "Se você disser sim: o Google e outros mecanismos de busca podem listar sua página pública — é assim que colegas e empregadores encontram seu trabalho; e repositórios abertos e agregadores podem coletá-la pelo ponto de acesso OAI-PMH do SigmaCV: seu registro de CV e os trabalhos que ele lista. Nada mais muda: sua página mostra exatamente o que você já escolheu mostrar.",
    separate: "Ser listado sob sua instituição é uma escolha separada, feita em seguida.",
    nothingUntil: "Nada é indexado até você escolher. Não escolher significa não indexar.",
    withdraw: "Você pode desativar a qualquer momento no menu Publicar, com efeito imediato.",
    yes: "Sim, deixar os mecanismos de busca indexarem minha página",
    notNow: "Agora não",
    learnMore: "O que isso significa",
    done: "Os mecanismos de busca já podem indexar sua página.",
  },
  "it-IT": {
    heading: "I motori di ricerca devono indicizzare la tua pagina?",
    what: "Se dici di sì: Google e gli altri motori di ricerca possono elencare la tua pagina pubblica — è così che colleghi e datori di lavoro trovano il tuo lavoro; e i repository aperti e gli aggregatori possono raccoglierla tramite l'endpoint OAI-PMH di SigmaCV: la tua registrazione CV e i lavori che elenca. Nient'altro cambia: la tua pagina mostra esattamente ciò che hai già scelto di mostrare.",
    separate: "Essere elencato sotto la tua istituzione è una scelta separata, posta subito dopo.",
    nothingUntil: "Nulla viene indicizzato finché non scegli. Non scegliere significa non indicizzare.",
    withdraw: "Puoi disattivarlo in qualsiasi momento dal menu Pubblica, con effetto immediato.",
    yes: "Sì, lascia che i motori di ricerca indicizzino la mia pagina",
    notNow: "Non ora",
    learnMore: "Cosa significa",
    done: "I motori di ricerca possono ora indicizzare la tua pagina.",
  },
  "ko-KR": {
    heading: "검색 엔진이 페이지를 색인하도록 허용하시겠습니까?",
    what: "예를 선택하면: Google 등 검색 엔진이 귀하의 공개 페이지를 목록에 올릴 수 있습니다. 동료와 고용주가 귀하의 성과를 찾는 경로입니다. 또한 공개 리포지토리와 수집 서비스가 SigmaCV의 OAI-PMH 엔드포인트를 통해 귀하의 CV 레코드와 거기에 나열된 성과를 수집할 수 있습니다. 그 외에는 아무것도 바뀌지 않습니다. 페이지에는 이미 보여주기로 선택한 내용만 표시됩니다.",
    separate: "소속 기관 아래에 등재되는 것은 별도의 선택이며, 이어서 따로 묻습니다.",
    nothingUntil: "선택하기 전까지는 아무것도 색인되지 않습니다. 선택하지 않으면 색인되지 않습니다.",
    withdraw: "게시 메뉴에서 언제든지 끌 수 있으며 즉시 적용됩니다.",
    yes: "예, 검색 엔진이 내 페이지를 색인하도록 허용",
    notNow: "지금은 안 함",
    learnMore: "이것이 의미하는 것",
    done: "이제 검색 엔진이 귀하의 페이지를 색인할 수 있습니다.",
  },
  "ru-RU": {
    heading: "Разрешить поисковым системам индексировать вашу страницу?",
    what: "Если вы скажете «да»: Google и другие поисковые системы смогут показывать вашу публичную страницу — именно так коллеги и работодатели находят ваши работы; а открытые репозитории и агрегаторы смогут собирать её через точку доступа OAI-PMH SigmaCV: вашу запись CV и перечисленные в ней работы. Больше ничего не меняется: страница показывает ровно то, что вы уже решили показывать.",
    separate: "Размещение под вашим учреждением — отдельный выбор, о нём спросят следом.",
    nothingUntil: "Ничего не индексируется, пока вы не решите. Не решить — значит не индексировать.",
    withdraw: "Вы можете отключить это в любой момент в меню «Опубликовать», с немедленным эффектом.",
    yes: "Да, разрешить поисковым системам индексировать мою страницу",
    notNow: "Не сейчас",
    learnMore: "Что это значит",
    done: "Теперь поисковые системы могут индексировать вашу страницу.",
  },
};

export function indexingPromptStrings(locale: string): IndexingPromptStrings {
  return INDEXING_PROMPT_I18N[asLocale(locale)];
}
