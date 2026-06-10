import { asLocale, type Locale } from "./index";

/**
 * Homepage "who it's for" content (the C2 audience section): the persona groups
 * SigmaCV serves — students & grad-school applicants, PhD students & postdocs,
 * faculty & PIs, and clinicians / librarians / research offices. Rendered by
 * `components/Landing.tsx` and kept separate from `landing.ts` so the existing
 * homepage copy is untouched.
 *
 * Typed as Record<Locale, LandingAudience> so a missing locale/field is a compile
 * error. Non-English copy was machine-drafted and is flagged for native review
 * (same convention as landing.ts / landingPages.ts).
 */

export interface LandingPersona {
  title: string;
  body: string;
}

export interface LandingAudience {
  heading: string;
  /** Four persona cards (same count in every locale). */
  personas: LandingPersona[];
}

const LANDING_AUDIENCE_I18N: Record<Locale, LandingAudience> = {
  "en-US": {
    heading: "Who it's for",
    personas: [
      {
        title: "Students & grad-school applicants",
        body: "Build a standout academic CV for a master's, PhD, or fellowship application — your publications formatted correctly from the start, not a blank template.",
      },
      {
        title: "PhD students & postdocs",
        body: "Keep a current researcher CV for job, grant, and conference applications without re-formatting your publication list every time.",
      },
      {
        title: "Faculty & principal investigators",
        body: "Generate funder and tenure CVs (NIH, NSF, ERC, UKRI) from one record, with consistent citations and one-click layouts.",
      },
      {
        title: "Clinicians, librarians & research offices",
        body: "Bring together papers, trials, and editorial roles in one place — and help others maintain their records too.",
      },
    ],
  },
  "zh-CN": {
    heading: "适用人群",
    personas: [
      {
        title: "学生与研究生申请者",
        body: "为硕士、博士或奖学金申请打造一份出众的学术简历——您的论文从一开始就格式正确，而不是一份空白模板。",
      },
      {
        title: "博士生与博士后",
        body: "随时保持一份最新的研究者简历，用于求职、申请资助和会议投稿，无需每次都重新排版您的论文列表。",
      },
      {
        title: "教职人员与项目负责人",
        body: "从同一份记录生成面向资助方和终身教职的简历（NIH、NSF、ERC、UKRI），引用风格一致，版式一键套用。",
      },
      {
        title: "临床医生、图书馆员与科研办公室",
        body: "将论文、临床试验和编辑职务汇聚于一处——并帮助他人一同维护各自的记录。",
      },
    ],
  },
  "es-ES": {
    heading: "Para quién es",
    personas: [
      {
        title: "Estudiantes y candidatos a posgrado",
        body: "Crea un CV académico que destaque para una solicitud de máster, doctorado o beca de investigación: tus publicaciones con el formato correcto desde el principio, no una plantilla en blanco.",
      },
      {
        title: "Doctorandos e investigadores postdoctorales",
        body: "Mantén actualizado tu CV de investigador para solicitudes de empleo, ayudas y congresos sin tener que reformatear tu lista de publicaciones cada vez.",
      },
      {
        title: "Profesorado e investigadores principales",
        body: "Genera CV para financiadores y para titularidad (NIH, NSF, ERC, UKRI) a partir de un único registro, con citas coherentes y diseños con un clic.",
      },
      {
        title: "Personal clínico, bibliotecarios y oficinas de investigación",
        body: "Reúne artículos, ensayos clínicos y funciones editoriales en un solo lugar, y ayuda a otros a mantener sus registros también.",
      },
    ],
  },
  "fr-FR": {
    heading: "À qui ça s'adresse",
    personas: [
      {
        title: "Étudiants et candidats aux études supérieures",
        body: "Constituez un CV académique qui se démarque pour une candidature en master, en doctorat ou à une bourse — vos publications correctement mises en forme dès le départ, et non un modèle vierge.",
      },
      {
        title: "Doctorants et postdoctorants",
        body: "Gardez un CV de chercheur à jour pour vos candidatures à des postes, à des financements et à des conférences, sans avoir à remettre en forme votre liste de publications à chaque fois.",
      },
      {
        title: "Enseignants-chercheurs et responsables de projet",
        body: "Générez des CV pour financeurs et pour titularisation (NIH, NSF, ERC, UKRI) à partir d'un seul dossier, avec des citations cohérentes et des mises en page en un clic.",
      },
      {
        title: "Cliniciens, bibliothécaires et services de la recherche",
        body: "Rassemblez articles, essais et fonctions éditoriales au même endroit — et aidez aussi les autres à tenir leur dossier à jour.",
      },
    ],
  },
  "de-DE": {
    heading: "Für wen es gedacht ist",
    personas: [
      {
        title: "Studierende & Bewerber:innen für ein Graduiertenstudium",
        body: "Erstellen Sie einen herausragenden akademischen Lebenslauf für eine Bewerbung um ein Masterstudium, eine Promotion oder ein Stipendium — mit Ihren Publikationen von Anfang an korrekt formatiert, statt einer leeren Vorlage.",
      },
      {
        title: "Promovierende & Postdocs",
        body: "Halten Sie einen aktuellen Forschungslebenslauf für Bewerbungen um Stellen, Förderungen und Konferenzen bereit, ohne Ihre Publikationsliste jedes Mal neu formatieren zu müssen.",
      },
      {
        title: "Hochschullehrende & Forschungsleitende",
        body: "Erstellen Sie Förderer- und Berufungslebensläufe (NIH, NSF, ERC, UKRI) aus einem einzigen Datensatz, mit einheitlichen Zitaten und Layouts mit einem Klick.",
      },
      {
        title: "Kliniker:innen, Bibliothekar:innen & Forschungsstellen",
        body: "Führen Sie Publikationen, Studien und redaktionelle Tätigkeiten an einem Ort zusammen — und helfen Sie auch anderen, ihre Nachweise zu pflegen.",
      },
    ],
  },
  "ja-JP": {
    heading: "こんな方に",
    personas: [
      {
        title: "学生・大学院出願者",
        body: "修士・博士課程やフェローシップの出願に向けて、際立つ学術 CV を作成しましょう——空のテンプレートではなく、最初からあなたの論文が正しく整形されています。",
      },
      {
        title: "博士課程の学生・ポスドク",
        body: "求職・研究費・学会の応募に使える最新の研究者 CV を、毎回論文リストを整形し直すことなく維持できます。",
      },
      {
        title: "教員・研究代表者",
        body: "一つの記録から助成機関向け・テニュア審査用の CV（NIH、NSF、ERC、UKRI）を生成。引用は一貫し、レイアウトはワンクリックで切り替えられます。",
      },
      {
        title: "臨床医・図書館員・研究支援部門",
        body: "論文・治験・編集者としての役割を一か所にまとめ——さらに他の方の記録の維持も支援できます。",
      },
    ],
  },
  "pt-BR": {
    heading: "Para quem é",
    personas: [
      {
        title: "Estudantes e candidatos à pós-graduação",
        body: "Monte um currículo acadêmico de destaque para uma candidatura a mestrado, doutorado ou bolsa — suas publicações formatadas corretamente desde o início, não um modelo em branco.",
      },
      {
        title: "Doutorandos e pós-docs",
        body: "Mantenha um currículo de pesquisador atualizado para candidaturas a vagas, financiamentos e congressos sem reformatar sua lista de publicações toda vez.",
      },
      {
        title: "Docentes e investigadores principais",
        body: "Gere currículos de financiadores e de progressão na carreira (NIH, NSF, ERC, UKRI) a partir de um único registro, com citações consistentes e layouts com um clique.",
      },
      {
        title: "Clínicos, bibliotecários e escritórios de pesquisa",
        body: "Reúna artigos, ensaios clínicos e funções editoriais em um só lugar — e ajude outros a manter seus registros também.",
      },
    ],
  },
  "it-IT": {
    heading: "Per chi è pensato",
    personas: [
      {
        title: "Studenti e candidati a corsi di laurea magistrale o dottorato",
        body: "Crea un CV accademico che si distingue per una candidatura a una laurea magistrale, un dottorato o una borsa di ricerca — con le tue pubblicazioni formattate correttamente fin dall'inizio, non un modello vuoto.",
      },
      {
        title: "Dottorandi e postdoc",
        body: "Mantieni aggiornato un CV da ricercatore per candidature a posizioni, finanziamenti e conferenze, senza riformattare ogni volta l'elenco delle tue pubblicazioni.",
      },
      {
        title: "Docenti e responsabili di progetto",
        body: "Genera CV per enti finanziatori e per la titolarità (NIH, NSF, ERC, UKRI) da un unico record, con citazioni coerenti e layout applicabili con un clic.",
      },
      {
        title: "Clinici, bibliotecari e uffici ricerca",
        body: "Riunisci articoli, sperimentazioni cliniche e ruoli editoriali in un unico posto — e aiuta anche gli altri a mantenere aggiornati i propri record.",
      },
    ],
  },
  "ko-KR": {
    heading: "이런 분들을 위한 서비스입니다",
    personas: [
      {
        title: "학생 및 대학원 지원자",
        body: "석사·박사 과정이나 펠로십 지원을 위한 돋보이는 학술 CV를 만드세요 — 빈 템플릿이 아니라, 처음부터 올바른 형식으로 정리된 논문 목록으로 시작합니다.",
      },
      {
        title: "박사과정생 및 박사후연구원",
        body: "취업·연구비·학회 지원을 위한 최신 연구자 CV를 유지하세요 — 매번 논문 목록의 형식을 다시 맞출 필요가 없습니다.",
      },
      {
        title: "교수진 및 연구책임자",
        body: "하나의 기록에서 지원기관 및 정년심사용 CV(NIH, NSF, ERC, UKRI)를 생성하세요 — 일관된 인용과 원클릭 레이아웃으로 만듭니다.",
      },
      {
        title: "임상의, 사서 및 연구지원실",
        body: "논문·임상시험·편집 역할을 한곳에 모으세요 — 그리고 다른 분들이 자신의 기록을 관리하는 일도 도울 수 있습니다.",
      },
    ],
  },
  "ru-RU": {
    heading: "Для кого это",
    personas: [
      {
        title: "Студенты и абитуриенты аспирантуры",
        body: "Создайте выдающееся академическое резюме для поступления в магистратуру, аспирантуру или на стипендию — ваши публикации будут оформлены правильно с самого начала, а не пустой шаблон.",
      },
      {
        title: "Аспиранты и постдоки",
        body: "Поддерживайте актуальное резюме исследователя для заявок на работу, гранты и конференции, не переоформляя список публикаций каждый раз.",
      },
      {
        title: "Преподаватели и руководители исследований",
        body: "Создавайте резюме для грантодателей и аттестации (NIH, NSF, ERC, UKRI) из одной записи — с единообразными ссылками и макетами в один клик.",
      },
      {
        title: "Врачи, библиотекари и научные отделы",
        body: "Соберите статьи, клинические исследования и редакторские роли в одном месте — и помогите другим вести их записи тоже.",
      },
    ],
  },
};

/** Homepage audience content for a locale (falls back to English). */
export function landingAudience(locale: string): LandingAudience {
  return LANDING_AUDIENCE_I18N[asLocale(locale)];
}
