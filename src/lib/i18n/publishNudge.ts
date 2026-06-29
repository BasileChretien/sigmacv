import { asLocale, type Locale } from "./index";

/**
 * Copy for the in-editor publish nudge: a gentle, dismissible prompt shown after
 * a successful document export (the "this is presentable" moment), while the CV
 * is still unpublished, encouraging the user to publish a shareable public page
 * (which drives the indexed `/p/[slug]` flywheel). It is consensual — dismissible
 * and never shown again once published — and frames the benefit, not pressure.
 * The copy references the just-completed export. Non-English strings are
 * machine-drafted; flag for native review.
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
    title: "Your CV is ready to share",
    body: "You just exported your CV — now publish a free public page too: one always-up-to-date link for your email signature, profiles and applications, and another way people find your work. You control exactly what's shown.",
    cta: "Publish my page",
    dismiss: "Not now",
  },
  "zh-CN": {
    title: "你的简历已准备好分享",
    body: "你刚刚导出了简历——不妨再发布一个免费的公开页面：一个始终保持最新的链接，可用于邮件签名、个人资料和申请，也让更多人发现你的工作。显示哪些内容完全由你掌控。",
    cta: "发布我的页面",
    dismiss: "暂不",
  },
  "es-ES": {
    title: "Tu CV está listo para compartir",
    body: "Acabas de exportar tu CV: publica también una página pública gratuita, un enlace siempre actualizado para tu firma de correo, perfiles y candidaturas, y una forma más de que encuentren tu trabajo. Tú decides exactamente qué se muestra.",
    cta: "Publicar mi página",
    dismiss: "Ahora no",
  },
  "fr-FR": {
    title: "Votre CV est prêt à être partagé",
    body: "Vous venez d'exporter votre CV — publiez aussi une page publique gratuite : un lien toujours à jour pour votre signature d'e-mail, vos profils et vos candidatures, et un moyen de plus de faire découvrir vos travaux. Vous choisissez exactement ce qui s'affiche.",
    cta: "Publier ma page",
    dismiss: "Pas maintenant",
  },
  "de-DE": {
    title: "Ihr Lebenslauf ist bereit zum Teilen",
    body: "Sie haben Ihren Lebenslauf gerade exportiert – veröffentlichen Sie auch eine kostenlose öffentliche Seite: ein stets aktueller Link für Ihre E-Mail-Signatur, Profile und Bewerbungen und ein weiterer Weg, über den man Ihre Arbeit findet. Sie bestimmen genau, was angezeigt wird.",
    cta: "Meine Seite veröffentlichen",
    dismiss: "Nicht jetzt",
  },
  "ja-JP": {
    title: "CV を共有する準備ができました",
    body: "CV をエクスポートしたところです。無料の公開ページも公開しましょう。メール署名やプロフィール、応募書類に貼れる常に最新のリンクになり、あなたの業績を見つけてもらう手段がもう一つ増えます。表示する内容はすべてあなたが選べます。",
    cta: "ページを公開する",
    dismiss: "後で",
  },
  "pt-BR": {
    title: "Seu currículo está pronto para compartilhar",
    body: "Você acabou de exportar seu currículo — publique também uma página pública gratuita: um link sempre atualizado para sua assinatura de e-mail, perfis e candidaturas, e mais uma forma de as pessoas encontrarem seu trabalho. Você decide exatamente o que aparece.",
    cta: "Publicar minha página",
    dismiss: "Agora não",
  },
  "it-IT": {
    title: "Il tuo CV è pronto da condividere",
    body: "Hai appena esportato il tuo CV: pubblica anche una pagina pubblica gratuita, un link sempre aggiornato per la firma email, i profili e le candidature, e un modo in più per far trovare il tuo lavoro. Decidi tu esattamente cosa mostrare.",
    cta: "Pubblica la mia pagina",
    dismiss: "Non ora",
  },
  "ko-KR": {
    title: "이력서를 공유할 준비가 되었습니다",
    body: "방금 이력서를 내보냈습니다. 무료 공개 페이지도 게시해 보세요. 이메일 서명, 프로필, 지원서에 넣을 수 있는 항상 최신 상태의 링크가 되고, 사람들이 당신의 연구를 찾는 또 하나의 경로가 됩니다. 무엇을 표시할지는 전적으로 당신이 정합니다.",
    cta: "내 페이지 게시",
    dismiss: "나중에",
  },
  "ru-RU": {
    title: "Ваше резюме готово к публикации",
    body: "Вы только что экспортировали резюме — опубликуйте и бесплатную публичную страницу: всегда актуальную ссылку для подписи в письмах, профилей и заявок, и ещё один способ найти ваши работы. Вы сами решаете, что именно показывать.",
    cta: "Опубликовать страницу",
    dismiss: "Не сейчас",
  },
};

/** Publish-nudge copy for a locale (falls back to English for unknown locales). */
export function publishNudgeStrings(locale: string): PublishNudgeStrings {
  return PUBLISH_NUDGE_I18N[asLocale(locale)];
}
