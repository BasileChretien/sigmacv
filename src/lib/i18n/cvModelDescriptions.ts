import { CV_MODELS, type CvModelId } from "@/lib/canonical/cvModels";
import { asLocale, type Locale } from "./index";

/**
 * Localized CV-model DESCRIPTIONS (issue #128).
 *
 * The 58 one-click CV models (`src/lib/canonical/cvModels.ts`) carry a plain-
 * English `description`. The picker chrome is already localized, but the
 * descriptions rendered in English only. This module supplies native
 * translations for the other nine locales, keyed by model id.
 *
 * ── Policy ──────────────────────────────────────────────────────────────────
 *  • English is the SOURCE OF TRUTH and fallback — it is NOT duplicated here but
 *    read straight from each model's `description` (see `cvModelDescription`),
 *    so it can never drift.
 *  • Only the DESCRIPTIONS are localized. Funder / form / portal / rubric proper
 *    nouns and standards ("ERC", "EU Funding & Tenders", "SciENcv", "Research.gov",
 *    "ICH-GCP", "DORA", "R4RI", "履歴書", "職務経歴書", "FDA Form 1572",
 *    "Professional Preparation", …) stay untranslated in every locale, exactly as
 *    the catalog `name` and `titleOverrides` do — a researcher needs the funder's
 *    own wording whatever their UI language.
 *  • Country descriptors that are NOT part of a funder's name ("US academic CV",
 *    "(India)", "(Brazil)") are localized naturally.
 *
 * Typed `Record<CvModelId, Record<TranslatedLocale, string>>` so that a missing
 * model OR a missing (non-English) locale is a COMPILE error — the same
 * enforcement every other i18n record here relies on.
 */

/** The nine non-English locales (English lives on the catalog `description`). */
type TranslatedLocale = Exclude<Locale, "en-US">;

/** One model's description in every non-English locale. */
type TranslatedDescriptions = Record<TranslatedLocale, string>;

const CV_MODEL_DESCRIPTIONS: Record<CvModelId, TranslatedDescriptions> = {
  // ─── GRANT — Europe ─────────────────────────────────────────────────────────
  erc: {
    "zh-CN":
      "European Research Council 简历 + Track Record（经历、经费、约 10 篇代表性论文）。通过 EU Funding & Tenders 门户提交。",
    "es-ES":
      "CV del European Research Council + Track Record (trayectoria, financiación, ~10 publicaciones representativas). Se presenta a través del portal EU Funding & Tenders.",
    "fr-FR":
      "CV + Track Record pour le European Research Council (parcours, financements, ~10 publications représentatives). Déposé via le portail EU Funding & Tenders.",
    "de-DE":
      "Lebenslauf des European Research Council + Track Record (Werdegang, Förderung, ~10 repräsentative Publikationen). Einreichung über das Portal EU Funding & Tenders.",
    "ja-JP":
      "European Research Council の CV + Track Record（経歴、研究費、代表的な論文約10編）。EU Funding & Tenders ポータルから提出します。",
    "pt-BR":
      "CV do European Research Council + Track Record (carreira, financiamento, ~10 publicações representativas). Enviado pelo portal EU Funding & Tenders.",
    "it-IT":
      "CV dello European Research Council + Track Record (carriera, finanziamenti, ~10 pubblicazioni rappresentative). Inviato tramite il portale EU Funding & Tenders.",
    "ko-KR":
      "European Research Council CV + Track Record(경력, 연구비, 대표 논문 약 10편). EU Funding & Tenders 포털을 통해 제출합니다.",
    "ru-RU":
      "Резюме European Research Council + Track Record (карьера, финансирование, ~10 репрезентативных публикаций). Подаётся через портал EU Funding & Tenders.",
  },
  "msca-pf": {
    "zh-CN": "Marie Skłodowska-Curie Postdoctoral Fellowship 简历（EU Funding & Tenders 门户）。",
    "es-ES":
      "CV para la Marie Skłodowska-Curie Postdoctoral Fellowship (portal EU Funding & Tenders).",
    "fr-FR":
      "CV pour la Marie Skłodowska-Curie Postdoctoral Fellowship (portail EU Funding & Tenders).",
    "de-DE":
      "Lebenslauf für die Marie Skłodowska-Curie Postdoctoral Fellowship (Portal EU Funding & Tenders).",
    "ja-JP":
      "Marie Skłodowska-Curie Postdoctoral Fellowship の CV（EU Funding & Tenders ポータル）。",
    "pt-BR":
      "CV para a Marie Skłodowska-Curie Postdoctoral Fellowship (portal EU Funding & Tenders).",
    "it-IT":
      "CV per la Marie Skłodowska-Curie Postdoctoral Fellowship (portale EU Funding & Tenders).",
    "ko-KR": "Marie Skłodowska-Curie Postdoctoral Fellowship CV(EU Funding & Tenders 포털).",
    "ru-RU":
      "Резюме для Marie Skłodowska-Curie Postdoctoral Fellowship (портал EU Funding & Tenders).",
  },
  horizon: {
    "zh-CN": "通用的 Horizon Europe 参与者简历。",
    "es-ES": "CV genérico de participante en Horizon Europe.",
    "fr-FR": "CV générique de participant à Horizon Europe.",
    "de-DE": "Generischer Lebenslauf für Horizon-Europe-Teilnehmende.",
    "ja-JP": "Horizon Europe 参加者向けの汎用 CV。",
    "pt-BR": "CV genérico de participante do Horizon Europe.",
    "it-IT": "CV generico per partecipanti a Horizon Europe.",
    "ko-KR": "Horizon Europe 참여자용 일반 CV.",
    "ru-RU": "Универсальное резюме участника Horizon Europe.",
  },
  embo: {
    "zh-CN": "EMBO 长期／博士后奖学金简历 + 论文清单。",
    "es-ES": "CV para la beca EMBO a largo plazo / postdoctoral + lista de publicaciones.",
    "fr-FR": "CV pour une bourse EMBO long terme / postdoctorale + liste de publications.",
    "de-DE": "Lebenslauf für ein EMBO-Langzeit-/Postdoc-Stipendium + Publikationsliste.",
    "ja-JP": "EMBO 長期／ポスドクフェローシップ向けの CV + 業績リスト。",
    "pt-BR": "CV para bolsa EMBO de longo prazo / pós-doutoral + lista de publicações.",
    "it-IT": "CV per borsa EMBO a lungo termine / post-dottorato + elenco delle pubblicazioni.",
    "ko-KR": "EMBO 장기 / 박사후 연구원 펠로우십 CV + 논문 목록.",
    "ru-RU": "Резюме для долгосрочной / постдок-стипендии EMBO + список публикаций.",
  },
  dfg: {
    "zh-CN":
      "DFG 统一格式简历 + 论文清单：Category A（同行评审）为必填且上限 10 篇；可突出显示至多 10 篇“最重要”的论文。",
    "es-ES":
      "CV uniforme de la DFG + lista de publicaciones: la Category A (revisada por pares) es obligatoria y se limita a 10; pueden destacarse hasta 10 «más importantes».",
    "fr-FR":
      "CV uniforme de la DFG + liste de publications : la Category A (évaluée par les pairs) est obligatoire et limitée à 10 ; jusqu’à 10 publications « les plus importantes » peuvent être mises en avant.",
    "de-DE":
      "Einheitlicher DFG-Lebenslauf + Publikationsliste: Category A (peer-reviewed) ist verpflichtend und auf 10 begrenzt; bis zu 10 „wichtigste“ dürfen hervorgehoben werden.",
    "ja-JP":
      "DFG 統一様式の CV + 業績リスト：Category A（査読付き）は必須で上限 10 件。最も重要な論文を最大 10 件まで強調できます。",
    "pt-BR":
      "CV uniforme da DFG + lista de publicações: a Category A (revisada por pares) é obrigatória e limitada a 10; até 10 «mais importantes» podem ser destacadas.",
    "it-IT":
      "CV uniforme della DFG + elenco delle pubblicazioni: la Category A (con revisione paritaria) è obbligatoria e limitata a 10; è possibile evidenziare fino a 10 pubblicazioni «più importanti».",
    "ko-KR":
      "DFG 표준 CV + 논문 목록: Category A(동료 심사)는 필수이며 최대 10편으로 제한됩니다. ‘가장 중요한’ 논문을 최대 10편까지 강조할 수 있습니다.",
    "ru-RU":
      "Единообразное резюме DFG + список публикаций: Category A (рецензируемые) обязательна и ограничена 10; до 10 «важнейших» можно выделить.",
  },
  snsf: {
    "zh-CN":
      "Swiss NSF SciCV 叙述式格式：用精选成果描述 1–3 项重大成就。符合 DORA——不含指标，不含冗长的论文清单。",
    "es-ES":
      "Formato narrativo SciCV de la Swiss NSF: describe 1–3 logros principales con trabajos seleccionados. Conforme con DORA: sin métricas ni listas largas de publicaciones.",
    "fr-FR":
      "Format narratif SciCV de la Swiss NSF : décrivez 1 à 3 réalisations majeures avec des travaux sélectionnés. Conforme à DORA — sans indicateurs ni longue liste de publications.",
    "de-DE":
      "Narratives SciCV-Format der Swiss NSF: 1–3 wichtige Leistungen mit ausgewählten Arbeiten beschreiben. DORA-konform — keine Kennzahlen, keine lange Publikationsliste.",
    "ja-JP":
      "Swiss NSF の SciCV ナラティブ形式：主要な成果 1〜3 件を代表的な業績とともに記述します。DORA 準拠——指標なし、長大な業績リストなし。",
    "pt-BR":
      "Formato narrativo SciCV da Swiss NSF: descreva 1 a 3 grandes conquistas com trabalhos selecionados. Em conformidade com a DORA — sem métricas nem longas listas de publicações.",
    "it-IT":
      "Formato narrativo SciCV della Swiss NSF: descrivi 1–3 risultati principali con lavori selezionati. Conforme a DORA — niente metriche né lunghi elenchi di pubblicazioni.",
    "ko-KR":
      "Swiss NSF SciCV 내러티브 형식: 대표 성과 1~3건을 선별 논문과 함께 서술합니다. DORA 준수 — 지표 없음, 긴 논문 목록 없음.",
    "ru-RU":
      "Нарративный формат SciCV Swiss NSF: опишите 1–3 главных достижения с избранными работами. Соответствует DORA — без метрик и длинного списка публикаций.",
  },
  nwo: {
    "zh-CN": "Dutch Research Council 简历，包含叙述式的学术声誉证据与学术概况。",
    "es-ES":
      "CV del Dutch Research Council con evidencia narrativa de reconocimiento + perfil académico.",
    "fr-FR":
      "CV du Dutch Research Council avec des preuves narratives de reconnaissance + profil académique.",
    "de-DE":
      "Lebenslauf des Dutch Research Council mit narrativen Nachweisen der Anerkennung + akademischem Profil.",
    "ja-JP":
      "Dutch Research Council の CV。評価（esteem）のナラティブな根拠と学術プロフィールを含みます。",
    "pt-BR":
      "CV do Dutch Research Council com evidências narrativas de reconhecimento + perfil acadêmico.",
    "it-IT":
      "CV del Dutch Research Council con prove narrative di autorevolezza + profilo accademico.",
    "ko-KR": "Dutch Research Council CV. 평판에 대한 내러티브 근거와 학술 프로필을 포함합니다.",
    "ru-RU":
      "Резюме Dutch Research Council с нарративными свидетельствами признания + академический профиль.",
  },
  anr: {
    "zh-CN": "French National Research Agency 简历：近期职业经历、精选论文、经费。",
    "es-ES":
      "CV de la French National Research Agency: trayectoria reciente, publicaciones seleccionadas, financiación.",
    "fr-FR":
      "CV de la French National Research Agency : parcours récent, publications sélectionnées, financements.",
    "de-DE":
      "Lebenslauf der French National Research Agency: jüngster Werdegang, ausgewählte Publikationen, Förderung.",
    "ja-JP": "French National Research Agency の CV：最近の経歴、精選した論文、研究費。",
    "pt-BR":
      "CV da French National Research Agency: carreira recente, publicações selecionadas, financiamento.",
    "it-IT":
      "CV della French National Research Agency: carriera recente, pubblicazioni selezionate, finanziamenti.",
    "ko-KR": "French National Research Agency CV: 최근 경력, 선별 논문, 연구비.",
    "ru-RU":
      "Резюме French National Research Agency: недавняя карьера, избранные публикации, финансирование.",
  },
  fwf: {
    "zh-CN": "Austrian Science Fund 简历 + 论文清单。",
    "es-ES": "CV del Austrian Science Fund + lista de publicaciones.",
    "fr-FR": "CV de l’Austrian Science Fund + liste de publications.",
    "de-DE": "Lebenslauf des Austrian Science Fund + Publikationsliste.",
    "ja-JP": "Austrian Science Fund の CV + 業績リスト。",
    "pt-BR": "CV do Austrian Science Fund + lista de publicações.",
    "it-IT": "CV dell’Austrian Science Fund + elenco delle pubblicazioni.",
    "ko-KR": "Austrian Science Fund CV + 논문 목록.",
    "ru-RU": "Резюме Austrian Science Fund + список публикаций.",
  },
  wellcome: {
    "zh-CN": "Wellcome Trust 简历，侧重贡献与关键成果（偏叙述式）。",
    "es-ES":
      "CV del Wellcome Trust que destaca contribuciones y resultados clave (de enfoque narrativo).",
    "fr-FR":
      "CV du Wellcome Trust mettant l’accent sur les contributions et les résultats clés (à dominante narrative).",
    "de-DE":
      "Wellcome-Trust-Lebenslauf mit Schwerpunkt auf Beiträgen und zentralen Ergebnissen (eher narrativ).",
    "ja-JP": "Wellcome Trust の CV。貢献と主要な成果を重視します（ナラティブ寄り）。",
    "pt-BR":
      "CV do Wellcome Trust com ênfase em contribuições e resultados principais (de tendência narrativa).",
    "it-IT":
      "CV del Wellcome Trust incentrato su contributi e risultati chiave (di taglio narrativo).",
    "ko-KR": "Wellcome Trust CV. 기여와 핵심 성과를 강조합니다(내러티브 중심).",
    "ru-RU":
      "Резюме Wellcome Trust с акцентом на вкладе и ключевых результатах (нарративной направленности).",
  },
  "ukri-r4ri": {
    "zh-CN": "UKRI 叙述式简历（R4RI）：四个贡献模块；不含传统论文清单。",
    "es-ES":
      "CV narrativo de UKRI (R4RI): cuatro módulos de contribución; sin lista de publicaciones tradicional.",
    "fr-FR":
      "CV narratif de UKRI (R4RI) : quatre modules de contribution ; sans liste de publications traditionnelle.",
    "de-DE":
      "Narrativer UKRI-Lebenslauf (R4RI): vier Beitragsmodule; keine klassische Publikationsliste.",
    "ja-JP": "UKRI のナラティブ CV（R4RI）：4 つの貢献モジュール。従来型の業績リストはありません。",
    "pt-BR":
      "CV narrativo da UKRI (R4RI): quatro módulos de contribuição; sem lista de publicações tradicional.",
    "it-IT":
      "CV narrativo di UKRI (R4RI): quattro moduli di contributo; nessun elenco tradizionale di pubblicazioni.",
    "ko-KR": "UKRI 내러티브 CV(R4RI): 네 개의 기여 모듈, 전통적 논문 목록 없음.",
    "ru-RU":
      "Нарративное резюме UKRI (R4RI): четыре модуля вклада; без традиционного списка публикаций.",
  },
  "royal-society": {
    "zh-CN": "Royal Society 叙述式简历：四个贡献模块。",
    "es-ES": "CV narrativo de la Royal Society: cuatro módulos de contribución.",
    "fr-FR": "CV narratif de la Royal Society : quatre modules de contribution.",
    "de-DE": "Narrativer Lebenslauf der Royal Society: vier Beitragsmodule.",
    "ja-JP": "Royal Society のナラティブ CV：4 つの貢献モジュール。",
    "pt-BR": "CV narrativo da Royal Society: quatro módulos de contribuição.",
    "it-IT": "CV narrativo della Royal Society: quattro moduli di contributo.",
    "ko-KR": "Royal Society 내러티브 CV: 네 개의 기여 모듈.",
    "ru-RU": "Нарративное резюме Royal Society: четыре модуля вклада.",
  },

  // ─── GRANT — US ─────────────────────────────────────────────────────────────
  nih: {
    "zh-CN":
      "NIH biosketch（≤5 页）：Personal Statement = 你的 Summary；Positions & Honors；Contributions to Science。通过 SciENcv（eRA／Research.gov）生成／认证正式 PDF。",
    "es-ES":
      "Biosketch del NIH (≤5 páginas): Personal Statement = tu Summary; Positions & Honors; Contributions to Science. Genera/certifica el PDF oficial mediante SciENcv (eRA/Research.gov).",
    "fr-FR":
      "Biosketch du NIH (≤5 pages) : Personal Statement = votre Summary ; Positions & Honors ; Contributions to Science. Générez/certifiez le PDF officiel via SciENcv (eRA/Research.gov).",
    "de-DE":
      "NIH-Biosketch (≤5 Seiten): Personal Statement = Ihre Summary; Positions & Honors; Contributions to Science. Offizielles PDF über SciENcv (eRA/Research.gov) erzeugen/zertifizieren.",
    "ja-JP":
      "NIH biosketch（5 ページ以内）：Personal Statement = あなたの Summary、Positions & Honors、Contributions to Science。正式な PDF は SciENcv（eRA／Research.gov）で作成・認証します。",
    "pt-BR":
      "Biosketch do NIH (≤5 páginas): Personal Statement = o seu Summary; Positions & Honors; Contributions to Science. Gere/certifique o PDF oficial via SciENcv (eRA/Research.gov).",
    "it-IT":
      "Biosketch del NIH (≤5 pagine): Personal Statement = il tuo Summary; Positions & Honors; Contributions to Science. Genera/certifica il PDF ufficiale tramite SciENcv (eRA/Research.gov).",
    "ko-KR":
      "NIH biosketch(5페이지 이하): Personal Statement = 당신의 Summary, Positions & Honors, Contributions to Science. 공식 PDF는 SciENcv(eRA/Research.gov)로 생성/인증합니다.",
    "ru-RU":
      "Biosketch NIH (≤5 страниц): Personal Statement = ваш Summary; Positions & Honors; Contributions to Science. Официальный PDF формируется/заверяется через SciENcv (eRA/Research.gov).",
  },
  nsf: {
    "zh-CN":
      "NSF biosketch：Professional Preparation、Appointments、Products（≤10）、Synergistic Activities。在 Research.gov 上使用 SciENcv。",
    "es-ES":
      "Biosketch de la NSF: Professional Preparation, Appointments, Products (≤10), Synergistic Activities. Usa SciENcv en Research.gov.",
    "fr-FR":
      "Biosketch de la NSF : Professional Preparation, Appointments, Products (≤10), Synergistic Activities. Utilisez SciENcv sur Research.gov.",
    "de-DE":
      "NSF-Biosketch: Professional Preparation, Appointments, Products (≤10), Synergistic Activities. SciENcv auf Research.gov verwenden.",
    "ja-JP":
      "NSF biosketch：Professional Preparation、Appointments、Products（10 件以内）、Synergistic Activities。Research.gov の SciENcv を使用します。",
    "pt-BR":
      "Biosketch da NSF: Professional Preparation, Appointments, Products (≤10), Synergistic Activities. Use o SciENcv no Research.gov.",
    "it-IT":
      "Biosketch della NSF: Professional Preparation, Appointments, Products (≤10), Synergistic Activities. Usa SciENcv su Research.gov.",
    "ko-KR":
      "NSF biosketch: Professional Preparation, Appointments, Products(10개 이하), Synergistic Activities. Research.gov의 SciENcv를 사용하세요.",
    "ru-RU":
      "Biosketch NSF: Professional Preparation, Appointments, Products (≤10), Synergistic Activities. Используйте SciENcv на Research.gov.",
  },
  "doe-dod-nasa": {
    "zh-CN": "美国联邦机构 biosketch（DOE／DOD／NASA），SciENcv 风格。",
    "es-ES": "Biosketch de agencias federales de EE. UU. (DOE/DOD/NASA), al estilo SciENcv.",
    "fr-FR": "Biosketch des agences fédérales américaines (DOE/DOD/NASA), façon SciENcv.",
    "de-DE": "Biosketch US-amerikanischer Bundesbehörden (DOE/DOD/NASA), im SciENcv-Stil.",
    "ja-JP": "米国連邦機関の biosketch（DOE／DOD／NASA）、SciENcv 形式。",
    "pt-BR": "Biosketch de agências federais dos EUA (DOE/DOD/NASA), no estilo SciENcv.",
    "it-IT": "Biosketch di agenzie federali statunitensi (DOE/DOD/NASA), in stile SciENcv.",
    "ko-KR": "미국 연방기관 biosketch(DOE/DOD/NASA), SciENcv 방식.",
    "ru-RU": "Biosketch федеральных агентств США (DOE/DOD/NASA) в стиле SciENcv.",
  },

  // ─── GRANT — Canada / Australia / Japan / China ──────────────────────────────
  ccv: {
    "zh-CN":
      "Canadian Common CV／Tri-agency 叙述式（CIHR · NSERC · SSHRC）：Personal statement、Most significant contributions & experiences、Supervisory & mentorship。最终通过 CCV 门户提交。",
    "es-ES":
      "Canadian Common CV / narrativa Tri-agency (CIHR · NSERC · SSHRC): Personal statement, Most significant contributions & experiences, Supervisory & mentorship. Envío final a través del portal CCV.",
    "fr-FR":
      "Canadian Common CV / narratif Tri-agency (CIHR · NSERC · SSHRC) : Personal statement, Most significant contributions & experiences, Supervisory & mentorship. Dépôt final via le portail CCV.",
    "de-DE":
      "Canadian Common CV / Tri-agency-Narrativ (CIHR · NSERC · SSHRC): Personal statement, Most significant contributions & experiences, Supervisory & mentorship. Endgültige Einreichung über das CCV-Portal.",
    "ja-JP":
      "Canadian Common CV／Tri-agency ナラティブ（CIHR · NSERC · SSHRC）：Personal statement、Most significant contributions & experiences、Supervisory & mentorship。最終提出は CCV ポータルから行います。",
    "pt-BR":
      "Canadian Common CV / narrativa Tri-agency (CIHR · NSERC · SSHRC): Personal statement, Most significant contributions & experiences, Supervisory & mentorship. Envio final pelo portal CCV.",
    "it-IT":
      "Canadian Common CV / narrativa Tri-agency (CIHR · NSERC · SSHRC): Personal statement, Most significant contributions & experiences, Supervisory & mentorship. Invio finale tramite il portale CCV.",
    "ko-KR":
      "Canadian Common CV / Tri-agency 내러티브(CIHR · NSERC · SSHRC): Personal statement, Most significant contributions & experiences, Supervisory & mentorship. 최종 제출은 CCV 포털을 통해 합니다.",
    "ru-RU":
      "Canadian Common CV / нарратив Tri-agency (CIHR · NSERC · SSHRC): Personal statement, Most significant contributions & experiences, Supervisory & mentorship. Окончательная подача через портал CCV.",
  },
  arc: {
    "zh-CN":
      "Australian Research Council 简历，含 ROPE——成果相对于机会进行评估；在 ROPE 说明中注明职业中断。",
    "es-ES":
      "CV del Australian Research Council con ROPE: los resultados se evalúan en relación con la oportunidad; indica las interrupciones de la carrera en la declaración ROPE.",
    "fr-FR":
      "CV de l’Australian Research Council avec ROPE — les résultats sont évalués au regard des opportunités ; signalez les interruptions de carrière dans la déclaration ROPE.",
    "de-DE":
      "Lebenslauf des Australian Research Council mit ROPE — Ergebnisse werden im Verhältnis zu den Möglichkeiten bewertet; Karriereunterbrechungen im ROPE-Statement angeben.",
    "ja-JP":
      "Australian Research Council の CV（ROPE 付き）——成果は機会に応じて評価されます。キャリアの中断は ROPE ステートメントに記載します。",
    "pt-BR":
      "CV do Australian Research Council com ROPE — os resultados são avaliados em relação à oportunidade; indique as interrupções de carreira na declaração ROPE.",
    "it-IT":
      "CV dell’Australian Research Council con ROPE — i risultati sono valutati in rapporto alle opportunità; indica le interruzioni di carriera nella dichiarazione ROPE.",
    "ko-KR":
      "Australian Research Council CV(ROPE 포함) — 성과는 기회 대비로 평가됩니다. 경력 공백은 ROPE 진술문에 기재하세요.",
    "ru-RU":
      "Резюме Australian Research Council с ROPE — результаты оцениваются с учётом возможностей; укажите перерывы в карьере в заявлении ROPE.",
  },
  nhmrc: {
    "zh-CN": "NHMRC 的“相对于机会”的履历记录。",
    "es-ES": "Trayectoria de la NHMRC «en relación con la oportunidad».",
    "fr-FR": "Bilan de carrière NHMRC « au regard des opportunités ».",
    "de-DE": "NHMRC-Leistungsbilanz „im Verhältnis zu den Möglichkeiten“.",
    "ja-JP": "NHMRC の「機会に応じた（relative to opportunity）」実績記録。",
    "pt-BR": "Histórico de desempenho da NHMRC «em relação à oportunidade».",
    "it-IT": "Track record NHMRC «in rapporto alle opportunità».",
    "ko-KR": "NHMRC의 ‘기회 대비’ 실적 기록.",
    "ru-RU": "Послужной список NHMRC «с учётом возможностей».",
  },
  jsps: {
    "zh-CN": "JSPS／KAKENHI 研究者档案（researchmap · e-Rad）：研究业绩、经历、经费、受奖。",
    "es-ES":
      "Perfil de investigador JSPS / KAKENHI (researchmap · e-Rad): logros de investigación, trayectoria, financiación, premios.",
    "fr-FR":
      "Profil de chercheur JSPS / KAKENHI (researchmap · e-Rad) : résultats de recherche, parcours, financements, distinctions.",
    "de-DE":
      "JSPS-/KAKENHI-Forschendenprofil (researchmap · e-Rad): Forschungsleistungen, Werdegang, Förderung, Auszeichnungen.",
    "ja-JP":
      "JSPS／KAKENHI の研究者プロフィール（researchmap · e-Rad）：研究業績、経歴、研究費、受賞。",
    "pt-BR":
      "Perfil de pesquisador JSPS / KAKENHI (researchmap · e-Rad): produção de pesquisa, carreira, financiamento, prêmios.",
    "it-IT":
      "Profilo del ricercatore JSPS / KAKENHI (researchmap · e-Rad): risultati di ricerca, carriera, finanziamenti, premi.",
    "ko-KR": "JSPS / KAKENHI 연구자 프로필(researchmap · e-Rad): 연구 업적, 경력, 연구비, 수상.",
    "ru-RU":
      "Профиль исследователя JSPS / KAKENHI (researchmap · e-Rad): научные достижения, карьера, финансирование, награды.",
  },
  amed: {
    "zh-CN": "AMED（Japan Agency for Medical Research & Development）简历——侧重临床／医学研究。",
    "es-ES":
      "CV de AMED (Japan Agency for Medical Research & Development): énfasis en investigación clínica/médica.",
    "fr-FR":
      "CV d’AMED (Japan Agency for Medical Research & Development) — axé sur la recherche clinique/médicale.",
    "de-DE":
      "AMED-Lebenslauf (Japan Agency for Medical Research & Development) — Schwerpunkt klinische/medizinische Forschung.",
    "ja-JP": "AMED（Japan Agency for Medical Research & Development）の CV——臨床・医学研究を重視。",
    "pt-BR":
      "CV da AMED (Japan Agency for Medical Research & Development) — ênfase em pesquisa clínica/médica.",
    "it-IT":
      "CV di AMED (Japan Agency for Medical Research & Development) — focus sulla ricerca clinica/medica.",
    "ko-KR": "AMED(Japan Agency for Medical Research & Development) CV — 임상/의학 연구 중심.",
    "ru-RU":
      "Резюме AMED (Japan Agency for Medical Research & Development) — акцент на клинических/медицинских исследованиях.",
  },
  nsfc: {
    "zh-CN": "National Natural Science Foundation of China biosketch：代表性论文。",
    "es-ES":
      "Biosketch de la National Natural Science Foundation of China: publicaciones representativas.",
    "fr-FR":
      "Biosketch de la National Natural Science Foundation of China : publications représentatives.",
    "de-DE":
      "Biosketch der National Natural Science Foundation of China: repräsentative Publikationen.",
    "ja-JP": "National Natural Science Foundation of China の biosketch：代表的な論文。",
    "pt-BR":
      "Biosketch da National Natural Science Foundation of China: publicações representativas.",
    "it-IT":
      "Biosketch della National Natural Science Foundation of China: pubblicazioni rappresentative.",
    "ko-KR": "National Natural Science Foundation of China biosketch: 대표 논문.",
    "ru-RU": "Biosketch National Natural Science Foundation of China: репрезентативные публикации.",
  },

  // ─── GRANT — national funders (more) ─────────────────────────────────────────
  aei: {
    "zh-CN": "Spanish State Research Agency（AEI）／Ramón y Cajal 简历。",
    "es-ES": "CV de la Spanish State Research Agency (AEI) / Ramón y Cajal.",
    "fr-FR": "CV de la Spanish State Research Agency (AEI) / Ramón y Cajal.",
    "de-DE": "Lebenslauf der Spanish State Research Agency (AEI) / Ramón y Cajal.",
    "ja-JP": "Spanish State Research Agency（AEI）／Ramón y Cajal の CV。",
    "pt-BR": "CV da Spanish State Research Agency (AEI) / Ramón y Cajal.",
    "it-IT": "CV della Spanish State Research Agency (AEI) / Ramón y Cajal.",
    "ko-KR": "Spanish State Research Agency(AEI) / Ramón y Cajal CV.",
    "ru-RU": "Резюме Spanish State Research Agency (AEI) / Ramón y Cajal.",
  },
  prin: {
    "zh-CN": "Italian Ministry of University & Research（PRIN）简历。",
    "es-ES": "CV del Italian Ministry of University & Research (PRIN).",
    "fr-FR": "CV de l’Italian Ministry of University & Research (PRIN).",
    "de-DE": "Lebenslauf des Italian Ministry of University & Research (PRIN).",
    "ja-JP": "Italian Ministry of University & Research（PRIN）の CV。",
    "pt-BR": "CV do Italian Ministry of University & Research (PRIN).",
    "it-IT": "CV dell’Italian Ministry of University & Research (PRIN).",
    "ko-KR": "Italian Ministry of University & Research(PRIN) CV.",
    "ru-RU": "Резюме Italian Ministry of University & Research (PRIN).",
  },
  vr: {
    "zh-CN": "Swedish Research Council 简历。",
    "es-ES": "CV del Swedish Research Council.",
    "fr-FR": "CV du Swedish Research Council.",
    "de-DE": "Lebenslauf des Swedish Research Council.",
    "ja-JP": "Swedish Research Council の CV。",
    "pt-BR": "CV do Swedish Research Council.",
    "it-IT": "CV dello Swedish Research Council.",
    "ko-KR": "Swedish Research Council CV.",
    "ru-RU": "Резюме Swedish Research Council.",
  },
  rcn: {
    "zh-CN": "Research Council of Norway 简历。",
    "es-ES": "CV del Research Council of Norway.",
    "fr-FR": "CV du Research Council of Norway.",
    "de-DE": "Lebenslauf des Research Council of Norway.",
    "ja-JP": "Research Council of Norway の CV。",
    "pt-BR": "CV do Research Council of Norway.",
    "it-IT": "CV del Research Council of Norway.",
    "ko-KR": "Research Council of Norway CV.",
    "ru-RU": "Резюме Research Council of Norway.",
  },
  sfi: {
    "zh-CN": "Science Foundation Ireland 简历。",
    "es-ES": "CV de Science Foundation Ireland.",
    "fr-FR": "CV de Science Foundation Ireland.",
    "de-DE": "Lebenslauf von Science Foundation Ireland.",
    "ja-JP": "Science Foundation Ireland の CV。",
    "pt-BR": "CV da Science Foundation Ireland.",
    "it-IT": "CV di Science Foundation Ireland.",
    "ko-KR": "Science Foundation Ireland CV.",
    "ru-RU": "Резюме Science Foundation Ireland.",
  },
  "fwo-fnrs": {
    "zh-CN": "Research Foundation–Flanders（FWO）／FNRS 简历。",
    "es-ES": "CV de Research Foundation–Flanders (FWO) / FNRS.",
    "fr-FR": "CV de Research Foundation–Flanders (FWO) / FNRS.",
    "de-DE": "Lebenslauf von Research Foundation–Flanders (FWO) / FNRS.",
    "ja-JP": "Research Foundation–Flanders（FWO）／FNRS の CV。",
    "pt-BR": "CV da Research Foundation–Flanders (FWO) / FNRS.",
    "it-IT": "CV di Research Foundation–Flanders (FWO) / FNRS.",
    "ko-KR": "Research Foundation–Flanders(FWO) / FNRS CV.",
    "ru-RU": "Резюме Research Foundation–Flanders (FWO) / FNRS.",
  },
  isf: {
    "zh-CN": "Israel Science Foundation 简历。",
    "es-ES": "CV de la Israel Science Foundation.",
    "fr-FR": "CV de l’Israel Science Foundation.",
    "de-DE": "Lebenslauf der Israel Science Foundation.",
    "ja-JP": "Israel Science Foundation の CV。",
    "pt-BR": "CV da Israel Science Foundation.",
    "it-IT": "CV della Israel Science Foundation.",
    "ko-KR": "Israel Science Foundation CV.",
    "ru-RU": "Резюме Israel Science Foundation.",
  },
  "nrf-kr": {
    "zh-CN": "National Research Foundation of Korea 简历。",
    "es-ES": "CV de la National Research Foundation of Korea.",
    "fr-FR": "CV de la National Research Foundation of Korea.",
    "de-DE": "Lebenslauf der National Research Foundation of Korea.",
    "ja-JP": "National Research Foundation of Korea の CV。",
    "pt-BR": "CV da National Research Foundation of Korea.",
    "it-IT": "CV della National Research Foundation of Korea.",
    "ko-KR": "National Research Foundation of Korea CV.",
    "ru-RU": "Резюме National Research Foundation of Korea.",
  },
  fapesp: {
    "zh-CN": "FAPESP Súmula Curricular／CNPq（Lattes）简历（巴西）。",
    "es-ES": "CV FAPESP Súmula Curricular / CNPq (Lattes) (Brasil).",
    "fr-FR": "CV FAPESP Súmula Curricular / CNPq (Lattes) (Brésil).",
    "de-DE": "FAPESP Súmula Curricular / CNPq (Lattes) Lebenslauf (Brasilien).",
    "ja-JP": "FAPESP Súmula Curricular／CNPq（Lattes）の CV（ブラジル）。",
    "pt-BR": "CV FAPESP Súmula Curricular / CNPq (Lattes) (Brasil).",
    "it-IT": "CV FAPESP Súmula Curricular / CNPq (Lattes) (Brasile).",
    "ko-KR": "FAPESP Súmula Curricular / CNPq(Lattes) CV(브라질).",
    "ru-RU": "Резюме FAPESP Súmula Curricular / CNPq (Lattes) (Бразилия).",
  },
  serb: {
    "zh-CN": "Science & Engineering Research Board（印度）简历。",
    "es-ES": "CV del Science & Engineering Research Board (India).",
    "fr-FR": "CV du Science & Engineering Research Board (Inde).",
    "de-DE": "Lebenslauf des Science & Engineering Research Board (Indien).",
    "ja-JP": "Science & Engineering Research Board（インド）の CV。",
    "pt-BR": "CV do Science & Engineering Research Board (Índia).",
    "it-IT": "CV dello Science & Engineering Research Board (India).",
    "ko-KR": "Science & Engineering Research Board(인도) CV.",
    "ru-RU": "Резюме Science & Engineering Research Board (Индия).",
  },
  "nrf-sg": {
    "zh-CN": "Singapore NRF／A*STAR 简历。",
    "es-ES": "CV de Singapore NRF / A*STAR.",
    "fr-FR": "CV de Singapore NRF / A*STAR.",
    "de-DE": "Lebenslauf von Singapore NRF / A*STAR.",
    "ja-JP": "Singapore NRF／A*STAR の CV。",
    "pt-BR": "CV de Singapore NRF / A*STAR.",
    "it-IT": "CV di Singapore NRF / A*STAR.",
    "ko-KR": "Singapore NRF / A*STAR CV.",
    "ru-RU": "Резюме Singapore NRF / A*STAR.",
  },

  // ─── GRANT — biomedical + philanthropic ──────────────────────────────────────
  "mrc-uk": {
    "zh-CN": "UK Medical Research Council 简历（叙述式，与 R4RI 对齐）。",
    "es-ES": "CV del UK Medical Research Council (narrativo, alineado con R4RI).",
    "fr-FR": "CV du UK Medical Research Council (narratif, aligné sur R4RI).",
    "de-DE": "Lebenslauf des UK Medical Research Council (narrativ, an R4RI angelehnt).",
    "ja-JP": "UK Medical Research Council の CV（ナラティブ、R4RI 準拠）。",
    "pt-BR": "CV do UK Medical Research Council (narrativo, alinhado ao R4RI).",
    "it-IT": "CV del UK Medical Research Council (narrativo, allineato a R4RI).",
    "ko-KR": "UK Medical Research Council CV(내러티브, R4RI 정렬).",
    "ru-RU": "Резюме UK Medical Research Council (нарративное, согласовано с R4RI).",
  },
  cruk: {
    "zh-CN": "Cancer Research UK 奖学金简历。",
    "es-ES": "CV de beca de Cancer Research UK.",
    "fr-FR": "CV de bourse Cancer Research UK.",
    "de-DE": "Lebenslauf für ein Cancer-Research-UK-Stipendium.",
    "ja-JP": "Cancer Research UK フェローシップ向けの CV。",
    "pt-BR": "CV de bolsa da Cancer Research UK.",
    "it-IT": "CV per fellowship Cancer Research UK.",
    "ko-KR": "Cancer Research UK 펠로우십 CV.",
    "ru-RU": "Резюме для стипендии Cancer Research UK.",
  },
  "frm-arc": {
    "zh-CN": "Fondation pour la Recherche Médicale／Fondation ARC（法国生物医学）简历。",
    "es-ES": "CV de la Fondation pour la Recherche Médicale / Fondation ARC (biomédico francés).",
    "fr-FR": "CV de la Fondation pour la Recherche Médicale / Fondation ARC (biomédical français).",
    "de-DE":
      "Lebenslauf der Fondation pour la Recherche Médicale / Fondation ARC (französisch, biomedizinisch).",
    "ja-JP": "Fondation pour la Recherche Médicale／Fondation ARC（フランスの生物医学）の CV。",
    "pt-BR": "CV da Fondation pour la Recherche Médicale / Fondation ARC (biomédico francês).",
    "it-IT": "CV della Fondation pour la Recherche Médicale / Fondation ARC (biomedico francese).",
    "ko-KR": "Fondation pour la Recherche Médicale / Fondation ARC(프랑스 생물의학) CV.",
    "ru-RU":
      "Резюме Fondation pour la Recherche Médicale / Fondation ARC (французская биомедицина).",
  },
  hhmi: {
    "zh-CN": "美国私立生物医学资助机构（HHMI、Simons Foundation、Chan Zuckerberg Initiative）。",
    "es-ES":
      "Financiadores biomédicos privados de EE. UU. (HHMI, Simons Foundation, Chan Zuckerberg Initiative).",
    "fr-FR":
      "Bailleurs biomédicaux privés américains (HHMI, Simons Foundation, Chan Zuckerberg Initiative).",
    "de-DE":
      "Private US-Biomedizin-Förderer (HHMI, Simons Foundation, Chan Zuckerberg Initiative).",
    "ja-JP": "米国の民間生物医学助成機関（HHMI、Simons Foundation、Chan Zuckerberg Initiative）。",
    "pt-BR":
      "Financiadores biomédicos privados dos EUA (HHMI, Simons Foundation, Chan Zuckerberg Initiative).",
    "it-IT":
      "Finanziatori biomedici privati statunitensi (HHMI, Simons Foundation, Chan Zuckerberg Initiative).",
    "ko-KR": "미국 민간 생물의학 후원기관(HHMI, Simons Foundation, Chan Zuckerberg Initiative).",
    "ru-RU":
      "Частные биомедицинские фонды США (HHMI, Simons Foundation, Chan Zuckerberg Initiative).",
  },
  gates: {
    "zh-CN": "Gates Foundation 资助简历（偏重影响力／叙述式）。",
    "es-ES": "CV para subvención de la Gates Foundation (orientado al impacto / narrativo).",
    "fr-FR": "CV de subvention Gates Foundation (axé impact / narratif).",
    "de-DE": "Lebenslauf für einen Gates-Foundation-Zuschuss (wirkungs-/narrativorientiert).",
    "ja-JP": "Gates Foundation の助成向け CV（インパクト／ナラティブ寄り）。",
    "pt-BR": "CV para subvenção da Gates Foundation (voltado a impacto / narrativo).",
    "it-IT": "CV per sovvenzione Gates Foundation (orientato all’impatto / narrativo).",
    "ko-KR": "Gates Foundation 지원금 CV(임팩트 / 내러티브 중심).",
    "ru-RU": "Резюме для гранта Gates Foundation (с акцентом на влияние / нарративное).",
  },
  "leverhulme-vw": {
    "zh-CN": "欧洲私立基金会（Leverhulme Trust、Volkswagen Foundation）。",
    "es-ES": "Fundaciones privadas europeas (Leverhulme Trust, Volkswagen Foundation).",
    "fr-FR": "Fondations privées européennes (Leverhulme Trust, Volkswagen Foundation).",
    "de-DE": "Private europäische Stiftungen (Leverhulme Trust, Volkswagen Foundation).",
    "ja-JP": "欧州の民間財団（Leverhulme Trust、Volkswagen Foundation）。",
    "pt-BR": "Fundações privadas europeias (Leverhulme Trust, Volkswagen Foundation).",
    "it-IT": "Fondazioni private europee (Leverhulme Trust, Volkswagen Foundation).",
    "ko-KR": "유럽 민간 재단(Leverhulme Trust, Volkswagen Foundation).",
    "ru-RU": "Частные европейские фонды (Leverhulme Trust, Volkswagen Foundation).",
  },

  // ─── PUBLIC INSTITUTION / JOB ────────────────────────────────────────────────
  europass: {
    "zh-CN": "符合欧盟标准的 Europass 简历（工作经历、教育、技能、语言）。",
    "es-ES":
      "CV Europass, estándar de la UE (experiencia laboral, formación, competencias, idiomas).",
    "fr-FR":
      "CV Europass, standard de l’UE (expérience professionnelle, formation, compétences, langues).",
    "de-DE":
      "EU-standardisierter Europass-Lebenslauf (Berufserfahrung, Ausbildung, Kompetenzen, Sprachen).",
    "ja-JP": "EU 標準の Europass CV（職務経歴、学歴、スキル、言語）。",
    "pt-BR":
      "CV Europass, padrão da UE (experiência profissional, formação, competências, idiomas).",
    "it-IT": "CV Europass, standard UE (esperienza lavorativa, istruzione, competenze, lingue).",
    "ko-KR": "EU 표준 Europass CV(경력, 학력, 역량, 언어).",
    "ru-RU": "Резюме Europass, стандарт ЕС (опыт работы, образование, навыки, языки).",
  },
  "academic-us": {
    "zh-CN": "全面的美国学术／教职简历（完整论文清单）。",
    "es-ES": "CV académico / de profesorado de EE. UU. completo (lista de publicaciones íntegra).",
    "fr-FR": "CV universitaire / de faculté américain complet (liste de publications intégrale).",
    "de-DE":
      "Umfassender US-amerikanischer akademischer / Faculty-Lebenslauf (vollständige Publikationsliste).",
    "ja-JP": "包括的な米国のアカデミック／ファカルティ CV（完全な業績リスト）。",
    "pt-BR": "CV acadêmico / docente dos EUA abrangente (lista de publicações completa).",
    "it-IT":
      "CV accademico / di faculty statunitense completo (elenco completo delle pubblicazioni).",
    "ko-KR": "포괄적인 미국 학술 / 교수 CV(전체 논문 목록).",
    "ru-RU": "Полное академическое / преподавательское резюме США (полный список публикаций).",
  },
  "academic-uk": {
    "zh-CN": "全面的英国学术简历。",
    "es-ES": "CV académico británico completo.",
    "fr-FR": "CV universitaire britannique complet.",
    "de-DE": "Umfassender britischer akademischer Lebenslauf.",
    "ja-JP": "包括的な英国のアカデミック CV。",
    "pt-BR": "CV acadêmico britânico abrangente.",
    "it-IT": "CV accademico britannico completo.",
    "ko-KR": "포괄적인 영국 학술 CV.",
    "ru-RU": "Полное британское академическое резюме.",
  },
  "academic-de": {
    "zh-CN": "德国学术 Lebenslauf + 论文清单。",
    "es-ES": "Lebenslauf académico alemán + lista de publicaciones.",
    "fr-FR": "Lebenslauf universitaire allemand + liste de publications.",
    "de-DE": "Deutscher akademischer Lebenslauf + Publikationsliste.",
    "ja-JP": "ドイツの学術 Lebenslauf + 業績リスト。",
    "pt-BR": "Lebenslauf acadêmico alemão + lista de publicações.",
    "it-IT": "Lebenslauf accademico tedesco + elenco delle pubblicazioni.",
    "ko-KR": "독일 학술 Lebenslauf + 논문 목록.",
    "ru-RU": "Немецкий академический Lebenslauf + список публикаций.",
  },
  rirekisho: {
    "zh-CN": "日本 履歴書（rirekisho）求职简历——与 rirekisho 模板搭配使用。",
    "es-ES": "CV de empleo 履歴書 (rirekisho) japonés: se combina con la plantilla rirekisho.",
    "fr-FR": "CV d’emploi japonais 履歴書 (rirekisho) — à associer au modèle rirekisho.",
    "de-DE": "Japanischer 履歴書-(rirekisho-)Bewerbungslebenslauf — passt zur rirekisho-Vorlage.",
    "ja-JP": "日本の 履歴書（rirekisho）——rirekisho テンプレートと組み合わせて使います。",
    "pt-BR": "CV de emprego japonês 履歴書 (rirekisho) — combina com o modelo rirekisho.",
    "it-IT": "CV di lavoro giapponese 履歴書 (rirekisho) — da abbinare al modello rirekisho.",
    "ko-KR": "일본 履歴書(rirekisho) 취업용 CV — rirekisho 템플릿과 함께 사용합니다.",
    "ru-RU":
      "Японское резюме для трудоустройства 履歴書 (rirekisho) — используется с шаблоном rirekisho.",
  },
  shokumu: {
    "zh-CN": "日本 職務経歴書 职务经历简历（JREC-IN 学术／研究岗位）。",
    "es-ES":
      "CV de historial profesional 職務経歴書 japonés (empleos académicos/de investigación de JREC-IN).",
    "fr-FR":
      "CV d’historique professionnel japonais 職務経歴書 (emplois académiques/de recherche JREC-IN).",
    "de-DE":
      "Japanischer 職務経歴書-Werdegangslebenslauf (akademische/Forschungsstellen bei JREC-IN).",
    "ja-JP": "日本の 職務経歴書（JREC-IN の学術・研究職）。",
    "pt-BR":
      "CV de histórico profissional japonês 職務経歴書 (vagas acadêmicas/de pesquisa do JREC-IN).",
    "it-IT":
      "CV di storia professionale giapponese 職務経歴書 (posizioni accademiche/di ricerca JREC-IN).",
    "ko-KR": "일본 職務経歴書 경력 기술 CV(JREC-IN 학술/연구직).",
    "ru-RU":
      "Японское резюме карьерной истории 職務経歴書 (академические/научные вакансии JREC-IN).",
  },
  "un-p11": {
    "zh-CN": "United Nations P.11 Personal History Form 结构（UN／WHO 及国际组织职位）。",
    "es-ES":
      "Estructura del United Nations P.11 Personal History Form (puestos en la UN/WHO y organizaciones internacionales).",
    "fr-FR":
      "Structure du United Nations P.11 Personal History Form (postes à l’UN/WHO et dans les organisations internationales).",
    "de-DE":
      "Struktur des United Nations P.11 Personal History Form (Stellen bei UN/WHO und internationalen Organisationen).",
    "ja-JP": "United Nations P.11 Personal History Form の構成（UN／WHO および国際機関のポスト）。",
    "pt-BR":
      "Estrutura do United Nations P.11 Personal History Form (cargos na UN/WHO e em organizações internacionais).",
    "it-IT":
      "Struttura dello United Nations P.11 Personal History Form (posizioni presso UN/WHO e organizzazioni internazionali).",
    "ko-KR": "United Nations P.11 Personal History Form 구조(UN/WHO 및 국제기구 직위).",
    "ru-RU":
      "Структура United Nations P.11 Personal History Form (должности в UN/WHO и международных организациях).",
  },
  hdr: {
    "zh-CN": "Habilitation 学位论文档案（法国 HDR／德国 Habilitation）——完整记录，含指导与教学。",
    "es-ES":
      "Dossier de Habilitation (HDR francesa / Habilitation alemana): expediente completo, incluida dirección y docencia.",
    "fr-FR":
      "Dossier d’Habilitation (HDR française / Habilitation allemande) — dossier complet, encadrement et enseignement inclus.",
    "de-DE":
      "Habilitationsdossier (französische HDR / deutsche Habilitation) — vollständiger Nachweis inkl. Betreuung + Lehre.",
    "ja-JP":
      "Habilitation のドシエ（フランスの HDR／ドイツの Habilitation）——指導・教育を含む完全な記録。",
    "pt-BR":
      "Dossiê de Habilitation (HDR francesa / Habilitation alemã) — registro completo, incluindo orientação + ensino.",
    "it-IT":
      "Dossier di Habilitation (HDR francese / Habilitation tedesca) — record completo, inclusa supervisione + didattica.",
    "ko-KR": "Habilitation 서류(프랑스 HDR / 독일 Habilitation) — 지도 및 강의를 포함한 전체 기록.",
    "ru-RU":
      "Досье Habilitation (французская HDR / немецкая Habilitation) — полный послужной список, включая руководство и преподавание.",
  },
  "nhs-consultant": {
    "zh-CN": "英国 NHS consultant／临床学术简历（GMC 注册、CCT、临床 + 学术记录）。",
    "es-ES":
      "CV de consultant del NHS británico / clínico-académico (registro GMC, CCT, historial clínico + académico).",
    "fr-FR":
      "CV de consultant du NHS britannique / clinico-universitaire (inscription GMC, CCT, dossier clinique + académique).",
    "de-DE":
      "Lebenslauf für NHS-Consultant / klinisch-akademisch (UK) (GMC-Registrierung, CCT, klinischer + akademischer Werdegang).",
    "ja-JP": "英国 NHS consultant／臨床アカデミック CV（GMC 登録、CCT、臨床 + 学術の記録）。",
    "pt-BR":
      "CV de consultant do NHS britânico / clínico-acadêmico (registro GMC, CCT, histórico clínico + acadêmico).",
    "it-IT":
      "CV di consultant del NHS britannico / clinico-accademico (registrazione GMC, CCT, record clinico + accademico).",
    "ko-KR": "영국 NHS consultant / 임상-학술 CV(GMC 등록, CCT, 임상 + 학술 기록).",
    "ru-RU":
      "Резюме NHS consultant (Великобритания) / клинико-академическое (регистрация GMC, CCT, клинический + академический послужной список).",
  },
  "tenure-us": {
    "zh-CN": "美国终身教职与晋升档案（全面的学术记录）。",
    "es-ES": "Dossier de tenure y promoción de EE. UU. (expediente académico completo).",
    "fr-FR": "Dossier de titularisation et de promotion américain (dossier académique complet).",
    "de-DE":
      "US-amerikanisches Tenure- und Beförderungsdossier (umfassender akademischer Werdegang).",
    "ja-JP": "米国のテニュア・昇進ドシエ（包括的な学術記録）。",
    "pt-BR": "Dossiê de tenure e promoção dos EUA (registro acadêmico abrangente).",
    "it-IT": "Dossier di tenure e promozione statunitense (record accademico completo).",
    "ko-KR": "미국 정년 보장(tenure) 및 승진 서류(포괄적 학술 기록).",
    "ru-RU":
      "Досье на постоянную позицию (tenure) и повышение в США (полный академический послужной список).",
  },

  // ─── INDUSTRY / PHARMA ───────────────────────────────────────────────────────
  "gcp-investigator": {
    "zh-CN":
      "用于临床试验的 ICH-GCP（E6）研究者简历／FDA Form 1572（Statement of Investigator）：现任职位、资质与执照、GCP 培训、相关的临床研究／试验经历（使用 Statement 部分），以及相关论文。保持内容最新并注明日期；1572 单独归档，研究者在其上的签名即为对本简历的证明。",
    "es-ES":
      "CV de investigador conforme a ICH-GCP (E6) para ensayos clínicos / FDA Form 1572 (Statement of Investigator): puesto actual, titulaciones y licencias, formación en GCP, experiencia relevante en investigación clínica / ensayos (usa la sección Statement) y publicaciones relevantes. Mantenlo actualizado y fechado; el 1572 se presenta por separado y la firma del investigador en él da fe del CV.",
    "fr-FR":
      "CV d’investigateur conforme à ICH-GCP (E6) pour les essais cliniques / FDA Form 1572 (Statement of Investigator) : poste actuel, titres et licences, formation GCP, expérience pertinente en recherche clinique / essais (utilisez la section Statement) et publications pertinentes. Tenez-le à jour et daté ; le 1572 est déposé séparément et la signature de l’investigateur qui y figure atteste le CV.",
    "de-DE":
      "Prüfer-Lebenslauf gemäß ICH-GCP (E6) für klinische Studien / FDA Form 1572 (Statement of Investigator): aktuelle Position, Qualifikationen & Zulassungen, GCP-Schulung, einschlägige Erfahrung in klinischer Forschung / Studien (Statement-Abschnitt verwenden) sowie einschlägige Publikationen. Aktuell und datiert halten; das 1572 wird separat eingereicht, und die Unterschrift des Prüfers darauf bestätigt den Lebenslauf.",
    "ja-JP":
      "臨床試験／FDA Form 1572（Statement of Investigator）向けの ICH-GCP（E6）治験責任医師 CV：現職、資格・免許、GCP トレーニング、関連する臨床研究・試験の経験（Statement セクションを使用）、および関連論文。最新かつ日付入りに保ちます。1572 は別途提出され、そこへの治験責任医師の署名が本 CV を証明します。",
    "pt-BR":
      "CV de investigador conforme à ICH-GCP (E6) para ensaios clínicos / FDA Form 1572 (Statement of Investigator): cargo atual, qualificações e licenças, treinamento em GCP, experiência relevante em pesquisa clínica / ensaios (use a seção Statement) e publicações relevantes. Mantenha-o atualizado e datado; o 1572 é arquivado separadamente e a assinatura do investigador nele atesta o CV.",
    "it-IT":
      "CV dello sperimentatore conforme a ICH-GCP (E6) per studi clinici / FDA Form 1572 (Statement of Investigator): posizione attuale, qualifiche e licenze, formazione GCP, esperienza pertinente in ricerca clinica / studi (usa la sezione Statement) e pubblicazioni pertinenti. Tienilo aggiornato e datato; il 1572 viene depositato separatamente e la firma dello sperimentatore su di esso attesta il CV.",
    "ko-KR":
      "임상시험 / FDA Form 1572(Statement of Investigator)용 ICH-GCP(E6) 연구자 CV: 현재 직위, 자격 및 면허, GCP 교육, 관련 임상연구 / 시험 경험(Statement 섹션 사용), 관련 논문. 최신 상태로 날짜를 기입해 유지하세요. 1572는 별도로 제출되며, 여기에 서명한 연구자의 서명이 본 CV를 증명합니다.",
    "ru-RU":
      "Резюме исследователя по ICH-GCP (E6) для клинических исследований / FDA Form 1572 (Statement of Investigator): текущая должность, квалификации и лицензии, обучение GCP, релевантный опыт клинических исследований / испытаний (используйте раздел Statement) и релевантные публикации. Держите его актуальным и датированным; 1572 подаётся отдельно, и подпись исследователя на нём удостоверяет резюме.",
  },
  "pharma-rd": {
    "zh-CN": "简洁、以技能为先的工业／生物技术研发简历（突出经验与能力；精选成果／专利）。",
    "es-ES":
      "Currículum de I+D industrial/biotecnológico conciso y centrado en las competencias (experiencia y competencias en primer plano; resultados/patentes seleccionados).",
    "fr-FR":
      "CV de R&D industrielle/biotech concis et axé sur les compétences (expérience et compétences mises en avant ; travaux/brevets sélectionnés).",
    "de-DE":
      "Prägnanter, kompetenzorientierter Lebenslauf für industrielle/Biotech-F&E (Erfahrung und Kompetenzen im Vordergrund; ausgewählte Ergebnisse/Patente).",
    "ja-JP":
      "簡潔でスキル重視の産業／バイオテク R&D 履歴書（経験と能力を前面に；精選した成果／特許）。",
    "pt-BR":
      "Currículo de P&D industrial/biotech conciso e voltado a competências (experiência e competências em destaque; resultados/patentes selecionados).",
    "it-IT":
      "Curriculum di R&S industriale/biotech conciso e incentrato sulle competenze (esperienza e competenze in primo piano; risultati/brevetti selezionati).",
    "ko-KR": "간결하고 역량 중심의 산업/바이오텍 R&D 이력서(경험과 역량을 강조; 선별 성과/특허).",
    "ru-RU":
      "Краткое, ориентированное на навыки резюме для промышленных/биотех R&D (опыт и компетенции на первом плане; избранные результаты/патенты).",
  },
  medical: {
    "zh-CN": "临床医师简历：资质、执照与专科认证、临床任职，然后是学术成果。",
    "es-ES":
      "CV de médico clínico: titulaciones, licencias y certificaciones de especialidad, nombramientos clínicos y, a continuación, producción académica.",
    "fr-FR":
      "CV de médecin clinicien : titres, licences et certifications de spécialité, postes cliniques, puis production académique.",
    "de-DE":
      "Lebenslauf einer klinisch tätigen Ärztin/eines Arztes: Qualifikationen, Zulassungen & Facharztzertifizierungen, klinische Anstellungen, dann akademische Leistungen.",
    "ja-JP": "臨床医の CV：資格、免許・専門医認定、臨床職、続いて学術成果。",
    "pt-BR":
      "CV de médico clínico: qualificações, licenças e certificações de especialidade, cargos clínicos e, em seguida, produção acadêmica.",
    "it-IT":
      "CV di medico clinico: qualifiche, licenze e certificazioni specialistiche, incarichi clinici e poi produzione accademica.",
    "ko-KR": "임상 의사 CV: 자격, 면허 및 전문의 인증, 임상 보직, 이어서 학술 성과.",
    "ru-RU":
      "Резюме врача-клинициста: квалификации, лицензии и сертификаты специалиста, клинические назначения, затем академические результаты.",
  },
  "medical-affairs": {
    "zh-CN": "制药 Medical Affairs／注册（法规）简历。",
    "es-ES": "CV de Medical Affairs / asuntos regulatorios farmacéuticos.",
    "fr-FR": "CV Medical Affairs / affaires réglementaires pharmaceutiques.",
    "de-DE": "Lebenslauf für Pharma Medical Affairs / Regulatory.",
    "ja-JP": "製薬の Medical Affairs／薬事の CV。",
    "pt-BR": "CV de Medical Affairs / assuntos regulatórios farmacêuticos.",
    "it-IT": "CV di Medical Affairs / affari regolatori farmaceutici.",
    "ko-KR": "제약 Medical Affairs / 규제(RA) CV.",
    "ru-RU": "Резюме для фармацевтических Medical Affairs / регуляторики.",
  },
  pharmacovigilance: {
    "zh-CN": "药物警戒／药品安全专家简历（信号检测、PSUR／PBRER、ICSR 处理、法规报告）。",
    "es-ES":
      "CV de especialista en farmacovigilancia / seguridad de medicamentos (detección de señales, PSUR/PBRER, procesamiento de ICSR, notificación regulatoria).",
    "fr-FR":
      "CV de spécialiste en pharmacovigilance / sécurité des médicaments (détection de signaux, PSUR/PBRER, traitement des ICSR, déclarations réglementaires).",
    "de-DE":
      "Lebenslauf einer Fachkraft für Pharmakovigilanz / Arzneimittelsicherheit (Signalerkennung, PSUR/PBRER, ICSR-Bearbeitung, regulatorisches Reporting).",
    "ja-JP":
      "ファーマコビジランス／医薬品安全性の専門家 CV（シグナル検出、PSUR／PBRER、ICSR 処理、規制当局報告）。",
    "pt-BR":
      "CV de especialista em farmacovigilância / segurança de medicamentos (detecção de sinais, PSUR/PBRER, processamento de ICSR, notificação regulatória).",
    "it-IT":
      "CV di specialista in farmacovigilanza / sicurezza dei farmaci (rilevamento dei segnali, PSUR/PBRER, gestione degli ICSR, reporting regolatorio).",
    "ko-KR": "약물감시 / 의약품 안전성 전문가 CV(신호 탐지, PSUR/PBRER, ICSR 처리, 규제 보고).",
    "ru-RU":
      "Резюме специалиста по фармаконадзору / безопасности лекарств (выявление сигналов, PSUR/PBRER, обработка ICSR, регуляторная отчётность).",
  },
  "regulatory-affairs": {
    "zh-CN": "制药／医疗器械注册事务简历（申报、与监管机构的沟通、生命周期管理）。",
    "es-ES":
      "CV de asuntos regulatorios farmacéuticos / de tecnología médica (presentaciones, interacción con agencias, ciclo de vida).",
    "fr-FR":
      "CV en affaires réglementaires pharma / medtech (soumissions, échanges avec les agences, cycle de vie).",
    "de-DE":
      "Lebenslauf für Regulatory Affairs Pharma / Medizintechnik (Einreichungen, Behördenkommunikation, Lebenszyklus).",
    "ja-JP": "製薬／医療機器の薬事（regulatory affairs）CV（申請、当局対応、ライフサイクル管理）。",
    "pt-BR":
      "CV de assuntos regulatórios farmacêuticos / de tecnologia médica (submissões, interações com agências, ciclo de vida).",
    "it-IT":
      "CV di affari regolatori pharma / medtech (sottomissioni, interazioni con le agenzie, ciclo di vita).",
    "ko-KR": "제약 / 의료기기 규제 업무 CV(제출, 당국 상호작용, 라이프사이클).",
    "ru-RU":
      "Резюме по регуляторным вопросам фармы / медтеха (подачи, взаимодействие с агентствами, жизненный цикл).",
  },
  cra: {
    "zh-CN": "CRA／临床监查员简历（ICH-GCP，覆盖各期别／治疗领域的中心监查经验）。",
    "es-ES":
      "CV de CRA / monitor clínico (ICH-GCP, experiencia en monitorización de centros en distintas fases/áreas terapéuticas).",
    "fr-FR":
      "CV de CRA / moniteur clinique (ICH-GCP, expérience de monitoring de sites sur différentes phases/aires thérapeutiques).",
    "de-DE":
      "Lebenslauf für CRA / Clinical Monitor (ICH-GCP, Erfahrung im Site-Monitoring über Phasen/Therapiegebiete hinweg).",
    "ja-JP": "CRA／臨床モニターの CV（ICH-GCP、各相・治療領域にわたる施設モニタリング経験）。",
    "pt-BR":
      "CV de CRA / monitor clínico (ICH-GCP, experiência em monitoramento de centros em diversas fases/áreas terapêuticas).",
    "it-IT":
      "CV di CRA / monitor clinico (ICH-GCP, esperienza di monitoraggio dei centri su varie fasi/aree terapeutiche).",
    "ko-KR": "CRA / 임상 모니터 CV(ICH-GCP, 여러 상/치료영역에 걸친 기관 모니터링 경험).",
    "ru-RU":
      "Резюме CRA / клинического монитора (ICH-GCP, опыт мониторинга центров по разным фазам/терапевтическим областям).",
  },
  "ema-qp": {
    "zh-CN":
      "欧盟 Qualified Person（QP）简历（符合 Directive 2001/83/EC Art. 49 资格；GMP 批次放行）。",
    "es-ES":
      "CV de Qualified Person (QP) de la UE (elegibilidad según la Directive 2001/83/EC Art. 49; liberación de lotes GMP).",
    "fr-FR":
      "CV de Qualified Person (QP) de l’UE (éligibilité au titre de la Directive 2001/83/EC Art. 49 ; libération de lots GMP).",
    "de-DE":
      "Lebenslauf für EU Qualified Person (QP) (Eignung nach Directive 2001/83/EC Art. 49; GMP-Chargenfreigabe).",
    "ja-JP":
      "EU の Qualified Person（QP）CV（Directive 2001/83/EC Art. 49 の適格性；GMP のバッチ出荷判定）。",
    "pt-BR":
      "CV de Qualified Person (QP) da UE (elegibilidade conforme a Directive 2001/83/EC Art. 49; liberação de lotes GMP).",
    "it-IT":
      "CV di Qualified Person (QP) dell’UE (idoneità ai sensi della Directive 2001/83/EC Art. 49; rilascio dei lotti GMP).",
    "ko-KR": "EU Qualified Person(QP) CV(Directive 2001/83/EC Art. 49 자격; GMP 배치 출하).",
    "ru-RU":
      "Резюме EU Qualified Person (QP) (соответствие Directive 2001/83/EC Art. 49; GMP-выпуск серий).",
  },
  msl: {
    "zh-CN": "Medical Science Liaison／现场 Medical Affairs 简历。",
    "es-ES": "CV de Medical Science Liaison / Medical Affairs de campo.",
    "fr-FR": "CV de Medical Science Liaison / Medical Affairs terrain.",
    "de-DE": "Lebenslauf für Medical Science Liaison / Field Medical Affairs.",
    "ja-JP": "Medical Science Liaison／フィールド Medical Affairs の CV。",
    "pt-BR": "CV de Medical Science Liaison / Medical Affairs de campo.",
    "it-IT": "CV di Medical Science Liaison / Medical Affairs sul campo.",
    "ko-KR": "Medical Science Liaison / 현장 Medical Affairs CV.",
    "ru-RU": "Резюме Medical Science Liaison / полевого Medical Affairs.",
  },
  heor: {
    "zh-CN": "卫生经济学与结果研究（HEOR）简历。",
    "es-ES": "CV de economía de la salud e investigación de resultados (HEOR).",
    "fr-FR": "CV en économie de la santé et recherche sur les résultats (HEOR).",
    "de-DE": "Lebenslauf für Gesundheitsökonomie und Outcomes-Forschung (HEOR).",
    "ja-JP": "医療経済・アウトカム研究（HEOR）の CV。",
    "pt-BR": "CV de economia da saúde e pesquisa de resultados (HEOR).",
    "it-IT": "CV di economia sanitaria e ricerca sugli esiti (HEOR).",
    "ko-KR": "보건경제 및 성과 연구(HEOR) CV.",
    "ru-RU": "Резюме по экономике здравоохранения и исследованиям исходов (HEOR).",
  },
};

/** English source of truth + fallback, read straight from the catalog. */
const ENGLISH_BY_ID: ReadonlyMap<string, string> = new Map(
  CV_MODELS.map((m) => [m.id, m.description]),
);

/**
 * The localized description for a CV model.
 *
 *  • A supported non-English locale returns its native translation.
 *  • `en-US`, an unsupported/unknown locale (via {@link asLocale}), or a model
 *    with no translation returns the catalog's English `description` — the
 *    single source of truth, so English can never drift.
 *  • An unknown model id returns "" (the picker only ever passes catalog ids).
 */
export function cvModelDescription(id: string, locale: string): string {
  const loc = asLocale(locale);
  const translations = CV_MODEL_DESCRIPTIONS[id as CvModelId] as TranslatedDescriptions | undefined;
  if (translations && loc !== "en-US") return translations[loc];
  return ENGLISH_BY_ID.get(id) ?? "";
}
