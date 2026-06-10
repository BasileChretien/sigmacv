import { asLocale, type Locale } from "./index";

/**
 * Sign-in-card helper for visitors who don't have an ORCID iD yet (students,
 * early-career and low-/middle-income-country researchers). Rendered as a native
 * <details> under the ORCID button in `components/Landing.tsx`: the question is
 * the always-visible <summary>, the explainer + register CTA reveal on expand.
 *
 * Kept in its own module (high cohesion, same convention as landingAudience.ts).
 * Typed as Record<Locale, OrcidHelp> so a missing locale/field is a compile error.
 * Non-English copy was machine-drafted and is flagged for native review.
 *
 * "ORCID" and "SigmaCV" are brand proper nouns — never translated (pinned by the
 * i18n test).
 */
export interface OrcidHelp {
  /** Always-visible prompt (the <summary>). */
  question: string;
  /** Two-sentence "what it is / why it matters" explainer. */
  explainer: string;
  /** Call-to-action label linking to orcid.org/register. */
  cta: string;
}

const ORCID_HELP_I18N: Record<Locale, OrcidHelp> = {
  "en-US": {
    question: "Don't have an ORCID iD yet?",
    explainer:
      "ORCID is a free, permanent iD for researchers, run by a non-profit — it tells you apart from others who share your name and is how SigmaCV reliably finds your work. Registering is open to anyone, anywhere, and takes about a minute.",
    cta: "Create your free ORCID iD",
  },
  "zh-CN": {
    question: "还没有 ORCID iD？",
    explainer:
      "ORCID 是面向研究者的免费、永久标识符，由非营利机构运营——它能将您与同名的其他研究者区分开来，也是 SigmaCV 可靠找到您成果的方式。注册面向全球所有人免费开放，大约只需一分钟。",
    cta: "免费创建您的 ORCID iD",
  },
  "es-ES": {
    question: "¿Aún no tienes un iD ORCID?",
    explainer:
      "ORCID es un identificador gratuito y permanente para investigadores, gestionado por una organización sin ánimo de lucro: te distingue de otras personas con tu mismo nombre y es la forma en que SigmaCV encuentra tu trabajo de manera fiable. Registrarse está abierto a cualquier persona, en cualquier lugar, y lleva alrededor de un minuto.",
    cta: "Crea tu iD ORCID gratis",
  },
  "fr-FR": {
    question: "Vous n'avez pas encore d'iD ORCID ?",
    explainer:
      "ORCID est un identifiant gratuit et permanent pour les chercheurs, géré par une organisation à but non lucratif : il vous distingue des autres personnes portant le même nom et c'est ainsi que SigmaCV retrouve vos travaux de façon fiable. L'inscription est ouverte à tous, partout, et prend environ une minute.",
    cta: "Créez votre iD ORCID gratuit",
  },
  "de-DE": {
    question: "Noch keine ORCID iD?",
    explainer:
      "ORCID ist eine kostenlose, dauerhafte iD für Forschende, betrieben von einer gemeinnützigen Organisation – sie unterscheidet Sie von anderen mit gleichem Namen und ist der Weg, über den SigmaCV Ihre Arbeiten zuverlässig findet. Die Registrierung steht allen offen, überall, und dauert etwa eine Minute.",
    cta: "Kostenlose ORCID iD erstellen",
  },
  "ja-JP": {
    question: "ORCID iD をまだお持ちでないですか？",
    explainer:
      "ORCID は研究者向けの無料で恒久的な iD で、非営利団体が運営しています。同姓の他の研究者とあなたを区別し、SigmaCV があなたの業績を確実に見つけるための仕組みです。登録は世界中の誰でも無料で行え、約 1 分で完了します。",
    cta: "無料で ORCID iD を作成",
  },
  "pt-BR": {
    question: "Ainda não tem um iD ORCID?",
    explainer:
      "O ORCID é um identificador gratuito e permanente para pesquisadores, mantido por uma organização sem fins lucrativos: ele diferencia você de outras pessoas com o mesmo nome e é como o SigmaCV encontra o seu trabalho de forma confiável. O cadastro é aberto a qualquer pessoa, em qualquer lugar, e leva cerca de um minuto.",
    cta: "Crie seu iD ORCID gratuito",
  },
  "it-IT": {
    question: "Non hai ancora un iD ORCID?",
    explainer:
      "ORCID è un identificativo gratuito e permanente per i ricercatori, gestito da un'organizzazione senza scopo di lucro: ti distingue da altre persone con il tuo stesso nome ed è il modo in cui SigmaCV trova in modo affidabile i tuoi lavori. La registrazione è aperta a chiunque, ovunque, e richiede circa un minuto.",
    cta: "Crea il tuo iD ORCID gratuito",
  },
  "ko-KR": {
    question: "아직 ORCID iD가 없으신가요?",
    explainer:
      "ORCID는 연구자를 위한 무료의 영구 식별자로, 비영리 단체가 운영합니다. 같은 이름을 가진 다른 연구자와 회원님을 구분해 주며, SigmaCV가 회원님의 업적을 정확히 찾는 방법이기도 합니다. 등록은 전 세계 누구에게나 무료로 열려 있으며, 약 1분이면 완료됩니다.",
    cta: "무료로 ORCID iD 만들기",
  },
  "ru-RU": {
    question: "Ещё нет ORCID iD?",
    explainer:
      "ORCID — это бесплатный постоянный iD для исследователей, который ведёт некоммерческая организация: он отличает вас от других людей с тем же именем, и именно по нему SigmaCV надёжно находит ваши работы. Регистрация открыта для всех и везде и занимает около минуты.",
    cta: "Создайте бесплатный ORCID iD",
  },
};

/** Sign-in ORCID helper copy for a locale (falls back to English). */
export function orcidHelp(locale: string): OrcidHelp {
  return ORCID_HELP_I18N[asLocale(locale)];
}
