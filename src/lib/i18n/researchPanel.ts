import { asLocale, type Locale } from "./index";

/**
 * The research panel's own UI text, in the ten UI locales: the entry points,
 * the status while taking part, the withdrawal confirmation, the errors and
 * the printable sheet's record table. The consent text itself (title,
 * summary, information sheet, checkboxes, the take-part button, contacts) is
 * NOT here: it exists only in the languages the ethics committee approved,
 * in `src/lib/research/consent/`. None of these strings may call the research
 * data anonymous: the approved sheet says it is pseudonymised, not anonymised.
 * `{date}`, `{version}` and `{document}` are substituted at the call site.
 */
export interface ResearchPanelStrings {
  /** The account-menu item and the editor link that open the panel. */
  entry: string;
  /** The panel heading while taking part (before, the consent title shows). */
  heading: string;
  close: string;
  /** Accessible label of the consent-language switch. */
  languageLabel: string;
  /** Shown when the UI locale is not a language of the study documents. */
  languageNote: string;
  loading: string;
  loadError: string;
  retry: string;
  saveError: string;
  /** A grant refused: the page holds a consent text that has been replaced. */
  staleText: string;
  /** A grant refused: the study takes no participants now. */
  closed: string;
  /** Consent on record under an older version, which no longer counts. */
  staleConsent: string;
  /** The status line while taking part. */
  since: string;
  secondaryYes: string;
  secondaryNo: string;
  sheetLink: string;
  recordLink: string;
  stop: string;
  stopTitle: string;
  stopBody: string;
  cancel: string;
  /** Confirmation after a withdrawal. */
  stopped: string;
  /** Withdrawing a consent given under an older version. */
  stopStale: string;
  // ── The printable information sheet (/cv/research-sheet) ──
  print: string;
  recordHeading: string;
  recordDate: string;
  recordAction: string;
  recordVersion: string;
  recordLanguage: string;
  recordSecondary: string;
  recordGrant: string;
  recordWithdraw: string;
  recordNone: string;
  yes: string;
  no: string;
}

const RESEARCH_PANEL: Record<Locale, ResearchPanelStrings> = {
  "en-US": {
    entry: "Research participation",
    heading: "Research participation",
    close: "Close",
    languageLabel: "Language of the study information",
    languageNote:
      "The study’s information sheet exists in English and Japanese only, so it is shown in English.",
    loading: "Loading…",
    loadError: "Your research participation could not be loaded.",
    retry: "Try again",
    saveError: "Your choice could not be saved. Please try again.",
    staleText:
      "The study information has changed since this page was opened. Reload the page and read it again.",
    closed: "The study is not taking participants at the moment.",
    staleConsent:
      "You agreed to an earlier version of this study’s terms. To keep taking part, read the information below and agree again.",
    since: "You are taking part since {date} · consent version {version} ({document})",
    secondaryYes: "Future related research: you agreed",
    secondaryNo: "Future related research: you did not agree",
    sheetLink: "Information sheet (print or save as PDF)",
    recordLink: "Download consent record",
    stop: "Stop taking part",
    stopTitle: "Stop taking part?",
    stopBody:
      "Your research data will be deleted, except results already published. Nothing else changes in SigmaCV.",
    cancel: "Cancel",
    stopped: "You have stopped taking part. Your research data has been deleted.",
    stopStale: "Withdraw the earlier consent",
    print: "Print or save as PDF",
    recordHeading: "Your consent record",
    recordDate: "Date (UTC)",
    recordAction: "Act",
    recordVersion: "Consent version",
    recordLanguage: "Language",
    recordSecondary: "Future related research",
    recordGrant: "Agreed",
    recordWithdraw: "Withdrew",
    recordNone: "No consent on record.",
    yes: "Yes",
    no: "No",
  },
  "zh-CN": {
    entry: "参与研究",
    heading: "参与研究",
    close: "关闭",
    languageLabel: "研究说明的语言",
    languageNote: "本研究的说明文件仅有英文和日文版本，因此以英文显示。",
    loading: "加载中…",
    loadError: "无法加载您的研究参与状态。",
    retry: "重试",
    saveError: "无法保存您的选择，请重试。",
    staleText: "自您打开此页面后，研究说明已更新。请重新加载页面并再次阅读。",
    closed: "本研究目前不接受参与者。",
    staleConsent: "您同意的是本研究条款的早期版本。如要继续参与，请阅读下方说明并重新同意。",
    since: "您自 {date} 起参与本研究 · 同意版本 {version}（{document}）",
    secondaryYes: "未来相关研究：您已同意",
    secondaryNo: "未来相关研究：您未同意",
    sheetLink: "说明文件（打印或另存为 PDF）",
    recordLink: "下载同意记录",
    stop: "停止参与",
    stopTitle: "停止参与？",
    stopBody: "您的研究数据将被删除（已发表的结果除外）。SigmaCV 的其他功能不受影响。",
    cancel: "取消",
    stopped: "您已停止参与。您的研究数据已被删除。",
    stopStale: "撤回早期的同意",
    print: "打印或另存为 PDF",
    recordHeading: "您的同意记录",
    recordDate: "日期（UTC）",
    recordAction: "操作",
    recordVersion: "同意版本",
    recordLanguage: "语言",
    recordSecondary: "未来相关研究",
    recordGrant: "同意",
    recordWithdraw: "撤回",
    recordNone: "没有同意记录。",
    yes: "是",
    no: "否",
  },
  "es-ES": {
    entry: "Participación en investigación",
    heading: "Participación en investigación",
    close: "Cerrar",
    languageLabel: "Idioma de la información del estudio",
    languageNote:
      "La hoja de información del estudio solo existe en inglés y japonés, por lo que se muestra en inglés.",
    loading: "Cargando…",
    loadError: "No se pudo cargar tu participación en la investigación.",
    retry: "Reintentar",
    saveError: "No se pudo guardar tu elección. Inténtalo de nuevo.",
    staleText:
      "La información del estudio ha cambiado desde que abriste esta página. Recarga la página y léela de nuevo.",
    closed: "El estudio no admite participantes en este momento.",
    staleConsent:
      "Aceptaste una versión anterior de las condiciones de este estudio. Para seguir participando, lee la información de abajo y vuelve a aceptar.",
    since: "Participas desde el {date} · versión del consentimiento {version} ({document})",
    secondaryYes: "Investigación futura relacionada: aceptaste",
    secondaryNo: "Investigación futura relacionada: no aceptaste",
    sheetLink: "Hoja de información (imprimir o guardar como PDF)",
    recordLink: "Descargar el registro de consentimiento",
    stop: "Dejar de participar",
    stopTitle: "¿Dejar de participar?",
    stopBody:
      "Se eliminarán tus datos de investigación, salvo los resultados ya publicados. Nada más cambia en SigmaCV.",
    cancel: "Cancelar",
    stopped: "Has dejado de participar. Tus datos de investigación se han eliminado.",
    stopStale: "Retirar el consentimiento anterior",
    print: "Imprimir o guardar como PDF",
    recordHeading: "Tu registro de consentimiento",
    recordDate: "Fecha (UTC)",
    recordAction: "Acción",
    recordVersion: "Versión del consentimiento",
    recordLanguage: "Idioma",
    recordSecondary: "Investigación futura relacionada",
    recordGrant: "Aceptado",
    recordWithdraw: "Retirado",
    recordNone: "No hay ningún consentimiento registrado.",
    yes: "Sí",
    no: "No",
  },
  "fr-FR": {
    entry: "Participation à la recherche",
    heading: "Participation à la recherche",
    close: "Fermer",
    languageLabel: "Langue des informations sur l’étude",
    languageNote:
      "La notice d’information de l’étude n’existe qu’en anglais et en japonais ; elle s’affiche donc en anglais.",
    loading: "Chargement…",
    loadError: "Impossible de charger votre participation à la recherche.",
    retry: "Réessayer",
    saveError: "Impossible d’enregistrer votre choix. Veuillez réessayer.",
    staleText:
      "Les informations sur l’étude ont changé depuis l’ouverture de cette page. Rechargez la page et relisez-les.",
    closed: "L’étude n’accueille pas de participants pour le moment.",
    staleConsent:
      "Vous avez accepté une version antérieure des conditions de cette étude. Pour continuer à participer, lisez les informations ci-dessous et acceptez à nouveau.",
    since: "Vous participez depuis le {date} · version du consentement {version} ({document})",
    secondaryYes: "Recherches futures liées : vous avez accepté",
    secondaryNo: "Recherches futures liées : vous n’avez pas accepté",
    sheetLink: "Notice d’information (imprimer ou enregistrer en PDF)",
    recordLink: "Télécharger l’enregistrement du consentement",
    stop: "Arrêter de participer",
    stopTitle: "Arrêter de participer ?",
    stopBody:
      "Vos données de recherche seront supprimées, sauf les résultats déjà publiés. Rien d’autre ne change dans SigmaCV.",
    cancel: "Annuler",
    stopped: "Vous avez arrêté de participer. Vos données de recherche ont été supprimées.",
    stopStale: "Retirer le consentement antérieur",
    print: "Imprimer ou enregistrer en PDF",
    recordHeading: "Votre enregistrement de consentement",
    recordDate: "Date (UTC)",
    recordAction: "Acte",
    recordVersion: "Version du consentement",
    recordLanguage: "Langue",
    recordSecondary: "Recherches futures liées",
    recordGrant: "Accepté",
    recordWithdraw: "Retiré",
    recordNone: "Aucun consentement enregistré.",
    yes: "Oui",
    no: "Non",
  },
  "de-DE": {
    entry: "Forschungsteilnahme",
    heading: "Forschungsteilnahme",
    close: "Schließen",
    languageLabel: "Sprache der Studieninformation",
    languageNote:
      "Die Studieninformation gibt es nur auf Englisch und Japanisch; sie wird daher auf Englisch angezeigt.",
    loading: "Wird geladen…",
    loadError: "Ihre Forschungsteilnahme konnte nicht geladen werden.",
    retry: "Erneut versuchen",
    saveError: "Ihre Auswahl konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
    staleText:
      "Die Studieninformation hat sich geändert, seit diese Seite geöffnet wurde. Laden Sie die Seite neu und lesen Sie sie erneut.",
    closed: "Die Studie nimmt derzeit keine Teilnehmenden auf.",
    staleConsent:
      "Sie haben einer früheren Fassung der Bedingungen dieser Studie zugestimmt. Um weiter teilzunehmen, lesen Sie die Informationen unten und stimmen Sie erneut zu.",
    since: "Sie nehmen seit {date} teil · Einwilligungsversion {version} ({document})",
    secondaryYes: "Künftige verwandte Forschung: Sie haben zugestimmt",
    secondaryNo: "Künftige verwandte Forschung: Sie haben nicht zugestimmt",
    sheetLink: "Informationsblatt (drucken oder als PDF speichern)",
    recordLink: "Einwilligungsnachweis herunterladen",
    stop: "Teilnahme beenden",
    stopTitle: "Teilnahme beenden?",
    stopBody:
      "Ihre Forschungsdaten werden gelöscht, ausgenommen bereits veröffentlichte Ergebnisse. Sonst ändert sich in SigmaCV nichts.",
    cancel: "Abbrechen",
    stopped: "Sie haben Ihre Teilnahme beendet. Ihre Forschungsdaten wurden gelöscht.",
    stopStale: "Frühere Einwilligung widerrufen",
    print: "Drucken oder als PDF speichern",
    recordHeading: "Ihr Einwilligungsnachweis",
    recordDate: "Datum (UTC)",
    recordAction: "Vorgang",
    recordVersion: "Einwilligungsversion",
    recordLanguage: "Sprache",
    recordSecondary: "Künftige verwandte Forschung",
    recordGrant: "Zugestimmt",
    recordWithdraw: "Widerrufen",
    recordNone: "Keine Einwilligung erfasst.",
    yes: "Ja",
    no: "Nein",
  },
  "ja-JP": {
    entry: "研究への参加",
    heading: "研究への参加",
    close: "閉じる",
    languageLabel: "研究の説明の言語",
    languageNote: "研究の説明文書は英語と日本語でのみ用意されているため、英語で表示しています。",
    loading: "読み込み中…",
    loadError: "研究への参加状況を読み込めませんでした。",
    retry: "再試行",
    saveError: "選択を保存できませんでした。もう一度お試しください。",
    staleText:
      "このページを開いた後に研究の説明が更新されました。ページを再読み込みして、もう一度お読みください。",
    closed: "現在、この研究は参加者を受け付けていません。",
    staleConsent:
      "以前の版の説明に同意されています。参加を続ける場合は、下の説明を読み、改めて同意してください。",
    since: "{date}から参加しています。同意の版は{version}（{document}）です。",
    secondaryYes: "将来の関連研究への利用に同意しています",
    secondaryNo: "将来の関連研究への利用には同意していません",
    sheetLink: "説明文書（印刷・PDF保存）",
    recordLink: "同意記録をダウンロード",
    stop: "参加をやめる（同意の撤回）",
    stopTitle: "参加をやめますか？",
    stopBody:
      "研究用データを削除します（既に公表した結果を除く）。SigmaCVのほかの機能は何も変わりません。",
    cancel: "キャンセル",
    stopped: "参加をやめました。研究用データは削除しました。",
    stopStale: "以前の同意を撤回する",
    print: "印刷・PDFで保存",
    recordHeading: "あなたの同意記録",
    recordDate: "日時（UTC）",
    recordAction: "操作",
    recordVersion: "同意の版",
    recordLanguage: "言語",
    recordSecondary: "将来の関連研究",
    recordGrant: "同意",
    recordWithdraw: "撤回",
    recordNone: "同意の記録はありません。",
    yes: "はい",
    no: "いいえ",
  },
  "pt-BR": {
    entry: "Participação em pesquisa",
    heading: "Participação em pesquisa",
    close: "Fechar",
    languageLabel: "Idioma das informações do estudo",
    languageNote:
      "A folha de informações do estudo existe apenas em inglês e japonês, por isso é exibida em inglês.",
    loading: "Carregando…",
    loadError: "Não foi possível carregar sua participação na pesquisa.",
    retry: "Tentar novamente",
    saveError: "Não foi possível salvar sua escolha. Tente novamente.",
    staleText:
      "As informações do estudo mudaram desde que esta página foi aberta. Recarregue a página e leia-as novamente.",
    closed: "O estudo não está aceitando participantes no momento.",
    staleConsent:
      "Você concordou com uma versão anterior dos termos deste estudo. Para continuar participando, leia as informações abaixo e concorde novamente.",
    since: "Você participa desde {date} · versão do consentimento {version} ({document})",
    secondaryYes: "Pesquisas futuras relacionadas: você concordou",
    secondaryNo: "Pesquisas futuras relacionadas: você não concordou",
    sheetLink: "Folha de informações (imprimir ou salvar como PDF)",
    recordLink: "Baixar o registro de consentimento",
    stop: "Deixar de participar",
    stopTitle: "Deixar de participar?",
    stopBody:
      "Seus dados de pesquisa serão excluídos, exceto resultados já publicados. Nada mais muda no SigmaCV.",
    cancel: "Cancelar",
    stopped: "Você deixou de participar. Seus dados de pesquisa foram excluídos.",
    stopStale: "Retirar o consentimento anterior",
    print: "Imprimir ou salvar como PDF",
    recordHeading: "Seu registro de consentimento",
    recordDate: "Data (UTC)",
    recordAction: "Ação",
    recordVersion: "Versão do consentimento",
    recordLanguage: "Idioma",
    recordSecondary: "Pesquisas futuras relacionadas",
    recordGrant: "Concordou",
    recordWithdraw: "Retirou",
    recordNone: "Nenhum consentimento registrado.",
    yes: "Sim",
    no: "Não",
  },
  "it-IT": {
    entry: "Partecipazione alla ricerca",
    heading: "Partecipazione alla ricerca",
    close: "Chiudi",
    languageLabel: "Lingua delle informazioni sullo studio",
    languageNote:
      "Il foglio informativo dello studio esiste solo in inglese e giapponese, perciò è mostrato in inglese.",
    loading: "Caricamento…",
    loadError: "Impossibile caricare la tua partecipazione alla ricerca.",
    retry: "Riprova",
    saveError: "Impossibile salvare la tua scelta. Riprova.",
    staleText:
      "Le informazioni sullo studio sono cambiate da quando hai aperto questa pagina. Ricarica la pagina e rileggile.",
    closed: "Al momento lo studio non accoglie partecipanti.",
    staleConsent:
      "Hai accettato una versione precedente delle condizioni di questo studio. Per continuare a partecipare, leggi le informazioni qui sotto e accetta di nuovo.",
    since: "Partecipi dal {date} · versione del consenso {version} ({document})",
    secondaryYes: "Ricerche future correlate: hai accettato",
    secondaryNo: "Ricerche future correlate: non hai accettato",
    sheetLink: "Foglio informativo (stampa o salva in PDF)",
    recordLink: "Scarica la registrazione del consenso",
    stop: "Smetti di partecipare",
    stopTitle: "Smettere di partecipare?",
    stopBody:
      "I tuoi dati di ricerca saranno eliminati, tranne i risultati già pubblicati. Nient’altro cambia in SigmaCV.",
    cancel: "Annulla",
    stopped: "Hai smesso di partecipare. I tuoi dati di ricerca sono stati eliminati.",
    stopStale: "Revoca il consenso precedente",
    print: "Stampa o salva in PDF",
    recordHeading: "La tua registrazione del consenso",
    recordDate: "Data (UTC)",
    recordAction: "Atto",
    recordVersion: "Versione del consenso",
    recordLanguage: "Lingua",
    recordSecondary: "Ricerche future correlate",
    recordGrant: "Accettato",
    recordWithdraw: "Revocato",
    recordNone: "Nessun consenso registrato.",
    yes: "Sì",
    no: "No",
  },
  "ko-KR": {
    entry: "연구 참여",
    heading: "연구 참여",
    close: "닫기",
    languageLabel: "연구 안내의 언어",
    languageNote: "연구 설명문은 영어와 일본어로만 제공되므로 영어로 표시됩니다.",
    loading: "불러오는 중…",
    loadError: "연구 참여 상태를 불러오지 못했습니다.",
    retry: "다시 시도",
    saveError: "선택을 저장하지 못했습니다. 다시 시도해 주세요.",
    staleText:
      "이 페이지를 연 뒤 연구 안내가 변경되었습니다. 페이지를 새로 고친 뒤 다시 읽어 주세요.",
    closed: "현재 이 연구는 참여자를 받지 않습니다.",
    staleConsent:
      "이 연구 조건의 이전 버전에 동의하셨습니다. 계속 참여하시려면 아래 안내를 읽고 다시 동의해 주세요.",
    since: "{date}부터 참여 중 · 동의 버전 {version} ({document})",
    secondaryYes: "향후 관련 연구: 동의함",
    secondaryNo: "향후 관련 연구: 동의하지 않음",
    sheetLink: "설명문 (인쇄 또는 PDF로 저장)",
    recordLink: "동의 기록 다운로드",
    stop: "참여 중단",
    stopTitle: "참여를 중단하시겠어요?",
    stopBody:
      "이미 발표된 결과를 제외한 연구 데이터가 삭제됩니다. SigmaCV의 다른 기능은 그대로입니다.",
    cancel: "취소",
    stopped: "참여를 중단했습니다. 연구 데이터가 삭제되었습니다.",
    stopStale: "이전 동의 철회",
    print: "인쇄 또는 PDF로 저장",
    recordHeading: "내 동의 기록",
    recordDate: "일시 (UTC)",
    recordAction: "구분",
    recordVersion: "동의 버전",
    recordLanguage: "언어",
    recordSecondary: "향후 관련 연구",
    recordGrant: "동의",
    recordWithdraw: "철회",
    recordNone: "동의 기록이 없습니다.",
    yes: "예",
    no: "아니요",
  },
  "ru-RU": {
    entry: "Участие в исследовании",
    heading: "Участие в исследовании",
    close: "Закрыть",
    languageLabel: "Язык сведений об исследовании",
    languageNote:
      "Информационный лист исследования существует только на английском и японском языках, поэтому он показан на английском.",
    loading: "Загрузка…",
    loadError: "Не удалось загрузить сведения о вашем участии в исследовании.",
    retry: "Повторить",
    saveError: "Не удалось сохранить ваш выбор. Попробуйте ещё раз.",
    staleText:
      "Сведения об исследовании изменились после открытия этой страницы. Перезагрузите страницу и прочитайте их снова.",
    closed: "Сейчас исследование не принимает участников.",
    staleConsent:
      "Вы согласились с предыдущей версией условий этого исследования. Чтобы продолжить участие, прочитайте сведения ниже и дайте согласие снова.",
    since: "Вы участвуете с {date} · версия согласия {version} ({document})",
    secondaryYes: "Будущие связанные исследования: вы согласились",
    secondaryNo: "Будущие связанные исследования: вы не согласились",
    sheetLink: "Информационный лист (печать или сохранение в PDF)",
    recordLink: "Скачать запись о согласии",
    stop: "Прекратить участие",
    stopTitle: "Прекратить участие?",
    stopBody:
      "Ваши исследовательские данные будут удалены, кроме уже опубликованных результатов. Больше ничего в SigmaCV не изменится.",
    cancel: "Отмена",
    stopped: "Вы прекратили участие. Ваши исследовательские данные удалены.",
    stopStale: "Отозвать прежнее согласие",
    print: "Печать или сохранение в PDF",
    recordHeading: "Ваша запись о согласии",
    recordDate: "Дата (UTC)",
    recordAction: "Действие",
    recordVersion: "Версия согласия",
    recordLanguage: "Язык",
    recordSecondary: "Будущие связанные исследования",
    recordGrant: "Согласие",
    recordWithdraw: "Отзыв",
    recordNone: "Записей о согласии нет.",
    yes: "Да",
    no: "Нет",
  },
};

/** The research panel's UI text for a UI locale (falls back to en-US). */
export function researchPanelStrings(locale: string): ResearchPanelStrings {
  return RESEARCH_PANEL[asLocale(locale)];
}
