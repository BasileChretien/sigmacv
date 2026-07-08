import { asLocale, type Locale } from "./index";

/**
 * The expandable "What we access — and what we never do" trust disclosure, shown
 * as a native <details> under the ORCID sign-in trust line in `components/
 * Landing.tsx`. Elevates the one-line `orcidTrust` into the concrete, verifiable
 * facts that answer the recurring "a tool that wants my ORCID?" hesitation.
 *
 * Every claim here is enforced in code: the ORCID provider requests only the
 * `openid` scope (auth.config.ts) and the access token is dropped after sign-in,
 * never persisted (auth.ts). Keep this copy in sync if that ever changes.
 *
 * Own module (same convention as orcidHelp.ts). Typed Record<Locale,
 * OrcidTrustDetails> so a missing locale/field is a compile error. Non-English
 * copy was machine-drafted and is flagged for native review.
 *
 * "ORCID", "SigmaCV", "openid" and "Apache-2.0" are brand/technical proper nouns —
 * never translated (pinned by the i18n brand-noun test).
 */
export interface OrcidTrustDetails {
  /** Always-visible <summary>. */
  summary: string;
  /** Read-only + minimal scope + never writes back. */
  access: string;
  /** No password reaches us; token discarded, not stored. */
  credentials: string;
  /** Open-source + not-for-profit + export/delete anytime. */
  open: string;
  /** Link label to the privacy notice. */
  privacyCta: string;
}

const ORCID_TRUST_DETAILS_I18N: Record<Locale, OrcidTrustDetails> = {
  "en-US": {
    summary: "What we access — and what we never do",
    access:
      "Read-only. We request the minimal openid scope — your ORCID iD and public record — and never write anything back to ORCID.",
    credentials:
      "No password reaches us: you sign in through ORCID, and your sign-in token is discarded right after — never stored in our database.",
    open: "Open-source (Apache-2.0) and not-for-profit. Audit the code, and export or delete your data anytime.",
    privacyCta: "Read our privacy notice",
  },
  "zh-CN": {
    summary: "我们会访问什么——以及我们绝不会做什么",
    access:
      "只读访问。我们仅申请最小的 openid 权限——您的 ORCID iD 和公开记录——绝不向 ORCID 写回任何内容。",
    credentials:
      "我们不会接触您的密码：您通过 ORCID 登录，登录令牌在登录后立即被丢弃——绝不存入我们的数据库。",
    open: "开源（Apache-2.0）且非营利。代码可供审计，您可随时导出或删除您的数据。",
    privacyCta: "阅读我们的隐私声明",
  },
  "es-ES": {
    summary: "A qué accedemos y qué no hacemos nunca",
    access:
      "Solo lectura. Solicitamos el permiso mínimo openid —tu iD ORCID y tu registro público— y nunca escribimos nada en ORCID.",
    credentials:
      "No recibimos tu contraseña: inicias sesión a través de ORCID y tu token de sesión se descarta justo después, nunca se almacena en nuestra base de datos.",
    open: "Código abierto (Apache-2.0) y sin ánimo de lucro. Audita el código y exporta o elimina tus datos cuando quieras.",
    privacyCta: "Lee nuestro aviso de privacidad",
  },
  "fr-FR": {
    summary: "Ce à quoi nous accédons — et ce que nous ne faisons jamais",
    access:
      "Lecture seule. Nous demandons la portée minimale openid — votre iD ORCID et votre dossier public — et n'écrivons jamais rien dans ORCID.",
    credentials:
      "Aucun mot de passe ne nous parvient : vous vous connectez via ORCID, et votre jeton de connexion est supprimé juste après — jamais stocké dans notre base de données.",
    open: "Open source (Apache-2.0) et à but non lucratif. Auditez le code, et exportez ou supprimez vos données à tout moment.",
    privacyCta: "Lire notre politique de confidentialité",
  },
  "de-DE": {
    summary: "Worauf wir zugreifen – und was wir niemals tun",
    access:
      "Nur Lesezugriff. Wir fordern den minimalen openid-Scope an – Ihre ORCID iD und Ihren öffentlichen Datensatz – und schreiben nie etwas an ORCID zurück.",
    credentials:
      "Kein Passwort erreicht uns: Sie melden sich über ORCID an, und Ihr Anmelde-Token wird direkt danach verworfen – nie in unserer Datenbank gespeichert.",
    open: "Open Source (Apache-2.0) und gemeinnützig. Prüfen Sie den Code und exportieren oder löschen Sie Ihre Daten jederzeit.",
    privacyCta: "Datenschutzhinweis lesen",
  },
  "ja-JP": {
    summary: "アクセスする範囲——そして決して行わないこと",
    access:
      "読み取り専用です。最小限の openid スコープ（あなたの ORCID iD と公開記録）のみを要求し、ORCID に何かを書き戻すことは一切ありません。",
    credentials:
      "パスワードが当方に届くことはありません。ログインは ORCID を通じて行われ、ログイントークンは直後に破棄され、データベースに保存されることはありません。",
    open: "オープンソース（Apache-2.0）かつ非営利です。コードを検証でき、データはいつでもエクスポートまたは削除できます。",
    privacyCta: "プライバシーに関する通知を読む",
  },
  "pt-BR": {
    summary: "O que acessamos — e o que nunca fazemos",
    access:
      "Somente leitura. Solicitamos o escopo mínimo openid — seu iD ORCID e seu registro público — e nunca escrevemos nada de volta no ORCID.",
    credentials:
      "Nenhuma senha chega até nós: você entra pelo ORCID, e seu token de sessão é descartado logo em seguida — nunca armazenado em nosso banco de dados.",
    open: "Código aberto (Apache-2.0) e sem fins lucrativos. Audite o código e exporte ou exclua seus dados quando quiser.",
    privacyCta: "Leia nosso aviso de privacidade",
  },
  "it-IT": {
    summary: "A cosa accediamo — e cosa non facciamo mai",
    access:
      "Sola lettura. Richiediamo l'ambito minimo openid — il tuo iD ORCID e il tuo record pubblico — e non scriviamo mai nulla su ORCID.",
    credentials:
      "Nessuna password ci raggiunge: accedi tramite ORCID e il tuo token di accesso viene scartato subito dopo — mai memorizzato nel nostro database.",
    open: "Open source (Apache-2.0) e senza scopo di lucro. Controlla il codice ed esporta o elimina i tuoi dati quando vuoi.",
    privacyCta: "Leggi la nostra informativa sulla privacy",
  },
  "ko-KR": {
    summary: "무엇에 접근하는지 — 그리고 절대 하지 않는 것",
    access:
      "읽기 전용입니다. 최소한의 openid 범위(회원님의 ORCID iD와 공개 기록)만 요청하며, ORCID에 어떤 내용도 다시 기록하지 않습니다.",
    credentials:
      "비밀번호는 저희에게 전달되지 않습니다. 로그인은 ORCID를 통해 이루어지며, 로그인 토큰은 직후에 폐기되어 데이터베이스에 저장되지 않습니다.",
    open: "오픈소스(Apache-2.0)이며 비영리입니다. 코드를 감사할 수 있고, 데이터는 언제든지 내보내거나 삭제할 수 있습니다.",
    privacyCta: "개인정보 처리방침 읽기",
  },
  "ru-RU": {
    summary: "К чему мы получаем доступ — и чего никогда не делаем",
    access:
      "Только чтение. Мы запрашиваем минимальную область openid — ваш ORCID iD и публичную запись — и никогда ничего не записываем обратно в ORCID.",
    credentials:
      "Пароль до нас не доходит: вход выполняется через ORCID, а токен входа удаляется сразу после — он никогда не хранится в нашей базе данных.",
    open: "Открытый исходный код (Apache-2.0) и некоммерческий проект. Проверяйте код и экспортируйте или удаляйте свои данные в любой момент.",
    privacyCta: "Читать наше уведомление о конфиденциальности",
  },
};

/** ORCID trust-disclosure copy for a locale (falls back to English). */
export function orcidTrustDetails(locale: string): OrcidTrustDetails {
  return ORCID_TRUST_DETAILS_I18N[asLocale(locale)];
}
