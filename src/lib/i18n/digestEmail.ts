import { asLocale, type Locale } from "./index";

/**
 * Strings for the opt-in re-sync digest email (plain text). Same typed-record
 * contract as the other dictionaries: a missing locale is a compile error.
 * `{n}` is substituted at the call site. Greetings deliberately carry NO name
 * (data minimization + name-order pitfalls across locales).
 */
export interface DigestEmailStrings {
  /** Subject; {n} = number of changes (added + removed). */
  dgSubject: string;
  dgGreeting: string;
  dgIntro: string;
  /** Bullet lines; {n} substituted. */
  dgAdded: string;
  dgReview: string;
  dgRemoved: string;
  /** Continuation line under the (capped) title list. */
  dgMore: string;
  /** Call to action; the editor URL follows on its own line. */
  dgCta: string;
  /** Unsubscribe lead-in; the one-click URL follows on its own line. */
  dgUnsub: string;
}

const DIGEST_EMAIL: Record<Locale, DigestEmailStrings> = {
  "en-US": {
    dgSubject: "SigmaCV: {n} updates to your CV",
    dgGreeting: "Hello,",
    dgIntro: "Your living CV picked up changes in the latest sync of the open record:",
    dgAdded: "{n} new entries:",
    dgReview: "{n} entries are waiting for your review",
    dgRemoved: "{n} entries are no longer listed by the sources",
    dgMore: "…and {n} more",
    dgCta: "Review and curate them in the editor:",
    dgUnsub: "Stop these emails (one click):",
  },
  "zh-CN": {
    dgSubject: "SigmaCV:您的简历有 {n} 处更新",
    dgGreeting: "您好,",
    dgIntro: "您的动态简历在最近一次同步公开记录时有以下变化:",
    dgAdded: "新增 {n} 条:",
    dgReview: "{n} 条等待您审核",
    dgRemoved: "{n} 条已不在数据源中",
    dgMore: "……另有 {n} 条",
    dgCta: "请在编辑器中查看并整理:",
    dgUnsub: "停止接收此类邮件(一键退订):",
  },
  "es-ES": {
    dgSubject: "SigmaCV: {n} novedades en su CV",
    dgGreeting: "Hola:",
    dgIntro: "Su CV dinámico registró cambios en la última sincronización del registro abierto:",
    dgAdded: "{n} entradas nuevas:",
    dgReview: "{n} entradas esperan su revisión",
    dgRemoved: "{n} entradas ya no figuran en las fuentes",
    dgMore: "…y {n} más",
    dgCta: "Revíselas en el editor:",
    dgUnsub: "Dejar de recibir estos correos (un clic):",
  },
  "fr-FR": {
    dgSubject: "SigmaCV : {n} nouveautés dans votre CV",
    dgGreeting: "Bonjour,",
    dgIntro:
      "Votre CV dynamique a enregistré des changements lors de la dernière synchronisation des sources ouvertes :",
    dgAdded: "{n} nouvelles entrées :",
    dgReview: "{n} entrées attendent votre vérification",
    dgRemoved: "{n} entrées ne figurent plus dans les sources",
    dgMore: "…et {n} de plus",
    dgCta: "Vérifiez-les dans l’éditeur :",
    dgUnsub: "Ne plus recevoir ces e-mails (un clic) :",
  },
  "de-DE": {
    dgSubject: "SigmaCV: {n} Neuerungen in Ihrem CV",
    dgGreeting: "Guten Tag,",
    dgIntro:
      "Ihr dynamischer CV hat bei der letzten Synchronisierung der offenen Quellen Änderungen erhalten:",
    dgAdded: "{n} neue Einträge:",
    dgReview: "{n} Einträge warten auf Ihre Prüfung",
    dgRemoved: "{n} Einträge sind nicht mehr in den Quellen",
    dgMore: "…und {n} weitere",
    dgCta: "Prüfen Sie sie im Editor:",
    dgUnsub: "Diese E-Mails abbestellen (ein Klick):",
  },
  "ja-JP": {
    dgSubject: "SigmaCV:CVに {n} 件の更新があります",
    dgGreeting: "こんにちは。",
    dgIntro: "公開データとの最新の同期で、あなたのCVに次の変更がありました:",
    dgAdded: "新規 {n} 件:",
    dgReview: "確認待ち {n} 件",
    dgRemoved: "ソースに存在しなくなった項目 {n} 件",
    dgMore: "…ほか {n} 件",
    dgCta: "エディタで確認・整理してください:",
    dgUnsub: "このメールの配信を停止する(ワンクリック):",
  },
  "pt-BR": {
    dgSubject: "SigmaCV: {n} novidades no seu CV",
    dgGreeting: "Olá,",
    dgIntro: "Seu CV dinâmico registrou mudanças na última sincronização do registro aberto:",
    dgAdded: "{n} itens novos:",
    dgReview: "{n} itens aguardam sua revisão",
    dgRemoved: "{n} itens não constam mais nas fontes",
    dgMore: "…e mais {n}",
    dgCta: "Revise no editor:",
    dgUnsub: "Parar de receber estes e-mails (um clique):",
  },
  "it-IT": {
    dgSubject: "SigmaCV: {n} novità nel tuo CV",
    dgGreeting: "Ciao,",
    dgIntro:
      "Il tuo CV dinamico ha registrato modifiche nell’ultima sincronizzazione del registro aperto:",
    dgAdded: "{n} nuove voci:",
    dgReview: "{n} voci attendono la tua verifica",
    dgRemoved: "{n} voci non risultano più nelle fonti",
    dgMore: "…e altre {n}",
    dgCta: "Verificale nell’editor:",
    dgUnsub: "Interrompi queste e-mail (un clic):",
  },
  "ko-KR": {
    dgSubject: "SigmaCV: CV에 {n}건의 업데이트",
    dgGreeting: "안녕하세요.",
    dgIntro: "공개 기록과의 최근 동기화에서 CV에 다음 변경이 있었습니다:",
    dgAdded: "신규 {n}건:",
    dgReview: "검토 대기 {n}건",
    dgRemoved: "소스에서 사라진 항목 {n}건",
    dgMore: "…외 {n}건",
    dgCta: "편집기에서 확인하고 정리하세요:",
    dgUnsub: "이 이메일 수신 중지(원클릭):",
  },
  "ru-RU": {
    dgSubject: "SigmaCV: {n} обновлений в вашем CV",
    dgGreeting: "Здравствуйте!",
    dgIntro:
      "Ваше живое CV получило изменения при последней синхронизации с открытыми источниками:",
    dgAdded: "{n} новых записей:",
    dgReview: "{n} записей ждут вашей проверки",
    dgRemoved: "{n} записей больше нет в источниках",
    dgMore: "…и ещё {n}",
    dgCta: "Проверьте их в редакторе:",
    dgUnsub: "Отписаться от этих писем (в один клик):",
  },
};

/** Digest-email strings for a locale (falls back to en-US). */
export function digestEmail(locale: string): DigestEmailStrings {
  return DIGEST_EMAIL[asLocale(locale)];
}
