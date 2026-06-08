import { asLocale, type Locale } from "./index";

/**
 * Contact-page copy, localized for all 10 supported languages. Typed as
 * Record<Locale, ContactStrings> so a missing translation is a compile error.
 * Used by the default `/contact` and the localized `/[locale]/contact` routes.
 *
 * The data-controller contact address is a constant (not translated). Set up the
 * `privacy@sigmacv.org` mailbox / forward before going live.
 */
export const CONTACT_EMAIL = "privacy@sigmacv.org";

export interface ContactStrings {
  metaTitle: string;
  metaDescription: string;
  heading: string;
  intro: string;
  dataNote: string;
  backLink: string;
}

const CONTACT_I18N: Record<Locale, ContactStrings> = {
  "en-US": {
    metaTitle: "Contact",
    metaDescription:
      "Contact SigmaCV — an independent personal project. Email the data controller for questions, feedback, or a privacy request.",
    heading: "Contact",
    intro:
      "SigmaCV is an independent personal project maintained by Basile Chrétien (PharmD, MSc, MPH), the data controller. For any question, feedback, or privacy request, email the controller at:",
    dataNote:
      "Data-protection requests — access, correction, export, or deletion of your data — can also be done yourself in the app from your account. Either way, we aim to reply within 30 days.",
    backLink: "← Back to SigmaCV",
  },
  "zh-CN": {
    metaTitle: "联系我们",
    metaDescription:
      "联系 SigmaCV——一个独立的个人项目。如有问题、反馈或隐私请求，请发送电子邮件给数据控制者。",
    heading: "联系方式",
    intro:
      "SigmaCV 是由数据控制者 Basile Chrétien（PharmD、MSc、MPH）维护的独立个人项目。如有任何问题、反馈或隐私请求，请发送电子邮件至：",
    dataNote:
      "数据保护请求——访问、更正、导出或删除您的数据——您也可以在应用中从您的账户自行完成。无论哪种方式，我们都会力求在 30 天内回复。",
    backLink: "← 返回 SigmaCV",
  },
  "es-ES": {
    metaTitle: "Contacto",
    metaDescription:
      "Contacte con SigmaCV, un proyecto personal independiente. Escriba al responsable del tratamiento para preguntas, comentarios o una solicitud de privacidad.",
    heading: "Contacto",
    intro:
      "SigmaCV es un proyecto personal independiente mantenido por Basile Chrétien (PharmD, MSc, MPH), el responsable del tratamiento. Para cualquier pregunta, comentario o solicitud de privacidad, escriba al responsable a:",
    dataNote:
      "Las solicitudes de protección de datos —acceso, corrección, exportación o eliminación de sus datos— también puede realizarlas usted mismo en la aplicación desde su cuenta. En cualquier caso, procuramos responder en un plazo de 30 días.",
    backLink: "← Volver a SigmaCV",
  },
  "fr-FR": {
    metaTitle: "Contact",
    metaDescription:
      "Contactez SigmaCV, un projet personnel indépendant. Écrivez au responsable du traitement pour toute question, remarque ou demande relative à la confidentialité.",
    heading: "Contact",
    intro:
      "SigmaCV est un projet personnel indépendant maintenu par Basile Chrétien (PharmD, MSc, MPH), le responsable du traitement. Pour toute question, remarque ou demande relative à la confidentialité, écrivez au responsable à :",
    dataNote:
      "Les demandes de protection des données — accès, rectification, exportation ou suppression de vos données — peuvent aussi être effectuées vous-même dans l'application depuis votre compte. Dans tous les cas, nous nous efforçons de répondre sous 30 jours.",
    backLink: "← Retour à SigmaCV",
  },
  "de-DE": {
    metaTitle: "Kontakt",
    metaDescription:
      "Kontaktieren Sie SigmaCV, ein unabhängiges privates Projekt. Schreiben Sie dem Verantwortlichen bei Fragen, Feedback oder einem Datenschutzanliegen.",
    heading: "Kontakt",
    intro:
      "SigmaCV ist ein unabhängiges privates Projekt, das von Basile Chrétien (PharmD, MSc, MPH), dem Verantwortlichen, betrieben wird. Bei Fragen, Feedback oder Datenschutzanliegen schreiben Sie dem Verantwortlichen an:",
    dataNote:
      "Datenschutzanfragen – Auskunft, Berichtigung, Export oder Löschung Ihrer Daten – können Sie auch selbst in der App über Ihr Konto vornehmen. In beiden Fällen bemühen wir uns, innerhalb von 30 Tagen zu antworten.",
    backLink: "← Zurück zu SigmaCV",
  },
  "ja-JP": {
    metaTitle: "お問い合わせ",
    metaDescription:
      "独立した個人プロジェクト SigmaCV へのお問い合わせ。ご質問・ご意見・プライバシーに関するご請求は、データ管理者までメールでご連絡ください。",
    heading: "お問い合わせ",
    intro:
      "SigmaCV は、データ管理者である Basile Chrétien（PharmD、MSc、MPH）が運営する独立した個人プロジェクトです。ご質問、ご意見、プライバシーに関するご請求は、管理者の次のアドレスまでメールでご連絡ください：",
    dataNote:
      "データ保護に関するご請求（データの開示・訂正・エクスポート・削除）は、アプリ内のアカウントからご自身で行うこともできます。いずれの場合も、30 日以内の回答に努めます。",
    backLink: "← SigmaCV に戻る",
  },
  "pt-BR": {
    metaTitle: "Contato",
    metaDescription:
      "Entre em contato com o SigmaCV, um projeto pessoal independente. Escreva ao controlador de dados para dúvidas, comentários ou uma solicitação de privacidade.",
    heading: "Contato",
    intro:
      "O SigmaCV é um projeto pessoal independente mantido por Basile Chrétien (PharmD, MSc, MPH), o controlador de dados. Para qualquer dúvida, comentário ou solicitação de privacidade, escreva ao controlador em:",
    dataNote:
      "As solicitações de proteção de dados — acesso, correção, exportação ou exclusão dos seus dados — também podem ser feitas por você mesmo no aplicativo, a partir da sua conta. De qualquer forma, procuramos responder em até 30 dias.",
    backLink: "← Voltar ao SigmaCV",
  },
  "it-IT": {
    metaTitle: "Contatti",
    metaDescription:
      "Contatta SigmaCV, un progetto personale indipendente. Scrivi al titolare del trattamento per domande, commenti o una richiesta sulla privacy.",
    heading: "Contatti",
    intro:
      "SigmaCV è un progetto personale indipendente gestito da Basile Chrétien (PharmD, MSc, MPH), il titolare del trattamento. Per qualsiasi domanda, commento o richiesta sulla privacy, scrivi al titolare all'indirizzo:",
    dataNote:
      "Le richieste in materia di protezione dei dati — accesso, rettifica, esportazione o cancellazione dei tuoi dati — puoi effettuarle anche autonomamente nell'app dal tuo account. In ogni caso, cerchiamo di rispondere entro 30 giorni.",
    backLink: "← Torna a SigmaCV",
  },
  "ko-KR": {
    metaTitle: "문의",
    metaDescription:
      "독립적인 개인 프로젝트 SigmaCV에 문의하기. 질문, 의견 또는 개인정보 요청은 데이터 관리자에게 이메일로 보내 주십시오.",
    heading: "문의",
    intro:
      "SigmaCV는 데이터 관리자인 Basile Chrétien(PharmD, MSc, MPH)이 운영하는 독립적인 개인 프로젝트입니다. 질문, 의견 또는 개인정보 요청은 관리자에게 다음 주소로 이메일을 보내 주십시오:",
    dataNote:
      "개인정보 보호 요청(데이터 열람, 정정, 내보내기 또는 삭제)은 앱에서 귀하의 계정을 통해 직접 수행할 수도 있습니다. 어느 경우든 저희는 30일 이내에 답변하도록 노력합니다.",
    backLink: "← SigmaCV로 돌아가기",
  },
  "ru-RU": {
    metaTitle: "Контакты",
    metaDescription:
      "Свяжитесь с SigmaCV — независимым личным проектом. Пишите контролёру данных по вопросам, отзывам или запросам о конфиденциальности.",
    heading: "Контакты",
    intro:
      "SigmaCV — независимый личный проект, поддерживаемый Basile Chrétien (PharmD, MSc, MPH), контролёром данных. По любым вопросам, отзывам или запросам о конфиденциальности пишите контролёру по адресу:",
    dataNote:
      "Запросы о защите данных — доступ, исправление, экспорт или удаление ваших данных — вы также можете выполнить самостоятельно в приложении из своей учётной записи. В любом случае мы стремимся ответить в течение 30 дней.",
    backLink: "← Назад к SigmaCV",
  },
};

/** Localized contact-page strings (falls back to en-US for an unknown locale). */
export function contactStrings(locale: string): ContactStrings {
  return CONTACT_I18N[asLocale(locale)];
}
