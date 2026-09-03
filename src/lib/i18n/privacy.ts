import { asLocale, type Locale } from "./index";

/**
 * Privacy-notice copy, localized for all 10 supported languages. Typed as
 * Record<Locale, PrivacyStrings> so a missing translation is a compile error.
 * Used by the default `/privacy` and the localized `/[locale]/privacy` routes.
 *
 * This is a GDPR (EU) + APPI (Japan) Article 13-style notice: controller,
 * data processed, purpose & legal basis, the opt-in research use, retention,
 * data-subject rights, and contact. Proper nouns (SigmaCV, OpenAlex, ORCID, …)
 * and the GDPR article references are intentionally kept untranslated.
 */
export interface PrivacyStrings {
  metaTitle: string;
  metaDescription: string;
  heading: string;
  intro: string;
  controllerHeading: string;
  controller: string;
  dataHeading: string;
  data: string;
  purposeHeading: string;
  purpose: string;
  researchHeading: string;
  research: string;
  /** Optional AI drafting assistant: the EU processor + what is (not) sent. */
  aiHeading: string;
  ai: string;
  /** The no-login /preview/[orcid] route, and the one account read it makes. */
  previewHeading: string;
  preview: string;
  retentionHeading: string;
  retention: string;
  rightsHeading: string;
  rights: string;
  contactHeading: string;
  contact: string;
  /** Recipients / processors + international-transfer disclosure. */
  sharingHeading: string;
  sharing: string;
  /** Security measures + cookie disclosure. */
  securityHeading: string;
  security: string;
  /** "English is the authoritative version" note for the multilingual notice. */
  authoritativeNote: string;
  updatedNote: string;
  backLink: string;
}

const PRIVACY_I18N: Record<Locale, PrivacyStrings> = {
  "en-US": {
    previewHeading: "Public ORCID preview",
    preview:
      "Anyone can enter an ORCID iD to see a CV assembled from public research metadata, with no account and no sign-in. That preview is built only from the public sources listed above. If the iD entered belongs to a SigmaCV account holder, we additionally read that person's own disambiguation corrections and apply them: works they marked “not mine” are removed, and the “may not be yours” flag is cleared on works they checked and kept. We read nothing else from their account — not their display choices, private notes, saved layouts or contact details — and this can only ever remove a work or remove a warning, never add anything a visitor would otherwise not see. The purpose is accuracy: automated author matching over-merges researchers with similar names, so honouring someone's own corrections stops a visitor being shown another person's work under their name (GDPR Art. 6(1)(f), legitimate interests, and Art. 5(1)(d), accuracy). If you would rather your corrections were not used this way, email privacy@sigmacv.org and we will exclude your record.",
    aiHeading: "AI drafting assistant (optional)",
    ai: "If you use the optional AI drafting assistant, you supply your OWN AI provider's API key — it is held only in your browser's memory for the session (never saved to your browser or on our servers). When you request a draft, a short, public-only summary of your visible research outputs (the module, output counts and a few titles — no contact details or identifiers) is relayed from our server to the provider YOU chose, under YOUR key, and nothing about the request is stored or logged. Where your data goes and how it is handled is governed by the provider and terms YOU pick, so choose one you're comfortable with (for example an EU provider such as Mistral AI if EU processing matters to you). The feature is off by default, you must explicitly request each draft and accept the on-screen notice, and the result is never added to your CV automatically.",
    metaTitle: "Privacy",
    metaDescription:
      "How SigmaCV handles your personal data: data minimization, identifier-only matching, and research logging only with explicit consent (GDPR + Japan APPI).",
    heading: "Privacy & Data Protection",
    intro:
      "SigmaCV is built on data minimization. It reads only public research metadata, matches your work by identifier (ORCID / OpenAlex ID) — never by name — and logs nothing about your choices unless you explicitly opt in. This notice explains what we process and the rights you have under the EU GDPR and Japan's APPI.",
    controllerHeading: "Data controller",
    controller:
      "SigmaCV is operated by Basile Chrétien (PharmD, MSc, MPH) as an independent personal project — not by, or on behalf of, any university or employer — and he is the sole data controller for the personal data SigmaCV processes. For any privacy question or request, contact him at privacy@sigmacv.org.",
    dataHeading: "What we process",
    data: "Account data from your sign-in provider (ORCID iD, or email / Google account); the public research metadata used to build your CV (publications, grants, affiliations and metrics from OpenAlex, ORCID, Crossref, DataCite and Open Editors Plus); the CV content and display choices you create; and an optional profile photo you upload. Your CV is private unless you choose to publish a public page.",
    purposeHeading: "Purpose & legal basis",
    purpose:
      "We process this data to provide the service you requested — generating and exporting your CV (GDPR Art. 6(1)(b), performance of a contract). Publishing a public CV page happens only on your instruction. We do not sell your data or use it for advertising.",
    researchHeading: "Research use (opt-in only)",
    research:
      "SigmaCV is also a research project on responsible research assessment and author-name disambiguation. Logging of your curation choices for research is OFF by default and happens only with your explicit, separate consent (GDPR Art. 6(1)(a)). You can withdraw at any time from your account; withdrawal stops future logging and erases the research records already collected. Confirmatory analyses are pre-registered and conducted under an ethics/IRB protocol. If the scope of research logging materially changes, we ask for your consent again.",
    retentionHeading: "Retention",
    retention:
      "We keep your account and CV data until you delete your account. Deleting your account removes your profile, CV, and any research records from the live service immediately. Encrypted backups are kept on a rolling schedule and overwritten within 14 days, so a deleted account disappears from them within that window; we do not restore deleted accounts from backup. Published public pages stop being served immediately when you unpublish or delete.",
    rightsHeading: "Your rights",
    rights:
      "You can access and export all your data (a one-click JSON export), correct it in the editor, withdraw research consent, and delete your account and all associated data at any time — directly from the app. Under the GDPR and APPI you also have the right to lodge a complaint with your data-protection authority.",
    contactHeading: "Contact",
    contact:
      "To ask a question or exercise your rights, email the data controller at privacy@sigmacv.org or use the contact page. We aim to reply within 30 days.",
    sharingHeading: "Who receives your data, and where it is stored",
    sharing:
      "We never sell your data or use it for advertising. We share it only to run the service: with our hosting provider in the European Union (Germany), which stores it on our behalf under a data-processing agreement; and, when you sign in or sync, with the public research services we query by your identifier to build your CV (OpenAlex, ORCID, Crossref, DataCite, OpenAIRE, DBLP, ROR and similar), which receive your ORCID iD or name to return your public records and act as independent controllers of that public data. Your account and CV are stored in the EU. Backup copies are also held by the controller in Japan on encrypted storage, and are not shared with anyone else; the controller is based in Japan, and transfers between Japan and the EU are covered by the 2019 Japan–EU mutual adequacy decision. When you opt into email digests or confirm a contact email, we deliver those messages through SMTP2GO, an email-delivery processor based in New Zealand, which receives only your email address and the message content (for digests, the titles of your own public works) to send the email on our behalf; New Zealand is recognised by the EU as ensuring an adequate level of data protection.",
    securityHeading: "Security & cookies",
    security:
      "We protect your data with HTTPS, access controls, and database-backed sessions (sign-in provider access tokens are dropped, not stored); the code has undergone independent security audits, and we minimise what we hold. We use a single strictly-necessary cookie to keep you signed in, and no advertising or tracking cookies. For aggregate usage statistics we run privacy-friendly, cookieless, self-hosted analytics — first-party only, with no third parties and no cross-site tracking — so no cookie banner is needed. No online service can be perfectly secure, but we take reasonable, audited measures.",
    authoritativeNote:
      "This notice is provided in several languages for convenience; if the versions differ, the English text prevails.",
    updatedNote:
      "We may update this notice; material changes to research logging require renewed consent.",
    backLink: "← Back to SigmaCV",
  },
  "zh-CN": {
    previewHeading: "公开 ORCID 预览",
    preview:
      "任何人都可以输入 ORCID iD，查看依据公开研究元数据生成的简历，无需账户、无需登录。该预览仅使用上文列出的公开数据源构建。如果所输入的 iD 属于某位 SigmaCV 用户，我们还会读取该用户本人的归属更正并加以应用：其标记为“不是我的”的成果会被移除，其已核对并保留的成果会清除“可能不是您的”标记。我们不会读取其账户中的任何其他内容——不读取展示选择、私人笔记、已保存的版式或联系方式——并且此机制只会移除成果或移除提示，绝不会增加访客本来看不到的内容。目的在于准确性：自动作者匹配会把姓名相近的研究者合并，尊重本人的更正可避免访客看到他人的成果被冠以其姓名（GDPR 第 6(1)(f) 条正当利益，以及第 5(1)(d) 条准确性）。若您不希望以此方式使用您的更正，请发送邮件至 privacy@sigmacv.org，我们将把您的记录排除在外。",
    aiHeading: "AI 起草助手（可选）",
    ai: "如果您使用可选的 AI 起草助手，需要提供您自己的 AI 提供商的 API 密钥——该密钥仅在本次会话期间保留在您浏览器的内存中，绝不会保存到您的浏览器或我们的服务器。当您请求起草时，系统会将您可见科研产出的简短、仅含公开信息的摘要（模块、产出数量和少量标题，不含联系方式或标识符）从我们的服务器转发给您所选择的提供商，使用您的密钥，且不会存储或记录该请求的任何内容。您的数据流向何处以及如何处理，取决于您选择的提供商及其条款，因此请选择您信任的提供商（例如，如果您在意欧盟境内处理，可选择 Mistral AI 等欧盟提供商）。该功能默认关闭，您必须每次明确请求起草并接受屏幕提示，生成结果绝不会自动加入您的简历。",
    metaTitle: "隐私",
    metaDescription:
      "SigmaCV 如何处理您的个人数据：数据最小化、仅基于标识符的匹配，以及仅在获得明确同意后进行的研究日志记录（GDPR + 日本 APPI）。",
    heading: "隐私与数据保护",
    intro:
      "SigmaCV 以数据最小化为基础构建。它仅读取公开的研究元数据，通过标识符（ORCID / OpenAlex ID）匹配您的成果——绝不依据姓名——并且除非您明确选择加入，否则不会记录任何关于您选择的信息。本声明说明了我们处理哪些数据，以及您在欧盟 GDPR 和日本 APPI 下所享有的权利。",
    controllerHeading: "数据控制者",
    controller:
      "SigmaCV 由 Basile Chrétien（PharmD、MSc、MPH）作为独立的个人项目运营——并非由任何大学或雇主运营，也非代表其运营——他是 SigmaCV 所处理个人数据的唯一数据控制者。如有任何隐私问题或请求，请通过 privacy@sigmacv.org 与他联系。",
    dataHeading: "我们处理哪些数据",
    data: "来自您登录提供方的账户数据（ORCID iD，或电子邮件 / Google 账户）；用于生成您简历的公开研究元数据（来自 OpenAlex、ORCID、Crossref、DataCite 和 Open Editors Plus 的出版物、资助、所属机构和指标）；您创建的简历内容和显示选择；以及您上传的可选个人照片。除非您选择发布公开页面，否则您的简历是私密的。",
    purposeHeading: "目的与法律依据",
    purpose:
      "我们处理这些数据是为了提供您所请求的服务——生成和导出您的简历（GDPR Art. 6(1)(b)，履行合同）。仅在您发出指示时才会发布公开的简历页面。我们不会出售您的数据，也不会将其用于广告。",
    researchHeading: "研究用途（仅限选择加入）",
    research:
      "SigmaCV 同时也是一个关于负责任的研究评估和作者姓名消歧的研究项目。出于研究目的对您的策展选择进行的日志记录默认为关闭，且仅在获得您明确、单独的同意后才会进行（GDPR Art. 6(1)(a)）。您可以随时从您的账户中撤回同意；撤回后将停止未来的日志记录，并删除已收集的研究记录。确证性分析已预先注册，并在伦理 / IRB 协议下进行。如果研究日志记录的范围发生实质性变更，我们将再次征求您的同意。",
    retentionHeading: "数据保留",
    retention:
      "在您删除账户之前，我们会保留您的账户和简历数据。删除账户会立即从运行中的服务移除您的个人资料、简历以及任何研究记录。加密备份按滚动周期保存并在 14 天内被覆盖，因此已删除的账户会在该期限内从备份中消失；我们不会从备份中恢复已删除的账户。当您取消发布或删除时，已发布的公开页面将立即停止提供访问。",
    rightsHeading: "您的权利",
    rights:
      "您可以访问并导出您的所有数据（一键 JSON 导出）、在编辑器中更正数据、撤回研究同意，并可随时删除您的账户及所有关联数据——均可直接在应用内完成。根据 GDPR 和 APPI，您还有权向您的数据保护机构提出投诉。",
    contactHeading: "联系方式",
    contact:
      "如需提问或行使您的权利，请发送电子邮件至数据控制者 privacy@sigmacv.org，或使用联系页面。我们力求在 30 天内回复。",
    sharingHeading: "谁会接收您的数据，以及数据存储于何处",
    sharing:
      "我们绝不出售您的数据，也不将其用于广告。我们仅为运营本服务而共享数据：与位于欧盟（德国）的托管服务商共享，其依据数据处理协议代表我们存储数据；以及在您登录或同步时，与我们按您的标识符查询以生成您简历的公共研究服务共享（OpenAlex、ORCID、Crossref、DataCite、OpenAIRE、DBLP、ROR 等），这些服务接收您的 ORCID iD 或姓名以返回您的公开记录，并作为该公开数据的独立控制者。您的账户和简历存储在欧盟。备份副本亦由数据控制者在日本以加密存储的方式保存，且不会与任何其他方共享；数据控制者位于日本，日本与欧盟之间的传输受 2019 年日本—欧盟相互充分性认定的保护。当您选择接收邮件摘要或确认联系邮箱时，我们会通过 SMTP2GO 发送这些邮件——SMTP2GO 是一家位于新西兰的邮件递送处理方，仅接收您的邮箱地址和邮件内容（对于摘要，即您本人公开成果的标题），以代表我们发送邮件；欧盟已认定新西兰能够确保充分的数据保护水平。",
    securityHeading: "安全与 Cookie",
    security:
      "我们通过 HTTPS、访问控制以及基于数据库的会话来保护您的数据（登录提供方的访问令牌会被丢弃，而非存储）；代码已通过独立的安全审计，且我们尽量减少所保存的数据。我们仅使用一个严格必要的 Cookie 来保持您的登录状态，不使用任何广告或跟踪 Cookie。为获取汇总的使用统计数据，我们运行注重隐私、无 Cookie 的自托管分析——仅限第一方，不涉及任何第三方，也不进行跨站跟踪——因此无需 Cookie 提示横幅。没有任何在线服务能够做到绝对安全，但我们采取了合理且经过审计的措施。",
    authoritativeNote: "本声明以多种语言提供仅为方便之用；如各版本存在差异，以英文版本为准。",
    updatedNote: "我们可能会更新本声明；对研究日志记录的实质性变更需要重新征得同意。",
    backLink: "← 返回 SigmaCV",
  },
  "es-ES": {
    previewHeading: "Vista previa pública por ORCID",
    preview:
      "Cualquier persona puede introducir un ORCID iD para ver un CV generado a partir de metadatos públicos de investigación, sin cuenta y sin iniciar sesión. Esa vista previa se construye únicamente con las fuentes públicas indicadas más arriba. Si el iD introducido pertenece a una persona con cuenta en SigmaCV, además leemos sus propias correcciones de desambiguación y las aplicamos: se eliminan los trabajos que marcó como «no es mío» y se retira el aviso «puede que no sea tuyo» de los trabajos que revisó y conservó. No leemos nada más de su cuenta —ni sus decisiones de presentación, ni notas privadas, ni diseños guardados, ni datos de contacto— y este mecanismo solo puede quitar un trabajo o quitar un aviso, nunca añadir algo que la persona visitante no vería de otro modo. La finalidad es la exactitud: el emparejamiento automático de autores fusiona a investigadores con nombres parecidos, así que respetar las correcciones de la propia persona evita que se muestre el trabajo de otra bajo su nombre (RGPD art. 6(1)(f), interés legítimo, y art. 5(1)(d), exactitud). Si prefiere que sus correcciones no se usen así, escriba a privacy@sigmacv.org y excluiremos su registro.",
    aiHeading: "Asistente de redacción con IA (opcional)",
    ai: "Si usas el asistente de redacción con IA opcional, aportas la clave API de TU PROPIO proveedor de IA: solo se mantiene en la memoria de tu navegador durante la sesión, nunca se guarda en tu navegador ni en nuestros servidores. Cuando solicitas un borrador, se retransmite desde nuestro servidor un breve resumen, solo con información pública, de tus resultados visibles (el módulo, los recuentos y algunos títulos, sin datos de contacto ni identificadores) al proveedor que TÚ elijas, con TU clave, y no se almacena ni registra nada de la solicitud. Adónde van tus datos y cómo se tratan lo determinan el proveedor y las condiciones que TÚ elijas, así que elige uno con el que te sientas cómodo (por ejemplo un proveedor de la UE como Mistral AI si te importa el procesamiento en la UE). La función está desactivada de forma predeterminada, debes solicitar cada borrador de forma expresa y aceptar el aviso, y el resultado nunca se añade a tu CV automáticamente.",
    metaTitle: "Privacidad",
    metaDescription:
      "Cómo SigmaCV trata sus datos personales: minimización de datos, emparejamiento basado únicamente en identificadores y registro con fines de investigación solo con consentimiento explícito (GDPR + APPI de Japón).",
    heading: "Privacidad y protección de datos",
    intro:
      "SigmaCV se basa en la minimización de datos. Lee únicamente metadatos públicos de investigación, identifica sus trabajos mediante identificador (ORCID / OpenAlex ID) —nunca por el nombre— y no registra nada sobre sus decisiones a menos que usted lo autorice de forma explícita. Este aviso explica qué datos tratamos y los derechos que le asisten en virtud del GDPR de la UE y de la APPI de Japón.",
    controllerHeading: "Responsable del tratamiento",
    controller:
      "SigmaCV está gestionado por Basile Chrétien (PharmD, MSc, MPH) como un proyecto personal independiente —no por una universidad o empleador, ni en su nombre— y es el único responsable del tratamiento de los datos personales que trata SigmaCV. Para cualquier pregunta o solicitud sobre privacidad, contáctelo en privacy@sigmacv.org.",
    dataHeading: "Qué datos tratamos",
    data: "Datos de la cuenta procedentes de su proveedor de inicio de sesión (ORCID iD, o cuenta de correo electrónico / Google); los metadatos públicos de investigación utilizados para crear su CV (publicaciones, financiaciones, afiliaciones y métricas de OpenAlex, ORCID, Crossref, DataCite y Open Editors Plus); el contenido del CV y las opciones de presentación que usted crea; y una fotografía de perfil opcional que usted suba. Su CV es privado a menos que decida publicar una página pública.",
    purposeHeading: "Finalidad y base jurídica",
    purpose:
      "Tratamos estos datos para prestar el servicio que usted ha solicitado: generar y exportar su CV (GDPR Art. 6(1)(b), ejecución de un contrato). La publicación de una página pública del CV solo se realiza por indicación suya. No vendemos sus datos ni los utilizamos con fines publicitarios.",
    researchHeading: "Uso con fines de investigación (solo previa aceptación)",
    research:
      "SigmaCV es también un proyecto de investigación sobre la evaluación responsable de la investigación y la desambiguación de nombres de autores. El registro de sus decisiones de curación con fines de investigación está DESACTIVADO de forma predeterminada y solo se realiza con su consentimiento explícito e independiente (GDPR Art. 6(1)(a)). Puede retirar su consentimiento en cualquier momento desde su cuenta; la retirada detiene el registro futuro y borra los registros de investigación ya recopilados. Los análisis confirmatorios están preinscritos y se llevan a cabo conforme a un protocolo ético/de comité de ética (IRB). Si el alcance del registro con fines de investigación cambia de forma sustancial, le solicitaremos de nuevo su consentimiento.",
    retentionHeading: "Conservación",
    retention:
      "Conservamos los datos de su cuenta y de su CV hasta que elimine su cuenta. Al eliminar su cuenta, su perfil, su CV y cualquier registro de investigación se borran de inmediato del servicio en funcionamiento. Las copias de seguridad cifradas se conservan de forma rotatoria y se sobrescriben en un plazo de 14 días, por lo que una cuenta eliminada desaparece de ellas dentro de ese plazo; no restauramos cuentas eliminadas a partir de copias de seguridad. Las páginas públicas publicadas dejan de servirse de inmediato cuando las despublica o las elimina.",
    rightsHeading: "Sus derechos",
    rights:
      "Puede acceder a todos sus datos y exportarlos (una exportación en JSON con un solo clic), rectificarlos en el editor, retirar el consentimiento para la investigación y eliminar su cuenta y todos los datos asociados en cualquier momento, directamente desde la aplicación. En virtud del GDPR y de la APPI, también tiene derecho a presentar una reclamación ante su autoridad de protección de datos.",
    contactHeading: "Contacto",
    contact:
      "Para hacer una pregunta o ejercer sus derechos, escriba al responsable del tratamiento a privacy@sigmacv.org o use la página de contacto. Procuramos responder en un plazo de 30 días.",
    sharingHeading: "Quién recibe sus datos y dónde se almacenan",
    sharing:
      "Nunca vendemos sus datos ni los usamos con fines publicitarios. Solo los compartimos para prestar el servicio: con nuestro proveedor de alojamiento en la Unión Europea (Alemania), que los almacena por cuenta nuestra en virtud de un acuerdo de tratamiento de datos; y, cuando inicia sesión o sincroniza, con los servicios públicos de investigación que consultamos mediante su identificador para crear su CV (OpenAlex, ORCID, Crossref, DataCite, OpenAIRE, DBLP, ROR y similares), que reciben su iD de ORCID o su nombre para devolver sus registros públicos y actúan como responsables independientes de esos datos públicos. Su cuenta y su CV se almacenan en la UE. El responsable conserva además copias de seguridad en Japón en almacenamiento cifrado, que no se comparten con nadie más; el responsable reside en Japón, y las transferencias entre Japón y la UE están amparadas por la decisión de adecuación mutua Japón-UE de 2019. Cuando se suscribe a los resúmenes por correo electrónico o confirma un correo electrónico de contacto, entregamos esos mensajes a través de SMTP2GO, un encargado del tratamiento de entrega de correo con sede en Nueva Zelanda, que recibe únicamente su dirección de correo electrónico y el contenido del mensaje (en el caso de los resúmenes, los títulos de sus propios trabajos públicos) para enviar el correo en nuestro nombre; la UE reconoce que Nueva Zelanda garantiza un nivel adecuado de protección de datos.",
    securityHeading: "Seguridad y cookies",
    security:
      "Protegemos sus datos con HTTPS, controles de acceso y sesiones almacenadas en la base de datos (los tokens de acceso de los proveedores de inicio de sesión se descartan, no se almacenan); el código ha sido sometido a auditorías de seguridad independientes y minimizamos lo que conservamos. Usamos una única cookie estrictamente necesaria para mantener su sesión y ninguna cookie publicitaria o de seguimiento. Para obtener estadísticas de uso agregadas, utilizamos una analítica autoalojada, respetuosa con la privacidad y sin cookies —solo de origen propio, sin terceros y sin seguimiento entre sitios—, por lo que no se necesita ningún aviso de cookies. Ningún servicio en línea puede ser perfectamente seguro, pero adoptamos medidas razonables y auditadas.",
    authoritativeNote:
      "Este aviso se ofrece en varios idiomas por comodidad; en caso de discrepancia, prevalece la versión en inglés.",
    updatedNote:
      "Es posible que actualicemos este aviso; los cambios sustanciales en el registro con fines de investigación requieren un nuevo consentimiento.",
    backLink: "← Volver a SigmaCV",
  },
  "fr-FR": {
    previewHeading: "Aperçu public par ORCID",
    preview:
      "Toute personne peut saisir un identifiant ORCID pour afficher un CV constitué à partir de métadonnées de recherche publiques, sans compte ni connexion. Cet aperçu est construit uniquement à partir des sources publiques citées ci-dessus. Si l'identifiant saisi correspond à un titulaire de compte SigmaCV, nous lisons en outre ses propres corrections de désambiguïsation et les appliquons : les travaux qu'il a marqués « pas à moi » sont retirés, et la mention « peut-être pas le vôtre » disparaît des travaux qu'il a vérifiés et conservés. Nous ne lisons rien d'autre dans son compte — ni ses choix d'affichage, ni ses notes privées, ni ses mises en page enregistrées, ni ses coordonnées — et ce mécanisme ne peut que retirer un travail ou retirer un avertissement, jamais ajouter quoi que ce soit qu'un visiteur ne verrait pas autrement. La finalité est l'exactitude : l'appariement automatique d'auteurs fusionne des chercheurs aux noms proches ; respecter les corrections de la personne concernée évite qu'un visiteur voie le travail d'autrui sous son nom (RGPD art. 6(1)(f), intérêt légitime, et art. 5(1)(d), exactitude). Si vous préférez que vos corrections ne soient pas utilisées ainsi, écrivez à privacy@sigmacv.org et nous exclurons votre dossier.",
    aiHeading: "Assistant de rédaction par IA (facultatif)",
    ai: "Si vous utilisez l’assistant de rédaction par IA facultatif, vous fournissez la clé API de VOTRE PROPRE fournisseur d’IA — elle n’est conservée qu’en mémoire dans votre navigateur pour la session, jamais enregistrée dans votre navigateur ni sur nos serveurs. Lorsque vous demandez un brouillon, un bref résumé, uniquement public, de vos travaux visibles (le module, le nombre de productions et quelques titres, sans coordonnée ni identifiant) est relayé depuis notre serveur vers le fournisseur que VOUS avez choisi, avec VOTRE clé, et rien de la requête n’est conservé ni journalisé. La destination de vos données et leur traitement dépendent du fournisseur et des conditions que VOUS choisissez ; choisissez-en un qui vous convient (par exemple un fournisseur de l’UE comme Mistral AI si le traitement dans l’UE vous importe). La fonction est désactivée par défaut, vous devez demander chaque brouillon explicitement et accepter l’avis, et le résultat n’est jamais ajouté automatiquement à votre CV.",
    metaTitle: "Confidentialité",
    metaDescription:
      "Comment SigmaCV traite vos données personnelles : minimisation des données, appariement uniquement par identifiant, et journalisation à des fins de recherche uniquement avec votre consentement explicite (GDPR + APPI du Japon).",
    heading: "Confidentialité et protection des données",
    intro:
      "SigmaCV repose sur la minimisation des données. Il ne lit que des métadonnées de recherche publiques, associe vos travaux par identifiant (ORCID / OpenAlex ID) — jamais par le nom — et n'enregistre rien sur vos choix sans votre accord explicite. Le présent avis explique ce que nous traitons et les droits dont vous disposez au titre du GDPR de l'UE et de l'APPI du Japon.",
    controllerHeading: "Responsable du traitement",
    controller:
      "SigmaCV est exploité par Basile Chrétien (PharmD, MSc, MPH) en tant que projet personnel indépendant — non pas par une université ou un employeur, ni en leur nom — et il est le seul responsable du traitement des données personnelles traitées par SigmaCV. Pour toute question ou demande relative à la confidentialité, contactez-le à privacy@sigmacv.org.",
    dataHeading: "Ce que nous traitons",
    data: "Les données de compte issues de votre fournisseur de connexion (ORCID iD, ou compte e-mail / Google) ; les métadonnées de recherche publiques utilisées pour construire votre CV (publications, financements, affiliations et indicateurs provenant d'OpenAlex, ORCID, Crossref, DataCite et Open Editors Plus) ; le contenu du CV et les choix d'affichage que vous créez ; et une photo de profil facultative que vous téléversez. Votre CV est privé, sauf si vous choisissez de publier une page publique.",
    purposeHeading: "Finalité et base légale",
    purpose:
      "Nous traitons ces données pour fournir le service que vous avez demandé — générer et exporter votre CV (GDPR Art. 6(1)(b), exécution d'un contrat). La publication d'une page de CV publique n'a lieu que sur votre instruction. Nous ne vendons pas vos données et ne les utilisons pas à des fins publicitaires.",
    researchHeading: "Utilisation à des fins de recherche (sur adhésion uniquement)",
    research:
      "SigmaCV est aussi un projet de recherche sur l'évaluation responsable de la recherche et la désambiguïsation des noms d'auteurs. La journalisation de vos choix de curation à des fins de recherche est DÉSACTIVÉE par défaut et n'a lieu qu'avec votre consentement explicite et distinct (GDPR Art. 6(1)(a)). Vous pouvez le retirer à tout moment depuis votre compte ; le retrait arrête toute journalisation future et efface les enregistrements de recherche déjà collectés. Les analyses confirmatoires sont préenregistrées et menées dans le cadre d'un protocole éthique/IRB. Si la portée de la journalisation à des fins de recherche change de manière substantielle, nous vous redemanderons votre consentement.",
    retentionHeading: "Conservation",
    retention:
      "Nous conservons les données de votre compte et de votre CV jusqu'à ce que vous supprimiez votre compte. La suppression de votre compte efface immédiatement votre profil, votre CV et tout enregistrement de recherche du service en ligne. Les sauvegardes chiffrées sont conservées de manière glissante et écrasées sous 14 jours, de sorte qu'un compte supprimé en disparaît dans ce délai ; nous ne restaurons pas de comptes supprimés à partir des sauvegardes. Les pages publiques publiées cessent d'être servies immédiatement lorsque vous les dépubliez ou les supprimez.",
    rightsHeading: "Vos droits",
    rights:
      "Vous pouvez accéder à toutes vos données et les exporter (un export JSON en un clic), les corriger dans l'éditeur, retirer votre consentement à la recherche, et supprimer votre compte et toutes les données associées à tout moment — directement depuis l'application. Au titre du GDPR et de l'APPI, vous avez également le droit d'introduire une réclamation auprès de votre autorité de protection des données.",
    contactHeading: "Contact",
    contact:
      "Pour poser une question ou exercer vos droits, écrivez au responsable du traitement à privacy@sigmacv.org ou utilisez la page de contact. Nous nous efforçons de répondre sous 30 jours.",
    sharingHeading: "Qui reçoit vos données, et où elles sont stockées",
    sharing:
      "Nous ne vendons jamais vos données et ne les utilisons pas à des fins publicitaires. Nous ne les partageons que pour faire fonctionner le service : avec notre hébergeur situé dans l'Union européenne (Allemagne), qui les stocke pour notre compte dans le cadre d'un accord de traitement des données ; et, lorsque vous vous connectez ou synchronisez, avec les services de recherche publics que nous interrogeons à partir de votre identifiant pour constituer votre CV (OpenAlex, ORCID, Crossref, DataCite, OpenAIRE, DBLP, ROR et similaires), qui reçoivent votre iD ORCID ou votre nom pour renvoyer vos données publiques et agissent en tant que responsables indépendants de ces données publiques. Votre compte et votre CV sont stockés dans l'UE. Le responsable conserve également des copies de sauvegarde au Japon sur un support chiffré, qui ne sont partagées avec personne d'autre ; le responsable est établi au Japon, et les transferts entre le Japon et l'UE sont couverts par la décision d'adéquation mutuelle Japon-UE de 2019. Lorsque vous vous abonnez aux résumés par e-mail ou confirmez une adresse e-mail de contact, nous acheminons ces messages via SMTP2GO, un sous-traitant de distribution d'e-mails établi en Nouvelle-Zélande, qui ne reçoit que votre adresse e-mail et le contenu du message (pour les résumés, les titres de vos propres travaux publics) afin d'envoyer l'e-mail pour notre compte ; la Nouvelle-Zélande est reconnue par l'UE comme assurant un niveau adéquat de protection des données.",
    securityHeading: "Sécurité et cookies",
    security:
      "Nous protégeons vos données par HTTPS, des contrôles d'accès et des sessions stockées en base de données (les jetons d'accès des fournisseurs de connexion sont supprimés, non conservés) ; le code a fait l'objet d'audits de sécurité indépendants et nous limitons les données conservées. Nous utilisons un unique cookie strictement nécessaire pour vous maintenir connecté, et aucun cookie publicitaire ou de suivi. Pour des statistiques d'usage agrégées, nous utilisons une solution de mesure d'audience auto-hébergée, respectueuse de la vie privée et sans cookies — uniquement first-party, sans aucun tiers ni suivi intersites —, de sorte qu'aucune bannière de cookies n'est nécessaire. Aucun service en ligne ne peut être parfaitement sûr, mais nous prenons des mesures raisonnables et auditées.",
    authoritativeNote:
      "Cette notice est proposée en plusieurs langues par commodité ; en cas de divergence, la version anglaise prévaut.",
    updatedNote:
      "Nous pouvons mettre à jour le présent avis ; toute modification substantielle de la journalisation à des fins de recherche nécessite un nouveau consentement.",
    backLink: "← Retour à SigmaCV",
  },
  "de-DE": {
    previewHeading: "Öffentliche ORCID-Vorschau",
    preview:
      "Jede Person kann eine ORCID iD eingeben und sich einen aus öffentlichen Forschungsmetadaten erstellten Lebenslauf ansehen – ohne Konto und ohne Anmeldung. Diese Vorschau wird ausschließlich aus den oben genannten öffentlichen Quellen erzeugt. Gehört die eingegebene iD zu einer Person mit SigmaCV-Konto, lesen wir zusätzlich deren eigene Zuordnungskorrekturen und wenden sie an: als „nicht meine“ markierte Arbeiten werden entfernt, und bei geprüften und behaltenen Arbeiten entfällt der Hinweis „gehört möglicherweise nicht zu Ihnen“. Sonst lesen wir nichts aus dem Konto – weder Anzeigeentscheidungen noch private Notizen, gespeicherte Layouts oder Kontaktdaten – und dieser Mechanismus kann nur eine Arbeit oder einen Hinweis entfernen, niemals etwas hinzufügen, das Besuchende sonst nicht sähen. Zweck ist die Richtigkeit: die automatische Autorenzuordnung führt Forschende mit ähnlichen Namen zusammen; die eigenen Korrekturen zu berücksichtigen verhindert, dass Besuchenden fremde Arbeiten unter diesem Namen angezeigt werden (DSGVO Art. 6(1)(f), berechtigte Interessen, und Art. 5(1)(d), Richtigkeit). Wenn Sie das nicht möchten, schreiben Sie an privacy@sigmacv.org; wir nehmen Ihren Datensatz dann aus.",
    aiHeading: "KI-Schreibassistent (optional)",
    ai: "Wenn Sie den optionalen KI-Schreibassistenten nutzen, geben Sie den API-Schlüssel IHRES EIGENEN KI-Anbieters an – er wird nur im Speicher Ihres Browsers für die Sitzung gehalten, nie in Ihrem Browser oder auf unseren Servern gespeichert. Wenn Sie einen Entwurf anfordern, wird eine kurze, ausschließlich öffentliche Zusammenfassung Ihrer sichtbaren Leistungen (das Modul, die Anzahl der Leistungen und einige Titel, ohne Kontaktdaten oder Kennungen) von unserem Server an den von IHNEN gewählten Anbieter weitergeleitet, mit IHREM Schlüssel, und nichts von der Anfrage wird gespeichert oder protokolliert. Wohin Ihre Daten gehen und wie sie verarbeitet werden, bestimmen der Anbieter und die Bedingungen, die SIE wählen – wählen Sie also einen, mit dem Sie einverstanden sind (z. B. einen EU-Anbieter wie Mistral AI, falls Ihnen die Verarbeitung in der EU wichtig ist). Die Funktion ist standardmäßig deaktiviert, Sie müssen jeden Entwurf ausdrücklich anfordern und den Hinweis akzeptieren, und das Ergebnis wird niemals automatisch in Ihren Lebenslauf übernommen.",
    metaTitle: "Datenschutz",
    metaDescription:
      "Wie SigmaCV mit Ihren personenbezogenen Daten umgeht: Datenminimierung, Zuordnung ausschließlich über Identifikatoren und Forschungsprotokollierung nur mit ausdrücklicher Einwilligung (GDPR + Japan APPI).",
    heading: "Datenschutz",
    intro:
      "SigmaCV basiert auf dem Grundsatz der Datenminimierung. Es liest ausschließlich öffentliche Forschungsmetadaten, ordnet Ihre Arbeiten anhand von Identifikatoren zu (ORCID / OpenAlex ID) — niemals anhand des Namens — und protokolliert nichts über Ihre Entscheidungen, sofern Sie dem nicht ausdrücklich zustimmen. Dieser Hinweis erläutert, welche Daten wir verarbeiten und welche Rechte Ihnen nach der GDPR der EU sowie dem japanischen APPI zustehen.",
    controllerHeading: "Verantwortliche Stelle",
    controller:
      "SigmaCV wird von Basile Chrétien (PharmD, MSc, MPH) als unabhängiges privates Projekt betrieben – nicht von einer Universität oder einem Arbeitgeber bzw. in deren Auftrag – und er ist der alleinige Verantwortliche für die von SigmaCV verarbeiteten personenbezogenen Daten. Bei Fragen oder Anliegen zum Datenschutz erreichen Sie ihn unter privacy@sigmacv.org.",
    dataHeading: "Was wir verarbeiten",
    data: "Kontodaten von Ihrem Anmeldeanbieter (ORCID iD oder E-Mail- / Google-Konto); die öffentlichen Forschungsmetadaten, die zur Erstellung Ihres CV verwendet werden (Publikationen, Fördermittel, Zugehörigkeiten und Metriken von OpenAlex, ORCID, Crossref, DataCite und Open Editors Plus); die von Ihnen erstellten CV-Inhalte und Anzeigeeinstellungen; sowie ein optionales Profilfoto, das Sie hochladen. Ihr CV ist privat, sofern Sie sich nicht für die Veröffentlichung einer öffentlichen Seite entscheiden.",
    purposeHeading: "Zweck & Rechtsgrundlage",
    purpose:
      "Wir verarbeiten diese Daten, um den von Ihnen angeforderten Dienst bereitzustellen — die Erstellung und den Export Ihres CV (GDPR Art. 6(1)(b), Erfüllung eines Vertrags). Die Veröffentlichung einer öffentlichen CV-Seite erfolgt ausschließlich auf Ihre Anweisung. Wir verkaufen Ihre Daten nicht und verwenden sie nicht für Werbung.",
    researchHeading: "Nutzung zu Forschungszwecken (nur mit Einwilligung)",
    research:
      "SigmaCV ist zugleich ein Forschungsprojekt zur verantwortungsvollen Forschungsbewertung und zur Disambiguierung von Autorennamen. Die Protokollierung Ihrer Kuratierungsentscheidungen zu Forschungszwecken ist standardmäßig DEAKTIVIERT und erfolgt nur mit Ihrer ausdrücklichen, gesonderten Einwilligung (GDPR Art. 6(1)(a)). Sie können diese jederzeit über Ihr Konto widerrufen; der Widerruf beendet die künftige Protokollierung und löscht die bereits erhobenen Forschungsdatensätze. Bestätigende Analysen werden vorab registriert und im Rahmen eines Ethik-/IRB-Protokolls durchgeführt. Sollte sich der Umfang der Forschungsprotokollierung wesentlich ändern, holen wir Ihre Einwilligung erneut ein.",
    retentionHeading: "Speicherdauer",
    retention:
      "Wir bewahren Ihre Konto- und CV-Daten auf, bis Sie Ihr Konto löschen. Durch das Löschen Ihres Kontos werden Ihr Profil, Ihr CV und sämtliche Forschungsdatensätze sofort aus dem laufenden Dienst entfernt. Verschlüsselte Sicherungen werden rollierend aufbewahrt und innerhalb von 14 Tagen überschrieben, sodass ein gelöschtes Konto innerhalb dieses Zeitraums auch daraus verschwindet; gelöschte Konten werden nicht aus Sicherungen wiederhergestellt. Veröffentlichte öffentliche Seiten werden sofort nicht mehr ausgeliefert, sobald Sie die Veröffentlichung zurücknehmen oder löschen.",
    rightsHeading: "Ihre Rechte",
    rights:
      "Sie können jederzeit auf alle Ihre Daten zugreifen und diese exportieren (ein JSON-Export per Klick), sie im Editor berichtigen, Ihre Einwilligung zur Forschung widerrufen sowie Ihr Konto und alle zugehörigen Daten löschen — direkt in der App. Nach der GDPR und dem APPI haben Sie zudem das Recht, eine Beschwerde bei Ihrer Datenschutzbehörde einzureichen.",
    contactHeading: "Kontakt",
    contact:
      "Für Fragen oder zur Ausübung Ihrer Rechte schreiben Sie dem Verantwortlichen an privacy@sigmacv.org oder nutzen Sie die Kontaktseite. Wir bemühen uns, innerhalb von 30 Tagen zu antworten.",
    sharingHeading: "Wer Ihre Daten erhält und wo sie gespeichert werden",
    sharing:
      "Wir verkaufen Ihre Daten niemals und nutzen sie nicht für Werbung. Wir geben sie nur weiter, soweit dies für den Betrieb des Dienstes erforderlich ist: an unseren Hosting-Anbieter in der Europäischen Union (Deutschland), der sie in unserem Auftrag auf Grundlage eines Auftragsverarbeitungsvertrags speichert; und – wenn Sie sich anmelden oder synchronisieren – an die öffentlichen Forschungsdienste, die wir anhand Ihrer Kennung abfragen, um Ihren Lebenslauf zu erstellen (OpenAlex, ORCID, Crossref, DataCite, OpenAIRE, DBLP, ROR und ähnliche); diese erhalten Ihre ORCID-iD oder Ihren Namen, um Ihre öffentlichen Einträge zurückzugeben, und sind eigenständige Verantwortliche für diese öffentlichen Daten. Ihr Konto und Ihr Lebenslauf werden in der EU gespeichert. Sicherungskopien werden zudem vom Verantwortlichen in Japan auf verschlüsseltem Speicher aufbewahrt und mit niemandem sonst geteilt; der Verantwortliche hat seinen Sitz in Japan, und Übermittlungen zwischen Japan und der EU sind durch den gegenseitigen Angemessenheitsbeschluss Japan–EU von 2019 abgedeckt. Wenn Sie E-Mail-Zusammenfassungen abonnieren oder eine Kontakt-E-Mail bestätigen, stellen wir diese Nachrichten über SMTP2GO zu, einen in Neuseeland ansässigen Auftragsverarbeiter für den E-Mail-Versand, der nur Ihre E-Mail-Adresse und den Nachrichteninhalt (bei Zusammenfassungen die Titel Ihrer eigenen öffentlichen Arbeiten) erhält, um die E-Mail in unserem Auftrag zu versenden; Neuseeland wird von der EU als Land mit einem angemessenen Datenschutzniveau anerkannt.",
    securityHeading: "Sicherheit und Cookies",
    security:
      "Wir schützen Ihre Daten durch HTTPS, Zugriffskontrollen und datenbankgestützte Sitzungen (Zugangstoken der Anmeldeanbieter werden verworfen, nicht gespeichert); der Code wurde unabhängigen Sicherheitsaudits unterzogen, und wir halten die gespeicherten Daten minimal. Wir verwenden ein einziges unbedingt erforderliches Cookie, um Sie angemeldet zu halten, und keine Werbe- oder Tracking-Cookies. Für aggregierte Nutzungsstatistiken setzen wir eine datenschutzfreundliche, cookielose, selbst gehostete Analyse ein – ausschließlich First-Party, ohne Dritte und ohne seitenübergreifendes Tracking –, daher ist kein Cookie-Banner erforderlich. Kein Online-Dienst kann vollkommen sicher sein, aber wir treffen angemessene, auditierte Maßnahmen.",
    authoritativeNote:
      "Diese Erklärung wird der Einfachheit halber in mehreren Sprachen bereitgestellt; im Falle von Abweichungen ist die englische Fassung maßgeblich.",
    updatedNote:
      "Wir können diesen Hinweis aktualisieren; wesentliche Änderungen an der Forschungsprotokollierung erfordern eine erneute Einwilligung.",
    backLink: "← Zurück zu SigmaCV",
  },
  "ja-JP": {
    previewHeading: "ORCID による公開プレビュー",
    preview:
      "どなたでも ORCID iD を入力すると、公開されている研究メタデータから作成した CV を閲覧できます（アカウント登録・ログインは不要です）。このプレビューは上記の公開ソースのみから構築されます。入力された iD が SigmaCV の利用者のものである場合、その本人による帰属の訂正も読み取って反映します。「自分のものではない」と指定された業績は除外し、本人が確認して残した業績からは「あなたの業績ではない可能性があります」という表示を外します。アカウントからそれ以外の情報（表示の設定、非公開メモ、保存済みレイアウト、連絡先など）は読み取りません。またこの仕組みは業績を減らすか警告を消すことしかできず、閲覧者が本来目にしないものを追加することはありません。目的は正確性です。著者の自動照合は氏名の似た研究者を統合してしまうため、本人の訂正を尊重することで、他者の業績がその方の名前で表示されるのを防ぎます（GDPR 第6条1項(f) 正当な利益、第5条1項(d) 正確性）。この扱いを望まれない場合は privacy@sigmacv.org までご連絡ください。対象から除外します。",
    aiHeading: "AI 起草アシスタント（任意）",
    ai: "任意の AI 起草アシスタントを利用する場合、あなた自身の AI プロバイダーの API キーを入力します——このキーはセッション中あなたのブラウザーのメモリー内にのみ保持され、ブラウザーにも当方のサーバーにも保存されません。下書きを要求すると、表示中の業績に関する短い公開情報のみの要約（モジュール、業績数、いくつかのタイトル。連絡先や識別子は含みません）が、当方のサーバーからあなたが選んだプロバイダーへ、あなたのキーを用いて中継され、リクエストの内容は保存もログ記録もされません。データの送信先や取り扱いは、あなたが選ぶプロバイダーとその規約によって決まりますので、納得できるプロバイダーを選んでください（EU 内での処理を重視する場合は Mistral AI などの EU プロバイダーなど）。この機能は既定でオフで、下書きは毎回明示的に要求して通知に同意する必要があり、結果が自動的に CV に追加されることはありません。",
    metaTitle: "プライバシー",
    metaDescription:
      "SigmaCV における個人データの取り扱いについて：データ最小化、識別子のみによる照合、そして明示的な同意がある場合に限る研究目的のログ記録（GDPR + 日本の APPI）。",
    heading: "プライバシーとデータ保護",
    intro:
      "SigmaCV はデータ最小化を基本として構築されています。公開されている研究メタデータのみを読み取り、お客様の業績を識別子（ORCID / OpenAlex ID）によって照合し、氏名文字列で照合することは決してありません。また、お客様が明示的にオプトインしない限り、お客様の選択について何も記録しません。本通知では、当方が処理する内容と、EU GDPR および日本の APPI のもとでお客様が有する権利について説明します。",
    controllerHeading: "データ管理者",
    controller:
      "SigmaCV は、Basile Chrétien（PharmD、MSc、MPH）が独立した個人プロジェクトとして運営しています（大学や雇用主によるもの、またはその代理ではありません）。同氏が、SigmaCV が取り扱う個人データの唯一の管理者です。プライバシーに関するご質問やご請求は、privacy@sigmacv.org までご連絡ください。",
    dataHeading: "当方が処理する情報",
    data: "お客様のサインインプロバイダーから取得するアカウントデータ（ORCID iD、またはメールアドレス / Google アカウント）、CV の作成に使用する公開研究メタデータ（OpenAlex、ORCID、Crossref、DataCite および Open Editors Plus から取得した論文、助成金、所属機関および各種指標）、お客様が作成する CV のコンテンツおよび表示に関する選択、ならびにお客様が任意でアップロードするプロフィール写真です。お客様が公開ページを公開することを選択しない限り、お客様の CV は非公開です。",
    purposeHeading: "目的および法的根拠",
    purpose:
      "当方は、お客様が要求されたサービス（CV の生成およびエクスポート）を提供するためにこのデータを処理します（GDPR Art. 6(1)(b)、契約の履行）。公開 CV ページの公開は、お客様の指示があった場合に限り行われます。当方はお客様のデータを販売せず、広告目的で使用することもありません。",
    researchHeading: "研究目的での利用（オプトインの場合のみ）",
    research:
      "SigmaCV は、責任ある研究評価および著者名の名寄せ（曖昧性解消）に関する研究プロジェクトでもあります。研究目的でのお客様のキュレーション選択のログ記録は、初期設定ではオフになっており、お客様の明示的かつ個別の同意がある場合に限り行われます（GDPR Art. 6(1)(a)）。お客様はいつでもアカウントから同意を撤回でき、撤回により今後のログ記録は停止され、すでに収集された研究記録は消去されます。確証的分析は事前登録され、倫理／IRB プロトコルのもとで実施されます。研究目的のログ記録の範囲に重大な変更があった場合、当方は改めてお客様の同意を求めます。",
    retentionHeading: "保持期間",
    retention:
      "当方は、お客様がアカウントを削除するまで、お客様のアカウントおよび CV データを保持します。アカウントを削除すると、お客様のプロフィール、CV、およびすべての研究記録は、稼働中のサービスから直ちに削除されます。暗号化されたバックアップは循環方式で保管され、14 日以内に上書きされるため、削除されたアカウントはその期間内にバックアップからも消えます。当方が削除済みのアカウントをバックアップから復元することはありません。公開されている公開ページは、お客様が公開を取り消すか削除した時点で直ちに配信が停止されます。",
    rightsHeading: "お客様の権利",
    rights:
      "お客様は、ご自身のすべてのデータにアクセスしてエクスポートすること（ワンクリックでの JSON エクスポート）、エディターでデータを修正すること、研究目的の同意を撤回すること、ならびにアカウントおよび関連するすべてのデータをいつでも削除することができ、これらはすべてアプリから直接行えます。GDPR および APPI のもとで、お客様にはデータ保護当局に苦情を申し立てる権利もあります。",
    contactHeading: "お問い合わせ",
    contact:
      "ご質問やお客様の権利の行使については、管理者（privacy@sigmacv.org）宛てにメールでご連絡いただくか、お問い合わせページをご利用ください。30 日以内の回答に努めます。",
    sharingHeading: "データの提供先と保存場所",
    sharing:
      "当方はお客様のデータを販売せず、広告にも利用しません。データの共有は、本サービスの運営に必要な範囲に限られます。すなわち、欧州連合（ドイツ）のホスティング事業者（データ処理契約に基づき当方に代わってデータを保存します）と、ログインまたは同期の際に、CV を作成するためお客様の識別子で照会する公開研究サービス（OpenAlex、ORCID、Crossref、DataCite、OpenAIRE、DBLP、ROR など）です。これらのサービスは、公開記録を返すためにお客様の ORCID iD または氏名を受け取り、その公開データについては独立した管理者として行動します。お客様のアカウントと CV は EU 内に保存されます。バックアップの複製は、管理者が日本において暗号化されたストレージに保管し、他のいかなる第三者とも共有しません。管理者は日本に所在し、日本と EU の間の移転は 2019 年の日 EU 相互の十分性認定によって保護されています。お客様がダイジェストメールの配信をオプトインされた場合、または連絡先メールアドレスを確認される場合、当方はこれらのメッセージを、ニュージーランドに拠点を置くメール配信の処理事業者である SMTP2GO を通じて送信します。SMTP2GO は、当方に代わってメールを送信するために、お客様のメールアドレスとメッセージの内容（ダイジェストの場合は、お客様ご自身の公開業績のタイトル）のみを受け取ります。ニュージーランドは、十分な水準のデータ保護を確保している国として EU に認められています。",
    securityHeading: "セキュリティと Cookie",
    security:
      "当方は、HTTPS、アクセス制御、データベースに基づくセッション（ログイン提供元のアクセストークンは保存せず破棄します）によりデータを保護しています。コードは独立したセキュリティ監査を受けており、保有する情報は最小限にとどめています。ログイン状態を保持するための必要不可欠な Cookie を 1 つだけ使用し、広告・トラッキングの Cookie は一切使用しません。集計された利用統計のために、プライバシーに配慮した Cookie 不要の自己ホスト型アクセス解析（ファーストパーティのみ、第三者なし、クロスサイト追跡なし）を使用しています。そのため Cookie バナーは不要です。完全に安全なオンラインサービスは存在しませんが、当方は合理的かつ監査済みの対策を講じています。",
    authoritativeNote:
      "本通知は便宜のため複数の言語で提供しています。各版に相違がある場合は英語版が優先します。",
    updatedNote:
      "当方は本通知を更新する場合があります。研究目的のログ記録に関する重大な変更については、改めて同意が必要となります。",
    backLink: "← SigmaCV に戻る",
  },
  "pt-BR": {
    previewHeading: "Prévia pública por ORCID",
    preview:
      "Qualquer pessoa pode informar um ORCID iD para ver um CV montado a partir de metadados públicos de pesquisa, sem conta e sem login. Essa prévia é construída apenas com as fontes públicas listadas acima. Se o iD informado pertencer a alguém com conta no SigmaCV, também lemos as próprias correções de desambiguação dessa pessoa e as aplicamos: trabalhos marcados como “não é meu” são removidos, e o aviso “pode não ser seu” sai dos trabalhos que ela revisou e manteve. Não lemos mais nada da conta — nem escolhas de exibição, notas privadas, layouts salvos ou dados de contato — e esse mecanismo só pode remover um trabalho ou remover um aviso, nunca acrescentar algo que a pessoa visitante não veria de outro modo. A finalidade é a exatidão: a correspondência automática de autores funde pesquisadores com nomes parecidos, então respeitar as correções da própria pessoa evita que o trabalho de outra apareça sob o nome dela (GDPR art. 6(1)(f), legítimo interesse, e art. 5(1)(d), exatidão). Se preferir que suas correções não sejam usadas assim, escreva para privacy@sigmacv.org e excluiremos seu registro.",
    aiHeading: "Assistente de redação com IA (opcional)",
    ai: "Se você usar o assistente de redação com IA opcional, fornece a chave de API do SEU PRÓPRIO provedor de IA — ela permanece apenas na memória do seu navegador durante a sessão, nunca é salva no seu navegador nem em nossos servidores. Quando você solicita um rascunho, um breve resumo, apenas público, dos seus resultados visíveis (o módulo, as contagens e alguns títulos, sem dados de contato ou identificadores) é retransmitido do nosso servidor para o provedor que VOCÊ escolher, com a SUA chave, e nada da solicitação é armazenado ou registrado. Para onde seus dados vão e como são tratados dependem do provedor e dos termos que VOCÊ escolher, então escolha um com o qual se sinta à vontade (por exemplo, um provedor da UE como a Mistral AI, se o processamento na UE for importante para você). O recurso fica desativado por padrão, você deve solicitar cada rascunho explicitamente e aceitar o aviso, e o resultado nunca é adicionado ao seu currículo automaticamente.",
    metaTitle: "Privacidade",
    metaDescription:
      "Como o SigmaCV trata seus dados pessoais: minimização de dados, correspondência apenas por identificador e registro para pesquisa somente com consentimento explícito (GDPR + APPI do Japão).",
    heading: "Privacidade e Proteção de Dados",
    intro:
      "O SigmaCV foi desenvolvido com base na minimização de dados. Ele lê apenas metadados públicos de pesquisa, identifica seus trabalhos por identificador (ORCID / OpenAlex ID) — nunca pelo nome — e não registra nada sobre suas escolhas, a menos que você opte explicitamente por isso. Este aviso explica o que processamos e os direitos que você tem sob o GDPR da UE e o APPI do Japão.",
    controllerHeading: "Controlador de dados",
    controller:
      "O SigmaCV é operado por Basile Chrétien (PharmD, MSc, MPH) como um projeto pessoal independente — não por uma universidade ou empregador, nem em seu nome — e ele é o único controlador dos dados pessoais tratados pelo SigmaCV. Para qualquer dúvida ou solicitação de privacidade, entre em contato pelo privacy@sigmacv.org.",
    dataHeading: "O que processamos",
    data: "Dados de conta do seu provedor de login (ORCID iD, ou conta de e-mail / Google); os metadados públicos de pesquisa usados para montar seu CV (publicações, financiamentos, afiliações e métricas de OpenAlex, ORCID, Crossref, DataCite e Open Editors Plus); o conteúdo do CV e as escolhas de exibição que você cria; e uma foto de perfil opcional que você carrega. Seu CV é privado, a menos que você opte por publicar uma página pública.",
    purposeHeading: "Finalidade e base legal",
    purpose:
      "Processamos esses dados para fornecer o serviço que você solicitou — gerar e exportar seu CV (GDPR Art. 6(1)(b), execução de um contrato). A publicação de uma página pública de CV ocorre apenas mediante sua instrução. Não vendemos seus dados nem os utilizamos para publicidade.",
    researchHeading: "Uso para pesquisa (apenas mediante adesão)",
    research:
      "O SigmaCV é também um projeto de pesquisa sobre avaliação responsável da pesquisa e desambiguação de nomes de autores. O registro das suas escolhas de curadoria para fins de pesquisa está DESATIVADO por padrão e ocorre somente com o seu consentimento explícito e separado (GDPR Art. 6(1)(a)). Você pode revogá-lo a qualquer momento a partir da sua conta; a revogação interrompe o registro futuro e apaga os registros de pesquisa já coletados. As análises confirmatórias são pré-registradas e conduzidas sob um protocolo de ética/IRB. Se o escopo do registro para pesquisa mudar de forma significativa, solicitaremos novamente o seu consentimento.",
    retentionHeading: "Retenção",
    retention:
      "Mantemos os dados da sua conta e do seu CV até que você exclua sua conta. A exclusão da sua conta remove imediatamente seu perfil, seu CV e quaisquer registros de pesquisa do serviço em operação. Os backups criptografados são mantidos em ciclo e sobrescritos em até 14 dias, de modo que uma conta excluída desaparece deles nesse prazo; não restauramos contas excluídas a partir de backups. As páginas públicas publicadas deixam de ser exibidas imediatamente quando você as despublica ou exclui.",
    rightsHeading: "Seus direitos",
    rights:
      "Você pode acessar e exportar todos os seus dados (uma exportação em JSON com um clique), corrigi-los no editor, revogar o consentimento para pesquisa e excluir sua conta e todos os dados associados a qualquer momento — diretamente pelo aplicativo. Sob o GDPR e o APPI, você também tem o direito de apresentar uma reclamação à sua autoridade de proteção de dados.",
    contactHeading: "Contato",
    contact:
      "Para tirar uma dúvida ou exercer seus direitos, escreva ao controlador em privacy@sigmacv.org ou use a página de contato. Procuramos responder em até 30 dias.",
    sharingHeading: "Quem recebe seus dados e onde são armazenados",
    sharing:
      "Nunca vendemos seus dados nem os usamos para publicidade. Só os compartilhamos para operar o serviço: com nosso provedor de hospedagem na União Europeia (Alemanha), que os armazena em nosso nome sob um acordo de tratamento de dados; e, quando você entra ou sincroniza, com os serviços públicos de pesquisa que consultamos pelo seu identificador para montar seu currículo (OpenAlex, ORCID, Crossref, DataCite, OpenAIRE, DBLP, ROR e similares), que recebem seu iD ORCID ou nome para retornar seus registros públicos e atuam como controladores independentes desses dados públicos. Sua conta e seu currículo são armazenados na UE. O controlador também mantém cópias de backup no Japão em armazenamento criptografado, que não são compartilhadas com mais ninguém; o controlador reside no Japão, e as transferências entre o Japão e a UE são cobertas pela decisão de adequação mútua Japão-UE de 2019. Quando você opta por receber os resumos por e-mail ou confirma um e-mail de contato, entregamos essas mensagens por meio do SMTP2GO, um operador de entrega de e-mails sediado na Nova Zelândia, que recebe apenas o seu endereço de e-mail e o conteúdo da mensagem (no caso dos resumos, os títulos dos seus próprios trabalhos públicos) para enviar o e-mail em nosso nome; a Nova Zelândia é reconhecida pela UE como garantidora de um nível adequado de proteção de dados.",
    securityHeading: "Segurança e cookies",
    security:
      "Protegemos seus dados com HTTPS, controles de acesso e sessões armazenadas no banco de dados (os tokens de acesso dos provedores de login são descartados, não armazenados); o código passou por auditorias de segurança independentes e minimizamos o que guardamos. Usamos um único cookie estritamente necessário para manter você conectado e nenhum cookie de publicidade ou rastreamento. Para estatísticas de uso agregadas, usamos uma análise auto-hospedada, respeitosa com a privacidade e sem cookies — apenas primária, sem terceiros e sem rastreamento entre sites —, por isso nenhum aviso de cookies é necessário. Nenhum serviço on-line pode ser perfeitamente seguro, mas adotamos medidas razoáveis e auditadas.",
    authoritativeNote:
      "Este aviso é oferecido em vários idiomas por conveniência; havendo divergência, prevalece a versão em inglês.",
    updatedNote:
      "Podemos atualizar este aviso; alterações significativas no registro para pesquisa exigem renovação do consentimento.",
    backLink: "← Voltar ao SigmaCV",
  },
  "it-IT": {
    previewHeading: "Anteprima pubblica tramite ORCID",
    preview:
      "Chiunque può inserire un ORCID iD per vedere un CV costruito a partire da metadati di ricerca pubblici, senza account e senza accedere. L'anteprima è costruita solo dalle fonti pubbliche elencate sopra. Se l'iD inserito appartiene a una persona con un account SigmaCV, leggiamo inoltre le sue correzioni di disambiguazione e le applichiamo: i lavori contrassegnati come «non è mio» vengono rimossi e l'avviso «potrebbe non essere tuo» scompare dai lavori che ha verificato e mantenuto. Non leggiamo nient'altro dal suo account — né le scelte di visualizzazione, né note private, layout salvati o recapiti — e questo meccanismo può solo togliere un lavoro o togliere un avviso, mai aggiungere qualcosa che chi visita non vedrebbe altrimenti. La finalità è l'esattezza: l'abbinamento automatico degli autori fonde ricercatori con nomi simili, quindi rispettare le correzioni dell'interessato evita che a chi visita venga mostrato il lavoro di un'altra persona sotto quel nome (GDPR art. 6(1)(f), legittimo interesse, e art. 5(1)(d), esattezza). Se preferisci che le tue correzioni non siano usate così, scrivi a privacy@sigmacv.org e escluderemo il tuo profilo.",
    aiHeading: "Assistente di scrittura con IA (facoltativo)",
    ai: "Se usi l’assistente di scrittura con IA facoltativo, fornisci la chiave API del TUO fornitore di IA — resta solo nella memoria del tuo browser per la sessione, mai salvata nel tuo browser né sui nostri server. Quando richiedi una bozza, un breve riepilogo, solo pubblico, dei tuoi risultati visibili (il modulo, i conteggi e alcuni titoli, senza recapiti o identificativi) viene inoltrato dal nostro server al fornitore che TU scegli, con la TUA chiave, e nulla della richiesta viene conservato o registrato. Dove vanno i tuoi dati e come vengono trattati dipende dal fornitore e dai termini che TU scegli, quindi scegline uno di cui ti fidi (ad esempio un fornitore dell’UE come Mistral AI se ti interessa il trattamento nell’UE). La funzione è disattivata per impostazione predefinita, devi richiedere ogni bozza esplicitamente e accettare l’avviso, e il risultato non viene mai aggiunto automaticamente al tuo CV.",
    metaTitle: "Privacy",
    metaDescription:
      "Come SigmaCV gestisce i tuoi dati personali: minimizzazione dei dati, corrispondenza basata esclusivamente sugli identificatori e registrazione a fini di ricerca solo previo consenso esplicito (GDPR + APPI giapponese).",
    heading: "Privacy e protezione dei dati",
    intro:
      "SigmaCV è costruito sul principio della minimizzazione dei dati. Legge esclusivamente metadati pubblici di ricerca, associa i tuoi lavori tramite identificatore (ORCID / OpenAlex ID) — mai tramite il nome — e non registra nulla riguardo alle tue scelte a meno che tu non vi acconsenta esplicitamente. La presente informativa illustra quali dati trattiamo e i diritti che ti spettano ai sensi del GDPR dell'UE e dell'APPI giapponese.",
    controllerHeading: "Titolare del trattamento",
    controller:
      "SigmaCV è gestito da Basile Chrétien (PharmD, MSc, MPH) come progetto personale indipendente — non da un'università o da un datore di lavoro, né per loro conto — ed è l'unico titolare del trattamento dei dati personali trattati da SigmaCV. Per qualsiasi domanda o richiesta sulla privacy, contattalo all'indirizzo privacy@sigmacv.org.",
    dataHeading: "Quali dati trattiamo",
    data: "I dati dell'account forniti dal tuo provider di accesso (ORCID iD, oppure indirizzo email / account Google); i metadati pubblici di ricerca utilizzati per costruire il tuo CV (pubblicazioni, finanziamenti, affiliazioni e metriche provenienti da OpenAlex, ORCID, Crossref, DataCite e Open Editors Plus); i contenuti del CV e le scelte di visualizzazione che crei; e un'eventuale foto profilo che carichi. Il tuo CV è privato a meno che tu non scelga di pubblicare una pagina pubblica.",
    purposeHeading: "Finalità e base giuridica",
    purpose:
      "Trattiamo questi dati per fornire il servizio da te richiesto — generare ed esportare il tuo CV (GDPR Art. 6(1)(b), esecuzione di un contratto). La pubblicazione di una pagina pubblica del CV avviene esclusivamente su tua indicazione. Non vendiamo i tuoi dati né li utilizziamo a fini pubblicitari.",
    researchHeading: "Uso a fini di ricerca (solo con adesione)",
    research:
      "SigmaCV è anche un progetto di ricerca sulla valutazione responsabile della ricerca e sulla disambiguazione dei nomi degli autori. La registrazione delle tue scelte di curatela a fini di ricerca è DISATTIVATA per impostazione predefinita e avviene solo previo tuo consenso esplicito e separato (GDPR Art. 6(1)(a)). Puoi revocarlo in qualsiasi momento dal tuo account; la revoca interrompe le registrazioni future e cancella i dati di ricerca già raccolti. Le analisi confermative sono preregistrate e condotte nell'ambito di un protocollo etico/IRB. Qualora l'ambito della registrazione a fini di ricerca cambi in modo sostanziale, ti chiederemo nuovamente il consenso.",
    retentionHeading: "Conservazione",
    retention:
      "Conserviamo i dati del tuo account e del tuo CV finché non elimini il tuo account. L'eliminazione dell'account rimuove immediatamente il tuo profilo, il CV e qualsiasi dato di ricerca dal servizio attivo. I backup cifrati sono conservati a rotazione e sovrascritti entro 14 giorni, quindi un account eliminato scompare anche da questi entro tale periodo; non ripristiniamo account eliminati dai backup. Le pagine pubbliche pubblicate cessano immediatamente di essere erogate quando le ritiri dalla pubblicazione o le elimini.",
    rightsHeading: "I tuoi diritti",
    rights:
      "Puoi accedere a tutti i tuoi dati ed esportarli (un'esportazione JSON con un solo clic), correggerli nell'editor, revocare il consenso alla ricerca ed eliminare il tuo account e tutti i dati associati in qualsiasi momento — direttamente dall'app. Ai sensi del GDPR e dell'APPI hai inoltre il diritto di proporre reclamo alla tua autorità di protezione dei dati.",
    contactHeading: "Contatti",
    contact:
      "Per una domanda o per esercitare i tuoi diritti, scrivi al titolare del trattamento all'indirizzo privacy@sigmacv.org o usa la pagina dei contatti. Cerchiamo di rispondere entro 30 giorni.",
    sharingHeading: "Chi riceve i tuoi dati e dove sono conservati",
    sharing:
      "Non vendiamo mai i tuoi dati né li usiamo per la pubblicità. Li condividiamo solo per erogare il servizio: con il nostro fornitore di hosting nell'Unione Europea (Germania), che li conserva per nostro conto in base a un accordo sul trattamento dei dati; e, quando accedi o sincronizzi, con i servizi pubblici di ricerca che interroghiamo tramite il tuo identificativo per costruire il tuo CV (OpenAlex, ORCID, Crossref, DataCite, OpenAIRE, DBLP, ROR e simili), che ricevono il tuo iD ORCID o il tuo nome per restituire i tuoi record pubblici e agiscono come titolari autonomi di tali dati pubblici. Il tuo account e il tuo CV sono conservati nell'UE. Il titolare conserva inoltre copie di backup in Giappone su supporto cifrato, che non sono condivise con nessun altro; il titolare ha sede in Giappone e i trasferimenti tra Giappone e UE sono coperti dalla decisione di adeguatezza reciproca Giappone-UE del 2019. Quando aderisci ai riepiloghi via e-mail o confermi un'e-mail di contatto, recapitiamo tali messaggi tramite SMTP2GO, un responsabile del trattamento per il recapito delle e-mail con sede in Nuova Zelanda, che riceve solo il tuo indirizzo e-mail e il contenuto del messaggio (per i riepiloghi, i titoli dei tuoi lavori pubblici) per inviare l'e-mail per nostro conto; la Nuova Zelanda è riconosciuta dall'UE come Paese che garantisce un livello adeguato di protezione dei dati.",
    securityHeading: "Sicurezza e cookie",
    security:
      "Proteggiamo i tuoi dati con HTTPS, controlli di accesso e sessioni memorizzate nel database (i token di accesso dei provider di login vengono scartati, non conservati); il codice è stato sottoposto ad audit di sicurezza indipendenti e riduciamo al minimo ciò che conserviamo. Usiamo un unico cookie strettamente necessario per mantenerti autenticato e nessun cookie pubblicitario o di tracciamento. Per statistiche d'uso aggregate utilizziamo un sistema di analisi self-hosted, rispettoso della privacy e senza cookie — solo di prima parte, senza terze parti e senza tracciamento tra siti —, perciò non è necessario alcun banner sui cookie. Nessun servizio online può essere perfettamente sicuro, ma adottiamo misure ragionevoli e verificate.",
    authoritativeNote:
      "Questa informativa è fornita in più lingue per comodità; in caso di discrepanze prevale la versione inglese.",
    updatedNote:
      "Potremmo aggiornare la presente informativa; modifiche sostanziali alla registrazione a fini di ricerca richiedono un nuovo consenso.",
    backLink: "← Torna a SigmaCV",
  },
  "ko-KR": {
    previewHeading: "공개 ORCID 미리보기",
    preview:
      "누구나 ORCID iD를 입력하면 공개된 연구 메타데이터로 구성한 CV를 볼 수 있으며, 계정이나 로그인은 필요하지 않습니다. 이 미리보기는 위에 열거한 공개 출처만으로 만들어집니다. 입력한 iD가 SigmaCV 이용자의 것이라면, 그 본인의 귀속 정정 내용도 읽어 적용합니다. 본인이 “내 것이 아님”으로 표시한 업적은 제외하고, 확인 후 유지한 업적에서는 “회원님의 업적이 아닐 수 있습니다” 표시를 없앱니다. 계정에서 그 밖의 정보(표시 설정, 비공개 메모, 저장된 레이아웃, 연락처)는 읽지 않으며, 이 방식은 업적을 빼거나 경고를 없앨 수만 있을 뿐 방문자가 원래 보지 못했을 내용을 추가하지 않습니다. 목적은 정확성입니다. 자동 저자 매칭은 이름이 비슷한 연구자를 병합하므로, 본인의 정정을 존중하면 다른 사람의 업적이 그 이름으로 표시되는 것을 막을 수 있습니다(GDPR 제6조 1항 (f) 정당한 이익, 제5조 1항 (d) 정확성). 이런 이용을 원하지 않으시면 privacy@sigmacv.org 로 연락해 주시면 대상에서 제외하겠습니다.",
    aiHeading: "AI 초안 작성 도우미(선택)",
    ai: "선택적 AI 작성 도우미를 사용하는 경우, 본인 소유 AI 제공자의 API 키를 입력합니다 — 이 키는 세션 동안 브라우저 메모리에만 보관되며, 브라우저에도 당사 서버에도 저장되지 않습니다. 초안을 요청하면 표시된 성과에 대한 짧고 공개 정보만 담긴 요약(모듈, 성과 수, 일부 제목이며 연락처나 식별자는 포함되지 않음)이 당사 서버에서 귀하가 선택한 제공자로 귀하의 키를 사용해 중계되며, 요청 내용은 저장되거나 기록되지 않습니다. 데이터가 어디로 가고 어떻게 처리되는지는 귀하가 선택한 제공자와 그 약관에 따라 결정되므로, 신뢰할 수 있는 제공자를 선택하세요(EU 내 처리가 중요하다면 Mistral AI 같은 EU 제공자 등). 이 기능은 기본적으로 꺼져 있으며, 초안은 매번 명시적으로 요청하고 안내에 동의해야 하고, 결과가 자동으로 이력서에 추가되지 않습니다.",
    metaTitle: "개인정보 보호",
    metaDescription:
      "SigmaCV가 개인정보를 처리하는 방식: 데이터 최소화, 식별자 기반 매칭, 명시적 동의가 있는 경우에만 수행하는 연구 로깅(GDPR + 일본 APPI).",
    heading: "개인정보 보호 및 데이터 보호",
    intro:
      "SigmaCV는 데이터 최소화를 기반으로 구축되었습니다. 공개된 연구 메타데이터만을 읽어 들이며, 이름이 아닌 식별자(ORCID / OpenAlex ID)로 귀하의 성과물을 매칭합니다. 또한 귀하가 명시적으로 동의(opt in)하지 않는 한 귀하의 선택에 관한 어떤 것도 기록하지 않습니다. 본 고지는 당사가 처리하는 정보와, EU GDPR 및 일본 APPI에 따라 귀하가 가지는 권리를 설명합니다.",
    controllerHeading: "데이터 관리자",
    controller:
      "SigmaCV는 Basile Chrétien(PharmD, MSc, MPH)이 독립적인 개인 프로젝트로 운영합니다(대학이나 고용주가 운영하거나 이를 대리하지 않습니다). 그는 SigmaCV가 처리하는 개인정보의 유일한 관리자입니다. 개인정보 관련 문의나 요청은 privacy@sigmacv.org로 연락해 주십시오.",
    dataHeading: "당사가 처리하는 정보",
    data: "로그인 제공자로부터 받는 계정 데이터(ORCID iD, 또는 이메일 / Google 계정), CV를 구성하는 데 사용되는 공개 연구 메타데이터(OpenAlex, ORCID, Crossref, DataCite, Open Editors Plus의 출판물, 연구비, 소속 기관 및 지표), 귀하가 작성하는 CV 콘텐츠와 표시 선택 사항, 그리고 귀하가 업로드하는 선택적 프로필 사진을 처리합니다. 귀하가 공개 페이지를 게시하기로 선택하지 않는 한 귀하의 CV는 비공개로 유지됩니다.",
    purposeHeading: "목적 및 법적 근거",
    purpose:
      "당사는 귀하가 요청한 서비스, 즉 CV의 생성 및 내보내기를 제공하기 위해 이 데이터를 처리합니다(GDPR Art. 6(1)(b), 계약의 이행). 공개 CV 페이지 게시는 오직 귀하의 지시에 따라서만 이루어집니다. 당사는 귀하의 데이터를 판매하거나 광고에 사용하지 않습니다.",
    researchHeading: "연구 목적 이용(동의 시에만)",
    research:
      "SigmaCV는 책임 있는 연구 평가와 저자명 식별(disambiguation)에 관한 연구 프로젝트이기도 합니다. 연구를 위한 귀하의 큐레이션 선택 기록은 기본적으로 꺼져 있으며, 오직 귀하의 명시적이고 별도의 동의(GDPR Art. 6(1)(a))가 있는 경우에만 이루어집니다. 귀하는 언제든지 계정에서 동의를 철회할 수 있으며, 철회 시 향후의 기록이 중단되고 이미 수집된 연구 기록은 삭제됩니다. 확증적 분석은 사전 등록되며 윤리/IRB 프로토콜에 따라 수행됩니다. 연구 로깅의 범위가 실질적으로 변경되는 경우, 당사는 귀하의 동의를 다시 요청합니다.",
    retentionHeading: "보관 기간",
    retention:
      "당사는 귀하가 계정을 삭제할 때까지 귀하의 계정 및 CV 데이터를 보관합니다. 계정을 삭제하면 귀하의 프로필, CV, 그리고 모든 연구 기록이 운영 중인 서비스에서 즉시 제거됩니다. 암호화된 백업은 순환 방식으로 보관되어 14일 이내에 덮어쓰이므로, 삭제된 계정은 그 기간 내에 백업에서도 사라집니다. 당사는 삭제된 계정을 백업에서 복원하지 않습니다. 게시된 공개 페이지는 귀하가 게시를 해제하거나 삭제하는 즉시 제공이 중단됩니다.",
    rightsHeading: "귀하의 권리",
    rights:
      "귀하는 앱에서 직접 언제든지 모든 데이터를 열람하고 내보내며(원클릭 JSON 내보내기), 편집기에서 이를 수정하고, 연구 동의를 철회하며, 계정과 관련된 모든 데이터를 삭제할 수 있습니다. GDPR 및 APPI에 따라 귀하는 또한 귀하의 데이터 보호 감독 기관에 민원을 제기할 권리가 있습니다.",
    contactHeading: "문의처",
    contact:
      "문의하거나 귀하의 권리를 행사하려면 관리자(privacy@sigmacv.org)에게 이메일을 보내거나 문의 페이지를 이용해 주십시오. 저희는 30일 이내에 답변하도록 노력합니다.",
    sharingHeading: "데이터를 받는 대상과 저장 위치",
    sharing:
      "저희는 귀하의 데이터를 판매하지 않으며 광고에 사용하지 않습니다. 데이터는 서비스 운영에 필요한 경우에만 공유합니다. 즉, 데이터 처리 계약에 따라 저희를 대신해 데이터를 저장하는 유럽연합(독일)의 호스팅 제공업체, 그리고 로그인 또는 동기화 시 이력서를 작성하기 위해 귀하의 식별자로 조회하는 공개 연구 서비스(OpenAlex, ORCID, Crossref, DataCite, OpenAIRE, DBLP, ROR 등)입니다. 이들 서비스는 귀하의 공개 기록을 반환하기 위해 ORCID iD 또는 이름을 받으며, 해당 공개 데이터에 대해 독립적인 관리자로서 행동합니다. 귀하의 계정과 이력서는 EU에 저장됩니다. 백업 사본은 관리자가 일본에서 암호화된 저장장치에 보관하며, 다른 어떠한 제3자와도 공유하지 않습니다. 관리자는 일본에 있으며, 일본과 EU 간 이전은 2019년 일본—EU 상호 적정성 결정에 따라 보호됩니다. 귀하가 이메일 다이제스트 수신을 신청하거나 연락처 이메일을 확인하는 경우, 저희는 이러한 메시지를 뉴질랜드에 소재한 이메일 발송 처리자인 SMTP2GO를 통해 전송합니다. SMTP2GO는 저희를 대신하여 이메일을 발송하기 위해 귀하의 이메일 주소와 메시지 내용(다이제스트의 경우 귀하 본인의 공개 성과물 제목)만을 전달받습니다. 뉴질랜드는 적절한 수준의 데이터 보호를 보장하는 국가로 EU로부터 인정받고 있습니다.",
    securityHeading: "보안 및 쿠키",
    security:
      "저희는 HTTPS, 접근 통제, 데이터베이스 기반 세션(로그인 제공업체의 액세스 토큰은 저장하지 않고 폐기합니다)으로 데이터를 보호합니다. 코드는 독립적인 보안 감사를 거쳤으며, 보관하는 정보를 최소화합니다. 로그인 상태 유지를 위한 반드시 필요한 쿠키 하나만 사용하고 광고·추적 쿠키는 사용하지 않습니다. 집계된 사용 통계를 위해 개인정보를 존중하는 쿠키 없는 자체 호스팅 분석(퍼스트파티 전용, 제3자 없음, 사이트 간 추적 없음)을 사용하므로 쿠키 배너가 필요하지 않습니다. 완벽하게 안전한 온라인 서비스는 없지만, 저희는 합리적이고 감사를 거친 조치를 취합니다.",
    authoritativeNote:
      "이 고지는 편의를 위해 여러 언어로 제공됩니다. 내용이 다를 경우 영어본이 우선합니다.",
    updatedNote:
      "당사는 본 고지를 업데이트할 수 있으며, 연구 로깅에 대한 실질적 변경에는 새로운 동의가 필요합니다.",
    backLink: "← SigmaCV로 돌아가기",
  },
  "ru-RU": {
    previewHeading: "Публичный предпросмотр по ORCID",
    preview:
      "Любой может ввести ORCID iD и увидеть резюме, собранное из публичных исследовательских метаданных, без учётной записи и без входа в систему. Такой предпросмотр строится только из перечисленных выше публичных источников. Если введённый iD принадлежит пользователю SigmaCV, мы дополнительно считываем его собственные исправления атрибуции и применяем их: работы, отмеченные как «не моя», удаляются, а с работ, которые он проверил и оставил, снимается пометка «возможно, это не ваша работа». Ничего другого из учётной записи мы не читаем — ни настройки отображения, ни личные заметки, ни сохранённые макеты, ни контактные данные, — и этот механизм может только убрать работу или убрать предупреждение, но никогда не добавляет того, чего посетитель иначе не увидел бы. Цель — точность: автоматическое сопоставление авторов объединяет исследователей со схожими именами, поэтому учёт собственных исправлений человека не даёт показать посетителю чужую работу под его именем (GDPR ст. 6(1)(f), законный интерес, и ст. 5(1)(d), точность). Если вы предпочитаете, чтобы ваши исправления так не использовались, напишите на privacy@sigmacv.org, и мы исключим вашу запись.",
    aiHeading: "Помощник ИИ для черновиков (необязательно)",
    ai: "Если вы используете необязательного помощника ИИ, вы указываете API-ключ ВАШЕГО СОБСТВЕННОГО поставщика ИИ — он хранится только в памяти вашего браузера в течение сессии, никогда не сохраняется в вашем браузере или на наших серверах. Когда вы запрашиваете черновик, краткая сводка только из общедоступной информации о ваших видимых результатах (модуль, число результатов и несколько названий, без контактных данных и идентификаторов) передаётся с нашего сервера выбранному ВАМИ поставщику с использованием ВАШЕГО ключа, и ничего из запроса не сохраняется и не записывается в журнал. Куда идут ваши данные и как они обрабатываются, определяют выбранные ВАМИ поставщик и условия, поэтому выберите того, кому доверяете (например, поставщика из ЕС, такого как Mistral AI, если для вас важна обработка в ЕС). Функция по умолчанию отключена, вы должны явно запрашивать каждый черновик и принимать уведомление, а результат никогда не добавляется в резюме автоматически.",
    metaTitle: "Конфиденциальность",
    metaDescription:
      "Как SigmaCV обрабатывает ваши персональные данные: минимизация данных, сопоставление только по идентификатору и ведение исследовательских журналов только при наличии явного согласия (GDPR + Japan APPI).",
    heading: "Конфиденциальность и защита данных",
    intro:
      "SigmaCV построен на принципе минимизации данных. Он считывает только открытые научные метаданные, сопоставляет ваши работы по идентификатору (ORCID / OpenAlex ID), а не по имени, и не ведёт никаких записей о ваших действиях, если вы явно не дадите на это согласие. В настоящем уведомлении разъясняется, какие данные мы обрабатываем и какими правами вы обладаете в соответствии с GDPR ЕС и APPI Японии.",
    controllerHeading: "Контролёр данных",
    controller:
      "SigmaCV управляется Basile Chrétien (PharmD, MSc, MPH) как независимый личный проект — не университетом или работодателем и не от их имени, — и он является единственным контролёром персональных данных, обрабатываемых SigmaCV. По любым вопросам или запросам о конфиденциальности пишите ему на privacy@sigmacv.org.",
    dataHeading: "Какие данные мы обрабатываем",
    data: "Учётные данные от вашего провайдера входа (ORCID iD либо учётная запись электронной почты / Google); открытые научные метаданные, используемые для формирования вашего CV (публикации, гранты, аффилиации и метрики из OpenAlex, ORCID, Crossref, DataCite и Open Editors Plus); содержимое CV и выбранные вами параметры отображения; а также необязательное фото профиля, которое вы загружаете. Ваше CV является приватным, если вы не решите опубликовать общедоступную страницу.",
    purposeHeading: "Цель и правовое основание",
    purpose:
      "Мы обрабатываем эти данные для предоставления запрошенной вами услуги — формирования и экспорта вашего CV (GDPR Art. 6(1)(b), исполнение договора). Публикация общедоступной страницы CV происходит только по вашему указанию. Мы не продаём ваши данные и не используем их для рекламы.",
    researchHeading: "Использование в исследовательских целях (только при согласии)",
    research:
      "SigmaCV также является исследовательским проектом, посвящённым ответственной оценке научной деятельности и устранению неоднозначности имён авторов. Ведение журналов ваших решений по курированию в исследовательских целях по умолчанию ВЫКЛЮЧЕНО и осуществляется только при наличии вашего явного, отдельного согласия (GDPR Art. 6(1)(a)). Вы можете в любой момент отозвать его в своей учётной записи; отзыв прекращает дальнейшее ведение журналов и удаляет уже собранные исследовательские записи. Подтверждающие анализы предварительно регистрируются и проводятся в рамках этического протокола / протокола IRB. Если объём ведения исследовательских журналов существенно изменится, мы снова запросим ваше согласие.",
    retentionHeading: "Сроки хранения",
    retention:
      "Мы храним данные вашей учётной записи и CV до тех пор, пока вы не удалите свою учётную запись. Удаление учётной записи немедленно удаляет ваш профиль, CV и любые исследовательские записи из работающего сервиса. Зашифрованные резервные копии хранятся по скользящему графику и перезаписываются в течение 14 дней, поэтому удалённая учётная запись исчезает из них в этот срок; мы не восстанавливаем удалённые учётные записи из резервных копий. Опубликованные общедоступные страницы перестают обслуживаться немедленно при снятии публикации или удалении.",
    rightsHeading: "Ваши права",
    rights:
      "Вы можете получить доступ ко всем своим данным и экспортировать их (экспорт в JSON одним щелчком), исправить их в редакторе, отозвать согласие на исследования, а также удалить свою учётную запись и все связанные с ней данные в любое время — непосредственно в приложении. В соответствии с GDPR и APPI вы также имеете право подать жалобу в свой орган по защите данных.",
    contactHeading: "Контакты",
    contact:
      "Чтобы задать вопрос или реализовать свои права, напишите контролёру данных на privacy@sigmacv.org или воспользуйтесь страницей контактов. Мы стремимся ответить в течение 30 дней.",
    sharingHeading: "Кому передаются ваши данные и где они хранятся",
    sharing:
      "Мы никогда не продаём ваши данные и не используем их для рекламы. Мы передаём их только для работы сервиса: нашему хостинг-провайдеру в Европейском союзе (Германия), который хранит их от нашего имени на основании соглашения об обработке данных; и — когда вы входите или синхронизируете — публичным исследовательским сервисам, которые мы запрашиваем по вашему идентификатору для составления резюме (OpenAlex, ORCID, Crossref, DataCite, OpenAIRE, DBLP, ROR и аналогичным); они получают ваш ORCID iD или имя, чтобы вернуть ваши общедоступные записи, и действуют как самостоятельные контролёры этих общедоступных данных. Ваша учётная запись и резюме хранятся в ЕС. Резервные копии также хранятся контролёром в Японии на зашифрованном носителе и никому не передаются; контролёр находится в Японии, а передача данных между Японией и ЕС покрывается решением о взаимной адекватности Япония–ЕС 2019 года. Когда вы подписываетесь на дайджесты по электронной почте или подтверждаете контактный адрес электронной почты, мы доставляем эти сообщения через SMTP2GO — обработчика доставки электронной почты, расположенного в Новой Зеландии, который получает только ваш адрес электронной почты и содержимое сообщения (для дайджестов — названия ваших собственных общедоступных работ), чтобы отправить письмо от нашего имени; Новая Зеландия признана ЕС как обеспечивающая надлежащий уровень защиты данных.",
    securityHeading: "Безопасность и файлы cookie",
    security:
      "Мы защищаем ваши данные с помощью HTTPS, контроля доступа и сессий на основе базы данных (токены доступа поставщиков входа отбрасываются, а не хранятся); код прошёл независимые аудиты безопасности, и мы минимизируем объём хранимых данных. Мы используем один строго необходимый файл cookie для сохранения входа в систему и не используем рекламные или отслеживающие файлы cookie. Для агрегированной статистики использования мы применяем самостоятельно размещённую аналитику, уважающую конфиденциальность и не использующую cookie, — только первой стороны, без третьих сторон и без межсайтового отслеживания, — поэтому баннер о cookie не требуется. Ни один онлайн-сервис не может быть абсолютно безопасным, но мы принимаем разумные и проверенные меры.",
    authoritativeNote:
      "Это уведомление предоставляется на нескольких языках для удобства; в случае расхождений преимущественную силу имеет английская версия.",
    updatedNote:
      "Мы можем обновлять настоящее уведомление; существенные изменения в ведении исследовательских журналов требуют повторного согласия.",
    backLink: "← Назад к SigmaCV",
  },
};

/** Localized privacy-notice strings (falls back to English for unknown locales). */
export function privacyStrings(locale: string): PrivacyStrings {
  return PRIVACY_I18N[asLocale(locale)];
}
