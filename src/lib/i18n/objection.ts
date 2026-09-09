import { asLocale, type Locale } from "./index";

/**
 * Copy for the self-service objection route (`/object`): a researcher who never
 * used SigmaCV can stop the no-login preview of their ORCID iD by verifying the
 * iD at ORCID once — no account is created, no session is kept. Also the
 * signed-in account toggle for the same setting. Ten locales, typed so a
 * missing translation is a compile error. Proper nouns (SigmaCV, ORCID) and
 * the privacy address stay untranslated.
 */
export interface ObjectionStrings {
  metaTitle: string;
  heading: string;
  intro: string;
  whatHeading: string;
  what1: string;
  what2: string;
  what3: string;
  /** The single, explicit consent action: verify at ORCID and hide the preview. */
  cta: string;
  ctaNote: string;
  emailFallback: string;
  doneSuppressedHeading: string;
  doneSuppressedBody: string;
  doneFailedHeading: string;
  doneFailedBody: string;
  doneUnavailableHeading: string;
  doneUnavailableBody: string;
  tryAgain: string;
  /** Account-settings toggle for signed-in users (same setting, no OAuth round trip). */
  accountToggle: string;
  accountToggleHint: string;
  accountToggleError: string;
  back: string;
}

const OBJECTION_I18N: Record<Locale, ObjectionStrings> = {
  "en-US": {
    metaTitle: "Object to the automatic preview",
    heading: "Don't want an automatic preview of your record?",
    intro:
      "Anyone can enter an ORCID iD on SigmaCV and see a CV assembled from open sources, without an account. If that iD is yours and you would rather it were not shown, you can object here. You need no account: you verify that the iD is yours by signing in at ORCID once, and SigmaCV creates no account and keeps no session.",
    whatHeading: "What objecting does",
    what1:
      "The automatic preview of your iD is answered as if no public record existed, from your next visit onwards.",
    what2:
      "SigmaCV stores only a keyed hash of your iD, never the iD itself, and does not tell visitors that you objected.",
    what3:
      "It does not touch a page you published yourself: if you later sign in and publish, that page is yours to manage. Signed-in users can switch the automatic preview back on from their account settings.",
    cta: "Verify my ORCID iD and hide my preview",
    ctaNote:
      "You will be sent to orcid.org to sign in, then straight back here. Nothing is stored unless the verification succeeds.",
    emailFallback:
      "Prefer email? Write to privacy@sigmacv.org with your ORCID iD; we honour objections within 30 days.",
    doneSuppressedHeading: "Your preview is hidden",
    doneSuppressedBody:
      "From now on, the automatic preview of your ORCID iD is answered as if no public record existed. SigmaCV created no account. To show it again, sign in and switch it back on in your account settings, or email privacy@sigmacv.org.",
    doneFailedHeading: "We couldn't record your objection",
    doneFailedBody:
      "The verification at ORCID did not complete, or the iD could not be read. Nothing was stored. You can try again, or email privacy@sigmacv.org with your ORCID iD.",
    doneUnavailableHeading: "Objections are not available on this instance yet",
    doneUnavailableBody:
      "This SigmaCV instance has no objection key configured. Email privacy@sigmacv.org with your ORCID iD and we will exclude it by hand.",
    tryAgain: "Try again",
    accountToggle: "Do not show an automatic preview of my record",
    accountToggleHint:
      "Hides the no-login preview of your ORCID iD (answered as if no public record existed). Your published page, if any, is unaffected.",
    accountToggleError: "Couldn't update the preview setting. Please try again.",
    back: "Back to SigmaCV",
  },
  "zh-CN": {
    metaTitle: "对自动预览提出反对",
    heading: "不希望显示您记录的自动预览？",
    intro:
      "任何人都可以在 SigmaCV 输入 ORCID iD，无需账户即可查看依据公开数据源生成的简历。如果该 iD 属于您，而您不希望它被显示，可以在此提出反对。您无需账户：只需在 ORCID 登录一次以核实该 iD 属于您，SigmaCV 不会创建账户，也不会保留会话。",
    whatHeading: "反对的效果",
    what1: "从您下次访问起，您 iD 的自动预览将按“不存在公开记录”处理。",
    what2: "SigmaCV 只存储您 iD 的带密钥哈希值，绝不存储 iD 本身，也不会告知访客您提出了反对。",
    what3:
      "这不会影响您自己发布的页面：如果您日后登录并发布，该页面由您自行管理。已登录用户可以在账户设置中重新开启自动预览。",
    cta: "核实我的 ORCID iD 并隐藏我的预览",
    ctaNote: "您将被转到 orcid.org 登录，随后直接返回此处。除非核实成功，否则不会存储任何内容。",
    emailFallback:
      "更愿意使用电子邮件？请将您的 ORCID iD 发送至 privacy@sigmacv.org，我们将在 30 天内处理您的反对。",
    doneSuppressedHeading: "您的预览已隐藏",
    doneSuppressedBody:
      "从现在起，您 ORCID iD 的自动预览将按“不存在公开记录”处理。SigmaCV 未创建任何账户。若要重新显示，请登录并在账户设置中重新开启，或发送邮件至 privacy@sigmacv.org。",
    doneFailedHeading: "我们无法记录您的反对",
    doneFailedBody:
      "ORCID 的核实未完成，或无法读取 iD。未存储任何内容。您可以重试，或将您的 ORCID iD 发送至 privacy@sigmacv.org。",
    doneUnavailableHeading: "此实例暂不支持反对功能",
    doneUnavailableBody:
      "此 SigmaCV 实例尚未配置反对密钥。请将您的 ORCID iD 发送至 privacy@sigmacv.org，我们将手动排除。",
    tryAgain: "重试",
    accountToggle: "不显示我记录的自动预览",
    accountToggleHint:
      "隐藏您 ORCID iD 的免登录预览（按“不存在公开记录”处理）。您已发布的页面（如有）不受影响。",
    accountToggleError: "无法更新预览设置。请重试。",
    back: "返回 SigmaCV",
  },
  "es-ES": {
    metaTitle: "Oponerse a la vista previa automática",
    heading: "¿No quieres una vista previa automática de tu registro?",
    intro:
      "Cualquiera puede introducir un ORCID iD en SigmaCV y ver un CV generado a partir de fuentes abiertas, sin cuenta. Si ese iD es tuyo y prefieres que no se muestre, puedes oponerte aquí. No necesitas cuenta: verificas que el iD es tuyo iniciando sesión en ORCID una vez, y SigmaCV no crea ninguna cuenta ni conserva ninguna sesión.",
    whatHeading: "Qué hace la oposición",
    what1:
      "La vista previa automática de tu iD se responde como si no existiera ningún registro público, desde tu próxima visita.",
    what2:
      "SigmaCV almacena solo un hash con clave de tu iD, nunca el iD en sí, y no comunica a los visitantes que te has opuesto.",
    what3:
      "No afecta a una página que hayas publicado tú: si más adelante inicias sesión y publicas, esa página la gestionas tú. Los usuarios con sesión iniciada pueden volver a activar la vista previa automática desde los ajustes de su cuenta.",
    cta: "Verificar mi ORCID iD y ocultar mi vista previa",
    ctaNote:
      "Se te enviará a orcid.org para iniciar sesión y volverás directamente aquí. No se almacena nada a menos que la verificación se complete.",
    emailFallback:
      "¿Prefieres el correo? Escribe a privacy@sigmacv.org con tu ORCID iD; atendemos las oposiciones en un plazo de 30 días.",
    doneSuppressedHeading: "Tu vista previa está oculta",
    doneSuppressedBody:
      "A partir de ahora, la vista previa automática de tu ORCID iD se responde como si no existiera ningún registro público. SigmaCV no ha creado ninguna cuenta. Para volver a mostrarla, inicia sesión y actívala en los ajustes de tu cuenta, o escribe a privacy@sigmacv.org.",
    doneFailedHeading: "No hemos podido registrar tu oposición",
    doneFailedBody:
      "La verificación en ORCID no se completó, o no se pudo leer el iD. No se ha almacenado nada. Puedes intentarlo de nuevo o escribir a privacy@sigmacv.org con tu ORCID iD.",
    doneUnavailableHeading: "Las oposiciones aún no están disponibles en esta instancia",
    doneUnavailableBody:
      "Esta instancia de SigmaCV no tiene configurada una clave de oposición. Escribe a privacy@sigmacv.org con tu ORCID iD y lo excluiremos manualmente.",
    tryAgain: "Intentar de nuevo",
    accountToggle: "No mostrar una vista previa automática de mi registro",
    accountToggleHint:
      "Oculta la vista previa sin sesión de tu ORCID iD (se responde como si no existiera ningún registro público). Tu página publicada, si la tienes, no se ve afectada.",
    accountToggleError: "No se pudo actualizar el ajuste de la vista previa. Inténtalo de nuevo.",
    back: "Volver a SigmaCV",
  },
  "fr-FR": {
    metaTitle: "S'opposer à l'aperçu automatique",
    heading: "Vous ne souhaitez pas d'aperçu automatique de votre notice ?",
    intro:
      "Toute personne peut saisir un ORCID iD sur SigmaCV et voir un CV assemblé à partir de sources ouvertes, sans compte. Si cet iD est le vôtre et que vous préférez qu'il ne soit pas affiché, vous pouvez vous y opposer ici. Aucun compte n'est nécessaire : vous vérifiez que l'iD est le vôtre en vous connectant une fois chez ORCID, et SigmaCV ne crée aucun compte et ne conserve aucune session.",
    whatHeading: "Ce que fait l'opposition",
    what1:
      "L'aperçu automatique de votre iD est traité comme s'il n'existait aucune notice publique, dès votre prochaine visite.",
    what2:
      "SigmaCV ne conserve qu'une empreinte à clé de votre iD, jamais l'iD lui-même, et n'indique pas aux visiteurs que vous vous êtes opposé.",
    what3:
      "Cela ne touche pas une page que vous auriez publiée vous-même : si vous vous connectez plus tard et publiez, cette page vous appartient. Les utilisateurs connectés peuvent réactiver l'aperçu automatique depuis les réglages de leur compte.",
    cta: "Vérifier mon ORCID iD et masquer mon aperçu",
    ctaNote:
      "Vous serez dirigé vers orcid.org pour vous connecter, puis ramené directement ici. Rien n'est enregistré tant que la vérification n'a pas abouti.",
    emailFallback:
      "Vous préférez l'e-mail ? Écrivez à privacy@sigmacv.org avec votre ORCID iD ; nous traitons les oppositions sous 30 jours.",
    doneSuppressedHeading: "Votre aperçu est masqué",
    doneSuppressedBody:
      "Désormais, l'aperçu automatique de votre ORCID iD est traité comme s'il n'existait aucune notice publique. SigmaCV n'a créé aucun compte. Pour l'afficher de nouveau, connectez-vous et réactivez-le dans les réglages de votre compte, ou écrivez à privacy@sigmacv.org.",
    doneFailedHeading: "Nous n'avons pas pu enregistrer votre opposition",
    doneFailedBody:
      "La vérification chez ORCID n'a pas abouti, ou l'iD n'a pas pu être lu. Rien n'a été enregistré. Vous pouvez réessayer, ou écrire à privacy@sigmacv.org avec votre ORCID iD.",
    doneUnavailableHeading: "Les oppositions ne sont pas encore disponibles sur cette instance",
    doneUnavailableBody:
      "Cette instance de SigmaCV n'a pas de clé d'opposition configurée. Écrivez à privacy@sigmacv.org avec votre ORCID iD et nous l'exclurons manuellement.",
    tryAgain: "Réessayer",
    accountToggle: "Ne pas afficher d'aperçu automatique de ma notice",
    accountToggleHint:
      "Masque l'aperçu sans connexion de votre ORCID iD (traité comme s'il n'existait aucune notice publique). Votre page publiée, le cas échéant, n'est pas concernée.",
    accountToggleError: "Impossible de mettre à jour ce réglage. Veuillez réessayer.",
    back: "Retour à SigmaCV",
  },
  "de-DE": {
    metaTitle: "Der automatischen Vorschau widersprechen",
    heading: "Sie möchten keine automatische Vorschau Ihres Nachweises?",
    intro:
      "Jede Person kann auf SigmaCV eine ORCID iD eingeben und ohne Konto einen aus offenen Quellen zusammengestellten Lebenslauf sehen. Ist diese iD Ihre und möchten Sie sie nicht angezeigt sehen, können Sie hier widersprechen. Ein Konto ist nicht nötig: Sie weisen einmal durch Anmeldung bei ORCID nach, dass die iD Ihre ist; SigmaCV legt kein Konto an und behält keine Sitzung.",
    whatHeading: "Was der Widerspruch bewirkt",
    what1:
      "Die automatische Vorschau Ihrer iD wird ab Ihrem nächsten Besuch so beantwortet, als gäbe es keinen öffentlichen Nachweis.",
    what2:
      "SigmaCV speichert nur einen schlüsselgebundenen Hash Ihrer iD, nie die iD selbst, und teilt Besuchenden nicht mit, dass Sie widersprochen haben.",
    what3:
      "Eine von Ihnen selbst veröffentlichte Seite bleibt unberührt: Wenn Sie sich später anmelden und veröffentlichen, verwalten Sie diese Seite selbst. Angemeldete Nutzende können die automatische Vorschau in den Kontoeinstellungen wieder einschalten.",
    cta: "Meine ORCID iD bestätigen und meine Vorschau verbergen",
    ctaNote:
      "Sie werden zur Anmeldung zu orcid.org geleitet und danach direkt hierher zurück. Nichts wird gespeichert, solange die Bestätigung nicht gelingt.",
    emailFallback:
      "Lieber per E-Mail? Schreiben Sie mit Ihrer ORCID iD an privacy@sigmacv.org; wir setzen Widersprüche innerhalb von 30 Tagen um.",
    doneSuppressedHeading: "Ihre Vorschau ist verborgen",
    doneSuppressedBody:
      "Ab jetzt wird die automatische Vorschau Ihrer ORCID iD so beantwortet, als gäbe es keinen öffentlichen Nachweis. SigmaCV hat kein Konto angelegt. Um sie wieder anzuzeigen, melden Sie sich an und schalten Sie sie in den Kontoeinstellungen wieder ein, oder schreiben Sie an privacy@sigmacv.org.",
    doneFailedHeading: "Wir konnten Ihren Widerspruch nicht erfassen",
    doneFailedBody:
      "Die Bestätigung bei ORCID wurde nicht abgeschlossen, oder die iD konnte nicht gelesen werden. Nichts wurde gespeichert. Sie können es erneut versuchen oder mit Ihrer ORCID iD an privacy@sigmacv.org schreiben.",
    doneUnavailableHeading: "Widersprüche sind auf dieser Instanz noch nicht verfügbar",
    doneUnavailableBody:
      "Für diese SigmaCV-Instanz ist kein Widerspruchsschlüssel konfiguriert. Schreiben Sie mit Ihrer ORCID iD an privacy@sigmacv.org, und wir schließen sie von Hand aus.",
    tryAgain: "Erneut versuchen",
    accountToggle: "Keine automatische Vorschau meines Nachweises anzeigen",
    accountToggleHint:
      "Verbirgt die Vorschau ohne Anmeldung für Ihre ORCID iD (beantwortet, als gäbe es keinen öffentlichen Nachweis). Eine von Ihnen veröffentlichte Seite ist nicht betroffen.",
    accountToggleError:
      "Die Einstellung konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.",
    back: "Zurück zu SigmaCV",
  },
  "ja-JP": {
    metaTitle: "自動プレビューへの異議申し立て",
    heading: "ご自身の記録の自動プレビューを表示したくない場合",
    intro:
      "誰でも SigmaCV で ORCID iD を入力すれば、アカウントなしで公開ソースから組み立てた CV を見ることができます。その iD がご自身のもので、表示されたくない場合は、ここで異議を申し立てることができます。アカウントは不要です。ORCID に一度ログインしてその iD がご自身のものであることを確認するだけで、SigmaCV はアカウントを作成せず、セッションも保持しません。",
    whatHeading: "異議申し立てによって起こること",
    what1: "次回のアクセス以降、ご自身の iD の自動プレビューは「公開記録なし」として扱われます。",
    what2:
      "SigmaCV は iD そのものではなく、鍵付きハッシュのみを保存し、異議があったことを訪問者に知らせることもありません。",
    what3:
      "ご自身で公開したページには影響しません。後でログインして公開すれば、そのページはご自身で管理できます。ログイン済みのユーザーはアカウント設定から自動プレビューを再び有効にできます。",
    cta: "ORCID iD を確認してプレビューを非表示にする",
    ctaNote:
      "orcid.org に移動してログインした後、すぐにこのページに戻ります。確認が完了しない限り、何も保存されません。",
    emailFallback:
      "メールをご希望の場合は、ORCID iD を添えて privacy@sigmacv.org までご連絡ください。異議には 30 日以内に対応します。",
    doneSuppressedHeading: "プレビューを非表示にしました",
    doneSuppressedBody:
      "今後、ご自身の ORCID iD の自動プレビューは「公開記録なし」として扱われます。SigmaCV はアカウントを作成していません。再び表示するには、ログインしてアカウント設定で有効に戻すか、privacy@sigmacv.org までご連絡ください。",
    doneFailedHeading: "異議を記録できませんでした",
    doneFailedBody:
      "ORCID での確認が完了しなかったか、iD を読み取れませんでした。何も保存されていません。もう一度お試しいただくか、ORCID iD を添えて privacy@sigmacv.org までご連絡ください。",
    doneUnavailableHeading: "このインスタンスでは異議申し立てはまだ利用できません",
    doneUnavailableBody:
      "この SigmaCV インスタンスには異議申し立て用の鍵が設定されていません。ORCID iD を添えて privacy@sigmacv.org までご連絡いただければ、手動で除外します。",
    tryAgain: "もう一度試す",
    accountToggle: "自分の記録の自動プレビューを表示しない",
    accountToggleHint:
      "ご自身の ORCID iD のログイン不要プレビューを非表示にします（「公開記録なし」として扱われます）。公開済みのページがある場合、そちらには影響しません。",
    accountToggleError: "プレビュー設定を更新できませんでした。もう一度お試しください。",
    back: "SigmaCV に戻る",
  },
  "pt-BR": {
    metaTitle: "Opor-se à prévia automática",
    heading: "Não quer uma prévia automática do seu registro?",
    intro:
      "Qualquer pessoa pode digitar um ORCID iD no SigmaCV e ver um CV montado a partir de fontes abertas, sem conta. Se esse iD for seu e você preferir que não seja exibido, pode se opor aqui. Não é preciso ter conta: você confirma que o iD é seu fazendo login no ORCID uma vez, e o SigmaCV não cria conta nem mantém sessão.",
    whatHeading: "O que a oposição faz",
    what1:
      "A prévia automática do seu iD passa a ser respondida como se não existisse registro público, a partir da sua próxima visita.",
    what2:
      "O SigmaCV armazena apenas um hash com chave do seu iD, nunca o iD em si, e não informa aos visitantes que você se opôs.",
    what3:
      "Não afeta uma página que você mesmo publicou: se mais tarde você fizer login e publicar, essa página é sua para gerenciar. Usuários com login podem reativar a prévia automática nas configurações da conta.",
    cta: "Confirmar meu ORCID iD e ocultar minha prévia",
    ctaNote:
      "Você será levado ao orcid.org para fazer login e voltará direto para cá. Nada é armazenado a menos que a confirmação seja concluída.",
    emailFallback:
      "Prefere e-mail? Escreva para privacy@sigmacv.org com o seu ORCID iD; atendemos oposições em até 30 dias.",
    doneSuppressedHeading: "Sua prévia está oculta",
    doneSuppressedBody:
      "A partir de agora, a prévia automática do seu ORCID iD é respondida como se não existisse registro público. O SigmaCV não criou nenhuma conta. Para exibi-la novamente, faça login e reative-a nas configurações da conta, ou escreva para privacy@sigmacv.org.",
    doneFailedHeading: "Não conseguimos registrar sua oposição",
    doneFailedBody:
      "A confirmação no ORCID não foi concluída, ou o iD não pôde ser lido. Nada foi armazenado. Você pode tentar de novo ou escrever para privacy@sigmacv.org com o seu ORCID iD.",
    doneUnavailableHeading: "Oposições ainda não estão disponíveis nesta instância",
    doneUnavailableBody:
      "Esta instância do SigmaCV não tem uma chave de oposição configurada. Escreva para privacy@sigmacv.org com o seu ORCID iD e faremos a exclusão manualmente.",
    tryAgain: "Tentar de novo",
    accountToggle: "Não mostrar uma prévia automática do meu registro",
    accountToggleHint:
      "Oculta a prévia sem login do seu ORCID iD (respondida como se não existisse registro público). Sua página publicada, se houver, não é afetada.",
    accountToggleError: "Não foi possível atualizar a configuração da prévia. Tente de novo.",
    back: "Voltar ao SigmaCV",
  },
  "it-IT": {
    metaTitle: "Opporsi all'anteprima automatica",
    heading: "Non vuoi un'anteprima automatica della tua registrazione?",
    intro:
      "Chiunque può inserire un ORCID iD su SigmaCV e vedere un CV assemblato da fonti aperte, senza account. Se quell'iD è tuo e preferisci che non venga mostrato, puoi opporti qui. Non serve un account: verifichi che l'iD è tuo accedendo una volta su ORCID, e SigmaCV non crea alcun account né conserva alcuna sessione.",
    whatHeading: "Cosa fa l'opposizione",
    what1:
      "L'anteprima automatica del tuo iD viene trattata come se non esistesse alcuna registrazione pubblica, dalla tua prossima visita.",
    what2:
      "SigmaCV conserva solo un hash con chiave del tuo iD, mai l'iD stesso, e non comunica ai visitatori che ti sei opposto.",
    what3:
      "Non tocca una pagina che hai pubblicato tu: se in seguito accedi e pubblichi, quella pagina la gestisci tu. Gli utenti con accesso possono riattivare l'anteprima automatica dalle impostazioni dell'account.",
    cta: "Verifica il mio ORCID iD e nascondi la mia anteprima",
    ctaNote:
      "Verrai inviato a orcid.org per accedere e poi riportato direttamente qui. Non viene memorizzato nulla finché la verifica non va a buon fine.",
    emailFallback:
      "Preferisci l'e-mail? Scrivi a privacy@sigmacv.org con il tuo ORCID iD; diamo seguito alle opposizioni entro 30 giorni.",
    doneSuppressedHeading: "La tua anteprima è nascosta",
    doneSuppressedBody:
      "D'ora in poi l'anteprima automatica del tuo ORCID iD viene trattata come se non esistesse alcuna registrazione pubblica. SigmaCV non ha creato alcun account. Per mostrarla di nuovo, accedi e riattivala nelle impostazioni dell'account, oppure scrivi a privacy@sigmacv.org.",
    doneFailedHeading: "Non siamo riusciti a registrare la tua opposizione",
    doneFailedBody:
      "La verifica su ORCID non è stata completata, o l'iD non è stato letto. Non è stato memorizzato nulla. Puoi riprovare, oppure scrivere a privacy@sigmacv.org con il tuo ORCID iD.",
    doneUnavailableHeading: "Le opposizioni non sono ancora disponibili su questa istanza",
    doneUnavailableBody:
      "Questa istanza di SigmaCV non ha una chiave di opposizione configurata. Scrivi a privacy@sigmacv.org con il tuo ORCID iD e lo escluderemo manualmente.",
    tryAgain: "Riprova",
    accountToggle: "Non mostrare un'anteprima automatica della mia registrazione",
    accountToggleHint:
      "Nasconde l'anteprima senza accesso del tuo ORCID iD (trattata come se non esistesse alcuna registrazione pubblica). La tua pagina pubblicata, se presente, non è interessata.",
    accountToggleError: "Impossibile aggiornare l'impostazione dell'anteprima. Riprova.",
    back: "Torna a SigmaCV",
  },
  "ko-KR": {
    metaTitle: "자동 미리보기에 대한 이의 제기",
    heading: "본인 기록의 자동 미리보기를 원하지 않으십니까?",
    intro:
      "누구나 SigmaCV에 ORCID iD를 입력하면 계정 없이 공개 소스로 구성된 CV를 볼 수 있습니다. 그 iD가 본인의 것이고 표시되기를 원하지 않는다면 여기에서 이의를 제기할 수 있습니다. 계정은 필요 없습니다. ORCID에 한 번 로그인하여 iD가 본인의 것임을 확인하기만 하면 되며, SigmaCV는 계정을 만들지도, 세션을 유지하지도 않습니다.",
    whatHeading: "이의 제기의 효과",
    what1: "다음 방문부터 본인 iD의 자동 미리보기는 공개 기록이 없는 것처럼 처리됩니다.",
    what2:
      "SigmaCV는 iD 자체가 아니라 키가 적용된 해시만 저장하며, 이의를 제기했다는 사실을 방문자에게 알리지 않습니다.",
    what3:
      "본인이 직접 게시한 페이지에는 영향을 주지 않습니다. 나중에 로그인하여 게시하면 그 페이지는 본인이 관리합니다. 로그인한 사용자는 계정 설정에서 자동 미리보기를 다시 켤 수 있습니다.",
    cta: "내 ORCID iD를 확인하고 미리보기 숨기기",
    ctaNote:
      "orcid.org로 이동하여 로그인한 뒤 바로 이곳으로 돌아옵니다. 확인이 완료되지 않으면 아무것도 저장되지 않습니다.",
    emailFallback:
      "이메일을 선호하십니까? ORCID iD를 첨부하여 privacy@sigmacv.org로 보내 주십시오. 이의는 30일 이내에 처리합니다.",
    doneSuppressedHeading: "미리보기가 숨겨졌습니다",
    doneSuppressedBody:
      "이제부터 본인 ORCID iD의 자동 미리보기는 공개 기록이 없는 것처럼 처리됩니다. SigmaCV는 계정을 만들지 않았습니다. 다시 표시하려면 로그인하여 계정 설정에서 다시 켜거나 privacy@sigmacv.org로 이메일을 보내 주십시오.",
    doneFailedHeading: "이의를 기록하지 못했습니다",
    doneFailedBody:
      "ORCID 확인이 완료되지 않았거나 iD를 읽을 수 없었습니다. 아무것도 저장되지 않았습니다. 다시 시도하거나 ORCID iD를 첨부하여 privacy@sigmacv.org로 보내 주십시오.",
    doneUnavailableHeading: "이 인스턴스에서는 아직 이의 제기를 이용할 수 없습니다",
    doneUnavailableBody:
      "이 SigmaCV 인스턴스에는 이의 제기 키가 설정되어 있지 않습니다. ORCID iD를 첨부하여 privacy@sigmacv.org로 보내 주시면 수동으로 제외하겠습니다.",
    tryAgain: "다시 시도",
    accountToggle: "내 기록의 자동 미리보기를 표시하지 않음",
    accountToggleHint:
      "본인 ORCID iD의 로그인 없는 미리보기를 숨깁니다(공개 기록이 없는 것처럼 처리). 게시된 페이지가 있다면 영향을 받지 않습니다.",
    accountToggleError: "미리보기 설정을 업데이트하지 못했습니다. 다시 시도해 주십시오.",
    back: "SigmaCV로 돌아가기",
  },
  "ru-RU": {
    metaTitle: "Возразить против автоматического предпросмотра",
    heading: "Не хотите автоматического предпросмотра вашей записи?",
    intro:
      "Любой может ввести ORCID iD на SigmaCV и без учётной записи увидеть CV, собранное из открытых источников. Если этот iD ваш и вы не хотите, чтобы его показывали, вы можете возразить здесь. Учётная запись не нужна: вы один раз входите на ORCID, подтверждая, что iD ваш, а SigmaCV не создаёт учётную запись и не сохраняет сеанс.",
    whatHeading: "Что даёт возражение",
    what1:
      "Автоматический предпросмотр вашего iD со следующего посещения обрабатывается так, будто открытой записи не существует.",
    what2:
      "SigmaCV хранит только хеш вашего iD с ключом, никогда сам iD, и не сообщает посетителям о вашем возражении.",
    what3:
      "Это не затрагивает страницу, которую вы опубликовали сами: если позже вы войдёте и опубликуете её, она останется под вашим управлением. Вошедшие пользователи могут снова включить автоматический предпросмотр в настройках учётной записи.",
    cta: "Подтвердить мой ORCID iD и скрыть мой предпросмотр",
    ctaNote:
      "Вас направят на orcid.org для входа, а затем сразу вернут сюда. Ничего не сохраняется, пока подтверждение не завершится успешно.",
    emailFallback:
      "Предпочитаете электронную почту? Напишите на privacy@sigmacv.org с указанием вашего ORCID iD; возражения мы выполняем в течение 30 дней.",
    doneSuppressedHeading: "Ваш предпросмотр скрыт",
    doneSuppressedBody:
      "Отныне автоматический предпросмотр вашего ORCID iD обрабатывается так, будто открытой записи не существует. SigmaCV не создал учётную запись. Чтобы снова показывать его, войдите и включите его в настройках учётной записи или напишите на privacy@sigmacv.org.",
    doneFailedHeading: "Нам не удалось зарегистрировать ваше возражение",
    doneFailedBody:
      "Подтверждение на ORCID не завершилось, или iD не удалось прочитать. Ничего не сохранено. Попробуйте ещё раз или напишите на privacy@sigmacv.org с указанием вашего ORCID iD.",
    doneUnavailableHeading: "Возражения на этом экземпляре пока недоступны",
    doneUnavailableBody:
      "На этом экземпляре SigmaCV не настроен ключ для возражений. Напишите на privacy@sigmacv.org с указанием вашего ORCID iD, и мы исключим его вручную.",
    tryAgain: "Попробовать ещё раз",
    accountToggle: "Не показывать автоматический предпросмотр моей записи",
    accountToggleHint:
      "Скрывает предпросмотр вашего ORCID iD без входа (обрабатывается так, будто открытой записи не существует). Ваша опубликованная страница, если она есть, не затрагивается.",
    accountToggleError: "Не удалось обновить настройку предпросмотра. Попробуйте ещё раз.",
    back: "Вернуться на SigmaCV",
  },
};

/** Objection-route copy for a UI locale (falls back to en-US). */
export function objectionStrings(locale: string): ObjectionStrings {
  return OBJECTION_I18N[asLocale(locale)];
}
