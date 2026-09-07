import { asLocale, type Locale } from "./index";

/**
 * Copy for the `/withdrawn` tombstone page — the static landing page a minted
 * snapshot DOI is repointed at when its owner deletes their account (see
 * `datacite/mint.ts` `tombstoneSnapshotDoi`). Typed as Record<Locale, …> so a
 * missing translation is a compile error. Used by the default `/withdrawn`
 * and the localized `/[locale]/withdrawn` routes. Proper nouns (SigmaCV,
 * DataCite, DOI) stay untranslated. Non-English strings are machine-drafted;
 * flag for native review.
 */
export interface WithdrawnStrings {
  metaTitle: string;
  metaDescription: string;
  heading: string;
  /** What the visitor followed, why it is gone, and what state the DOI is in. */
  body: string;
  /** What to do next. */
  note: string;
  backLink: string;
}

const WITHDRAWN_I18N: Record<Locale, WithdrawnStrings> = {
  "en-US": {
    metaTitle: "Version withdrawn",
    metaDescription:
      "This frozen CV version was withdrawn by its owner; its DOI is kept in a hidden, registered state.",
    heading: "This version was withdrawn by its owner",
    body: "The DOI you followed was minted for a frozen version of a SigmaCV curriculum vitae. That version was withdrawn by its owner, so the page and the data behind it are no longer available. Because a DOI is a promise of persistence, the record is not erased: DataCite keeps it in a hidden, registered state that no longer appears in searches and points here instead of to the withdrawn page.",
    note: "If you need the document for an assessment, contact its author directly.",
    backLink: "← Back to SigmaCV",
  },
  "zh-CN": {
    metaTitle: "版本已撤回",
    metaDescription: "此冻结的简历版本已由其所有者撤回；其 DOI 保留为隐藏的已注册状态。",
    heading: "此版本已由其所有者撤回",
    body: "您访问的 DOI 是为一份 SigmaCV 简历的冻结版本注册的。该版本已由其所有者撤回，因此该页面及其背后的数据已不再可用。由于 DOI 是对持久性的承诺，该记录不会被删除：DataCite 将其保留为隐藏的已注册状态，不再出现在搜索中，并指向本页而非已撤回的页面。",
    note: "如果您需要该文件用于评审，请直接联系其作者。",
    backLink: "← 返回 SigmaCV",
  },
  "es-ES": {
    metaTitle: "Versión retirada",
    metaDescription:
      "Esta versión congelada de CV fue retirada por su titular; su DOI se conserva en un estado registrado pero oculto.",
    heading: "Esta versión fue retirada por su titular",
    body: "El DOI que ha seguido se registró para una versión congelada de un currículum SigmaCV. Esa versión fue retirada por su titular, por lo que la página y los datos que la sustentaban ya no están disponibles. Como un DOI es una promesa de permanencia, el registro no se borra: DataCite lo conserva en un estado registrado pero oculto, que ya no aparece en las búsquedas y apunta aquí en lugar de a la página retirada.",
    note: "Si necesita el documento para una evaluación, póngase en contacto directamente con su autor.",
    backLink: "← Volver a SigmaCV",
  },
  "fr-FR": {
    metaTitle: "Version retirée",
    metaDescription:
      "Cette version figée de CV a été retirée par son auteur ; son DOI est conservé dans un état enregistré mais masqué.",
    heading: "Cette version a été retirée par son auteur",
    body: "Le DOI que vous avez suivi avait été attribué à une version figée d'un curriculum vitae SigmaCV. Cette version a été retirée par son auteur : la page et les données qui la composaient ne sont plus disponibles. Un DOI étant une promesse de pérennité, la notice n'est pas effacée : DataCite la conserve dans un état enregistré mais masqué, qui n'apparaît plus dans les recherches et renvoie ici plutôt que vers la page retirée.",
    note: "Si vous avez besoin du document pour une évaluation, contactez directement son auteur.",
    backLink: "← Retour à SigmaCV",
  },
  "de-DE": {
    metaTitle: "Version zurückgezogen",
    metaDescription:
      "Diese eingefrorene Lebenslauf-Version wurde von ihrem Inhaber zurückgezogen; ihr DOI bleibt in einem ausgeblendeten, registrierten Zustand erhalten.",
    heading: "Diese Version wurde von ihrem Inhaber zurückgezogen",
    body: "Der DOI, dem Sie gefolgt sind, wurde für eine eingefrorene Version eines SigmaCV-Lebenslaufs vergeben. Diese Version wurde von ihrem Inhaber zurückgezogen; die Seite und die dahinterliegenden Daten sind nicht mehr verfügbar. Da ein DOI ein Versprechen der Beständigkeit ist, wird der Datensatz nicht gelöscht: DataCite bewahrt ihn in einem ausgeblendeten, registrierten Zustand auf, der nicht mehr in Suchen erscheint und hierher statt auf die zurückgezogene Seite verweist.",
    note: "Wenn Sie das Dokument für eine Begutachtung benötigen, wenden Sie sich direkt an die Autorin oder den Autor.",
    backLink: "← Zurück zu SigmaCV",
  },
  "ja-JP": {
    metaTitle: "取り下げられたバージョン",
    metaDescription:
      "この固定された CV バージョンは所有者により取り下げられました。その DOI は非表示の登録済み状態で保持されます。",
    heading: "このバージョンは所有者により取り下げられました",
    body: "アクセスされた DOI は、SigmaCV の CV の固定バージョンに対して発行されたものです。このバージョンは所有者によって取り下げられたため、ページとその元になったデータは利用できません。DOI は永続性の約束であるため、レコードは消去されません。DataCite はこれを非表示の登録済み状態で保持し、検索には表示されず、取り下げられたページの代わりにこのページを指します。",
    note: "評価のためにこの文書が必要な場合は、著者に直接お問い合わせください。",
    backLink: "← SigmaCV に戻る",
  },
  "pt-BR": {
    metaTitle: "Versão retirada",
    metaDescription:
      "Esta versão congelada de CV foi retirada pelo titular; seu DOI é mantido em um estado registrado, porém oculto.",
    heading: "Esta versão foi retirada pelo titular",
    body: "O DOI que você seguiu foi registrado para uma versão congelada de um currículo SigmaCV. Essa versão foi retirada por seu titular, portanto a página e os dados por trás dela não estão mais disponíveis. Como um DOI é uma promessa de permanência, o registro não é apagado: a DataCite o mantém em um estado registrado, porém oculto, que não aparece mais em buscas e aponta para cá em vez de para a página retirada.",
    note: "Se você precisa do documento para uma avaliação, entre em contato diretamente com o autor.",
    backLink: "← Voltar ao SigmaCV",
  },
  "it-IT": {
    metaTitle: "Versione ritirata",
    metaDescription:
      "Questa versione congelata di CV è stata ritirata dal titolare; il suo DOI è conservato in uno stato registrato ma nascosto.",
    heading: "Questa versione è stata ritirata dal titolare",
    body: "Il DOI che hai seguito era stato assegnato a una versione congelata di un curriculum SigmaCV. Quella versione è stata ritirata dal titolare, quindi la pagina e i dati che la sostenevano non sono più disponibili. Poiché un DOI è una promessa di persistenza, il record non viene cancellato: DataCite lo conserva in uno stato registrato ma nascosto, che non compare più nelle ricerche e rimanda qui anziché alla pagina ritirata.",
    note: "Se hai bisogno del documento per una valutazione, contatta direttamente l'autore.",
    backLink: "← Torna a SigmaCV",
  },
  "ko-KR": {
    metaTitle: "철회된 버전",
    metaDescription:
      "이 고정된 CV 버전은 소유자에 의해 철회되었습니다. DOI는 숨겨진 등록 상태로 유지됩니다.",
    heading: "이 버전은 소유자에 의해 철회되었습니다",
    body: "귀하가 따라온 DOI는 SigmaCV 이력서의 고정 버전에 대해 발급된 것입니다. 해당 버전은 소유자에 의해 철회되어 페이지와 그 기반 데이터는 더 이상 이용할 수 없습니다. DOI는 영속성에 대한 약속이므로 레코드는 삭제되지 않습니다. DataCite는 이를 숨겨진 등록 상태로 유지하며, 검색에 더 이상 나타나지 않고 철회된 페이지 대신 이 페이지를 가리킵니다.",
    note: "평가를 위해 해당 문서가 필요하다면 저자에게 직접 문의하세요.",
    backLink: "← SigmaCV로 돌아가기",
  },
  "ru-RU": {
    metaTitle: "Версия отозвана",
    metaDescription:
      "Эта зафиксированная версия резюме отозвана владельцем; её DOI сохраняется в скрытом зарегистрированном состоянии.",
    heading: "Эта версия отозвана владельцем",
    body: "DOI, по которому вы перешли, был присвоен зафиксированной версии резюме SigmaCV. Эта версия была отозвана её владельцем, поэтому страница и данные, лежащие в её основе, больше недоступны. Поскольку DOI — это обещание постоянства, запись не стирается: DataCite хранит её в скрытом зарегистрированном состоянии, которое больше не отображается в поиске и ведёт сюда, а не на отозванную страницу.",
    note: "Если документ нужен вам для оценки, обратитесь напрямую к его автору.",
    backLink: "← Назад к SigmaCV",
  },
};

/** Tombstone-page copy for a locale (falls back to en-US for an unknown locale). */
export function withdrawnStrings(locale: string): WithdrawnStrings {
  return WITHDRAWN_I18N[asLocale(locale)];
}
