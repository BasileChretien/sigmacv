import { asLocale, type Locale } from "./index";

/**
 * Copy for the 404 page (`src/components/NotFound.tsx`): shown for an address
 * no route answers, and wherever a page calls `notFound()`. Typed as
 * Record<Locale, …> so a missing translation is a compile error. Kept to a
 * title, one paragraph and a link: this table is client code, loaded with
 * every page (the 404 is every page's not-found boundary). Non-English strings
 * are machine-drafted; flag for native review.
 */

/**
 * The tab title, the same in every language: it is set where the address, and
 * so the language, is not known (the route's metadata), and the page repeats it.
 */
export const NOT_FOUND_DOCUMENT_TITLE = "404 — SigmaCV";

export interface NotFoundStrings {
  /** The page heading. */
  title: string;
  /** That nothing is here, the status code, and the two usual causes. */
  body: string;
  /** Same label as the tombstone page's (`withdrawn.ts`): one link, one wording. */
  backLink: string;
}

const NOT_FOUND_I18N: Record<Locale, NotFoundStrings> = {
  "en-US": {
    title: "Page not found",
    body: "There is no page at this address (error 404). The link you followed may be out of date, or the address may have been mistyped.",
    backLink: "← Back to SigmaCV",
  },
  "zh-CN": {
    title: "未找到页面",
    body: "此地址没有对应的页面（错误 404）。您点击的链接可能已过期，或者地址输入有误。",
    backLink: "← 返回 SigmaCV",
  },
  "es-ES": {
    title: "Página no encontrada",
    body: "No hay ninguna página en esta dirección (error 404). Puede que el enlace que ha seguido esté desactualizado o que la dirección contenga un error.",
    backLink: "← Volver a SigmaCV",
  },
  "fr-FR": {
    title: "Page introuvable",
    body: "Aucune page ne correspond à cette adresse (erreur 404). Le lien que vous avez suivi est peut-être périmé, ou l'adresse contient une erreur de saisie.",
    backLink: "← Retour à SigmaCV",
  },
  "de-DE": {
    title: "Seite nicht gefunden",
    body: "Unter dieser Adresse gibt es keine Seite (Fehler 404). Möglicherweise ist der Link, dem Sie gefolgt sind, veraltet, oder die Adresse enthält einen Tippfehler.",
    backLink: "← Zurück zu SigmaCV",
  },
  "ja-JP": {
    title: "ページが見つかりません",
    body: "このアドレスにページはありません（エラー404）。リンクが古くなっているか、アドレスの入力に誤りがある可能性があります。",
    backLink: "← SigmaCV に戻る",
  },
  "pt-BR": {
    title: "Página não encontrada",
    body: "Não há nenhuma página neste endereço (erro 404). O link que você seguiu pode estar desatualizado, ou o endereço pode conter um erro de digitação.",
    backLink: "← Voltar ao SigmaCV",
  },
  "it-IT": {
    title: "Pagina non trovata",
    body: "Non c'è nessuna pagina a questo indirizzo (errore 404). Il link che hai seguito potrebbe non essere più valido, oppure l'indirizzo contiene un errore di battitura.",
    backLink: "← Torna a SigmaCV",
  },
  "ko-KR": {
    title: "페이지를 찾을 수 없습니다",
    body: "이 주소에는 페이지가 없습니다(오류 404). 따라온 링크가 오래되었거나 주소가 잘못 입력되었을 수 있습니다.",
    backLink: "← SigmaCV로 돌아가기",
  },
  "ru-RU": {
    title: "Страница не найдена",
    body: "По этому адресу нет страницы (ошибка 404). Возможно, ссылка, по которой вы перешли, устарела или в адресе допущена опечатка.",
    backLink: "← Назад к SigmaCV",
  },
};

/** 404-page copy for a locale (falls back to en-US for an unknown locale). */
export function notFoundStrings(locale: string): NotFoundStrings {
  return NOT_FOUND_I18N[asLocale(locale)];
}
