import { asLocale, type Locale } from "./index";

/**
 * Copy for the in-editor publish nudge (F1): a gentle, dismissible prompt shown
 * only while the CV is unpublished, encouraging the user to publish a shareable
 * public page (which drives the indexed `/p/[slug]` flywheel). It is consensual —
 * dismissible and never shown again once published — and frames the benefit, not
 * pressure. Non-English strings are machine-drafted; flag for native review.
 *
 * Typed Record<Locale,…> so a missing locale is a compile error (all ten or bust).
 */
export interface PublishNudgeStrings {
  /** Banner heading. */
  title: string;
  /** One-sentence benefit framing. */
  body: string;
  /** Primary action — ticks the existing publish toggle. */
  cta: string;
  /** Secondary action — hides the nudge for this browser. */
  dismiss: string;
}

const PUBLISH_NUDGE_I18N: Record<Locale, PublishNudgeStrings> = {
  "en-US": {
    title: "Share your CV with a public page",
    body: "Publish a free, always-up-to-date public page — a shareable link for your profiles, email signature and applications, and one more way people find your work. You control exactly what's shown.",
    cta: "Publish my page",
    dismiss: "Not now",
  },
  "zh-CN": {
    title: "用公开页面分享你的简历",
    body: "发布一个免费、始终保持最新的公开页面——可分享的链接，用于你的个人资料、邮件签名和申请，也让更多人发现你的工作。显示哪些内容完全由你掌控。",
    cta: "发布我的页面",
    dismiss: "暂不",
  },
  "es-ES": {
    title: "Comparte tu CV con una página pública",
    body: "Publica una página pública gratuita y siempre actualizada: un enlace para tus perfiles, firma de correo y candidaturas, y una forma más de que encuentren tu trabajo. Tú decides exactamente qué se muestra.",
    cta: "Publicar mi página",
    dismiss: "Ahora no",
  },
  "fr-FR": {
    title: "Partagez votre CV avec une page publique",
    body: "Publiez une page publique gratuite et toujours à jour : un lien pour vos profils, votre signature d'e-mail et vos candidatures, et un moyen de plus de faire découvrir vos travaux. Vous choisissez exactement ce qui s'affiche.",
    cta: "Publier ma page",
    dismiss: "Pas maintenant",
  },
  "de-DE": {
    title: "Teilen Sie Ihren Lebenslauf über eine öffentliche Seite",
    body: "Veröffentlichen Sie eine kostenlose, stets aktuelle öffentliche Seite – ein Link für Ihre Profile, Ihre E-Mail-Signatur und Bewerbungen und ein weiterer Weg, über den man Ihre Arbeit findet. Sie bestimmen genau, was angezeigt wird.",
    cta: "Meine Seite veröffentlichen",
    dismiss: "Nicht jetzt",
  },
  "ja-JP": {
    title: "公開ページで CV を共有",
    body: "無料で常に最新の公開ページを公開しましょう。プロフィールやメール署名、応募書類に貼れる共有リンクになり、あなたの業績を見つけてもらう手段がもう一つ増えます。表示する内容はすべてあなたが選べます。",
    cta: "ページを公開する",
    dismiss: "後で",
  },
  "pt-BR": {
    title: "Compartilhe seu currículo com uma página pública",
    body: "Publique uma página pública gratuita e sempre atualizada — um link para seus perfis, assinatura de e-mail e candidaturas, e mais uma forma de as pessoas encontrarem seu trabalho. Você decide exatamente o que aparece.",
    cta: "Publicar minha página",
    dismiss: "Agora não",
  },
  "it-IT": {
    title: "Condividi il tuo CV con una pagina pubblica",
    body: "Pubblica una pagina pubblica gratuita e sempre aggiornata: un link per i tuoi profili, la firma email e le candidature, e un modo in più per far trovare il tuo lavoro. Decidi tu esattamente cosa mostrare.",
    cta: "Pubblica la mia pagina",
    dismiss: "Non ora",
  },
  "ko-KR": {
    title: "공개 페이지로 이력서를 공유하세요",
    body: "무료로 항상 최신 상태로 유지되는 공개 페이지를 게시하세요. 프로필, 이메일 서명, 지원서에 넣을 수 있는 공유 링크가 되고, 사람들이 당신의 연구를 찾는 또 하나의 경로가 됩니다. 무엇을 표시할지는 전적으로 당신이 정합니다.",
    cta: "내 페이지 게시",
    dismiss: "나중에",
  },
  "ru-RU": {
    title: "Поделитесь резюме с помощью публичной страницы",
    body: "Опубликуйте бесплатную и всегда актуальную публичную страницу — ссылку для ваших профилей, подписи в письмах и заявок, и ещё один способ найти ваши работы. Вы сами решаете, что именно показывать.",
    cta: "Опубликовать страницу",
    dismiss: "Не сейчас",
  },
};

/** Publish-nudge copy for a locale (falls back to English for unknown locales). */
export function publishNudgeStrings(locale: string): PublishNudgeStrings {
  return PUBLISH_NUDGE_I18N[asLocale(locale)];
}
