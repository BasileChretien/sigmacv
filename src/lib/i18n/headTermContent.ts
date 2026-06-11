// Native-first copy for the head-term landing pages (I1), keyed by native slug.
// One entry per market (single-locale) — see HEAD_TERM_META in headTermPages.ts for
// the slug→locale mapping. Machine-drafted, flagged for native-speaker review.
import type { HeadTermPageId } from "./headTermPages";
import type { LandingPageContent } from "./landingContent";
import type { LandingPageStrings } from "./landingPages";

export const HEAD_TERM_STRINGS: Record<HeadTermPageId, LandingPageStrings> = {
  "cv-academique": {
    metaTitle: "CV académique — créez le vôtre gratuitement",
    metaDescription:
      "Construisez un CV académique complet et à jour en quelques minutes : connexion ORCID, publications via OpenAlex, export PDF/DOCX/LaTeX. Gratuit, open source.",
    navLabel: "CV académique",
    heading: "Créez votre CV académique gratuitement avec SigmaCV",
    subhead:
      "Connectez votre ORCID, laissez SigmaCV importer vos travaux et générez un CV académique professionnel — sans saisie manuelle.",
    bullets: [
      "Publications identifiées par DOI et identifiant ORCID, jamais par simple homonymie",
      "Citations formatées par CSL dans n'importe quel style, identiques sur tous les formats de sortie",
      "Export PDF, DOCX, LaTeX, Markdown ou page publique vivante qui se resynchronise automatiquement",
    ],
    cta: "Créer mon CV académique gratuitement",
    faq: [
      {
        q: "Faut-il un compte ORCID pour utiliser SigmaCV ?",
        a: "L'identifiant ORCID est le moyen recommandé : il permet à SigmaCV d'associer vos publications avec certitude, sans risque de confusion avec un homonyme. Vous pouvez toutefois vous connecter avec Google ou une adresse e-mail, puis renseigner votre ORCID iD manuellement.",
      },
      {
        q: "SigmaCV est-il vraiment gratuit pour les chercheurs individuels ?",
        a: "Oui, SigmaCV est entièrement gratuit pour toute personne qui l'utilise à titre individuel. Le code source est publié sous licence Apache-2.0 et librement accessible sur GitHub.",
      },
    ],
    backLink: "← Retour à SigmaCV",
  },
  "wissenschaftlicher-lebenslauf": {
    metaTitle: "Wissenschaftlicher Lebenslauf – kostenlos erstellen",
    metaDescription:
      "Wissenschaftlichen Lebenslauf automatisch aus ORCID und OpenAlex aufbauen. Identifier-basiert, kein Namensverwechslungsproblem. PDF, DOCX, LaTeX – kostenlos.",
    navLabel: "Wissenschaftlicher Lebenslauf",
    heading: "Wissenschaftlicher Lebenslauf – automatisch und kostenlos mit SigmaCV",
    subhead:
      "Verbinden Sie Ihr ORCID-Profil, und SigmaCV erstellt Ihren wissenschaftlichen Lebenslauf aus verifizierten Quellen – ohne manuelle Dateneingabe.",
    bullets: [
      "Publikationen sicher per Identifier zugeordnet – keine Namens­verwechslungen, auch bei häufigen Namen oder nicht-lateinischen Schriften",
      "Export als PDF, DOCX, LaTeX, Markdown oder als lebendige öffentliche Seite – Zitierformate per CSL in jedem Stil",
      "Förderspezifische Layouts auf Knopfdruck: NIH-Biosketch, ERC, UKRI R4RI und weitere – jederzeit rückgängig zu machen",
    ],
    cta: "Wissenschaftlichen Lebenslauf kostenlos erstellen",
    faq: [
      {
        q: "Was ist ein wissenschaftlicher Lebenslauf, und worin unterscheidet er sich vom gewöhnlichen Lebenslauf?",
        a: "Ein wissenschaftlicher Lebenslauf (auch Academic CV genannt) dokumentiert neben persönlichen Daten und Berufserfahrung vor allem Publikationen, Drittmittel, Lehrleistungen, Gutachtertätigkeiten und Auszeichnungen. Er ist deutlich ausführlicher als ein industrieller Lebenslauf und folgt disziplinspezifischen Konventionen – etwa bei der Zitierweise oder der Reihenfolge der Abschnitte.",
      },
      {
        q: "Ist SigmaCV wirklich kostenlos – auch für kommerzielle Nutzung?",
        a: "Für Einzelpersonen ist SigmaCV vollständig kostenlos. Der Quellcode steht unter der Apache-2.0-Lizenz offen zur Verfügung. Es gibt keine versteckten Gebühren, keine Freemium-Schranken und kein Wasserzeichen auf exportierten Dokumenten.",
      },
    ],
    backLink: "← Zurück zu SigmaCV",
  },
  "cv-academico": {
    metaTitle: "CV académico — créalo gratis y automático",
    metaDescription:
      "Un CV académico profesional, generado automáticamente desde ORCID y OpenAlex. Exporta en PDF, DOCX o LaTeX. Gratuito y de código abierto.",
    navLabel: "CV académico",
    heading: "Tu CV académico, construido automáticamente",
    subhead:
      "Conecta tu ORCID, y SigmaCV organiza tus publicaciones, métricas y trayectoria en un CV académico listo para usar.",
    bullets: [
      "Publicaciones importadas por identificador —nunca por nombre— desde ORCID y OpenAlex",
      "Citas formateadas con CSL en cualquier estilo; exporta a PDF, DOCX, LaTeX o Markdown",
      "Métricas normalizadas por campo, alineadas con DORA — el índice h nunca aparece por defecto",
    ],
    cta: "Crea tu CV académico gratis",
    faq: [
      {
        q: "¿Es SigmaCV realmente gratuito?",
        a: "Sí. SigmaCV es gratuito para personas individuales y de código abierto bajo licencia Apache-2.0. No hay planes de pago ni funciones ocultas de pago.",
      },
      {
        q: "¿Necesito una cuenta ORCID para usarlo?",
        a: "ORCID es la vía recomendada porque permite importar tu registro público de forma segura. También puedes iniciar sesión con Google o correo electrónico y añadir publicaciones por DOI.",
      },
    ],
    backLink: "← Volver a SigmaCV",
  },
  "cv-accademico": {
    metaTitle: "CV accademico — crea il tuo gratis",
    metaDescription:
      "Costruisci un CV accademico completo e aggiornato in automatico: collega ORCID, importa pubblicazioni da OpenAlex, esporta in PDF, DOCX o LaTeX. Gratuito e open source.",
    navLabel: "CV accademico",
    heading: "CV accademico: costruiscilo in automatico, gratis",
    subhead:
      "SigmaCV legge il tuo ORCID, raccoglie le tue pubblicazioni da OpenAlex e genera un CV accademico impeccabile — senza digitare un solo riferimento a mano.",
    bullets: [
      "Pubblicazioni importate per identificatore (ORCID / DOI), mai per omonimia",
      "Citazioni formattate via CSL in qualsiasi stile, identiche in tutti i formati di export",
      "Layout pronti all'uso per NIH biosketch, ERC, UKRI R4RI e altri enti finanziatori",
    ],
    cta: "Crea il tuo CV accademico gratis",
    faq: [
      {
        q: "Devo inserire le mie pubblicazioni a mano?",
        a: "No. SigmaCV le recupera direttamente da ORCID e OpenAlex abbinandole al tuo identificatore, non al nome: niente duplicati, niente attribuzioni errate.",
      },
      {
        q: "Il servizio è davvero gratuito?",
        a: "Sì, SigmaCV è gratuito per uso individuale e rilasciato con licenza open source Apache-2.0. Non esistono piani a pagamento nascosti.",
      },
    ],
    backLink: "← Torna a SigmaCV",
  },
  "curriculo-academico": {
    metaTitle: "Currículo Acadêmico Gratuito e Automático",
    metaDescription:
      "Monte seu currículo acadêmico completo a partir do ORCID e do OpenAlex, exporte em PDF, DOCX ou LaTeX e publique uma página viva — tudo grátis com SigmaCV.",
    navLabel: "Currículo acadêmico",
    heading: "Crie seu currículo acadêmico gratuitamente com SigmaCV",
    subhead:
      "Conecte seu ORCID e deixe o SigmaCV montar, formatar e exportar seu currículo acadêmico com citações corretas em qualquer estilo CSL.",
    bullets: [
      "Publicações importadas por identificador (ORCID/DOI) — sem confusão de homônimos",
      "Exportação em PDF, DOCX, LaTeX, Markdown e BibTeX com um clique",
      "Layouts prontos para NIH, NSF, ERC e UKRI aplicados de forma reversível",
    ],
    cta: "Monte seu currículo acadêmico grátis",
    faq: [
      {
        q: "O SigmaCV é mesmo gratuito para pesquisadores individuais?",
        a: "Sim. O SigmaCV é gratuito para uso individual e de código aberto (licença Apache-2.0). Não há plano pago nem limite de exportações.",
      },
      {
        q: "Preciso ter ORCID para usar o SigmaCV?",
        a: "O ORCID é o método de login recomendado e o que permite a importação automática das suas publicações. Também é possível entrar com Google ou e-mail, mas nesse caso a importação automática via ORCID não estará disponível.",
      },
    ],
    backLink: "← Voltar ao SigmaCV",
  },
  "akademicheskoe-rezume": {
    metaTitle: "Академическое резюме — создайте бесплатно",
    metaDescription:
      "Академическое резюме автоматически из ORCID и OpenAlex. Экспорт в PDF, DOCX, LaTeX. Полевая нормализация метрик, шаблоны NIH, ERC. Бесплатно, открытый код.",
    navLabel: "Академическое резюме",
    heading: "Академическое резюме: создайте своё автоматически и бесплатно",
    subhead:
      "SigmaCV собирает ваши публикации из ORCID и OpenAlex по идентификатору — без путаницы с однофамильцами — и превращает их в профессиональное академическое резюме.",
    bullets: [
      "Публикации подтягиваются автоматически — не нужно вводить их вручную",
      "Экспорт в PDF, DOCX, LaTeX, Markdown, BibTeX или живая публичная страница",
      "Метрики по желанию: полевая нормализация, соответствие DORA, без импакт-фактора журнала",
    ],
    cta: "Создать академическое резюме — бесплатно",
    faq: [
      {
        q: "Чем академическое резюме отличается от обычного резюме?",
        a: "Академическое резюме (curriculum vitae) — полный хронологический перечень вашей научной деятельности: публикации, гранты, конференции, преподавание, редакционные роли. В отличие от одностраничного резюме соискателя, оно не ограничено по объёму и оформляется по дисциплинарным стандартам цитирования.",
      },
      {
        q: "Нужно ли платить за SigmaCV?",
        a: "Нет. SigmaCV полностью бесплатен для частных лиц и распространяется с открытым кодом под лицензией Apache-2.0. Никаких подписок, водяных знаков и скрытых платежей.",
      },
    ],
    backLink: "← На главную SigmaCV",
  },
  "xueshu-jianli": {
    metaTitle: "学术简历 — 免费自动生成",
    metaDescription:
      "什么是学术简历？如何快速制作？SigmaCV 通过 ORCID 和 OpenAlex 自动抓取您的成果，按 CSL 样式排版，支持导出 PDF、DOCX、LaTeX，完全免费开源。",
    navLabel: "学术简历",
    heading: "学术简历：一键自动生成，永久免费",
    subhead:
      "用 ORCID 登录，SigmaCV 即可从权威数据库中提取您的全部成果，生成规范、可导出的学术简历。",
    bullets: [
      "按标识符匹配文献，杜绝同名误收",
      "CSL 引文格式，支持任意期刊样式，自动高亮本人姓名",
      "一键套用 NIH、ERC、UKRI R4RI 等资助机构模板",
    ],
    cta: "免费生成我的学术简历",
    faq: [
      {
        q: "没有 ORCID 也能使用吗？",
        a: "可以。您可以用 Google 账号或电子邮件注册登录，随后在账户设置中关联 ORCID 以获取最完整的文献数据。",
      },
      {
        q: "生成的学术简历可以在线分享吗？",
        a: "可以。SigmaCV 支持发布一个实时同步的公开页面，链接可直接分享。您可逐字段控制哪些内容对外可见，完全保护个人隐私。",
      },
    ],
    backLink: "← 返回 SigmaCV 首页",
  },
  "gakujutsu-cv": {
    metaTitle: "アカデミックCVを無料で自動作成",
    metaDescription:
      "アカデミックCVとは何か、そして研究者として最短でどう作るか。SigmaCV はORCIDとOpenAlexから文献を自動取得し、PDF・DOCX・LaTeXで書き出せる無料ツールです。",
    navLabel: "アカデミックCV",
    heading: "アカデミックCVを自動で作る",
    subhead: "ORCIDでサインインするだけで、研究業績が自動で揃います。",
    bullets: [
      "ORCID・OpenAlex から業績をID照合で取得——同姓同名の混入なし",
      "PDF・DOCX・LaTeX・Markdown で書き出し、または公開URLで常時更新",
      "NIH バイオスケッチ・ERC・UKRI R4RI など主要フォーマットにワンクリック対応",
    ],
    cta: "アカデミックCVを無料で作る",
    faq: [
      {
        q: "履歴書とアカデミックCVの違いは何ですか？",
        a: "一般的な履歴書（就活用）は職歴を1〜2枚にまとめるものですが、アカデミックCVは論文・学会発表・獲得競争的資金・受賞・指導実績など研究活動の全記録です。ページ数に上限はなく、研究者としてのキャリアすべてを網羅します。",
      },
      {
        q: "SigmaCV は完全無料ですか？",
        a: "個人利用は完全無料です。ソースコードも Apache-2.0 ライセンスで公開されています。",
      },
    ],
    backLink: "← SigmaCV トップへ戻る",
  },
  "haksul-cv": {
    metaTitle: "학술 CV 무료 자동 생성",
    metaDescription:
      "학술 CV를 ORCID와 OpenAlex 데이터로 자동 작성하세요. PDF·DOCX·LaTeX 출력, CSL 인용 스타일, NIH·ERC 레이아웃 지원. 무료·오픈소스.",
    navLabel: "학술 CV",
    heading: "학술 CV, 자동으로 완성하세요",
    subhead: "ORCID iD로 로그인하면 연구 업적이 자동으로 불러와져 전문적인 학술 CV가 완성됩니다.",
    bullets: [
      "식별자 기반 매칭 — 동명이인 오류 없이 내 논문만 정확히 수집",
      "PDF·DOCX·LaTeX·Markdown 출력 및 실시간 업데이트 공개 페이지 제공",
      "NIH 바이오스케치·ERC·UKRI R4RI 등 원클릭 펀더 레이아웃 지원",
    ],
    cta: "학술 CV 무료로 만들기",
    faq: [
      {
        q: "SigmaCV는 정말 무료인가요?",
        a: "네, 개인 연구자에게는 완전 무료입니다. 소스 코드도 Apache-2.0 라이선스로 공개되어 있습니다.",
      },
      {
        q: "한국어 이름도 정확히 인식하나요?",
        a: "이름 문자열이 아닌 ORCID iD와 OpenAlex 식별자로 논문을 매칭하므로, 한국어·중국어·아랍어 등 비라틴 문자 이름도 혼동 없이 정확히 처리됩니다.",
      },
    ],
    backLink: "← SigmaCV 홈으로",
  },
};

export const HEAD_TERM_CONTENT: Record<HeadTermPageId, LandingPageContent> = {
  "cv-academique": {
    intro: [
      "Un CV académique est le document de référence qui résume votre parcours de recherche : formations, postes, publications, financements, rôles éditoriaux et distinctions. Il diffère d'un CV professionnel classique par sa profondeur bibliographique et par les normes typographiques propres à la communauté scientifique — citations formatées selon un style cohérent, métriques choisies avec discernement, mise en page sobre et lisible par les comités de recrutement comme par les algorithmes d'indexation.",
      "SigmaCV automatise la partie la plus fastidieuse de cet exercice. Après connexion avec votre ORCID iD, la plateforme interroge OpenAlex et ORCID pour importer vos publications en les appariant par identifiant — et non par nom —, ce qui élimine les confusions liées aux homonymes, particulièrement fréquentes pour les noms courants ou les systèmes d'écriture non latins. Vous conservez le contrôle total : vous choisissez ce qui apparaît, dans quel ordre, avec quel style de citation CSL, et vous exportez dans le format attendu par votre institution ou votre financeur.",
    ],
    stepsHeading: "Comment créer votre CV académique en quatre étapes",
    steps: [
      {
        title: "Connectez-vous avec votre ORCID iD",
        body: "SigmaCV utilise l'authentification OAuth ORCID pour lire votre dossier public. Aucune donnée n'est stockée sans votre accord. Vous pouvez aussi vous connecter via Google ou e-mail si vous n'avez pas encore d'ORCID.",
      },
      {
        title: "Vos publications sont importées automatiquement",
        body: "SigmaCV interroge OpenAlex et ORCID et apparie chaque travail à votre identifiant de chercheur — jamais à une simple concordance de noms. Le résultat est un dossier complet, dédoublonné, incluant articles, prépublications, données et logiciels.",
      },
      {
        title: "Curez, ordonnez et choisissez votre style",
        body: "Masquez les entrées non pertinentes, réorganisez les sections par glisser-déposer et sélectionnez un style de citation CSL parmi des milliers de styles disponibles. Activez la mise en évidence de votre propre nom dans les listes d'auteurs. Pour un dossier NIH, ERC ou UKRI R4RI, une mise en page en un clic adapte la structure au format attendu.",
      },
      {
        title: "Exportez ou publiez votre CV académique",
        body: "Téléchargez votre CV en PDF, DOCX, LaTeX, Markdown ou BibTeX, ou publiez une page publique vivante dont les données se resynchronisent à chaque nouvelle publication. Les métriques — normalisées par domaine, conformes à DORA — sont optionnelles et désactivées par défaut.",
      },
    ],
    whyHeading: "Pourquoi choisir SigmaCV pour votre CV académique ?",
    why: [
      "La plupart des outils de CV académique reposent sur la reconnaissance de nom pour associer vos publications : une approche fragile qui génère des erreurs pour les chercheurs portant des noms courants, des noms composés ou des noms en écriture non latine. SigmaCV n'utilise que des identifiants persistants — ORCID iD, DOI, identifiant OpenAlex — ce qui garantit une liste de publications juste dès le premier import. L'outil est par ailleurs open source (Apache-2.0) et auditable : aucune boîte noire, aucun biais algorithmique opaque.",
      "SigmaCV est conçu en accord avec les principes de l'évaluation responsable de la recherche. Les métriques bibliométriques comme le h-index ou le facteur d'impact de revue sont absentes par défaut ; seules des métriques normalisées par domaine (FWCI, RCR) peuvent être activées manuellement, en pleine conscience. Cette approche s'inscrit dans l'esprit du Manifeste de Leyde et de DORA, et répond aux attentes croissantes des comités de recrutement européens qui valorisent la qualité et la diversité des contributions plutôt que les seuls indicateurs quantitatifs.",
    ],
    faqExtra: [
      {
        q: "Puis-je utiliser SigmaCV pour un dossier de candidature NIH, ERC ou UKRI ?",
        a: "Oui. SigmaCV propose des mises en page spécifiques pour les principaux financeurs — NIH biosketch, NSF, ERC, UKRI R4RI, SNSF et d'autres — appliquées en un clic et révocables à tout moment. La structure des sections et les règles de formatage propres à chaque organisme sont respectées automatiquement.",
      },
      {
        q: "Comment SigmaCV gère-t-il mes données personnelles ?",
        a: "SigmaCV applique un principe de minimisation des données. Chaque champ publié nécessite un consentement explicite ; vous pouvez exporter l'intégralité de vos données ou supprimer votre compte à tout moment. La plateforme est hébergée dans l'Union européenne et respecte le RGPD.",
      },
      {
        q: "SigmaCV peut-il formater mes citations dans le style de ma revue ou de mon institution ?",
        a: "Oui. SigmaCV utilise le Citation Style Language (CSL) via le moteur citeproc, ce qui lui donne accès à des milliers de styles officiels — APA, Vancouver, Chicago, styles maison des universités et des revues. Le style choisi s'applique de manière identique à tous les formats d'export : PDF, DOCX, LaTeX et Markdown.",
      },
    ],
    relatedHeading: "Voir aussi",
  },
  "wissenschaftlicher-lebenslauf": {
    intro: [
      "Ein wissenschaftlicher Lebenslauf ist das zentrale Dokument Ihrer akademischen Karriere. Er begleitet Bewerbungen auf Professuren, Förderanträge bei DFG, ERC oder NIH, Habilitationsverfahren und Evaluierungen. Wer ihn manuell pflegt, kennt das Problem: Publikationslisten laufen auseinander, Zitierformate variieren je nach Zielinstitution, und bei jedem neuen Antrag beginnt das Sortieren von vorn. SigmaCV automatisiert genau diesen Teil – und tut es auf eine Weise, die wissenschaftlichen Qualitätsansprüchen genügt.",
      "Statt den Namen als Suchschlüssel zu verwenden, identifiziert SigmaCV Ihre Werke über Ihre ORCID-iD und OpenAlex-Identifier. Das bedeutet: Keine Treffer für andere Forschende mit ähnlichem Namen, keine fehlenden Artikel wegen einer Namensänderung oder einer nichtlateinischen Schreibweise. Die Publikationsliste, die SigmaCV aufbaut, ist Ihre – und nur Ihre.",
    ],
    stepsHeading: "In vier Schritten zum wissenschaftlichen Lebenslauf",
    steps: [
      {
        title: "Mit ORCID anmelden",
        body: "Melden Sie sich mit Ihrer ORCID-iD an (alternativ: Google oder E-Mail). SigmaCV liest Ihr öffentliches ORCID-Profil aus und legt automatisch ein Konto an – kein Formular, kein manuelles Eingeben von Affiliationen oder Kontaktdaten.",
      },
      {
        title: "Daten automatisch zusammenführen",
        body: "SigmaCV zieht Ihre Publikationen aus ORCID und OpenAlex, ergänzt bibliografische Details über Crossref und DOI, und fügt – sofern vorhanden – Förderinformationen, Datensätze und Softwareveröffentlichungen hinzu. Die Zuordnung erfolgt ausschließlich per Identifier, nie per Namensstring.",
      },
      {
        title: "Kuratieren und gestalten",
        body: "Entfernen Sie Einträge, die nicht zu Ihnen gehören, ordnen Sie Abschnitte nach Ihren Wünschen um, und wählen Sie einen CSL-Zitierst il – von APA über Vancouver bis zu fachspezifischen Journal-Stilen. Aktivieren Sie auf Wunsch feldnormierte Metriken (DORA-konform, kein Journal-Impact-Faktor). Für Förderanträge stehen Layout-Vorlagen zur Verfügung: NIH-Biosketch, ERC, UKRI R4RI und weitere.",
      },
      {
        title: "Exportieren oder veröffentlichen",
        body: "Laden Sie Ihren Lebenslauf als PDF, DOCX (Word-kompatibel), LaTeX, Markdown oder BibTeX herunter. Oder schalten Sie eine lebendige öffentliche Seite frei, die sich bei neuen Publikationen automatisch aktualisiert – mit granularer Kontrolle darüber, welche Felder sichtbar sind.",
      },
    ],
    whyHeading: "Warum SigmaCV für Ihren wissenschaftlichen Lebenslauf?",
    why: [
      "Andere CV-Tools arbeiten mit Namenssuchen oder verlassen sich darauf, dass Sie Ihre Publikationen manuell eingeben. Beides ist fehleranfällig – insbesondere bei häufigen Namen, Namenswechseln nach Heirat oder Schriften außerhalb des lateinischen Alphabets. SigmaCV verwendet stattdessen persistente Identifier (ORCID, OpenAlex-ID, DOI), die eindeutig auf Sie verweisen. Das Ergebnis ist eine Publikationsliste, der Sie und Ihre Gutachtenden vertrauen können.",
      "SigmaCV ist quelloffen (Apache-2.0), kostenlos für Einzelpersonen und bewusst unabhängig von kommerziellen Verlagsinteressen. Es zeigt keinen Journal-Impact-Faktor – nicht, weil die Funktion fehlt, sondern weil die Metrik dem DORA-Manifest und dem Leiden Manifesto widerspricht. Wer Metriken möchte, kann feldnormierte Werte (FWCI, mittlerer RCR) auf freiwilliger Basis aktivieren. Ihre Daten gehören Ihnen: vollständiger Export, vollständige Löschung, feingranulare Veröffentlichungsfreigaben.",
    ],
    faqExtra: [
      {
        q: "Ich habe noch keine ORCID-iD. Kann ich SigmaCV trotzdem nutzen?",
        a: "Ja. Sie können sich auch mit Google oder einer E-Mail-Adresse anmelden. Für die automatische Publikationszuordnung über OpenAlex ist eine ORCID-iD jedoch empfehlenswert – sie ist kostenlos unter orcid.org zu registrieren und dauerhaft mit Ihrer Forschungsidentität verknüpft.",
      },
      {
        q: "Unterstützt SigmaCV deutsche Zitierformate und DFG-Anforderungen?",
        a: "SigmaCV nutzt die Citation Style Language (CSL) mit Tausenden von Stilen, darunter gängige deutsche und internationale Fachzeitschriftenstile. Für DFG-Anträge empfiehlt sich ein generischer Autor-Jahr-Stil oder der Stil der Zielfachzeitschrift. NIH-Biosketch, ERC und UKRI R4RI sind als Ein-Klick-Layouts bereits integriert; weitere Förderlayouts sind in Entwicklung.",
      },
      {
        q: "Was passiert, wenn eine Publikation in meiner Liste auftaucht, die nicht von mir stammt?",
        a: "Sie können jeden Eintrag mit einem Klick ausblenden. Ausgeblendete Einträge werden nicht gelöscht – SigmaCV speichert sie intern, damit sie bei einem erneuten Sync nicht wieder auftauchen. In einer zukünftigen Version wird es möglich sein, Fehlzuordnungen direkt an OpenAlex zurückzumelden und so zur Verbesserung der Datenbasis beizutragen.",
      },
    ],
    relatedHeading: "Weitere Themen",
  },
  "cv-academico": {
    intro: [
      "Un CV académico es el documento central de tu trayectoria investigadora: recoge publicaciones, financiación obtenida, formación, docencia y méritos evaluables. A diferencia de un currículum convencional, sigue convenciones estrictas de cada disciplina y puede extenderse varios folios. Crearlo a mano es laborioso, y mantenerlo actualizado lo es aún más —sobre todo cuando el listado de publicaciones crece en diferentes bases de datos.",
      "SigmaCV resuelve ese problema recuperando tus datos desde fuentes abiertas y contrastadas. En lugar de copiar y pegar referencias, el sistema las obtiene directamente de ORCID y OpenAlex mediante identificadores únicos, lo que elimina duplicados y atribuciones erróneas. El resultado es un CV académico coherente, exportable y siempre sincronizable.",
    ],
    stepsHeading: "Cómo crear tu CV académico con SigmaCV",
    steps: [
      {
        title: "Inicia sesión con tu ORCID",
        body: "Accede a SigmaCV con tu iD de ORCID —o con Google o correo electrónico si lo prefieres—. En cuestión de segundos, SigmaCV lee tu perfil público y lo utiliza como punto de partida.",
      },
      {
        title: "Importación automática de publicaciones",
        body: "SigmaCV consulta ORCID y OpenAlex para recuperar tus trabajos por identificador. No realiza búsquedas por nombre, lo que evita mezclar tus publicaciones con las de homónimos, algo especialmente importante con apellidos comunes o escritura no latina.",
      },
      {
        title: "Selecciona secciones y estilo de citación",
        body: "Elige qué secciones incluir, ordénalas y escoge un estilo CSL —APA, Vancouver, Chicago y cientos más—. Si solicitas una beca del ERC, el NIH o la NSF, aplica el diseño específico con un solo clic y reviértelo cuando no lo necesites.",
      },
      {
        title: "Exporta o publica tu CV académico",
        body: "Descarga tu CV en PDF, DOCX, LaTeX, Markdown o BibTeX. También puedes publicar una página pública permanente que se resincroniza con tus últimas publicaciones sin que tengas que intervenir.",
      },
    ],
    whyHeading: "¿Por qué SigmaCV para tu CV académico?",
    why: [
      "La mayoría de herramientas de CV genéricas ignoran las particularidades del mundo académico: estilos de citación normalizados, métricas evaluables, formatos de convocatoria específicos. SigmaCV está diseñado desde el principio para investigadores: cada decisión —desde cómo se asignan los nombres en las listas de autores hasta qué métricas mostrar— sigue principios de evaluación responsable alineados con DORA y el Leiden Manifesto.",
      "Además, SigmaCV respeta tu privacidad. Tú decides qué campos publicar, puedes exportar todos tus datos y eliminar tu cuenta en cualquier momento. Al ser de código abierto (Apache-2.0), cualquiera puede auditar el código, contribuir o desplegarlo en su propia infraestructura.",
    ],
    faqExtra: [
      {
        q: "¿Puedo usar SigmaCV si mi ORCID tiene pocas publicaciones vinculadas?",
        a: "Sí. SigmaCV también consulta OpenAlex, que indexa publicaciones no siempre presentes en ORCID. Además, puedes añadir cualquier trabajo manualmente introduciendo su DOI.",
      },
      {
        q: "¿El CV académico generado cumple con los formatos de convocatorias europeas?",
        a: "SigmaCV incluye plantillas de un clic para formatos de convocatorias habituales, como el R4RI de UKRI. Los formatos ERC y otros pueden configurarse mediante los estilos CSL disponibles. El soporte de Europass ELM está planificado para versiones futuras.",
      },
      {
        q: "¿Cómo se gestionan las métricas en el CV académico?",
        a: "Las métricas están desactivadas por defecto. Si decides incluirlas, SigmaCV muestra indicadores normalizados por campo —como el FWCI— en lugar del factor de impacto de revista. Este enfoque sigue las recomendaciones de DORA para una evaluación responsable de la investigación.",
      },
    ],
    relatedHeading: "Véase también",
  },
  "cv-accademico": {
    intro: [
      "Il CV accademico è il documento cardine della carriera di un ricercatore: riassume produzione scientifica, attività didattica, finanziamenti ottenuti e ruoli istituzionali in un formato leggibile da commissioni, enti finanziatori e riviste. Mantenerlo aggiornato è però un lavoro costante — ogni nuova pubblicazione, ogni nuovo progetto richiede un intervento manuale, con il rischio di errori tipografici nei riferimenti e incoerenze di stile tra i diversi formati richiesti.",
      "SigmaCV nasce per eliminare questa fatica. Una volta collegato il tuo ORCID iD, il sistema recupera automaticamente le tue pubblicazioni da OpenAlex e le abbina al tuo profilo per identificatore univoco — non per corrispondenza di nome. Il risultato è un CV accademico sempre aggiornato, con citazioni formattate in modo coerente attraverso il Citation Style Language (CSL) e pronto per l'export nei formati più richiesti: PDF, DOCX, LaTeX, Markdown e BibTeX.",
    ],
    stepsHeading: "Come costruire il tuo CV accademico con SigmaCV",
    steps: [
      {
        title: "Accedi con ORCID, Google o e-mail",
        body: "La registrazione avviene in pochi secondi. Se hai già un ORCID iD — l'identificatore internazionale per i ricercatori — SigmaCV lo usa come punto di partenza per importare il tuo profilo pubblico.",
      },
      {
        title: "Le tue pubblicazioni vengono importate in automatico",
        body: "SigmaCV interroga ORCID e OpenAlex e costruisce la lista delle tue opere abbinandole al tuo identificatore. Niente omonimie, niente attribuzioni errate: ogni voce è collegata al DOI o all'ID OpenAlex corrispondente. Puoi rimuovere le voci che non ti appartengono con un clic.",
      },
      {
        title: "Scegli lo stile, il layout e le sezioni",
        body: "Seleziona lo stile citazionale CSL che preferisci (APA, Vancouver, Chicago e centinaia di altri), attiva l'evidenziazione del tuo nome nella lista autori e scegli le sezioni da includere. Per domande di finanziamento hai a disposizione layout pronti per NIH, ERC, UKRI R4RI e altri enti, applicabili e rimovibili in modo reversibile.",
      },
      {
        title: "Esporta o pubblica la pagina pubblica",
        body: "Scarica il CV accademico in PDF, DOCX, LaTeX o Markdown in un clic. In alternativa, pubblica una pagina pubblica permanente che si aggiorna automaticamente ogni volta che arriva una nuova pubblicazione — nessuna manutenzione manuale necessaria.",
      },
    ],
    whyHeading: "Perché SigmaCV per il tuo CV accademico",
    why: [
      "La maggior parte dei tool per CV accademici chiede di inserire i dati a mano o di caricare un file. SigmaCV invece attinge direttamente alle infrastrutture dell'open science — ORCID e OpenAlex — e abbina le pubblicazioni per identificatore, non per stringa di testo. Questo approccio è fondamentale per i ricercatori con nomi comuni o con caratteri non latini: non c'è rischio di confondere la propria produzione con quella di un omonimo.",
      "Le metriche bibliometriche sono disponibili su richiesta, disattivate per impostazione predefinita, sempre field-normalized e allineate ai principi DORA e al Leiden Manifesto: SigmaCV non mostra mai il Journal Impact Factor. I tuoi dati restano tuoi — puoi scegliere campo per campo cosa rendere pubblico, esportare il tuo profilo completo o eliminare l'account in qualsiasi momento. Il codice sorgente è pubblico (Apache-2.0) e ospitato su server europei.",
    ],
    faqExtra: [
      {
        q: "Quali formati di export sono supportati?",
        a: "SigmaCV esporta in PDF (via rendering HTML), DOCX (compatibile con Word), LaTeX con file .bib, Markdown con frontmatter YAML e BibTeX. È anche possibile pubblicare una pagina pubblica che si aggiorna automaticamente.",
      },
      {
        q: "Posso usare il mio stile citazionale preferito?",
        a: "Sì. Le citazioni sono gestite tramite CSL (Citation Style Language): hai accesso a migliaia di stili, dagli standard internazionali (APA, Vancouver, MLA) agli stili specifici di riviste e enti. Lo stile scelto si applica in modo identico a tutti i formati di export.",
      },
      {
        q: "Come vengono trattati i dati personali?",
        a: "SigmaCV applica un principio di privacy per impostazione predefinita: scegli tu campo per campo cosa rendere visibile nella pagina pubblica. Puoi esportare tutti i tuoi dati in qualsiasi momento e richiedere la cancellazione completa dell'account. Il trattamento è conforme al GDPR e i server sono situati in Europa.",
      },
    ],
    relatedHeading: "Approfondimenti",
  },
  "curriculo-academico": {
    intro: [
      "Um currículo acadêmico — também chamado de curriculum vitae ou lattes no contexto brasileiro — é o documento central da vida de qualquer pesquisador. Ele reúne formação, publicações, projetos financiados, orientações, cargos editoriais e métricas de impacto, e é exigido em candidaturas a empregos, bolsas de fomento, avaliações institucionais e submissões a periódicos. Diferente de um currículo profissional convencional, o currículo acadêmico tende a crescer continuamente ao longo da carreira e precisa estar sempre atualizado com as convenções bibliográficas de cada área.",
      "O SigmaCV automatiza a montagem desse documento. Basta fazer login com seu ORCID iD: o sistema recupera suas obras do OpenAlex e do ORCID, formata cada referência via CSL (Citation Style Language) no estilo de citação que você escolher, e gera um currículo coeso em segundos. Toda a correspondência entre obra e autor é feita por identificador — ORCID, DOI ou ID do OpenAlex — nunca por coincidência de nome, o que elimina erros de homonímia muito comuns entre autores brasileiros.",
    ],
    stepsHeading: "Como montar seu currículo acadêmico em quatro passos",
    steps: [
      {
        title: "Faça login com seu ORCID",
        body: "Acesse o SigmaCV e autentique-se com seu ORCID iD. O sistema lê seu registro público e importa automaticamente publicações, filiações e financiamentos já cadastrados. Nenhuma digitação manual necessária para começar.",
      },
      {
        title: "Curadoria e organização",
        body: "Revise a lista de publicações importadas, oculte itens que não são seus e reordene seções conforme a convenção da sua área. O SigmaCV nunca exclui registros — apenas os esconde do currículo exibido, preservando a rastreabilidade.",
      },
      {
        title: "Escolha o estilo e as métricas",
        body: "Selecione qualquer estilo CSL (APA, Vancouver, ABNT, Harvard etc.) para formatar as citações de forma idêntica em todos os formatos de saída. Se desejar exibir métricas, ative-as individualmente: o SigmaCV oferece apenas métricas normalizadas por campo, em linha com os princípios do DORA e do Leiden Manifesto — nunca o Fator de Impacto de periódico.",
      },
      {
        title: "Exporte ou publique",
        body: "Baixe o currículo em PDF pronto para impressão, em DOCX editável no Word, em LaTeX para personalização tipográfica avançada, em Markdown ou BibTeX. Ou publique uma página viva que se atualiza automaticamente conforme novas obras são indexadas no OpenAlex.",
      },
    ],
    whyHeading: "Por que usar o SigmaCV para seu currículo acadêmico",
    why: [
      "A maioria das ferramentas de currículo acadêmico — incluindo plataformas institucionais — depende de correspondência por nome para vincular publicações a autores. Isso funciona mal para nomes comuns, para pesquisadores com múltiplas grafias ou para quem publicou em diferentes idiomas. O SigmaCV resolve esse problema na raiz: a vinculação é feita exclusivamente por identificadores persistentes (ORCID iD, DOI, ID do OpenAlex). O resultado é um currículo com publicações corretas sem curadoria exaustiva.",
      "Além da precisão, o SigmaCV foi projetado para a diversidade de exigências da carreira acadêmica: candidaturas a bolsas do NIH, NSF, ERC ou UKRI exigem layouts específicos (como o biosketch do NIH); submissões a periódicos pedem BibTeX ou Markdown; avaliações institucionais querem PDF. Com o SigmaCV, o mesmo currículo curado gera todos esses formatos sem retrabalho. O código é aberto (Apache-2.0), auditável e auto-hospedável — sem dependência de uma plataforma proprietária.",
    ],
    faqExtra: [
      {
        q: "O SigmaCV substitui a Plataforma Lattes?",
        a: "Não diretamente. A Plataforma Lattes é obrigatória para fomento CNPq e possui integração com sistemas nacionais. O SigmaCV é complementar: gera um currículo internacional interoperável (PDF, DOCX, LaTeX, página viva) a partir dos mesmos dados, útil para candidaturas fora do Brasil, submissões a periódicos e apresentações em conferências internacionais.",
      },
      {
        q: "Posso destacar meu nome na lista de autores?",
        a: "Sim. O SigmaCV identifica sua autoria pelo ORCID iD ou pelo ID do OpenAlex e aplica destaque tipográfico ao seu nome em todas as referências, em qualquer estilo CSL escolhido — sem risco de destacar um homônimo por engano.",
      },
      {
        q: "Como os financiamentos e bolsas aparecem no currículo?",
        a: "O SigmaCV importa concessões associadas ao seu ORCID a partir do OpenAlex, Crossref e de agências como NIH, NSF, ERC e UKRI. Financiamentos vinculados por identificador são incluídos automaticamente; os que dependem apenas de correspondência nome+instituição aparecem como candidatos para revisão manual, com uma marcação visível.",
      },
    ],
    relatedHeading: "Veja também",
  },
  "akademicheskoe-rezume": {
    intro: [
      "Академическое резюме — центральный документ научной карьеры. В отличие от делового резюме, оно не сжимается до одной страницы: здесь полный перечень ваших публикаций, грантов, конференционных докладов, руководства студентами, редакционных обязанностей и наград. Именно по нему комиссии оценивают кандидатов на должности, гранты и премии — поэтому точность и актуальность каждой строки имеют прямое значение для вашей карьеры.",
      "Традиционно обновление академического резюме отнимает часы: нужно вручную выгружать записи из баз данных, согласовывать форматы цитирования, следить за новыми публикациями. SigmaCV решает эту задачу иначе: сервис подключается к вашему ORCID iD и OpenAlex, сопоставляет работы по идентификатору DOI и автора — а не по строке имени, — и автоматически строит структурированный документ. Вы только решаете, что показывать и как оформить.",
    ],
    stepsHeading: "Как создать академическое резюме в SigmaCV",
    steps: [
      {
        title: "Войдите через ORCID, Google или e-mail",
        body: "Авторизация через ORCID iD позволяет SigmaCV сразу получить ваш публичный профиль. Если у вас ещё нет ORCID, можно зарегистрироваться бесплатно на orcid.org — это займёт две минуты.",
      },
      {
        title: "Автоматическое наполнение из открытых источников",
        body: "SigmaCV запрашивает ваши публикации в OpenAlex и ORCID, сопоставляя их по идентификаторам автора и DOI. Никакой угадки по имени: при распространённых фамилиях и нелатинских алфавитах это принципиально важно. Гранты, клинические испытания и редакционные роли подтягиваются из дополнительных открытых источников.",
      },
      {
        title: "Настройте и оформите резюме",
        body: "Уберите чужие работы, переупорядочьте разделы, выберите стиль цитирования CSL — от APA до Vancouver или журнального стиля вашей дисциплины. При желании включите полевую нормализацию метрик (FWCI и другие), соответствующих принципам DORA. Одним кликом применяется шаблон NIH Biosketch, ERC, UKRI R4RI или другой под нужный грант.",
      },
      {
        title: "Экспортируйте или опубликуйте",
        body: "Скачайте готовый документ в PDF, DOCX, LaTeX, Markdown или BibTeX. Либо опубликуйте живую публичную страницу, которая автоматически обновляется при появлении новых публикаций, — и укажите её ссылку в профиле.",
      },
    ],
    whyHeading: "Почему исследователи выбирают SigmaCV",
    why: [
      "Большинство инструментов для академического резюме либо платные, либо требуют ручного ввода каждой публикации. SigmaCV — открытый и бесплатный проект (Apache-2.0), который автоматизирует рутину: синхронизацию источников, согласование форматов цитирования через CSL, поддержку нескольких шаблонов под разные требования финансирующих организаций. Данные остаются вашими: предусмотрены гранулированный контроль публикации, экспорт всех данных и удаление аккаунта.",
      "SigmaCV создан в духе ответственной оценки науки. Метрики — строго по желанию, по умолчанию отключены, всегда полевая нормализация, импакт-фактор журнала не показывается никогда. Это согласуется с принципами DORA и Лейденского манифеста. Сервис работает на открытых данных — ORCID, OpenAlex, Crossref — и сам является открытой инфраструктурой, которую академическое сообщество может изучать, использовать и улучшать.",
    ],
    faqExtra: [
      {
        q: "Что делать, если в моём резюме оказались чужие публикации?",
        a: "Это частая проблема при сопоставлении по имени. SigmaCV использует идентификаторы автора (ORCID и OpenAlex ID), что значительно снижает риск ошибок. Если работа всё же попала по ошибке, достаточно одного нажатия, чтобы исключить её из вашего резюме — она помечается как «не моя» и больше не отображается.",
      },
      {
        q: "Какие стили цитирования поддерживаются?",
        a: "SigmaCV использует Citation Style Language (CSL) — открытый стандарт с тысячами стилей: от APA, MLA и Chicago до Vancouver, Harvard и узкоспециализированных журнальных форматов. Выбранный стиль применяется одинаково во всех форматах экспорта.",
      },
      {
        q: "Как часто данные обновляются?",
        a: "Вы можете запустить повторную синхронизацию вручную в любой момент. Если вы опубликовали живую публичную страницу, SigmaCV периодически проверяет новые публикации в OpenAlex и ORCID и обновляет страницу автоматически.",
      },
    ],
    relatedHeading: "Смотрите также",
  },
  "xueshu-jianli": {
    intro: [
      "学术简历（Academic CV）是研究人员展示学术成果、职业经历与学术贡献的核心文件，与普通求职简历不同，它通常包含完整的发表列表、科研项目、学术荣誉、学术任职及授权专利等。在申请教职、科研基金或国际合作时，一份格式规范、内容完整的学术简历不可或缺。",
      "SigmaCV 是一款免费、开源（Apache-2.0）的学术简历生成工具。它通过 ORCID 和 OpenAlex 的公开 API，依据作者标识符（而非姓名字符串）精准检索您的文献，有效避免重名混淆——对于中文姓名等在国际数据库中高度重复的情况尤为重要。生成的简历支持导出为 PDF、DOCX、LaTeX、Markdown 或 BibTeX，也可发布为自动同步的在线公开页面。",
    ],
    stepsHeading: "四步完成您的学术简历",
    steps: [
      {
        title: "用 ORCID 登录",
        body: "使用您的 ORCID iD 一键授权登录。SigmaCV 将读取您的公开 ORCID 记录，作为后续数据抓取的身份锚点。若暂无 ORCID，也可通过 Google 或电子邮件注册。",
      },
      {
        title: "自动同步文献与成果",
        body: "系统自动从 ORCID 和 OpenAlex 拉取您的发表记录，并通过 Crossref、DataCite、DBLP 等来源补全缺失信息。所有匹配均基于作者标识符，不依赖姓名字符串，准确率高。",
      },
      {
        title: "整理内容与选择样式",
        body: "在编辑器中移除非本人文献、调整章节顺序、选择 CSL 引文格式（支持 APA、Vancouver、Nature 等数千种样式），并可开启姓名高亮功能。如需特定资助机构格式，可一键套用 NIH Biosketch、ERC、UKRI R4RI 等预设模板，修改后可随时还原。",
      },
      {
        title: "导出或发布",
        body: "将学术简历导出为 PDF、DOCX（兼容 Word）、LaTeX、Markdown 或 BibTeX，或直接发布为公开在线页面。在线页面会随数据源自动更新，无需手动维护。",
      },
    ],
    whyHeading: "为什么选择 SigmaCV？",
    why: [
      "SigmaCV 从设计之初就以研究者的实际需求为出发点。它不展示期刊影响因子，而是提供领域归一化指标（如 FWCI），与 DORA 宣言和 Leiden Manifesto 的原则保持一致，帮助您如实呈现研究影响力，而非被期刊排名所主导。指标功能默认关闭，完全由您选择是否启用。",
      "作为开源项目，SigmaCV 的所有代码均公开可审计，个人使用永久免费，无广告，无隐藏收费。您的数据属于您：支持逐字段发布授权、完整数据导出与账号删除。对于高度重视数据主权的学术用户，这一点至关重要。",
    ],
    faqExtra: [
      {
        q: "学术简历和普通简历有什么区别？",
        a: "普通简历（Résumé）通常为 1—2 页，侧重工作经历与技能，面向企业招聘。学术简历没有页数限制，完整列出所有发表、科研项目、学术荣誉、学术任职、教学经历等，主要用于学术职位申请、基金申请及国际合作。",
      },
      {
        q: "SigmaCV 支持中文姓名高亮吗？",
        a: "支持。SigmaCV 通过 ORCID 或 OpenAlex 标识符而非姓名字符串匹配作者，因此对中文、日文、韩文等非拉丁字符姓名的识别同样准确，不会因姓名形式差异（如拼音、繁简体）造成遗漏或误收。",
      },
      {
        q: "我的文献数据保存在哪里？",
        a: "文献元数据来自 ORCID、OpenAlex 等公开数据库，SigmaCV 仅存储您的整理选择与展示偏好。您可以随时导出全部数据或删除账号，平台不会将您的数据用于任何未经同意的用途。",
      },
    ],
    relatedHeading: "相关主题",
  },
  "gakujutsu-cv": {
    intro: [
      "アカデミックCV（学術的履歴書）とは、研究者が自分の学術業績を網羅的に記録した文書です。論文・著書・学会発表・競争的資金・特許・受賞・査読歴・指導学生など、あらゆる研究活動を時系列で記載します。就職活動用の履歴書とは異なり、ページ数の制限はなく、研究者としてのキャリア全体を正確に伝えることを目的とします。海外の大学・研究機関・グラント申請では「CV」という呼称が標準です。",
      "SigmaCV は、このアカデミックCVを自動で生成するオープンソースのウェブツールです。ORCID iD でサインインするとORCIDの公開レコードとOpenAlexのデータベースから業績を取得し、識別子（DOIやORCID ID）による照合を行うため、同姓同名の他の研究者の論文が紛れ込む心配がありません。日本語名・漢字名など非ラテン文字のお名前でも安全です。",
    ],
    stepsHeading: "SigmaCV でアカデミックCVを作る4ステップ",
    steps: [
      {
        title: "ORCIDでサインイン",
        body: "ORCID iD をお持ちでない場合は事前に無料登録できます。SigmaCV はORCIDの公開APIを通じてあなたのレコードを読み取ります。Googleアカウントやメールアドレスでのサインインも可能です。",
      },
      {
        title: "業績を自動取得・確認",
        body: "SigmaCV がORCIDとOpenAlexから論文・発表・競争的資金などを自動的に収集します。「自分の業績ではない」と判断した項目は非表示にでき、逆にDOIを直接入力して追加することもできます。",
      },
      {
        title: "フォーマットとスタイルを選択",
        body: "CSL（Citation Style Language）に対応した任意の引用スタイルを選べます。著者リスト内の自分の名前をハイライト表示する機能も搭載。NIHバイオスケッチ・ERC・UKRI R4RI などのフォーマットにもワンクリックで切り替えられ、いつでも元に戻せます。",
      },
      {
        title: "書き出しまたは公開URLで共有",
        body: "PDF・DOCX（Word互換）・LaTeX・Markdown・BibTeX 形式でエクスポートできます。公開CVページを有効にすれば、URLを共有するだけで常時最新の業績リストを閲覧者に提供できます。",
      },
    ],
    whyHeading: "なぜ SigmaCV か",
    why: [
      "研究者が最も困るのは「また業績リストを手で更新しなければ」という繰り返し作業です。SigmaCV はOpenAlexと連携して新しい論文を自動検出し、CVを常に最新の状態に保ちます。指標（メトリクス）の表示はオプトイン制で、デフォルトではオフです。表示する場合も DORA 宣言に沿ったフィールド正規化指標のみを採用しており、インパクトファクターは一切表示しません。",
      "プライバシーへの配慮も徹底しています。公開する項目をフィールド単位で設定でき、アカウントとデータはいつでも削除可能。ソースコードは Apache-2.0 ライセンスで GitHub に公開されており、誰でも監査・改変・自己ホストができます。機能ではなく透明性で信頼を示すツールです。",
    ],
    faqExtra: [
      {
        q: "ORCIDに登録されていない論文は取り込めますか？",
        a: "DOIを直接入力することでOpenAlexからメタデータを取得し、手動で追加できます。また、SigmaCV はORCIDに登録されていない論文もOpenAlexのデータから補完しようとします。",
      },
      {
        q: "引用スタイルはどのくらい選べますか？",
        a: "CSL スタイルリポジトリに収録されている数千種類のスタイルから選択できます。APA・Vancouver・Nature・Chicago など主要スタイルはもちろん、日本語論文誌のスタイルにも対応しています。",
      },
      {
        q: "競争的資金の情報も自動で取得されますか？",
        a: "NIH・NSF・ERC・UKRI などの主要ファンダーの助成情報はOpenAlexやCrossref経由で自動取得されます。取得できた場合はCVのグラント欄に自動で追加され、確認後に公開・非公開を選べます。",
      },
    ],
    relatedHeading: "あわせてご覧ください",
  },
  "haksul-cv": {
    intro: [
      "학술 CV(연구자 이력서)는 연구자의 출판 목록, 수상 경력, 연구비 수혜, 교육 경력 등을 체계적으로 정리한 공식 문서입니다. 취업 지원, 연구비 신청, 학술 기관 협력 등 연구 경력 전반에 걸쳐 필수적으로 요구됩니다. 그러나 수십 편의 논문을 손수 정리하고 인용 형식을 통일하는 작업은 시간이 많이 소요되고 오류가 발생하기 쉽습니다.",
      "SigmaCV는 이 과정을 자동화합니다. ORCID 공개 데이터와 OpenAlex를 통해 연구자의 논문·연구비·소속 정보를 식별자 기반으로 수집하고, CSL(Citation Style Language)로 인용 형식을 통일하여 PDF, DOCX, LaTeX, Markdown 등 다양한 형식으로 내보낼 수 있습니다. 완성된 학술 CV는 공개 URL로 게시하여 언제든 자동으로 최신 상태를 유지할 수 있습니다.",
    ],
    stepsHeading: "4단계로 완성하는 학술 CV",
    steps: [
      {
        title: "ORCID iD로 로그인",
        body: "ORCID iD, Google 계정, 또는 이메일로 로그인합니다. SigmaCV는 ORCID 공개 레코드에서 소속, 교육 이력, 연구비 정보를 바로 불러옵니다.",
      },
      {
        title: "논문 자동 수집 및 검토",
        body: "OpenAlex와 ORCID에서 내 논문을 식별자 기반으로 수집합니다. 이름 매칭이 아니기 때문에 동명이인의 논문이 섞이지 않습니다. 원하지 않는 항목은 제외하고, DOI로 누락된 논문을 직접 추가할 수도 있습니다.",
      },
      {
        title: "스타일 및 형식 설정",
        body: "수백 가지 CSL 인용 스타일 중 원하는 것을 선택하세요. 저자 목록에서 본인 이름 강조 표시, NIH 바이오스케치·ERC·UKRI R4RI 등 펀더별 레이아웃, 섹션 순서 조정도 가능합니다. 지표는 기본적으로 비활성화되어 있으며, 필요한 경우 필드 정규화 지표를 선택적으로 표시할 수 있습니다.",
      },
      {
        title: "내보내기 또는 공개 페이지 게시",
        body: "PDF, DOCX, LaTeX, Markdown, BibTeX로 내보내거나, 연구 업적이 자동으로 업데이트되는 공개 학술 CV 페이지를 게시하세요. 공개 범위는 항목별로 세밀하게 설정할 수 있습니다.",
      },
    ],
    whyHeading: "왜 SigmaCV인가요?",
    why: [
      "SigmaCV는 연구자 평가의 책임 있는 실천을 위해 설계되었습니다. DORA 선언에 부합하도록 저널 임팩트 팩터(JIF)는 표시하지 않으며, 지표를 사용할 경우 FWCI 등 필드 정규화 지표만 선택적으로 표시합니다. 코드는 완전히 공개(Apache-2.0)되어 있어 투명성과 신뢰성을 직접 확인할 수 있습니다.",
      "개인정보 보호도 핵심 원칙입니다. 항목별 공개 동의 설정, 데이터 내보내기, 계정 삭제 기능을 제공합니다. 유럽 서버에서 운영되며, 불필요한 데이터는 수집하지 않습니다. 연구자 본인이 자신의 학술 CV를 완전히 통제할 수 있어야 한다는 철학을 바탕으로 만들어졌습니다.",
    ],
    faqExtra: [
      {
        q: "어떤 인용 스타일을 지원하나요?",
        a: "CSL(Citation Style Language)을 기반으로 APA, Vancouver, IEEE, Chicago 등 수천 가지 스타일을 지원합니다. PDF·DOCX·LaTeX 모든 출력물에 동일한 형식이 적용됩니다.",
      },
      {
        q: "NIH 바이오스케치처럼 특정 펀더 형식도 지원하나요?",
        a: "네. NIH, NSF, ERC, UKRI R4RI, SNSF 등 주요 펀더 레이아웃을 원클릭으로 적용할 수 있습니다. 레이아웃 변경은 언제든 되돌릴 수 있습니다.",
      },
      {
        q: "ORCID 계정이 없으면 사용할 수 없나요?",
        a: "ORCID iD가 가장 완전한 경험을 제공하지만, Google 계정이나 이메일로도 가입할 수 있습니다. ORCID가 없을 경우 일부 자동 수집 기능이 제한될 수 있습니다. ORCID는 연구자라면 무료로 발급받을 수 있습니다(orcid.org).",
      },
    ],
    relatedHeading: "관련 페이지",
  },
};
