import { GRANT_PRESET_IDS, type GrantPresetId } from "@/lib/canonical/grantPresets";
import { asLocale, type Locale } from "./index";

/**
 * Localized name + description for each grant-CV preset (Phase 7.4 EU ·
 * 7.5 US NSF · 7.6 Japan JSPS).
 *
 * The DESCRIPTION must always carry the caveat that this is a structured
 * STARTING POINT and the final submission goes through the funder's own
 * portal/template:
 *   • ERC / MSCA  → the EU Funding & Tenders portal
 *   • NSF         → SciENcv on Research.gov
 *   • JSPS/KAKENHI → e-Rad (data maintained in researchmap)
 * Proper nouns ("ERC", "MSCA", "NSF", "JSPS", "KAKENHI", "EU Funding &
 * Tenders", "SciENcv", "Research.gov", "e-Rad", "researchmap") stay
 * untranslated.
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
    nsf: {
      name: "NSF",
      description:
        "A structured starting point for a US NSF biographical sketch (SciENcv structure): Professional Preparation (education), Appointments (positions), Products (~10 selected, peer-reviewed outputs), Synergistic Activities (service and talks) and funding, plus the narrative modules. It is only a draft — NSF requires the biosketch to be generated and certified via SciENcv on Research.gov, which produces the official PDF.",
    },
    jsps: {
      name: "JSPS",
      description:
        "A structured starting point for a Japan JSPS / KAKENHI researcher profile (researchmap / e-Rad based): research achievements (~10 selected publications), career (positions and education), research funding and awards, plus the narrative research summary. It is only a draft — KAKENHI applications are submitted through e-Rad and the researcher record is maintained in researchmap.",
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
    nsf: {
      name: "NSF",
      description:
        "用于美国 NSF 个人简历（SciENcv 结构）的结构化起点：Professional Preparation（教育）、Appointments（职位）、Products（约 10 项精选的同行评审成果）、Synergistic Activities（服务与报告）以及经费，并包含叙述式模块。这只是一份草稿——NSF 要求该简历须通过 Research.gov 上的 SciENcv 生成并认证，由其产出正式 PDF。",
    },
    jsps: {
      name: "JSPS",
      description:
        "用于日本 JSPS／KAKENHI 研究者档案（基于 researchmap／e-Rad）的结构化起点：研究业绩（约 10 项精选论文）、经历（职位与教育）、研究费与受奖，并包含叙述式研究概述。这只是一份草稿——KAKENHI 申请须通过 e-Rad 提交，研究者信息在 researchmap 中维护。",
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
    nsf: {
      name: "NSF",
      description:
        "Un punto de partida estructurado para un biographical sketch de la NSF de EE. UU. (estructura SciENcv): Professional Preparation (formación), Appointments (puestos), Products (~10 trabajos seleccionados y revisados por pares), Synergistic Activities (servicio y conferencias) y financiación, además de los módulos narrativos. Es solo un borrador: la NSF exige que el biosketch se genere y certifique mediante SciENcv en Research.gov, que produce el PDF oficial.",
    },
    jsps: {
      name: "JSPS",
      description:
        "Un punto de partida estructurado para un perfil de investigador de la JSPS / KAKENHI de Japón (basado en researchmap / e-Rad): logros de investigación (~10 publicaciones seleccionadas), trayectoria (puestos y formación), financiación de investigación y premios, además del resumen narrativo de investigación. Es solo un borrador: las solicitudes KAKENHI se presentan a través de e-Rad y el registro del investigador se mantiene en researchmap.",
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
    nsf: {
      name: "NSF",
      description:
        "Un point de départ structuré pour un biographical sketch de la NSF américaine (structure SciENcv) : Professional Preparation (formation), Appointments (postes), Products (~10 travaux sélectionnés et évalués par les pairs), Synergistic Activities (missions et conférences) et financements, ainsi que les modules narratifs. Ce n’est qu’un brouillon — la NSF exige que le biosketch soit généré et certifié via SciENcv sur Research.gov, qui produit le PDF officiel.",
    },
    jsps: {
      name: "JSPS",
      description:
        "Un point de départ structuré pour un profil de chercheur JSPS / KAKENHI japonais (basé sur researchmap / e-Rad) : travaux de recherche (~10 publications sélectionnées), parcours (postes et formation), financements de recherche et distinctions, ainsi que le résumé narratif de recherche. Ce n’est qu’un brouillon — les candidatures KAKENHI se déposent via e-Rad et la fiche du chercheur est tenue à jour dans researchmap.",
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
    nsf: {
      name: "NSF",
      description:
        "Ein strukturierter Ausgangspunkt für einen Biographical Sketch der US-amerikanischen NSF (SciENcv-Struktur): Professional Preparation (Ausbildung), Appointments (Positionen), Products (~10 ausgewählte, begutachtete Arbeiten), Synergistic Activities (Dienst und Vorträge) sowie Förderungen und die narrativen Module. Es ist nur ein Entwurf — die NSF verlangt, dass der Biosketch über SciENcv auf Research.gov erstellt und zertifiziert wird, das die offizielle PDF erzeugt.",
    },
    jsps: {
      name: "JSPS",
      description:
        "Ein strukturierter Ausgangspunkt für ein Forscherprofil der japanischen JSPS / KAKENHI (auf Basis von researchmap / e-Rad): Forschungsleistungen (~10 ausgewählte Publikationen), Werdegang (Positionen und Ausbildung), Forschungsförderung und Auszeichnungen sowie die narrative Forschungszusammenfassung. Es ist nur ein Entwurf — KAKENHI-Anträge werden über e-Rad eingereicht und die Forscherdaten in researchmap gepflegt.",
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
    nsf: {
      name: "NSF",
      description:
        "米国 NSF の biographical sketch（SciENcv 構成）向けの構造化された出発点です。Professional Preparation（学歴）、Appointments（職歴）、Products（厳選した査読付き成果 約10件）、Synergistic Activities（サービスと講演）、および研究費に加え、ナラティブのモジュールを含みます。これは下書きにすぎません——NSF は biosketch を Research.gov 上の SciENcv で作成・認証することを求めており、そこで正式な PDF が生成されます。",
    },
    jsps: {
      name: "JSPS",
      description:
        "日本の JSPS／KAKENHI 研究者プロフィール（researchmap／e-Rad ベース）向けの構造化された出発点です。研究業績（厳選した論文 約10件）、経歴（職歴と学歴）、研究費、受賞に加え、ナラティブの研究概要を含みます。これは下書きにすぎません——KAKENHI の申請は e-Rad から提出し、研究者情報は researchmap で維持します。",
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
    nsf: {
      name: "NSF",
      description:
        "Um ponto de partida estruturado para um biographical sketch da NSF dos EUA (estrutura SciENcv): Professional Preparation (formação), Appointments (cargos), Products (~10 trabalhos selecionados e revisados por pares), Synergistic Activities (serviço e palestras) e financiamento, além dos módulos narrativos. É apenas um rascunho — a NSF exige que o biosketch seja gerado e certificado via SciENcv no Research.gov, que produz o PDF oficial.",
    },
    jsps: {
      name: "JSPS",
      description:
        "Um ponto de partida estruturado para um perfil de pesquisador da JSPS / KAKENHI do Japão (baseado em researchmap / e-Rad): produção de pesquisa (~10 publicações selecionadas), trajetória (cargos e formação), financiamento de pesquisa e prêmios, além do resumo narrativo de pesquisa. É apenas um rascunho — as candidaturas KAKENHI são enviadas pelo e-Rad e o registro do pesquisador é mantido no researchmap.",
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
    nsf: {
      name: "NSF",
      description:
        "Un punto di partenza strutturato per un biographical sketch della NSF statunitense (struttura SciENcv): Professional Preparation (formazione), Appointments (incarichi), Products (~10 lavori selezionati e sottoposti a revisione paritaria), Synergistic Activities (servizio e relazioni) e finanziamenti, oltre ai moduli narrativi. È solo una bozza — la NSF richiede che il biosketch sia generato e certificato tramite SciENcv su Research.gov, che produce il PDF ufficiale.",
    },
    jsps: {
      name: "JSPS",
      description:
        "Un punto di partenza strutturato per un profilo di ricercatore JSPS / KAKENHI giapponese (basato su researchmap / e-Rad): risultati di ricerca (~10 pubblicazioni selezionate), carriera (incarichi e formazione), finanziamenti alla ricerca e premi, oltre alla sintesi narrativa della ricerca. È solo una bozza — le domande KAKENHI si presentano tramite e-Rad e il profilo del ricercatore è gestito in researchmap.",
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
    nsf: {
      name: "NSF",
      description:
        "미국 NSF biographical sketch(SciENcv 구조)를 위한 구조화된 출발점입니다. Professional Preparation(학력), Appointments(경력), Products(엄선한 동료 심사 성과 약 10건), Synergistic Activities(봉사와 강연), 연구비에 더해 내러티브 모듈을 포함합니다. 이것은 초안일 뿐이며 — NSF는 biosketch를 Research.gov의 SciENcv에서 생성·인증하도록 요구하며, 그곳에서 공식 PDF가 만들어집니다.",
    },
    jsps: {
      name: "JSPS",
      description:
        "일본 JSPS／KAKENHI 연구자 프로필(researchmap／e-Rad 기반)을 위한 구조화된 출발점입니다. 연구 업적(엄선한 논문 약 10건), 경력(직위와 학력), 연구비와 수상에 더해 내러티브 연구 요약을 포함합니다. 이것은 초안일 뿐이며 — KAKENHI 지원은 e-Rad로 제출하고 연구자 정보는 researchmap에서 관리합니다.",
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
    nsf: {
      name: "NSF",
      description:
        "Структурированная отправная точка для biographical sketch Национального научного фонда США (NSF, структура SciENcv): Professional Preparation (образование), Appointments (должности), Products (~10 отобранных рецензированных работ), Synergistic Activities (служба и доклады) и финансирование, а также нарративные модули. Это лишь черновик — NSF требует, чтобы biosketch создавался и заверялся через SciENcv на Research.gov, где формируется официальный PDF.",
    },
    jsps: {
      name: "JSPS",
      description:
        "Структурированная отправная точка для профиля исследователя японских JSPS / KAKENHI (на основе researchmap / e-Rad): результаты исследований (~10 отобранных публикаций), карьера (должности и образование), финансирование исследований и награды, а также нарративное резюме исследований. Это лишь черновик — заявки KAKENHI подаются через e-Rad, а запись об исследователе ведётся в researchmap.",
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
