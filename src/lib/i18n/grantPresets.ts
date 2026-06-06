import { GRANT_PRESET_IDS, type GrantPresetId } from "@/lib/canonical/grantPresets";
import { asLocale, type Locale } from "./index";

/**
 * Localized name + description for each EU grant-CV preset (Phase 7.4).
 *
 * The DESCRIPTION must always carry the caveat that this is a structured
 * STARTING POINT and the final submission goes through the funder's own
 * portal/template (ERC / MSCA via the EU Funding & Tenders portal) — proper
 * nouns ("ERC", "MSCA", "EU Funding & Tenders") stay untranslated.
 *
 * Typed Record<Locale, Record<GrantPresetId, …>> so a missing translation is a
 * compile error — the same enforcement as every other i18n module here.
 */
export interface GrantPresetStrings {
  /** Short label for the control button (e.g. "ERC"). */
  name: string;
  /** One-paragraph description, INCLUDING the funder-portal caveat. */
  description: string;
}

type GrantStrings = Record<GrantPresetId, GrantPresetStrings>;

const GRANT_I18N: Record<Locale, GrantStrings> = {
  "en-US": {
    erc: {
      name: "ERC",
      description:
        "A structured starting point for an ERC grant CV (Starting / Consolidator / Advanced): a selected, peer-reviewed track record (~10 outputs), funding, fellowships and honours, supervision, teaching, invited talks and commissions of trust, plus the narrative track-record modules. It is only a layout — the final application is submitted through the ERC's own template on the EU Funding & Tenders portal.",
    },
    msca: {
      name: "MSCA",
      description:
        "A structured starting point for an MSCA Postdoctoral Fellowships CV: degrees, positions, a short selected-publications list, fellowships and honours, supervision, teaching, talks and reviewing, plus the narrative track-record modules. It is only a layout — the final application is submitted through the MSCA template on the EU Funding & Tenders portal.",
    },
  },
  "zh-CN": {
    erc: {
      name: "ERC",
      description:
        "用于 ERC 资助简历（Starting／Consolidator／Advanced）的结构化起点：精选的同行评审代表作（约 10 项）、经费、奖学金与荣誉、指导、教学、受邀报告及信任性职务，并包含叙述式代表作模块。这只是一个版式——最终申请须通过 EU Funding & Tenders 门户上 ERC 自有的模板提交。",
    },
    msca: {
      name: "MSCA",
      description:
        "用于 MSCA 博士后奖学金简历的结构化起点：学位、职位、精简的精选论文清单、奖学金与荣誉、指导、教学、报告与评审，并包含叙述式代表作模块。这只是一个版式——最终申请须通过 EU Funding & Tenders 门户上的 MSCA 模板提交。",
    },
  },
  "es-ES": {
    erc: {
      name: "ERC",
      description:
        "Un punto de partida estructurado para un CV de subvención ERC (Starting / Consolidator / Advanced): una trayectoria seleccionada y revisada por pares (~10 trabajos), financiación, becas y distinciones, dirección, docencia, conferencias invitadas y encargos de confianza, además de los módulos narrativos de trayectoria. Es solo un diseño: la solicitud final se presenta mediante la propia plantilla del ERC en el portal EU Funding & Tenders.",
    },
    msca: {
      name: "MSCA",
      description:
        "Un punto de partida estructurado para un CV de las MSCA Postdoctoral Fellowships: titulaciones, puestos, una lista breve de publicaciones seleccionadas, becas y distinciones, dirección, docencia, conferencias y revisión, además de los módulos narrativos de trayectoria. Es solo un diseño: la solicitud final se presenta con la plantilla MSCA en el portal EU Funding & Tenders.",
    },
  },
  "fr-FR": {
    erc: {
      name: "ERC",
      description:
        "Un point de départ structuré pour un CV de bourse ERC (Starting / Consolidator / Advanced) : un bilan sélectif et évalué par les pairs (~10 travaux), les financements, les bourses et distinctions, l’encadrement, l’enseignement, les conférences sur invitation et les missions de confiance, ainsi que les modules narratifs de parcours. Ce n’est qu’une mise en page — la candidature finale se dépose via le modèle propre de l’ERC sur le portail EU Funding & Tenders.",
    },
    msca: {
      name: "MSCA",
      description:
        "Un point de départ structuré pour un CV MSCA Postdoctoral Fellowships : diplômes, postes, une courte liste de publications sélectionnées, bourses et distinctions, encadrement, enseignement, conférences et évaluation, ainsi que les modules narratifs de parcours. Ce n’est qu’une mise en page — la candidature finale se dépose via le modèle MSCA sur le portail EU Funding & Tenders.",
    },
  },
  "de-DE": {
    erc: {
      name: "ERC",
      description:
        "Ein strukturierter Ausgangspunkt für einen ERC-Förderlebenslauf (Starting / Consolidator / Advanced): ein ausgewählter, begutachteter Leistungsnachweis (~10 Arbeiten), Förderungen, Stipendien und Auszeichnungen, Betreuung, Lehre, eingeladene Vorträge und Vertrauensämter sowie die narrativen Track-Record-Module. Es ist nur ein Layout — der endgültige Antrag wird über die ERC-eigene Vorlage im Portal EU Funding & Tenders eingereicht.",
    },
    msca: {
      name: "MSCA",
      description:
        "Ein strukturierter Ausgangspunkt für einen Lebenslauf der MSCA Postdoctoral Fellowships: Abschlüsse, Positionen, eine kurze Liste ausgewählter Publikationen, Stipendien und Auszeichnungen, Betreuung, Lehre, Vorträge und Begutachtung sowie die narrativen Track-Record-Module. Es ist nur ein Layout — der endgültige Antrag wird über die MSCA-Vorlage im Portal EU Funding & Tenders eingereicht.",
    },
  },
  "ja-JP": {
    erc: {
      name: "ERC",
      description:
        "ERC 助成（Starting／Consolidator／Advanced）向け CV の構造化された出発点です。厳選した査読付きの代表業績（約10件）、研究費、フェローシップ・栄誉、指導、教育、招待講演、信任に基づく役職に加え、ナラティブの業績モジュールを含みます。これはレイアウトにすぎません——最終的な申請は EU Funding & Tenders ポータル上の ERC 専用テンプレートで提出します。",
    },
    msca: {
      name: "MSCA",
      description:
        "MSCA Postdoctoral Fellowships 向け CV の構造化された出発点です。学位、職歴、厳選した短い論文一覧、フェローシップ・栄誉、指導、教育、講演、査読に加え、ナラティブの業績モジュールを含みます。これはレイアウトにすぎません——最終的な申請は EU Funding & Tenders ポータル上の MSCA テンプレートで提出します。",
    },
  },
  "pt-BR": {
    erc: {
      name: "ERC",
      description:
        "Um ponto de partida estruturado para um currículo de financiamento ERC (Starting / Consolidator / Advanced): um histórico selecionado e revisado por pares (~10 trabalhos), financiamento, bolsas e honrarias, orientação, ensino, palestras convidadas e funções de confiança, além dos módulos narrativos de trajetória. É apenas um layout — a candidatura final é enviada pelo modelo do próprio ERC no portal EU Funding & Tenders.",
    },
    msca: {
      name: "MSCA",
      description:
        "Um ponto de partida estruturado para um currículo das MSCA Postdoctoral Fellowships: titulações, cargos, uma lista curta de publicações selecionadas, bolsas e honrarias, orientação, ensino, palestras e revisão, além dos módulos narrativos de trajetória. É apenas um layout — a candidatura final é enviada pelo modelo MSCA no portal EU Funding & Tenders.",
    },
  },
  "it-IT": {
    erc: {
      name: "ERC",
      description:
        "Un punto di partenza strutturato per un CV per un finanziamento ERC (Starting / Consolidator / Advanced): un percorso selezionato e sottoposto a revisione paritaria (~10 lavori), finanziamenti, borse e riconoscimenti, supervisione, didattica, relazioni su invito e incarichi di fiducia, oltre ai moduli narrativi di percorso. È solo un layout — la domanda finale si presenta tramite il modello proprio dell’ERC sul portale EU Funding & Tenders.",
    },
    msca: {
      name: "MSCA",
      description:
        "Un punto di partenza strutturato per un CV delle MSCA Postdoctoral Fellowships: titoli, incarichi, un breve elenco di pubblicazioni selezionate, borse e riconoscimenti, supervisione, didattica, relazioni e revisione, oltre ai moduli narrativi di percorso. È solo un layout — la domanda finale si presenta tramite il modello MSCA sul portale EU Funding & Tenders.",
    },
  },
  "ko-KR": {
    erc: {
      name: "ERC",
      description:
        "ERC 연구비 CV(Starting / Consolidator / Advanced)를 위한 구조화된 출발점입니다. 엄선한 동료 심사 대표 업적(약 10건), 연구비, 펠로십과 영예, 지도, 강의, 초청 강연, 신임 직무에 더해 내러티브 업적 모듈을 포함합니다. 이것은 레이아웃일 뿐이며 — 최종 지원은 EU Funding & Tenders 포털의 ERC 자체 템플릿으로 제출합니다.",
    },
    msca: {
      name: "MSCA",
      description:
        "MSCA Postdoctoral Fellowships CV를 위한 구조화된 출발점입니다. 학위, 경력, 엄선한 짧은 논문 목록, 펠로십과 영예, 지도, 강의, 강연과 심사에 더해 내러티브 업적 모듈을 포함합니다. 이것은 레이아웃일 뿐이며 — 최종 지원은 EU Funding & Tenders 포털의 MSCA 템플릿으로 제출합니다.",
    },
  },
  "ru-RU": {
    erc: {
      name: "ERC",
      description:
        "Структурированная отправная точка для резюме под грант ERC (Starting / Consolidator / Advanced): отобранный, прошедший рецензирование послужной список (~10 работ), финансирование, стипендии и награды, руководство, преподавание, приглашённые доклады и должности доверия, а также нарративные модули послужного списка. Это лишь макет — итоговая заявка подаётся через собственный шаблон ERC на портале EU Funding & Tenders.",
    },
    msca: {
      name: "MSCA",
      description:
        "Структурированная отправная точка для резюме MSCA Postdoctoral Fellowships: дипломы, должности, краткий список избранных публикаций, стипендии и награды, руководство, преподавание, доклады и рецензирование, а также нарративные модули послужного списка. Это лишь макет — итоговая заявка подаётся через шаблон MSCA на портале EU Funding & Tenders.",
    },
  },
};

/** Localized grant-preset strings for a locale (falls back to en-US). */
export function grantPresetStrings(locale: string): GrantStrings {
  return GRANT_I18N[asLocale(locale)];
}

/** Localized name + description for one grant preset. */
export function grantPresetLabel(
  locale: string,
  id: GrantPresetId,
): GrantPresetStrings {
  return grantPresetStrings(locale)[id];
}

/** The grant presets in catalog order, each with its localized label. */
export function grantPresetList(
  locale: string,
): ReadonlyArray<{ id: GrantPresetId } & GrantPresetStrings> {
  const strings = grantPresetStrings(locale);
  return GRANT_PRESET_IDS.map((id) => ({ id, ...strings[id] }));
}
