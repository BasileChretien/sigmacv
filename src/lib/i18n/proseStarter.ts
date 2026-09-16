// Strings of the prose STARTER DRAFTS (`src/lib/canonical/proseStarter.ts`): the
// scaffold SigmaCV writes into an empty narrative section from the owner's own
// entries, so a funder layout such as the CV-FRQ never opens on a blank page.
// Written in the CV's language (`cv.display.locale`), not the UI's, because the
// text lands in the document. Square-bracket prompts mark what the owner must
// write; they stay visible in the preview until edited. Non-English copy was
// machine-drafted and is flagged for a native-speaker pass (cf. `render.ts`).
import { asLocale, type Locale } from "./index";

export interface ProseStarterStrings {
  /** First line of every draft, in brackets: what this text is and what to do with it. */
  draftNote: string;
  /** The bracketed prompt standing in for text the owner must write. */
  todo: string;
  /** Section 1 (statement / background): lead prompt and sub-headings. */
  bgIntro: string;
  education: string;
  positions: string;
  awards: string;
  grants: string;
  skillsPrompt: string;
  /** Section 2 (contributions): lead prompt and per-contribution labels. */
  contribIntro: string;
  audience: string;
  audienceKey: string;
  role: string;
  impact: string;
  reference: string;
  /** Section 3 (people): lead prompt, sub-headings, closing prompt. */
  supervisionIntro: string;
  supervision: string;
  teaching: string;
  mentoringPrompt: string;
  /** Community / society modules: lead prompts. */
  communityIntro: string;
  societyIntro: string;
  /** Open-ended date range ("2021 to present"). */
  present: string;
}

export const PROSE_STARTER_STRINGS: Record<Locale, ProseStarterStrings> = {
  "en-US": {
    draftNote:
      "[Starter draft built from your record. Keep what serves the call, rewrite the rest, delete this line. An empty section is not exported.]",
    todo: "[to complete]",
    bgIntro:
      "[In a few sentences: how your background prepares you to carry out the proposed research and to meet the programme's criteria. Use the call's own vocabulary.]",
    education: "Education",
    positions: "Positions",
    awards: "Recognitions",
    grants: "Funding held",
    skillsPrompt:
      "[Expertise, leadership, earlier collaborations on the theme, concrete effects of past work, skills acquired through personal experience.]",
    contribIntro:
      "[Up to ten contributions. For each: the period, the audience (A academic community, B practice community, C general public), your role, and the impact with something the reader can check. Below, your most cited and most recent outputs as candidates: keep, merge or replace them.]",
    audience: "Audience",
    audienceKey: "A / B / C",
    role: "Role",
    impact: "Impact",
    reference: "Reference",
    supervisionIntro:
      "[How you have trained the next generation. Below, your supervision and teaching records as a starting point; add mentoring, outreach and the research environment you build.]",
    supervision: "Supervision",
    teaching: "Teaching",
    mentoringPrompt:
      "[Formal or informal mentoring; workshops; safe, equitable and inclusive research practices.]",
    communityIntro:
      "[Service to the research community. Below, your peer review, editorial and service records as a starting point; say what each changed for the field.]",
    societyIntro:
      "[Contributions beyond academia. Below, your patents and clinical trials as a starting point; add policy work, knowledge mobilisation and partnerships.]",
    present: "present",
  },
  "zh-CN": {
    draftNote:
      "[根据您的记录生成的起始草稿。保留对本次申请有用的内容，改写其余部分，然后删除这一行。空白部分不会被导出。]",
    todo: "[待补充]",
    bgIntro:
      "[用几句话说明：您的经历如何使您能够完成拟议研究并满足项目标准。使用征集文件本身的用语。]",
    education: "教育背景",
    positions: "任职经历",
    awards: "荣誉与奖励",
    grants: "获得的资助",
    skillsPrompt:
      "[专长、领导力、在该主题上的既往合作、既往工作的具体效果、从个人经历中获得的能力。]",
    contribIntro:
      "[最多十项贡献。每项写明：时期、受众（A 学术界，B 实务界，C 公众）、您的角色，以及附有可核查依据的影响。下面是您被引最多和最新的成果，作为候选：保留、合并或替换。]",
    audience: "受众",
    audienceKey: "A / B / C",
    role: "角色",
    impact: "影响",
    reference: "参考文献",
    supervisionIntro:
      "[您如何培养下一代。下面是您的指导和教学记录，作为起点；请补充导师工作、推广活动和您所建设的研究环境。]",
    supervision: "指导",
    teaching: "教学",
    mentoringPrompt: "[正式或非正式的导师工作；工作坊；安全、公平、包容的研究实践。]",
    communityIntro:
      "[对研究共同体的服务。下面是您的同行评审、编辑和服务记录，作为起点；说明每一项为学科带来了什么改变。]",
    societyIntro:
      "[学术界之外的贡献。下面是您的专利和临床试验，作为起点；请补充政策工作、知识动员和合作关系。]",
    present: "至今",
  },
  "es-ES": {
    draftNote:
      "[Borrador inicial construido a partir de tu registro. Conserva lo que sirva a la convocatoria, reescribe el resto y borra esta línea. Una sección vacía no se exporta.]",
    todo: "[por completar]",
    bgIntro:
      "[En pocas frases: cómo tu trayectoria te prepara para realizar la investigación propuesta y cumplir los criterios del programa. Usa el vocabulario de la propia convocatoria.]",
    education: "Formación",
    positions: "Puestos",
    awards: "Reconocimientos",
    grants: "Financiación obtenida",
    skillsPrompt:
      "[Experiencia, liderazgo, colaboraciones anteriores sobre el tema, efectos concretos del trabajo pasado, competencias adquiridas por experiencia personal.]",
    contribIntro:
      "[Hasta diez contribuciones. Para cada una: el periodo, el público (A comunidad académica, B comunidad de práctica, C público general), tu papel y el impacto con algo que el lector pueda comprobar. Debajo, tus resultados más citados y más recientes como candidatos: conserva, agrupa o sustituye.]",
    audience: "Público",
    audienceKey: "A / B / C",
    role: "Papel",
    impact: "Impacto",
    reference: "Referencia",
    supervisionIntro:
      "[Cómo has formado a la siguiente generación. Debajo, tus registros de supervisión y docencia como punto de partida; añade mentoría, divulgación y el entorno de investigación que construyes.]",
    supervision: "Supervisión",
    teaching: "Docencia",
    mentoringPrompt:
      "[Mentoría formal o informal; talleres; prácticas de investigación seguras, equitativas e inclusivas.]",
    communityIntro:
      "[Servicio a la comunidad investigadora. Debajo, tus registros de revisión por pares, edición y servicio como punto de partida; di qué cambió cada uno para la disciplina.]",
    societyIntro:
      "[Contribuciones fuera de la academia. Debajo, tus patentes y ensayos clínicos como punto de partida; añade trabajo de políticas, movilización del conocimiento y alianzas.]",
    present: "actualidad",
  },
  "fr-FR": {
    draftNote:
      "[Brouillon de départ construit à partir de votre dossier. Gardez ce qui sert au concours, réécrivez le reste, supprimez cette ligne. Une section vide n'est pas exportée.]",
    todo: "[à compléter]",
    bgIntro:
      "[En quelques phrases : comment votre parcours vous prépare à réaliser la recherche proposée et à répondre aux critères du programme. Reprenez le vocabulaire du concours.]",
    education: "Formation",
    positions: "Postes",
    awards: "Reconnaissances",
    grants: "Financements obtenus",
    skillsPrompt:
      "[Expertise, leadership, collaborations antérieures sur la thématique, effets concrets des travaux passés, aptitudes acquises par vos expériences personnelles.]",
    contribIntro:
      "[Jusqu'à dix contributions. Pour chacune : la période, la clientèle (A milieu académique, B milieu de pratique, C grand public), votre rôle, et les retombées avec quelque chose que le lecteur peut vérifier. Ci-dessous, vos produits les plus cités et les plus récents comme candidats : gardez, regroupez ou remplacez.]",
    audience: "Clientèle",
    audienceKey: "A / B / C",
    role: "Rôle",
    impact: "Retombées",
    reference: "Référence",
    supervisionIntro:
      "[Comment vous avez formé la relève. Ci-dessous, vos encadrements et votre enseignement comme point de départ ; ajoutez le mentorat, la sensibilisation et le milieu de recherche que vous bâtissez.]",
    supervision: "Encadrement",
    teaching: "Enseignement",
    mentoringPrompt:
      "[Mentorat formel ou informel ; ateliers ; pratiques de recherche sûres, équitables et inclusives.]",
    communityIntro:
      "[Services à la communauté de recherche. Ci-dessous, vos évaluations, rôles éditoriaux et services comme point de départ ; dites ce que chacun a changé pour la discipline.]",
    societyIntro:
      "[Contributions au-delà du milieu académique. Ci-dessous, vos brevets et essais cliniques comme point de départ ; ajoutez le travail sur les politiques, la mobilisation des connaissances et les partenariats.]",
    present: "aujourd'hui",
  },
  "de-DE": {
    draftNote:
      "[Startentwurf aus Ihrem Verzeichnis. Behalten Sie, was der Ausschreibung dient, schreiben Sie den Rest um und löschen Sie diese Zeile. Ein leerer Abschnitt wird nicht exportiert.]",
    todo: "[zu ergänzen]",
    bgIntro:
      "[In wenigen Sätzen: wie Ihr Hintergrund Sie darauf vorbereitet, die vorgeschlagene Forschung durchzuführen und die Kriterien des Programms zu erfüllen. Verwenden Sie das Vokabular der Ausschreibung.]",
    education: "Ausbildung",
    positions: "Positionen",
    awards: "Anerkennungen",
    grants: "Eingeworbene Förderung",
    skillsPrompt:
      "[Expertise, Führung, frühere Kooperationen zum Thema, konkrete Wirkungen bisheriger Arbeit, Kompetenzen aus persönlicher Erfahrung.]",
    contribIntro:
      "[Bis zu zehn Beiträge. Für jeden: Zeitraum, Zielgruppe (A wissenschaftliche Gemeinschaft, B Praxisgemeinschaft, C breite Öffentlichkeit), Ihre Rolle und die Wirkung mit etwas, das die Lesenden prüfen können. Unten Ihre meistzitierten und neuesten Ergebnisse als Kandidaten: behalten, zusammenfassen oder ersetzen.]",
    audience: "Zielgruppe",
    audienceKey: "A / B / C",
    role: "Rolle",
    impact: "Wirkung",
    reference: "Referenz",
    supervisionIntro:
      "[Wie Sie die nächste Generation ausgebildet haben. Unten Ihre Betreuungen und Ihre Lehre als Ausgangspunkt; ergänzen Sie Mentoring, Outreach und die Forschungsumgebung, die Sie schaffen.]",
    supervision: "Betreuung",
    teaching: "Lehre",
    mentoringPrompt:
      "[Formelles oder informelles Mentoring; Workshops; sichere, gerechte und inklusive Forschungspraxis.]",
    communityIntro:
      "[Dienst an der Forschungsgemeinschaft. Unten Ihre Begutachtungen, Herausgebertätigkeiten und Gremienarbeit als Ausgangspunkt; sagen Sie, was jede für das Fach verändert hat.]",
    societyIntro:
      "[Beiträge außerhalb der Wissenschaft. Unten Ihre Patente und klinischen Studien als Ausgangspunkt; ergänzen Sie Politikarbeit, Wissensmobilisierung und Partnerschaften.]",
    present: "heute",
  },
  "ja-JP": {
    draftNote:
      "[あなたの記録から作成した下書きです。公募に役立つものを残し、残りを書き直し、この行を削除してください。空のセクションはエクスポートされません。]",
    todo: "[要記入]",
    bgIntro:
      "[数文で：あなたの経歴が、提案する研究の遂行とプログラムの基準の充足にどう備えているか。公募の語彙を使ってください。]",
    education: "学歴",
    positions: "職歴",
    awards: "受賞・表彰",
    grants: "獲得した研究資金",
    skillsPrompt:
      "[専門性、リーダーシップ、テーマに関する過去の共同研究、これまでの研究の具体的な効果、個人的経験から得た能力。]",
    contribIntro:
      "[最多 10 件の貢献。各件に：期間、対象（A 学術コミュニティ、B 実務コミュニティ、C 一般市民）、あなたの役割、読者が確認できるものを添えた成果。以下は被引用数の多い成果と最新の成果の候補です：残す、まとめる、置き換えるのいずれかを。]",
    audience: "対象",
    audienceKey: "A / B / C",
    role: "役割",
    impact: "成果",
    reference: "参考文献",
    supervisionIntro:
      "[次世代をどう育成してきたか。以下は出発点としての指導記録と教育記録です。メンタリング、アウトリーチ、あなたが築く研究環境を加えてください。]",
    supervision: "指導",
    teaching: "教育",
    mentoringPrompt:
      "[公式・非公式のメンタリング、ワークショップ、安全で公正かつ包摂的な研究実践。]",
    communityIntro:
      "[研究コミュニティへの貢献。以下は出発点としての査読、編集、委員活動の記録です。それぞれが分野に何を変えたかを述べてください。]",
    societyIntro:
      "[アカデミアの外への貢献。以下は出発点としての特許と臨床試験です。政策への関与、知識動員、パートナーシップを加えてください。]",
    present: "現在",
  },
  "pt-BR": {
    draftNote:
      "[Rascunho inicial construído a partir do seu registro. Mantenha o que serve ao edital, reescreva o resto e apague esta linha. Uma seção vazia não é exportada.]",
    todo: "[a completar]",
    bgIntro:
      "[Em poucas frases: como sua trajetória o prepara para realizar a pesquisa proposta e atender aos critérios do programa. Use o vocabulário do próprio edital.]",
    education: "Formação",
    positions: "Cargos",
    awards: "Reconhecimentos",
    grants: "Financiamentos obtidos",
    skillsPrompt:
      "[Expertise, liderança, colaborações anteriores sobre o tema, efeitos concretos do trabalho passado, competências adquiridas por experiência pessoal.]",
    contribIntro:
      "[Até dez contribuições. Para cada uma: o período, o público (A comunidade acadêmica, B comunidade de prática, C público em geral), seu papel e o impacto com algo que o leitor possa verificar. Abaixo, seus resultados mais citados e mais recentes como candidatos: mantenha, agrupe ou substitua.]",
    audience: "Público",
    audienceKey: "A / B / C",
    role: "Papel",
    impact: "Impacto",
    reference: "Referência",
    supervisionIntro:
      "[Como você formou a próxima geração. Abaixo, seus registros de supervisão e ensino como ponto de partida; acrescente mentoria, divulgação e o ambiente de pesquisa que você constrói.]",
    supervision: "Supervisão",
    teaching: "Ensino",
    mentoringPrompt:
      "[Mentoria formal ou informal; oficinas; práticas de pesquisa seguras, equitativas e inclusivas.]",
    communityIntro:
      "[Serviço à comunidade de pesquisa. Abaixo, seus registros de revisão por pares, edição e serviço como ponto de partida; diga o que cada um mudou para a área.]",
    societyIntro:
      "[Contribuições fora da academia. Abaixo, suas patentes e ensaios clínicos como ponto de partida; acrescente trabalho em políticas, mobilização do conhecimento e parcerias.]",
    present: "atual",
  },
  "it-IT": {
    draftNote:
      "[Bozza iniziale costruita dal tuo registro. Tieni ciò che serve al bando, riscrivi il resto e cancella questa riga. Una sezione vuota non viene esportata.]",
    todo: "[da completare]",
    bgIntro:
      "[In poche frasi: come il tuo percorso ti prepara a realizzare la ricerca proposta e a soddisfare i criteri del programma. Usa il vocabolario del bando stesso.]",
    education: "Formazione",
    positions: "Posizioni",
    awards: "Riconoscimenti",
    grants: "Finanziamenti ottenuti",
    skillsPrompt:
      "[Competenza, leadership, collaborazioni precedenti sul tema, effetti concreti del lavoro passato, abilità acquisite con l'esperienza personale.]",
    contribIntro:
      "[Fino a dieci contributi. Per ciascuno: il periodo, il pubblico (A comunità accademica, B comunità di pratica, C pubblico generale), il tuo ruolo e l'impatto con qualcosa che il lettore possa verificare. Sotto, i tuoi risultati più citati e più recenti come candidati: tieni, raggruppa o sostituisci.]",
    audience: "Pubblico",
    audienceKey: "A / B / C",
    role: "Ruolo",
    impact: "Impatto",
    reference: "Riferimento",
    supervisionIntro:
      "[Come hai formato la prossima generazione. Sotto, le tue supervisioni e la tua didattica come punto di partenza; aggiungi mentoring, divulgazione e l'ambiente di ricerca che costruisci.]",
    supervision: "Supervisione",
    teaching: "Didattica",
    mentoringPrompt:
      "[Mentoring formale o informale; laboratori; pratiche di ricerca sicure, eque e inclusive.]",
    communityIntro:
      "[Servizio alla comunità di ricerca. Sotto, le tue revisioni, i ruoli editoriali e gli incarichi come punto di partenza; di' cosa ciascuno ha cambiato per la disciplina.]",
    societyIntro:
      "[Contributi oltre l'accademia. Sotto, i tuoi brevetti e le sperimentazioni cliniche come punto di partenza; aggiungi lavoro sulle politiche, mobilitazione della conoscenza e partenariati.]",
    present: "oggi",
  },
  "ko-KR": {
    draftNote:
      "[본인의 기록으로 만든 초안입니다. 공모에 도움이 되는 것은 남기고, 나머지는 다시 쓰고, 이 줄은 삭제하세요. 빈 부분은 내보내지지 않습니다.]",
    todo: "[작성 필요]",
    bgIntro:
      "[몇 문장으로: 본인의 배경이 제안한 연구를 수행하고 프로그램 기준을 충족하도록 어떻게 준비시켰는지. 공모 자체의 용어를 사용하세요.]",
    education: "학력",
    positions: "경력",
    awards: "수상 및 인정",
    grants: "확보한 연구비",
    skillsPrompt:
      "[전문성, 리더십, 주제에 관한 이전 협력, 과거 연구의 구체적 효과, 개인적 경험으로 얻은 역량.]",
    contribIntro:
      "[최대 열 개의 기여. 각각: 기간, 대상(A 학술 공동체, B 실무 공동체, C 일반 대중), 본인의 역할, 독자가 확인할 수 있는 근거를 갖춘 영향. 아래는 후보로 제시한 가장 많이 인용된 성과와 최근 성과입니다. 남기거나, 묶거나, 교체하세요.]",
    audience: "대상",
    audienceKey: "A / B / C",
    role: "역할",
    impact: "영향",
    reference: "참고문헌",
    supervisionIntro:
      "[차세대를 어떻게 양성했는지. 아래는 출발점으로 제시한 지도 기록과 강의 기록입니다. 멘토링, 아웃리치, 본인이 만드는 연구 환경을 더하세요.]",
    supervision: "지도",
    teaching: "강의",
    mentoringPrompt: "[공식·비공식 멘토링, 워크숍, 안전하고 공평하며 포용적인 연구 관행.]",
    communityIntro:
      "[연구 공동체에 대한 봉사. 아래는 출발점으로 제시한 심사, 편집, 봉사 기록입니다. 각각이 분야에 무엇을 바꾸었는지 말하세요.]",
    societyIntro:
      "[학계 밖의 기여. 아래는 출발점으로 제시한 특허와 임상시험입니다. 정책 활동, 지식 동원, 파트너십을 더하세요.]",
    present: "현재",
  },
  "ru-RU": {
    draftNote:
      "[Начальный черновик, собранный из вашей записи. Оставьте то, что служит конкурсу, перепишите остальное и удалите эту строку. Пустой раздел не экспортируется.]",
    todo: "[дополнить]",
    bgIntro:
      "[В нескольких фразах: как ваш опыт подготовил вас к выполнению предлагаемого исследования и к соответствию критериям программы. Используйте словарь самого конкурса.]",
    education: "Образование",
    positions: "Должности",
    awards: "Признание",
    grants: "Полученное финансирование",
    skillsPrompt:
      "[Экспертиза, лидерство, предыдущие коллаборации по теме, конкретные эффекты прошлой работы, компетенции из личного опыта.]",
    contribIntro:
      "[До десяти вкладов. Для каждого: период, аудитория (A академическое сообщество, B практическое сообщество, C широкая публика), ваша роль и эффект с чем-то, что читатель может проверить. Ниже ваши самые цитируемые и самые свежие результаты как кандидаты: оставьте, объедините или замените.]",
    audience: "Аудитория",
    audienceKey: "A / B / C",
    role: "Роль",
    impact: "Эффект",
    reference: "Ссылка",
    supervisionIntro:
      "[Как вы подготовили следующее поколение. Ниже ваши записи о руководстве и преподавании как отправная точка; добавьте наставничество, просветительскую работу и исследовательскую среду, которую вы создаёте.]",
    supervision: "Руководство",
    teaching: "Преподавание",
    mentoringPrompt:
      "[Формальное или неформальное наставничество; семинары; безопасная, справедливая и инклюзивная исследовательская практика.]",
    communityIntro:
      "[Служение исследовательскому сообществу. Ниже ваши записи о рецензировании, редакторской и общественной работе как отправная точка; скажите, что каждая изменила для дисциплины.]",
    societyIntro:
      "[Вклад за пределами академии. Ниже ваши патенты и клинические исследования как отправная точка; добавьте работу над политикой, мобилизацию знаний и партнёрства.]",
    present: "настоящее время",
  },
};

/** The starter-draft strings for a CV locale (falls back to English). */
export function proseStarterStrings(locale: string): ProseStarterStrings {
  return PROSE_STARTER_STRINGS[asLocale(locale)];
}
