import { asLocale, type Locale } from "./index";

/**
 * Copy for the "Import a .bib file" on-ramp in the editor (components/
 * ImportBib.tsx), shown beside "Add a publication by DOI". Lets researchers who
 * already keep a clean bibliography start from it.
 *
 * Own module (same convention as orcidHelp.ts / preview.ts). Typed Record<Locale,
 * ImportBibStrings> so a missing locale/field is a compile error. Non-English copy
 * was machine-drafted and is flagged for native review.
 *
 * "BibTeX", ".bib", "Zotero", "Mendeley", "JabRef" are proper nouns — never
 * translated (pinned by the i18n brand-noun test). `result` is a template with
 * `{added}` / `{duplicates}` / `{skipped}` placeholders filled at render.
 */
export interface ImportBibStrings {
  /** <summary> label. */
  label: string;
  /** One-line explainer under the file input. */
  note: string;
  /** Import button. */
  button: string;
  /** aria-label for the file input. */
  ariaFile: string;
  /** Shown on a failed import. */
  error: string;
  /** Result summary — `{added}` / `{duplicates}` / `{skipped}` are substituted. */
  result: string;
  /** Rate-limited (HTTP 429). */
  errorTooMany: string;
  /** File exceeds the size cap (HTTP 413). */
  errorTooLarge: string;
  /** No CV yet — must sync first (HTTP 409). */
  errorNotSynced: string;
}

const IMPORT_BIB_I18N: Record<Locale, ImportBibStrings> = {
  "en-US": {
    label: "Import a .bib file",
    note: "Bring your publications in from a Zotero, Mendeley or JabRef BibTeX export. Works already in your CV are skipped.",
    button: "Import",
    ariaFile: "Choose a BibTeX (.bib) file",
    error: "Couldn't import that file. Please check it's valid BibTeX and try again.",
    result: "Added {added} · {duplicates} already present · {skipped} skipped",
    errorTooMany: "Too many imports just now. Please wait a moment and try again.",
    errorTooLarge: "That .bib file is too large to import.",
    errorNotSynced: "Sync your CV once before importing.",
  },
  "zh-CN": {
    label: "导入 .bib 文件",
    note: "从 Zotero、Mendeley 或 JabRef 的 BibTeX 导出文件导入您的论文。已在您简历中的成果将被跳过。",
    button: "导入",
    ariaFile: "选择一个 BibTeX (.bib) 文件",
    error: "无法导入该文件。请确认它是有效的 BibTeX 后重试。",
    result: "已添加 {added} · {duplicates} 项已存在 · 跳过 {skipped}",
    errorTooMany: "导入过于频繁。请稍候片刻后重试。",
    errorTooLarge: "该 .bib 文件太大，无法导入。",
    errorNotSynced: "请先同步一次您的简历，然后再导入。",
  },
  "es-ES": {
    label: "Importar un archivo .bib",
    note: "Importa tus publicaciones desde una exportación BibTeX de Zotero, Mendeley o JabRef. Los trabajos que ya están en tu CV se omiten.",
    button: "Importar",
    ariaFile: "Elegir un archivo BibTeX (.bib)",
    error:
      "No se pudo importar ese archivo. Comprueba que sea un BibTeX válido e inténtalo de nuevo.",
    result: "{added} añadidos · {duplicates} ya presentes · {skipped} omitidos",
    errorTooMany: "Demasiadas importaciones por ahora. Espera un momento e inténtalo de nuevo.",
    errorTooLarge: "Ese archivo .bib es demasiado grande para importarlo.",
    errorNotSynced: "Sincroniza tu CV una vez antes de importar.",
  },
  "fr-FR": {
    label: "Importer un fichier .bib",
    note: "Importez vos publications depuis un export BibTeX de Zotero, Mendeley ou JabRef. Les travaux déjà présents dans votre CV sont ignorés.",
    button: "Importer",
    ariaFile: "Choisir un fichier BibTeX (.bib)",
    error:
      "Impossible d'importer ce fichier. Vérifiez qu'il s'agit d'un BibTeX valide et réessayez.",
    result: "{added} ajoutés · {duplicates} déjà présents · {skipped} ignorés",
    errorTooMany: "Trop d'imports pour le moment. Veuillez patienter un instant, puis réessayer.",
    errorTooLarge: "Ce fichier .bib est trop volumineux pour être importé.",
    errorNotSynced: "Synchronisez votre CV une première fois avant d'importer.",
  },
  "de-DE": {
    label: "Eine .bib-Datei importieren",
    note: "Importieren Sie Ihre Publikationen aus einem BibTeX-Export von Zotero, Mendeley oder JabRef. Bereits in Ihrem Lebenslauf vorhandene Arbeiten werden übersprungen.",
    button: "Importieren",
    ariaFile: "Eine BibTeX-Datei (.bib) auswählen",
    error:
      "Diese Datei konnte nicht importiert werden. Bitte prüfen Sie, ob es gültiges BibTeX ist, und versuchen Sie es erneut.",
    result: "{added} hinzugefügt · {duplicates} bereits vorhanden · {skipped} übersprungen",
    errorTooMany:
      "Zu viele Importe im Moment. Bitte warten Sie einen Moment und versuchen Sie es erneut.",
    errorTooLarge: "Diese .bib-Datei ist zu groß für den Import.",
    errorNotSynced: "Synchronisieren Sie Ihren Lebenslauf einmal, bevor Sie importieren.",
  },
  "ja-JP": {
    label: ".bib ファイルをインポート",
    note: "Zotero・Mendeley・JabRef の BibTeX エクスポートから論文を取り込みます。すでに CV にある業績はスキップされます。",
    button: "インポート",
    ariaFile: "BibTeX（.bib）ファイルを選択",
    error:
      "このファイルをインポートできませんでした。有効な BibTeX かご確認のうえ、もう一度お試しください。",
    result: "{added} 件追加 · {duplicates} 件は既存 · {skipped} 件スキップ",
    errorTooMany: "現在インポートが多すぎます。少し待ってからもう一度お試しください。",
    errorTooLarge: "この .bib ファイルは大きすぎてインポートできません。",
    errorNotSynced: "インポートの前に、CV を一度同期してください。",
  },
  "pt-BR": {
    label: "Importar um arquivo .bib",
    note: "Traga suas publicações de uma exportação BibTeX do Zotero, Mendeley ou JabRef. Trabalhos que já estão no seu CV são ignorados.",
    button: "Importar",
    ariaFile: "Escolher um arquivo BibTeX (.bib)",
    error:
      "Não foi possível importar esse arquivo. Verifique se é um BibTeX válido e tente novamente.",
    result: "{added} adicionados · {duplicates} já presentes · {skipped} ignorados",
    errorTooMany: "Muitas importações agora. Aguarde um momento e tente novamente.",
    errorTooLarge: "Esse arquivo .bib é grande demais para importar.",
    errorNotSynced: "Sincronize seu CV uma vez antes de importar.",
  },
  "it-IT": {
    label: "Importa un file .bib",
    note: "Importa le tue pubblicazioni da un'esportazione BibTeX di Zotero, Mendeley o JabRef. I lavori già presenti nel tuo CV vengono ignorati.",
    button: "Importa",
    ariaFile: "Scegli un file BibTeX (.bib)",
    error: "Impossibile importare il file. Verifica che sia un BibTeX valido e riprova.",
    result: "{added} aggiunti · {duplicates} già presenti · {skipped} ignorati",
    errorTooMany: "Troppe importazioni al momento. Attendi un momento e riprova.",
    errorTooLarge: "Questo file .bib è troppo grande per essere importato.",
    errorNotSynced: "Sincronizza il tuo CV una volta prima di importare.",
  },
  "ko-KR": {
    label: ".bib 파일 가져오기",
    note: "Zotero, Mendeley 또는 JabRef의 BibTeX 내보내기에서 논문을 가져옵니다. 이미 CV에 있는 업적은 건너뜁니다.",
    button: "가져오기",
    ariaFile: "BibTeX(.bib) 파일 선택",
    error: "이 파일을 가져오지 못했습니다. 유효한 BibTeX인지 확인한 후 다시 시도해 주세요.",
    result: "{added}건 추가 · {duplicates}건 이미 있음 · {skipped}건 건너뜀",
    errorTooMany: "지금은 가져오기가 너무 많습니다. 잠시 후 다시 시도해 주세요.",
    errorTooLarge: "이 .bib 파일은 너무 커서 가져올 수 없습니다.",
    errorNotSynced: "가져오기 전에 CV를 한 번 동기화해 주세요.",
  },
  "ru-RU": {
    label: "Импортировать файл .bib",
    note: "Импортируйте свои публикации из экспорта BibTeX в Zotero, Mendeley или JabRef. Работы, уже добавленные в ваше CV, пропускаются.",
    button: "Импортировать",
    ariaFile: "Выберите файл BibTeX (.bib)",
    error:
      "Не удалось импортировать этот файл. Убедитесь, что это корректный BibTeX, и попробуйте снова.",
    result: "Добавлено {added} · {duplicates} уже есть · пропущено {skipped}",
    errorTooMany:
      "Сейчас слишком много импортов. Пожалуйста, подождите немного и попробуйте снова.",
    errorTooLarge: "Этот файл .bib слишком большой для импорта.",
    errorNotSynced: "Синхронизируйте своё CV один раз перед импортом.",
  },
};

/** Editor "import .bib" copy for a locale (falls back to English). */
export function importBibStrings(locale: string): ImportBibStrings {
  return IMPORT_BIB_I18N[asLocale(locale)];
}
