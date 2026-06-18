import { asLocale, type Locale } from "./index";

/**
 * Terms-of-Use copy, localized for all 10 supported languages. Typed as
 * Record<Locale, TermsStrings> so a missing translation is a compile error.
 * Used by the default `/terms` and the localized `/[locale]/terms` routes.
 *
 * This is a short, plain-language Terms of Use for a FREE, open-source,
 * personally-run service: acceptance, what the service is, accounts, user
 * content + licence, acceptable use, the auto-generated-data disclaimer, an
 * "as-is"/no-warranty clause, limitation of liability, termination, changes,
 * IP, a pointer to the privacy notice, and governing law (Japan, with a
 * mandatory-consumer-rights carve-out). It complements — and incorporates by
 * reference — the privacy notice (`./privacy.ts`). Proper nouns (SigmaCV,
 * OpenAlex, ORCID, GitHub, …) and the operator's name are kept untranslated.
 */
export interface TermsStrings {
  metaTitle: string;
  metaDescription: string;
  heading: string;
  /** Acceptance — "by using SigmaCV you agree to these terms". */
  intro: string;
  serviceHeading: string;
  service: string;
  eligibilityHeading: string;
  eligibility: string;
  contentHeading: string;
  content: string;
  acceptableUseHeading: string;
  acceptableUse: string;
  accuracyHeading: string;
  accuracy: string;
  warrantyHeading: string;
  warranty: string;
  liabilityHeading: string;
  liability: string;
  terminationHeading: string;
  termination: string;
  changesHeading: string;
  changes: string;
  ipHeading: string;
  ip: string;
  privacyHeading: string;
  privacyBody: string;
  lawHeading: string;
  law: string;
  contactHeading: string;
  contact: string;
  /** "English is the authoritative version" note for the multilingual terms. */
  authoritativeNote: string;
  updatedNote: string;
  backLink: string;
  /** Short label for the site footer / nav. */
  navLabel: string;
}

const TERMS_I18N: Record<Locale, TermsStrings> = {
  "en-US": {
    metaTitle: "Terms of Use",
    metaDescription:
      "The terms governing use of SigmaCV — a free, open-source, as-is service that builds academic CVs from public research data: your responsibilities, our disclaimers, and the governing law.",
    heading: "Terms of Use",
    intro:
      "These Terms of Use govern your use of SigmaCV at sigmacv.org and its pages. By creating an account or otherwise using SigmaCV, you agree to them. If you do not agree, please do not use the service. They apply alongside our Privacy & Data Protection notice, which is incorporated here by reference.",
    serviceHeading: "The service",
    service:
      "SigmaCV is a free, open-source tool that assembles an academic CV from public research metadata and lets you curate, style, export, and optionally publish it. It is operated by Basile Chrétien (PharmD, MSc, MPH) as an independent personal project — not by, or on behalf of, any university or employer — and is provided free of charge for individual, non-commercial use.",
    eligibilityHeading: "Accounts & eligibility",
    eligibility:
      "Using SigmaCV requires signing in through a supported provider (ORCID, Google, or email). You are responsible for activity under your account and for keeping your sign-in method secure. You must be at least 16, or the age of digital consent in your country, to create an account. Do not impersonate anyone else or misrepresent your identity or affiliation.",
    contentHeading: "Your content",
    content:
      "You keep ownership of the CV content and any profile photo you add. You are responsible for what your CV contains and, if you publish a public page, for what you make public — including ensuring you have the right to use anything you upload and that it is accurate and not misleading. You grant SigmaCV the limited permission needed to store, process, and display your content so the service can work — for example, to render your CV, generate exports, and serve your public page when you choose to publish. We claim no other rights over your content, and the permission ends when you delete the content or your account.",
    acceptableUseHeading: "Acceptable use",
    acceptableUse:
      "Use SigmaCV only for lawful purposes and as intended. Do not: upload or publish unlawful, infringing, hateful, or deliberately false content; impersonate another researcher or claim work that is not yours; attempt to break, overload, probe, or gain unauthorised access to the service or its infrastructure; bulk-extract data by means other than the features provided; or use the service in a way that breaches the terms of the public data sources it relies on. We may remove content or restrict access that breaks these rules.",
    accuracyHeading: "Auto-generated data",
    accuracy:
      "SigmaCV builds your CV from third-party public sources (OpenAlex, ORCID, Crossref, DataCite and others). That data can be incomplete, out of date, or wrongly attributed — for example, a publication by a different researcher with a similar name. The service flags likely mismatches, but you are responsible for reviewing and correcting your CV before relying on it or publishing it. We do not warrant the accuracy or completeness of data obtained from these sources.",
    warrantyHeading: "No warranty",
    warranty:
      "SigmaCV is provided “as is” and “as available”, without warranties of any kind, express or implied, including fitness for a particular purpose, accuracy, or uninterrupted availability. Because the service is free and personally run, it may change, become unavailable, or be discontinued at any time. To the maximum extent permitted by law, we disclaim all warranties not expressly stated here.",
    liabilityHeading: "Limitation of liability",
    liability:
      "To the maximum extent permitted by applicable law, the operator will not be liable for any indirect, incidental, or consequential damages, or for loss of data, opportunities, or reputation, arising from your use of (or inability to use) SigmaCV — including any reliance on auto-generated CV data. Nothing here limits liability that cannot be limited by law.",
    terminationHeading: "Suspension & termination",
    termination:
      "You can stop using SigmaCV at any time and delete your account and all associated data from within the app. We may suspend or end access if you materially breach these terms or use the service in a way that harms it or its users — where practical, with notice. If the service is discontinued, we will give reasonable notice so you can export your data first.",
    changesHeading: "Changes",
    changes:
      "We may update these terms as the service evolves. When changes are material we will note them on this page and update the date below; continuing to use SigmaCV after a change means you accept the revised terms. If you do not agree to a change, please delete your account.",
    ipHeading: "Intellectual property",
    ip: "The SigmaCV software is open source under its licence on GitHub — your rights to the code come from that licence. The SigmaCV name, look, and branding belong to the operator and are not granted by these terms or by the software licence. Third-party data and citation styles remain the property of their sources and are used under their own terms.",
    privacyHeading: "Privacy",
    privacyBody:
      "How we handle your personal data — data minimisation, identifier-only matching, and research logging only with your explicit consent — is described in our Privacy & Data Protection notice, which forms part of these terms.",
    lawHeading: "Governing law",
    law: "These terms are governed by the laws of Japan, where the operator is established, without regard to conflict-of-law rules. If you use SigmaCV as a consumer, this does not deprive you of the protection of the mandatory consumer-protection rules of your country of residence — for example, in the EU. We aim to resolve any dispute amicably, so please contact us first.",
    contactHeading: "Contact",
    contact:
      "Questions about these terms? Email the operator at privacy@sigmacv.org or use the contact page.",
    authoritativeNote:
      "These terms are provided in several languages for convenience; if the versions differ, the English text prevails.",
    updatedNote: "Last updated June 2026.",
    backLink: "← Back to SigmaCV",
    navLabel: "Terms",
  },
  "zh-CN": {
    metaTitle: "使用条款",
    metaDescription:
      "管理 SigmaCV 使用的条款——一项免费、开源、按现状提供、依据公开研究数据生成学术简历的服务：您的责任、我们的免责声明以及适用法律。",
    heading: "使用条款",
    intro:
      "本使用条款管理您对 sigmacv.org 上的 SigmaCV 及其页面的使用。创建账户或以其他方式使用 SigmaCV，即表示您同意本条款。如不同意，请勿使用本服务。本条款与我们的《隐私与数据保护声明》一并适用，该声明以引用方式纳入本条款。",
    serviceHeading: "本服务",
    service:
      "SigmaCV 是一款免费、开源的工具，依据公开的研究元数据生成学术简历，并允许您对其进行策展、设计样式、导出以及（可选）发布。它由 Basile Chrétien（PharmD、MSc、MPH）作为独立的个人项目运营——并非由任何大学或雇主运营，也非代表其运营——并面向个人、非商业用途免费提供。",
    eligibilityHeading: "账户与使用资格",
    eligibility:
      "使用 SigmaCV 需要通过受支持的提供方（ORCID、Google 或电子邮件）登录。您对其账户下的活动以及妥善保管登录方式负责。您必须年满 16 周岁，或达到您所在国家／地区的数字同意年龄，方可创建账户。请勿冒充他人，也不得虚报您的身份或所属机构。",
    contentHeading: "您的内容",
    content:
      "您保留对简历内容以及您添加的任何个人照片的所有权。您对简历所含内容负责；若您发布公开页面，则对公开的内容负责——包括确保您有权使用所上传的任何内容，且该内容准确、不具误导性。您授予 SigmaCV 运行本服务所需的有限许可，以便存储、处理和展示您的内容——例如渲染您的简历、生成导出文件，以及在您选择发布时提供您的公开页面。除此之外我们不主张对您内容的任何权利，且该许可在您删除内容或账户时终止。",
    acceptableUseHeading: "可接受的使用",
    acceptableUse:
      "请仅将 SigmaCV 用于合法目的并按其预期使用。请勿：上传或发布违法、侵权、仇恨或故意虚假的内容；冒充其他研究者或声称并非您本人的成果；试图破坏、超载、探测或未经授权访问本服务或其基础设施；以所提供功能以外的方式批量提取数据；或以违反其所依赖的公开数据源条款的方式使用本服务。对于违反上述规则的内容或访问，我们可予以移除或限制。",
    accuracyHeading: "自动生成的数据",
    accuracy:
      "SigmaCV 依据第三方公开来源（OpenAlex、ORCID、Crossref、DataCite 等）生成您的简历。这些数据可能不完整、过时或被错误归属——例如某篇论文实为同名的另一位研究者所作。本服务会标记可能的不匹配，但在依赖或发布简历之前，您有责任进行核查与更正。我们不保证从这些来源获得的数据的准确性或完整性。",
    warrantyHeading: "不作保证",
    warranty:
      "SigmaCV 按「现状（as is）」及「可提供的现有状态（as available）」提供，不附带任何明示或默示的保证，包括对特定用途的适用性、准确性或不间断可用性的保证。由于本服务免费且由个人运营，它可能随时变更、不可用或停止提供。在法律允许的最大范围内，我们对本条款未明确载明的一切保证不予承担。",
    liabilityHeading: "责任限制",
    liability:
      "在适用法律允许的最大范围内，运营者对因您使用（或无法使用）SigmaCV 而产生的任何间接、附带或后果性损害，或数据、机会或声誉的损失概不负责——包括对自动生成的简历数据的任何依赖。本条款中的任何内容均不限制依法不可限制的责任。",
    terminationHeading: "暂停与终止",
    termination:
      "您可随时停止使用 SigmaCV，并在应用内删除您的账户及所有关联数据。如您严重违反本条款，或以损害本服务或其用户的方式使用本服务，我们可暂停或终止访问——在可行的情况下会事先通知。如本服务停止运营，我们会给予合理的提前通知，以便您先行导出数据。",
    changesHeading: "变更",
    changes:
      "随着服务的发展，我们可能会更新本条款。发生实质性变更时，我们会在本页面注明并更新下方日期；在变更后继续使用 SigmaCV 即表示您接受修订后的条款。如您不同意某项变更，请删除您的账户。",
    ipHeading: "知识产权",
    ip: "SigmaCV 软件为开源软件，依据其在 GitHub 上的许可证提供——您对代码的权利来自该许可证。SigmaCV 的名称、外观及品牌标识归运营者所有，本条款或软件许可证均未授予这些权利。第三方数据及引用样式仍归各自来源所有，并按其各自条款使用。",
    privacyHeading: "隐私",
    privacyBody:
      "我们如何处理您的个人数据——数据最小化、仅基于标识符的匹配，以及仅在您明确同意后进行的研究日志记录——详见我们的《隐私与数据保护声明》，该声明构成本条款的一部分。",
    lawHeading: "适用法律",
    law: "本条款受运营者所在地日本的法律管辖，不适用法律冲突规则。如您作为消费者使用 SigmaCV，这不会剥夺您在常住国家／地区（例如欧盟）依强制性消费者保护规则所享有的保护。我们力求友好解决任何争议，因此请先与我们联系。",
    contactHeading: "联系方式",
    contact: "对本条款有疑问？请发送电子邮件至运营者 privacy@sigmacv.org，或使用联系页面。",
    authoritativeNote: "本条款以多种语言提供仅为方便之用；如各版本存在差异，以英文版本为准。",
    updatedNote: "最后更新于 2026 年 6 月。",
    backLink: "← 返回 SigmaCV",
    navLabel: "使用条款",
  },
  "es-ES": {
    metaTitle: "Condiciones de uso",
    metaDescription:
      "Las condiciones que rigen el uso de SigmaCV —un servicio gratuito, de código abierto y «tal cual» que crea CV académicos a partir de datos públicos de investigación—: sus responsabilidades, nuestras exenciones y la ley aplicable.",
    heading: "Condiciones de uso",
    intro:
      "Estas Condiciones de uso rigen su uso de SigmaCV en sigmacv.org y sus páginas. Al crear una cuenta o usar SigmaCV de cualquier otro modo, usted las acepta. Si no está de acuerdo, no use el servicio. Se aplican junto con nuestro Aviso de privacidad y protección de datos, que se incorpora aquí por referencia.",
    serviceHeading: "El servicio",
    service:
      "SigmaCV es una herramienta gratuita y de código abierto que crea un CV académico a partir de metadatos públicos de investigación y le permite curarlo, darle estilo, exportarlo y, opcionalmente, publicarlo. Está gestionado por Basile Chrétien (PharmD, MSc, MPH) como un proyecto personal independiente —no por una universidad o empleador, ni en su nombre— y se ofrece de forma gratuita para uso individual y no comercial.",
    eligibilityHeading: "Cuentas y requisitos",
    eligibility:
      "Para usar SigmaCV es necesario iniciar sesión a través de un proveedor compatible (ORCID, Google o correo electrónico). Usted es responsable de la actividad de su cuenta y de mantener seguro su método de acceso. Debe tener al menos 16 años, o la edad de consentimiento digital de su país, para crear una cuenta. No suplante a nadie ni falsee su identidad o afiliación.",
    contentHeading: "Su contenido",
    content:
      "Usted conserva la titularidad del contenido del CV y de cualquier foto de perfil que añada. Es responsable de lo que contenga su CV y, si publica una página pública, de lo que haga público —incluido asegurarse de tener derecho a usar todo lo que suba y de que sea exacto y no engañoso—. Usted concede a SigmaCV el permiso limitado necesario para almacenar, procesar y mostrar su contenido a fin de que el servicio funcione —por ejemplo, para representar su CV, generar exportaciones y servir su página pública cuando decida publicarla—. No reclamamos ningún otro derecho sobre su contenido, y el permiso finaliza cuando elimina el contenido o su cuenta.",
    acceptableUseHeading: "Uso aceptable",
    acceptableUse:
      "Use SigmaCV solo con fines lícitos y según lo previsto. No: suba ni publique contenido ilícito, infractor, de odio o deliberadamente falso; suplante a otro investigador ni se atribuya trabajos que no son suyos; intente dañar, sobrecargar, sondear u obtener acceso no autorizado al servicio o a su infraestructura; extraiga datos de forma masiva por medios distintos de las funciones ofrecidas; ni use el servicio de un modo que infrinja las condiciones de las fuentes públicas de datos en las que se basa. Podemos retirar contenido o restringir el acceso que infrinja estas reglas.",
    accuracyHeading: "Datos generados automáticamente",
    accuracy:
      "SigmaCV crea su CV a partir de fuentes públicas de terceros (OpenAlex, ORCID, Crossref, DataCite y otras). Esos datos pueden estar incompletos, desactualizados o mal atribuidos —por ejemplo, una publicación de otro investigador con un nombre similar—. El servicio señala las posibles discrepancias, pero usted es responsable de revisar y corregir su CV antes de fiarse de él o publicarlo. No garantizamos la exactitud ni la integridad de los datos obtenidos de esas fuentes.",
    warrantyHeading: "Sin garantía",
    warranty:
      "SigmaCV se ofrece «tal cual» y «según disponibilidad», sin garantías de ningún tipo, expresas o implícitas, incluidas la idoneidad para un fin concreto, la exactitud o la disponibilidad ininterrumpida. Al ser un servicio gratuito y de gestión personal, puede cambiar, dejar de estar disponible o discontinuarse en cualquier momento. En la máxima medida permitida por la ley, declinamos toda garantía no indicada expresamente aquí.",
    liabilityHeading: "Limitación de responsabilidad",
    liability:
      "En la máxima medida permitida por la ley aplicable, el responsable no será responsable de daños indirectos, incidentales o consecuentes, ni de la pérdida de datos, oportunidades o reputación, derivados de su uso (o de la imposibilidad de uso) de SigmaCV —incluida cualquier confianza en los datos del CV generados automáticamente—. Nada de lo aquí dispuesto limita la responsabilidad que no pueda limitarse por ley.",
    terminationHeading: "Suspensión y cancelación",
    termination:
      "Puede dejar de usar SigmaCV en cualquier momento y eliminar su cuenta y todos los datos asociados desde la propia aplicación. Podemos suspender o cancelar el acceso si incumple de forma sustancial estas condiciones o usa el servicio de un modo que lo perjudique a él o a sus usuarios —cuando sea viable, con previo aviso—. Si el servicio se discontinúa, daremos un aviso razonable para que pueda exportar antes sus datos.",
    changesHeading: "Cambios",
    changes:
      "Podemos actualizar estas condiciones a medida que evoluciona el servicio. Cuando los cambios sean sustanciales, los señalaremos en esta página y actualizaremos la fecha de abajo; seguir usando SigmaCV tras un cambio significa que acepta las condiciones revisadas. Si no está de acuerdo con un cambio, elimine su cuenta.",
    ipHeading: "Propiedad intelectual",
    ip: "El software de SigmaCV es de código abierto bajo su licencia en GitHub —sus derechos sobre el código provienen de esa licencia—. El nombre, la apariencia y la marca de SigmaCV pertenecen al responsable y no se conceden por estas condiciones ni por la licencia del software. Los datos de terceros y los estilos de citación siguen siendo propiedad de sus fuentes y se usan conforme a sus propias condiciones.",
    privacyHeading: "Privacidad",
    privacyBody:
      "Cómo tratamos sus datos personales —minimización de datos, emparejamiento basado solo en identificadores y registro con fines de investigación únicamente con su consentimiento explícito— se describe en nuestro Aviso de privacidad y protección de datos, que forma parte de estas condiciones.",
    lawHeading: "Ley aplicable",
    law: "Estas condiciones se rigen por las leyes de Japón, donde está establecido el responsable, sin atender a las normas de conflicto de leyes. Si usa SigmaCV como consumidor, esto no le priva de la protección de las normas imperativas de protección del consumidor de su país de residencia —por ejemplo, en la UE—. Procuramos resolver cualquier disputa de forma amistosa, así que contáctenos primero.",
    contactHeading: "Contacto",
    contact:
      "¿Dudas sobre estas condiciones? Escriba al responsable a privacy@sigmacv.org o use la página de contacto.",
    authoritativeNote:
      "Estas condiciones se ofrecen en varios idiomas por comodidad; en caso de discrepancia, prevalece la versión en inglés.",
    updatedNote: "Última actualización: junio de 2026.",
    backLink: "← Volver a SigmaCV",
    navLabel: "Condiciones",
  },
  "fr-FR": {
    metaTitle: "Conditions d’utilisation",
    metaDescription:
      "Les conditions régissant l’utilisation de SigmaCV — un service gratuit, open source et « en l’état » qui construit des CV académiques à partir de données de recherche publiques : vos responsabilités, nos clauses de non-responsabilité et le droit applicable.",
    heading: "Conditions d’utilisation",
    intro:
      "Les présentes Conditions d’utilisation régissent votre utilisation de SigmaCV sur sigmacv.org et ses pages. En créant un compte ou en utilisant SigmaCV de quelque manière que ce soit, vous les acceptez. Si vous n’êtes pas d’accord, n’utilisez pas le service. Elles s’appliquent conjointement avec notre Avis de confidentialité et de protection des données, qui y est intégré par renvoi.",
    serviceHeading: "Le service",
    service:
      "SigmaCV est un outil gratuit et open source qui construit un CV académique à partir de métadonnées de recherche publiques et vous permet de le curer, de le mettre en forme, de l’exporter et, éventuellement, de le publier. Il est exploité par Basile Chrétien (PharmD, MSc, MPH) en tant que projet personnel indépendant — non par une université ou un employeur, ni en leur nom — et est fourni gratuitement pour un usage individuel et non commercial.",
    eligibilityHeading: "Comptes et conditions d’accès",
    eligibility:
      "L’utilisation de SigmaCV nécessite une connexion via un fournisseur pris en charge (ORCID, Google ou e-mail). Vous êtes responsable de l’activité sur votre compte et de la sécurité de votre moyen de connexion. Vous devez avoir au moins 16 ans, ou l’âge du consentement numérique dans votre pays, pour créer un compte. N’usurpez l’identité de personne et ne donnez pas de fausses informations sur votre identité ou votre affiliation.",
    contentHeading: "Votre contenu",
    content:
      "Vous conservez la propriété du contenu du CV et de toute photo de profil que vous ajoutez. Vous êtes responsable du contenu de votre CV et, si vous publiez une page publique, de ce que vous rendez public — y compris de vous assurer que vous avez le droit d’utiliser tout ce que vous téléversez et que c’est exact et non trompeur. Vous accordez à SigmaCV la permission limitée nécessaire pour stocker, traiter et afficher votre contenu afin que le service fonctionne — par exemple pour afficher votre CV, générer des exports et servir votre page publique lorsque vous choisissez de la publier. Nous ne revendiquons aucun autre droit sur votre contenu, et la permission prend fin lorsque vous supprimez le contenu ou votre compte.",
    acceptableUseHeading: "Utilisation acceptable",
    acceptableUse:
      "N’utilisez SigmaCV qu’à des fins licites et conformément à sa destination. Ne pas : téléverser ou publier de contenu illicite, contrefaisant, haineux ou délibérément faux ; usurper l’identité d’un autre chercheur ou revendiquer des travaux qui ne sont pas les vôtres ; tenter d’endommager, de surcharger, de sonder ou d’accéder sans autorisation au service ou à son infrastructure ; extraire des données en masse par d’autres moyens que les fonctionnalités proposées ; ou utiliser le service d’une manière qui enfreint les conditions des sources de données publiques dont il dépend. Nous pouvons retirer un contenu ou restreindre un accès qui enfreint ces règles.",
    accuracyHeading: "Données générées automatiquement",
    accuracy:
      "SigmaCV construit votre CV à partir de sources publiques tierces (OpenAlex, ORCID, Crossref, DataCite et autres). Ces données peuvent être incomplètes, obsolètes ou mal attribuées — par exemple une publication d’un autre chercheur portant un nom similaire. Le service signale les incohérences probables, mais il vous incombe de vérifier et de corriger votre CV avant de vous y fier ou de le publier. Nous ne garantissons ni l’exactitude ni l’exhaustivité des données obtenues de ces sources.",
    warrantyHeading: "Absence de garantie",
    warranty:
      "SigmaCV est fourni « en l’état » et « selon disponibilité », sans garantie d’aucune sorte, expresse ou implicite, y compris d’adéquation à un usage particulier, d’exactitude ou de disponibilité ininterrompue. Le service étant gratuit et géré à titre personnel, il peut changer, devenir indisponible ou être interrompu à tout moment. Dans toute la mesure permise par la loi, nous déclinons toute garantie non expressément énoncée ici.",
    liabilityHeading: "Limitation de responsabilité",
    liability:
      "Dans toute la mesure permise par le droit applicable, l’exploitant ne saurait être tenu responsable des dommages indirects, accessoires ou consécutifs, ni de la perte de données, d’opportunités ou de réputation, résultant de votre utilisation (ou de l’impossibilité d’utiliser) SigmaCV — y compris de toute confiance accordée aux données de CV générées automatiquement. Rien dans les présentes ne limite la responsabilité qui ne peut être limitée par la loi.",
    terminationHeading: "Suspension et résiliation",
    termination:
      "Vous pouvez cesser d’utiliser SigmaCV à tout moment et supprimer votre compte ainsi que toutes les données associées depuis l’application. Nous pouvons suspendre ou mettre fin à l’accès si vous manquez gravement aux présentes conditions ou utilisez le service d’une manière qui lui nuit ou nuit à ses utilisateurs — avec préavis lorsque c’est possible. En cas d’arrêt du service, nous donnerons un préavis raisonnable afin que vous puissiez d’abord exporter vos données.",
    changesHeading: "Modifications",
    changes:
      "Nous pouvons mettre à jour ces conditions à mesure que le service évolue. Lorsque les modifications sont substantielles, nous les signalerons sur cette page et mettrons à jour la date ci-dessous ; continuer à utiliser SigmaCV après une modification vaut acceptation des conditions révisées. Si vous n’acceptez pas une modification, veuillez supprimer votre compte.",
    ipHeading: "Propriété intellectuelle",
    ip: "Le logiciel SigmaCV est open source sous sa licence sur GitHub — vos droits sur le code découlent de cette licence. Le nom, l’apparence et la marque SigmaCV appartiennent à l’exploitant et ne sont concédés ni par les présentes conditions ni par la licence du logiciel. Les données de tiers et les styles de citation restent la propriété de leurs sources et sont utilisés selon leurs propres conditions.",
    privacyHeading: "Confidentialité",
    privacyBody:
      "La manière dont nous traitons vos données personnelles — minimisation des données, appariement par identifiant uniquement et journalisation à des fins de recherche seulement avec votre consentement explicite — est décrite dans notre Avis de confidentialité et de protection des données, qui fait partie des présentes conditions.",
    lawHeading: "Droit applicable",
    law: "Les présentes conditions sont régies par le droit du Japon, où l’exploitant est établi, sans égard aux règles de conflit de lois. Si vous utilisez SigmaCV en tant que consommateur, cela ne vous prive pas de la protection des règles impératives de protection des consommateurs de votre pays de résidence — par exemple au sein de l’UE. Nous cherchons à résoudre tout litige à l’amiable ; veuillez donc nous contacter en premier lieu.",
    contactHeading: "Contact",
    contact:
      "Des questions sur ces conditions ? Écrivez à l’exploitant à privacy@sigmacv.org ou utilisez la page de contact.",
    authoritativeNote:
      "Ces conditions sont proposées en plusieurs langues par commodité ; en cas de divergence, la version anglaise prévaut.",
    updatedNote: "Dernière mise à jour : juin 2026.",
    backLink: "← Retour à SigmaCV",
    navLabel: "Conditions",
  },
  "de-DE": {
    metaTitle: "Nutzungsbedingungen",
    metaDescription:
      "Die Bedingungen für die Nutzung von SigmaCV – einem kostenlosen, quelloffenen Dienst, der „wie besehen“ akademische Lebensläufe aus öffentlichen Forschungsdaten erstellt: Ihre Pflichten, unsere Haftungsausschlüsse und das anwendbare Recht.",
    heading: "Nutzungsbedingungen",
    intro:
      "Diese Nutzungsbedingungen regeln Ihre Nutzung von SigmaCV unter sigmacv.org und seinen Seiten. Mit dem Erstellen eines Kontos oder der sonstigen Nutzung von SigmaCV stimmen Sie ihnen zu. Wenn Sie nicht einverstanden sind, nutzen Sie den Dienst bitte nicht. Sie gelten zusammen mit unserem Datenschutzhinweis, der hier durch Verweis einbezogen wird.",
    serviceHeading: "Der Dienst",
    service:
      "SigmaCV ist ein kostenloses, quelloffenes Werkzeug, das aus öffentlichen Forschungsmetadaten einen akademischen Lebenslauf erstellt und es Ihnen ermöglicht, ihn zu kuratieren, zu gestalten, zu exportieren und optional zu veröffentlichen. Er wird von Basile Chrétien (PharmD, MSc, MPH) als unabhängiges privates Projekt betrieben – nicht von einer Universität oder einem Arbeitgeber bzw. in deren Auftrag – und wird kostenlos für die individuelle, nicht-kommerzielle Nutzung bereitgestellt.",
    eligibilityHeading: "Konten & Voraussetzungen",
    eligibility:
      "Die Nutzung von SigmaCV erfordert eine Anmeldung über einen unterstützten Anbieter (ORCID, Google oder E-Mail). Sie sind für Aktivitäten unter Ihrem Konto und für die Sicherheit Ihres Anmeldewegs verantwortlich. Sie müssen mindestens 16 Jahre alt sein bzw. das Alter der digitalen Einwilligungsfähigkeit in Ihrem Land erreicht haben, um ein Konto zu erstellen. Geben Sie sich nicht als jemand anderes aus und machen Sie keine falschen Angaben zu Ihrer Identität oder Zugehörigkeit.",
    contentHeading: "Ihre Inhalte",
    content:
      "Das Eigentum an den Lebenslauf-Inhalten und an einem von Ihnen hinzugefügten Profilfoto verbleibt bei Ihnen. Sie sind dafür verantwortlich, was Ihr Lebenslauf enthält, und – falls Sie eine öffentliche Seite veröffentlichen – dafür, was Sie öffentlich machen; dazu gehört, dass Sie das Recht haben, alles Hochgeladene zu verwenden, und dass es zutreffend und nicht irreführend ist. Sie räumen SigmaCV die begrenzte Erlaubnis ein, die nötig ist, um Ihre Inhalte zu speichern, zu verarbeiten und anzuzeigen, damit der Dienst funktioniert – etwa um Ihren Lebenslauf darzustellen, Exporte zu erzeugen und Ihre öffentliche Seite auszuliefern, wenn Sie sie veröffentlichen. Wir beanspruchen keine weiteren Rechte an Ihren Inhalten, und die Erlaubnis endet, wenn Sie die Inhalte oder Ihr Konto löschen.",
    acceptableUseHeading: "Zulässige Nutzung",
    acceptableUse:
      "Nutzen Sie SigmaCV nur zu rechtmäßigen Zwecken und bestimmungsgemäß. Unterlassen Sie es: rechtswidrige, rechtsverletzende, hetzerische oder absichtlich falsche Inhalte hochzuladen oder zu veröffentlichen; sich als andere Forschende auszugeben oder Arbeiten zu beanspruchen, die nicht Ihre sind; den Dienst oder seine Infrastruktur zu beschädigen, zu überlasten, auszuspähen oder sich unbefugt Zugang zu verschaffen; Daten auf anderem Wege als über die bereitgestellten Funktionen massenhaft zu extrahieren; oder den Dienst auf eine Weise zu nutzen, die gegen die Bedingungen der öffentlichen Datenquellen verstößt, auf die er sich stützt. Wir können Inhalte entfernen oder den Zugang beschränken, die gegen diese Regeln verstoßen.",
    accuracyHeading: "Automatisch erzeugte Daten",
    accuracy:
      "SigmaCV erstellt Ihren Lebenslauf aus öffentlichen Drittquellen (OpenAlex, ORCID, Crossref, DataCite u. a.). Diese Daten können unvollständig, veraltet oder falsch zugeordnet sein – etwa eine Publikation einer anderen Person mit ähnlichem Namen. Der Dienst kennzeichnet wahrscheinliche Fehlzuordnungen, doch sind Sie dafür verantwortlich, Ihren Lebenslauf zu prüfen und zu korrigieren, bevor Sie sich darauf verlassen oder ihn veröffentlichen. Wir gewährleisten weder die Richtigkeit noch die Vollständigkeit der aus diesen Quellen bezogenen Daten.",
    warrantyHeading: "Keine Gewährleistung",
    warranty:
      "SigmaCV wird „wie besehen“ und „wie verfügbar“ bereitgestellt, ohne jegliche ausdrückliche oder stillschweigende Gewährleistung, einschließlich der Eignung für einen bestimmten Zweck, der Richtigkeit oder der unterbrechungsfreien Verfügbarkeit. Da der Dienst kostenlos ist und privat betrieben wird, kann er sich jederzeit ändern, nicht verfügbar sein oder eingestellt werden. Im größtmöglichen gesetzlich zulässigen Umfang schließen wir alle hier nicht ausdrücklich genannten Gewährleistungen aus.",
    liabilityHeading: "Haftungsbeschränkung",
    liability:
      "Im größtmöglichen nach geltendem Recht zulässigen Umfang haftet der Betreiber nicht für indirekte, beiläufige oder Folgeschäden oder für den Verlust von Daten, Chancen oder Ansehen, die aus Ihrer Nutzung (oder Nichtnutzbarkeit) von SigmaCV entstehen – einschließlich des Vertrauens auf automatisch erzeugte Lebenslaufdaten. Nichts hierin beschränkt die Haftung, die gesetzlich nicht beschränkt werden kann.",
    terminationHeading: "Sperrung & Beendigung",
    termination:
      "Sie können die Nutzung von SigmaCV jederzeit beenden und Ihr Konto samt aller zugehörigen Daten in der App löschen. Wir können den Zugang sperren oder beenden, wenn Sie wesentlich gegen diese Bedingungen verstoßen oder den Dienst in einer Weise nutzen, die ihm oder seinen Nutzern schadet – nach Möglichkeit mit Vorankündigung. Wird der Dienst eingestellt, kündigen wir dies angemessen an, damit Sie Ihre Daten zuvor exportieren können.",
    changesHeading: "Änderungen",
    changes:
      "Wir können diese Bedingungen anpassen, während sich der Dienst weiterentwickelt. Bei wesentlichen Änderungen weisen wir auf dieser Seite darauf hin und aktualisieren das Datum unten; die fortgesetzte Nutzung von SigmaCV nach einer Änderung gilt als Annahme der überarbeiteten Bedingungen. Wenn Sie einer Änderung nicht zustimmen, löschen Sie bitte Ihr Konto.",
    ipHeading: "Geistiges Eigentum",
    ip: "Die SigmaCV-Software ist quelloffen unter ihrer Lizenz auf GitHub – Ihre Rechte am Code ergeben sich aus dieser Lizenz. Name, Erscheinungsbild und Marke von SigmaCV gehören dem Betreiber und werden weder durch diese Bedingungen noch durch die Softwarelizenz eingeräumt. Drittdaten und Zitierstile bleiben Eigentum ihrer Quellen und werden zu deren eigenen Bedingungen genutzt.",
    privacyHeading: "Datenschutz",
    privacyBody:
      "Wie wir mit Ihren personenbezogenen Daten umgehen – Datenminimierung, Zuordnung ausschließlich über Identifikatoren und Forschungsprotokollierung nur mit Ihrer ausdrücklichen Einwilligung – ist in unserem Datenschutzhinweis beschrieben, der Bestandteil dieser Bedingungen ist.",
    lawHeading: "Anwendbares Recht",
    law: "Diese Bedingungen unterliegen dem Recht Japans, wo der Betreiber niedergelassen ist, ungeachtet kollisionsrechtlicher Regeln. Wenn Sie SigmaCV als Verbraucher nutzen, entzieht Ihnen dies nicht den Schutz der zwingenden Verbraucherschutzvorschriften Ihres Wohnsitzlandes – etwa in der EU. Wir sind bestrebt, etwaige Streitigkeiten einvernehmlich zu lösen; kontaktieren Sie uns daher bitte zuerst.",
    contactHeading: "Kontakt",
    contact:
      "Fragen zu diesen Bedingungen? Schreiben Sie dem Betreiber an privacy@sigmacv.org oder nutzen Sie die Kontaktseite.",
    authoritativeNote:
      "Diese Bedingungen werden der Einfachheit halber in mehreren Sprachen bereitgestellt; bei Abweichungen ist die englische Fassung maßgeblich.",
    updatedNote: "Zuletzt aktualisiert im Juni 2026.",
    backLink: "← Zurück zu SigmaCV",
    navLabel: "Nutzungsbedingungen",
  },
  "ja-JP": {
    metaTitle: "利用規約",
    metaDescription:
      "SigmaCV の利用を規律する規約です。SigmaCV は、公開された研究データから学術 CV を生成する、無料・オープンソースの「現状有姿」のサービスです。お客様の責任、当方の免責、および準拠法を定めます。",
    heading: "利用規約",
    intro:
      "本利用規約は、sigmacv.org 上の SigmaCV およびそのページのご利用を規律します。アカウントを作成し、またはその他の方法で SigmaCV を利用された時点で、本規約に同意したものとみなされます。同意されない場合は、本サービスをご利用にならないでください。本規約は、参照により本規約に組み込まれる当方の「プライバシーとデータ保護に関する通知」とあわせて適用されます。",
    serviceHeading: "本サービス",
    service:
      "SigmaCV は、公開された研究メタデータから学術 CV を生成し、その編集（キュレーション）、スタイル設定、エクスポート、および任意での公開を行える、無料・オープンソースのツールです。Basile Chrétien（PharmD、MSc、MPH）が独立した個人プロジェクトとして運営しており（大学や雇用主によるもの、またはその代理ではありません）、個人による非商業的利用のために無償で提供されます。",
    eligibilityHeading: "アカウントと利用資格",
    eligibility:
      "SigmaCV のご利用には、対応するプロバイダー（ORCID、Google、またはメール）でのサインインが必要です。お客様は、ご自身のアカウントでの活動、およびサインイン手段の安全な管理について責任を負います。アカウントの作成には、16 歳以上であるか、またはお客様の国における電子的同意の年齢に達している必要があります。他者になりすましたり、ご自身の身元や所属を偽ったりしないでください。",
    contentHeading: "お客様のコンテンツ",
    content:
      "CV のコンテンツおよびお客様が追加するプロフィール写真の所有権は、お客様に帰属します。お客様は、CV の内容について、また公開ページを公開する場合は公開する内容について責任を負います。これには、アップロードするものを使用する権利を有していること、ならびにその内容が正確で誤解を招くものでないことの確認が含まれます。お客様は、本サービスが機能するために必要な限度で、コンテンツの保存・処理・表示を行うための限定的な許諾を SigmaCV に付与します。たとえば、CV の表示、エクスポートの生成、公開を選択した場合の公開ページの配信などです。当方はお客様のコンテンツに対してこれ以外の権利を主張せず、当該許諾はお客様がコンテンツまたはアカウントを削除した時点で終了します。",
    acceptableUseHeading: "許容される利用",
    acceptableUse:
      "SigmaCV は、適法な目的のため、かつ本来の用途に従ってのみご利用ください。次の行為は行わないでください。違法・権利侵害・差別／憎悪を助長する、または故意に虚偽のコンテンツをアップロードもしくは公開すること、他の研究者になりすますこと、または自分のものでない業績を自分のものと主張すること、本サービスもしくはそのインフラを破壊・過負荷・探索し、または不正にアクセスしようとすること、提供される機能以外の手段でデータを大量に取得すること、本サービスが依拠する公開データソースの規約に違反する方法で利用すること。これらの規則に違反するコンテンツの削除またはアクセスの制限を行う場合があります。",
    accuracyHeading: "自動生成されるデータ",
    accuracy:
      "SigmaCV は、第三者の公開ソース（OpenAlex、ORCID、Crossref、DataCite など）からお客様の CV を生成します。これらのデータは、不完全であったり、古かったり、誤って帰属されていたりする場合があります。たとえば、類似した氏名を持つ別の研究者の論文などです。本サービスは想定される不一致にフラグを付けますが、CV を信頼し、または公開する前に、内容を確認し修正する責任はお客様にあります。当方は、これらのソースから取得したデータの正確性や完全性を保証しません。",
    warrantyHeading: "無保証",
    warranty:
      "SigmaCV は「現状のまま（as is）」かつ「提供可能な範囲で（as available）」提供され、特定目的への適合性、正確性、または中断のない利用可能性を含め、明示・黙示を問わず一切の保証を伴いません。本サービスは無料かつ個人により運営されているため、いつでも変更され、利用できなくなり、または提供を終了する場合があります。法律で認められる最大限の範囲で、当方は本規約に明示されていない一切の保証を否認します。",
    liabilityHeading: "責任の制限",
    liability:
      "適用法令で認められる最大限の範囲で、運営者は、お客様による SigmaCV の利用（または利用できないこと）に起因する間接的・付随的・結果的損害、ならびにデータ・機会・信用の喪失について、自動生成された CV データへの依拠を含め、一切責任を負いません。本規約のいかなる定めも、法律上制限できない責任を制限するものではありません。",
    terminationHeading: "停止と終了",
    termination:
      "お客様はいつでも SigmaCV の利用を停止でき、アプリ内からアカウントおよび関連するすべてのデータを削除できます。お客様が本規約に重大に違反した場合、または本サービスもしくはその利用者に損害を与える方法で利用した場合、当方はアクセスを停止または終了することがあります（可能な場合は事前に通知します）。本サービスを終了する場合は、お客様が事前にデータをエクスポートできるよう、合理的な予告を行います。",
    changesHeading: "変更",
    changes:
      "当方は、サービスの発展に応じて本規約を更新することがあります。重大な変更を行う場合は、本ページに記載し、下部の日付を更新します。変更後も SigmaCV を継続して利用された場合、改定後の規約に同意したものとみなされます。変更に同意されない場合は、アカウントを削除してください。",
    ipHeading: "知的財産",
    ip: "SigmaCV のソフトウェアは、GitHub 上のライセンスのもとで提供されるオープンソースであり、コードに関するお客様の権利は当該ライセンスに基づきます。SigmaCV の名称・外観・ブランドは運営者に帰属し、本規約またはソフトウェアライセンスによって付与されるものではありません。第三者のデータおよび引用スタイルは、引き続きそれぞれの提供元に帰属し、各提供元の規約に従って利用されます。",
    privacyHeading: "プライバシー",
    privacyBody:
      "当方によるお客様の個人データの取り扱い（データ最小化、識別子のみによる照合、明示的な同意がある場合に限る研究目的のログ記録）については、本規約の一部を構成する「プライバシーとデータ保護に関する通知」に記載しています。",
    lawHeading: "準拠法",
    law: "本規約は、運営者が所在する日本の法律に準拠し、抵触法の規則は適用されません。お客様が消費者として SigmaCV を利用する場合、本条は、お客様の居住国（たとえば EU 内）の強行的な消費者保護規定による保護を奪うものではありません。当方は、いかなる紛争も友好的に解決することを目指していますので、まずは当方までご連絡ください。",
    contactHeading: "お問い合わせ",
    contact:
      "本規約に関するご質問は、運営者（privacy@sigmacv.org）宛てにメールでご連絡いただくか、お問い合わせページをご利用ください。",
    authoritativeNote:
      "本規約は便宜のため複数の言語で提供しています。各版に相違がある場合は英語版が優先します。",
    updatedNote: "最終更新：2026 年 6 月。",
    backLink: "← SigmaCV に戻る",
    navLabel: "利用規約",
  },
  "pt-BR": {
    metaTitle: "Termos de Uso",
    metaDescription:
      "Os termos que regem o uso do SigmaCV — um serviço gratuito, de código aberto e «no estado em que se encontra» que cria CVs acadêmicos a partir de dados públicos de pesquisa: suas responsabilidades, nossas isenções e a lei aplicável.",
    heading: "Termos de Uso",
    intro:
      "Estes Termos de Uso regem o seu uso do SigmaCV em sigmacv.org e suas páginas. Ao criar uma conta ou usar o SigmaCV de qualquer outra forma, você concorda com eles. Se não concordar, não use o serviço. Eles se aplicam em conjunto com o nosso Aviso de Privacidade e Proteção de Dados, aqui incorporado por referência.",
    serviceHeading: "O serviço",
    service:
      "O SigmaCV é uma ferramenta gratuita e de código aberto que monta um CV acadêmico a partir de metadados públicos de pesquisa e permite curá-lo, estilizá-lo, exportá-lo e, opcionalmente, publicá-lo. É operado por Basile Chrétien (PharmD, MSc, MPH) como um projeto pessoal independente — não por uma universidade ou empregador, nem em seu nome — e é oferecido gratuitamente para uso individual e não comercial.",
    eligibilityHeading: "Contas e elegibilidade",
    eligibility:
      "O uso do SigmaCV exige login por meio de um provedor compatível (ORCID, Google ou e-mail). Você é responsável pela atividade em sua conta e por manter seguro o seu método de acesso. É preciso ter pelo menos 16 anos, ou a idade de consentimento digital do seu país, para criar uma conta. Não se passe por outra pessoa nem informe de forma falsa a sua identidade ou afiliação.",
    contentHeading: "Seu conteúdo",
    content:
      "Você mantém a titularidade do conteúdo do CV e de qualquer foto de perfil que adicionar. Você é responsável pelo que o seu CV contém e, se publicar uma página pública, pelo que torna público — incluindo garantir que tem o direito de usar tudo o que enviar e que isso é exato e não enganoso. Você concede ao SigmaCV a permissão limitada necessária para armazenar, processar e exibir o seu conteúdo para que o serviço funcione — por exemplo, para renderizar o seu CV, gerar exportações e servir a sua página pública quando você optar por publicá-la. Não reivindicamos nenhum outro direito sobre o seu conteúdo, e a permissão termina quando você exclui o conteúdo ou a sua conta.",
    acceptableUseHeading: "Uso aceitável",
    acceptableUse:
      "Use o SigmaCV apenas para fins lícitos e conforme o previsto. Não: envie ou publique conteúdo ilícito, infrator, de ódio ou deliberadamente falso; passe-se por outro pesquisador ou reivindique trabalhos que não são seus; tente danificar, sobrecarregar, sondar ou obter acesso não autorizado ao serviço ou à sua infraestrutura; extraia dados em massa por meios diferentes dos recursos oferecidos; ou use o serviço de modo a violar os termos das fontes públicas de dados das quais ele depende. Podemos remover conteúdo ou restringir o acesso que infrinja estas regras.",
    accuracyHeading: "Dados gerados automaticamente",
    accuracy:
      "O SigmaCV monta o seu CV a partir de fontes públicas de terceiros (OpenAlex, ORCID, Crossref, DataCite e outras). Esses dados podem estar incompletos, desatualizados ou atribuídos incorretamente — por exemplo, uma publicação de outro pesquisador com nome semelhante. O serviço sinaliza prováveis divergências, mas é sua a responsabilidade de revisar e corrigir o seu CV antes de confiar nele ou publicá-lo. Não garantimos a exatidão ou a integridade dos dados obtidos dessas fontes.",
    warrantyHeading: "Sem garantia",
    warranty:
      "O SigmaCV é fornecido «no estado em que se encontra» e «conforme disponível», sem garantias de qualquer tipo, expressas ou implícitas, incluindo adequação a uma finalidade específica, exatidão ou disponibilidade ininterrupta. Por ser um serviço gratuito e mantido de forma pessoal, ele pode mudar, ficar indisponível ou ser descontinuado a qualquer momento. Na máxima extensão permitida por lei, isentamo-nos de todas as garantias não declaradas expressamente aqui.",
    liabilityHeading: "Limitação de responsabilidade",
    liability:
      "Na máxima extensão permitida pela lei aplicável, o operador não será responsável por quaisquer danos indiretos, incidentais ou consequenciais, nem por perda de dados, oportunidades ou reputação, decorrentes do seu uso (ou da impossibilidade de uso) do SigmaCV — incluindo qualquer confiança em dados de CV gerados automaticamente. Nada aqui limita a responsabilidade que não possa ser limitada por lei.",
    terminationHeading: "Suspensão e encerramento",
    termination:
      "Você pode parar de usar o SigmaCV a qualquer momento e excluir a sua conta e todos os dados associados de dentro do aplicativo. Podemos suspender ou encerrar o acesso se você violar de forma substancial estes termos ou usar o serviço de modo que o prejudique ou prejudique seus usuários — quando viável, com aviso prévio. Se o serviço for descontinuado, daremos aviso razoável para que você possa primeiro exportar os seus dados.",
    changesHeading: "Alterações",
    changes:
      "Podemos atualizar estes termos à medida que o serviço evolui. Quando as alterações forem substanciais, iremos indicá-las nesta página e atualizar a data abaixo; continuar a usar o SigmaCV após uma alteração significa que você aceita os termos revisados. Se não concordar com uma alteração, exclua a sua conta.",
    ipHeading: "Propriedade intelectual",
    ip: "O software do SigmaCV é de código aberto sob a sua licença no GitHub — os seus direitos sobre o código vêm dessa licença. O nome, a aparência e a marca do SigmaCV pertencem ao operador e não são concedidos por estes termos nem pela licença do software. Os dados de terceiros e os estilos de citação permanecem propriedade das suas fontes e são usados conforme os termos próprios delas.",
    privacyHeading: "Privacidade",
    privacyBody:
      "Como tratamos os seus dados pessoais — minimização de dados, correspondência apenas por identificador e registro para pesquisa somente com o seu consentimento explícito — está descrito no nosso Aviso de Privacidade e Proteção de Dados, que faz parte destes termos.",
    lawHeading: "Lei aplicável",
    law: "Estes termos são regidos pelas leis do Japão, onde o operador está estabelecido, sem consideração às regras de conflito de leis. Se você usa o SigmaCV como consumidor, isso não o priva da proteção das normas imperativas de defesa do consumidor do seu país de residência — por exemplo, na UE. Buscamos resolver qualquer disputa de forma amigável, portanto entre em contato conosco primeiro.",
    contactHeading: "Contato",
    contact:
      "Dúvidas sobre estes termos? Escreva ao operador em privacy@sigmacv.org ou use a página de contato.",
    authoritativeNote:
      "Estes termos são oferecidos em vários idiomas por conveniência; havendo divergência, prevalece a versão em inglês.",
    updatedNote: "Última atualização: junho de 2026.",
    backLink: "← Voltar ao SigmaCV",
    navLabel: "Termos",
  },
  "it-IT": {
    metaTitle: "Condizioni d’uso",
    metaDescription:
      "Le condizioni che regolano l’uso di SigmaCV — un servizio gratuito, open source e «così com’è» che crea CV accademici a partire da dati pubblici di ricerca: le tue responsabilità, le nostre esclusioni di garanzia e la legge applicabile.",
    heading: "Condizioni d’uso",
    intro:
      "Le presenti Condizioni d’uso regolano l’utilizzo di SigmaCV su sigmacv.org e delle sue pagine. Creando un account o utilizzando in altro modo SigmaCV, le accetti. Se non sei d’accordo, non utilizzare il servizio. Si applicano insieme alla nostra Informativa sulla privacy e protezione dei dati, qui richiamata per riferimento.",
    serviceHeading: "Il servizio",
    service:
      "SigmaCV è uno strumento gratuito e open source che compone un CV accademico a partire da metadati pubblici di ricerca e ti consente di curarlo, impaginarlo, esportarlo e, facoltativamente, pubblicarlo. È gestito da Basile Chrétien (PharmD, MSc, MPH) come progetto personale indipendente — non da un’università o da un datore di lavoro, né per loro conto — ed è fornito gratuitamente per uso individuale e non commerciale.",
    eligibilityHeading: "Account e requisiti",
    eligibility:
      "L’uso di SigmaCV richiede l’accesso tramite un provider supportato (ORCID, Google o e-mail). Sei responsabile dell’attività svolta con il tuo account e della sicurezza del tuo metodo di accesso. Per creare un account devi avere almeno 16 anni, o l’età del consenso digitale nel tuo Paese. Non spacciarti per altri e non fornire informazioni false sulla tua identità o affiliazione.",
    contentHeading: "I tuoi contenuti",
    content:
      "Conservi la titolarità dei contenuti del CV e di eventuali foto profilo che aggiungi. Sei responsabile di ciò che il tuo CV contiene e, se pubblichi una pagina pubblica, di ciò che rendi pubblico — incluso l’accertarti di avere il diritto di usare qualsiasi cosa carichi e che sia accurata e non fuorviante. Concedi a SigmaCV l’autorizzazione limitata necessaria per archiviare, elaborare e mostrare i tuoi contenuti affinché il servizio funzioni — ad esempio per visualizzare il tuo CV, generare esportazioni e servire la tua pagina pubblica quando scegli di pubblicarla. Non rivendichiamo alcun altro diritto sui tuoi contenuti e l’autorizzazione cessa quando elimini i contenuti o il tuo account.",
    acceptableUseHeading: "Uso accettabile",
    acceptableUse:
      "Usa SigmaCV solo per scopi leciti e secondo la sua destinazione. Non: caricare o pubblicare contenuti illeciti, lesivi di diritti, d’odio o deliberatamente falsi; spacciarti per un altro ricercatore o rivendicare lavori non tuoi; tentare di danneggiare, sovraccaricare, sondare o accedere senza autorizzazione al servizio o alla sua infrastruttura; estrarre dati in massa con mezzi diversi dalle funzionalità offerte; o usare il servizio in modo da violare le condizioni delle fonti pubbliche di dati su cui si basa. Possiamo rimuovere contenuti o limitare l’accesso che violino queste regole.",
    accuracyHeading: "Dati generati automaticamente",
    accuracy:
      "SigmaCV compone il tuo CV a partire da fonti pubbliche di terzi (OpenAlex, ORCID, Crossref, DataCite e altre). Tali dati possono essere incompleti, non aggiornati o attribuiti erroneamente — ad esempio una pubblicazione di un altro ricercatore con un nome simile. Il servizio segnala le probabili discordanze, ma sei tu responsabile di verificare e correggere il tuo CV prima di farvi affidamento o di pubblicarlo. Non garantiamo l’accuratezza o la completezza dei dati ottenuti da queste fonti.",
    warrantyHeading: "Nessuna garanzia",
    warranty:
      "SigmaCV è fornito «così com’è» e «secondo disponibilità», senza garanzie di alcun tipo, espresse o implicite, comprese l’idoneità a uno scopo particolare, l’accuratezza o la disponibilità ininterrotta. Trattandosi di un servizio gratuito e gestito a titolo personale, può cambiare, non essere disponibile o essere interrotto in qualsiasi momento. Nella massima misura consentita dalla legge, decliniamo ogni garanzia non espressamente indicata qui.",
    liabilityHeading: "Limitazione di responsabilità",
    liability:
      "Nella massima misura consentita dalla legge applicabile, il gestore non sarà responsabile per danni indiretti, incidentali o consequenziali, né per la perdita di dati, opportunità o reputazione, derivanti dal tuo uso (o dall’impossibilità d’uso) di SigmaCV — incluso qualsiasi affidamento sui dati del CV generati automaticamente. Nulla di quanto qui previsto limita la responsabilità che non può essere limitata per legge.",
    terminationHeading: "Sospensione e cessazione",
    termination:
      "Puoi smettere di usare SigmaCV in qualsiasi momento ed eliminare il tuo account e tutti i dati associati dall’interno dell’app. Possiamo sospendere o cessare l’accesso se violi in modo sostanziale le presenti condizioni o usi il servizio in modo da danneggiarlo o danneggiarne gli utenti — ove possibile, con preavviso. Se il servizio viene interrotto, daremo un preavviso ragionevole affinché tu possa prima esportare i tuoi dati.",
    changesHeading: "Modifiche",
    changes:
      "Possiamo aggiornare queste condizioni man mano che il servizio evolve. Quando le modifiche sono sostanziali le segnaleremo in questa pagina e aggiorneremo la data in basso; continuare a usare SigmaCV dopo una modifica significa che accetti le condizioni riviste. Se non accetti una modifica, elimina il tuo account.",
    ipHeading: "Proprietà intellettuale",
    ip: "Il software SigmaCV è open source secondo la sua licenza su GitHub — i tuoi diritti sul codice derivano da quella licenza. Il nome, l’aspetto e il marchio di SigmaCV appartengono al gestore e non sono concessi né da queste condizioni né dalla licenza del software. I dati di terzi e gli stili di citazione restano di proprietà delle rispettive fonti e sono utilizzati secondo le loro condizioni.",
    privacyHeading: "Privacy",
    privacyBody:
      "Il modo in cui trattiamo i tuoi dati personali — minimizzazione dei dati, corrispondenza basata solo sugli identificatori e registrazione a fini di ricerca soltanto con il tuo consenso esplicito — è descritto nella nostra Informativa sulla privacy e protezione dei dati, che è parte integrante di queste condizioni.",
    lawHeading: "Legge applicabile",
    law: "Le presenti condizioni sono regolate dalle leggi del Giappone, dove il gestore è stabilito, senza riguardo alle norme sui conflitti di legge. Se usi SigmaCV come consumatore, ciò non ti priva della protezione delle norme imperative a tutela dei consumatori del tuo Paese di residenza — ad esempio nell’UE. Cerchiamo di risolvere ogni controversia in modo amichevole, quindi contattaci prima.",
    contactHeading: "Contatti",
    contact:
      "Domande su queste condizioni? Scrivi al gestore all’indirizzo privacy@sigmacv.org o usa la pagina dei contatti.",
    authoritativeNote:
      "Queste condizioni sono fornite in più lingue per comodità; in caso di discrepanze prevale la versione inglese.",
    updatedNote: "Ultimo aggiornamento: giugno 2026.",
    backLink: "← Torna a SigmaCV",
    navLabel: "Condizioni",
  },
  "ko-KR": {
    metaTitle: "이용약관",
    metaDescription:
      "SigmaCV 이용을 규율하는 약관입니다. SigmaCV는 공개된 연구 데이터로 학술 CV를 생성하는 무료·오픈소스의 «있는 그대로» 제공되는 서비스입니다. 이용자의 책임, 당사의 면책, 준거법을 정합니다.",
    heading: "이용약관",
    intro:
      "본 이용약관은 sigmacv.org의 SigmaCV 및 그 페이지에 대한 귀하의 이용을 규율합니다. 계정을 만들거나 그 밖의 방법으로 SigmaCV를 이용하면 본 약관에 동의하는 것으로 봅니다. 동의하지 않으시면 본 서비스를 이용하지 마십시오. 본 약관은 참조로써 본 약관에 포함되는 «개인정보 및 데이터 보호 고지»와 함께 적용됩니다.",
    serviceHeading: "본 서비스",
    service:
      "SigmaCV는 공개된 연구 메타데이터로 학술 CV를 구성하고 이를 큐레이션, 스타일 지정, 내보내기, 그리고 선택적으로 공개할 수 있게 해 주는 무료·오픈소스 도구입니다. Basile Chrétien(PharmD, MSc, MPH)이 독립적인 개인 프로젝트로 운영하며(대학이나 고용주가 운영하거나 이를 대리하지 않습니다), 개인의 비영리적 이용을 위해 무료로 제공됩니다.",
    eligibilityHeading: "계정 및 이용 자격",
    eligibility:
      "SigmaCV를 이용하려면 지원되는 제공자(ORCID, Google, 또는 이메일)를 통해 로그인해야 합니다. 귀하는 자신의 계정에서 이루어지는 활동과 로그인 수단의 보안 유지에 대해 책임을 집니다. 계정을 만들려면 만 16세 이상이거나 귀하의 국가에서 정한 디지털 동의 연령에 도달해야 합니다. 타인을 사칭하거나 자신의 신원 또는 소속을 거짓으로 표시하지 마십시오.",
    contentHeading: "귀하의 콘텐츠",
    content:
      "CV 콘텐츠와 귀하가 추가하는 프로필 사진의 소유권은 귀하에게 있습니다. 귀하는 CV에 담긴 내용에 대해, 그리고 공개 페이지를 게시하는 경우 공개하는 내용에 대해 책임을 집니다. 여기에는 업로드하는 모든 것을 사용할 권리가 있고 그 내용이 정확하며 오해를 일으키지 않음을 보장하는 것이 포함됩니다. 귀하는 서비스가 작동하는 데 필요한 한도에서 콘텐츠를 저장·처리·표시하기 위한 제한적 허락을 SigmaCV에 부여합니다. 예를 들어 CV 렌더링, 내보내기 생성, 게시를 선택한 경우 공개 페이지 제공 등이 이에 해당합니다. 당사는 그 밖의 어떠한 권리도 귀하의 콘텐츠에 대해 주장하지 않으며, 해당 허락은 귀하가 콘텐츠 또는 계정을 삭제하는 시점에 종료됩니다.",
    acceptableUseHeading: "허용되는 이용",
    acceptableUse:
      "SigmaCV는 적법한 목적을 위해, 본래의 용도에 따라서만 이용하십시오. 다음 행위를 하지 마십시오. 위법·권리침해·혐오 또는 고의로 허위인 콘텐츠를 업로드하거나 게시하는 행위, 다른 연구자를 사칭하거나 자신의 것이 아닌 업적을 자신의 것이라고 주장하는 행위, 서비스 또는 그 인프라를 손상·과부하·탐색하거나 무단으로 접근하려는 행위, 제공되는 기능 외의 수단으로 데이터를 대량 추출하는 행위, 서비스가 의존하는 공개 데이터 출처의 약관을 위반하는 방식으로 이용하는 행위. 당사는 이러한 규칙을 위반하는 콘텐츠를 삭제하거나 접근을 제한할 수 있습니다.",
    accuracyHeading: "자동 생성 데이터",
    accuracy:
      "SigmaCV는 제3자 공개 출처(OpenAlex, ORCID, Crossref, DataCite 등)로부터 귀하의 CV를 생성합니다. 이러한 데이터는 불완전하거나, 오래되었거나, 잘못 귀속되어 있을 수 있습니다. 예를 들어 이름이 비슷한 다른 연구자의 논문일 수 있습니다. 서비스는 불일치 가능성이 있는 항목에 표시를 하지만, CV를 신뢰하거나 게시하기 전에 이를 검토하고 수정할 책임은 귀하에게 있습니다. 당사는 이러한 출처에서 얻은 데이터의 정확성이나 완전성을 보증하지 않습니다.",
    warrantyHeading: "보증의 부인",
    warranty:
      "SigmaCV는 «있는 그대로(as is)» 및 «제공 가능한 범위에서(as available)» 제공되며, 특정 목적에의 적합성, 정확성, 또는 중단 없는 가용성을 포함하여 명시적이든 묵시적이든 어떠한 종류의 보증도 제공하지 않습니다. 본 서비스는 무료이며 개인이 운영하므로 언제든지 변경되거나, 이용할 수 없게 되거나, 중단될 수 있습니다. 법이 허용하는 최대 범위에서 당사는 여기에 명시되지 않은 모든 보증을 부인합니다.",
    liabilityHeading: "책임의 제한",
    liability:
      "관련 법이 허용하는 최대 범위에서, 운영자는 귀하의 SigmaCV 이용(또는 이용 불능)으로 인해 발생하는 간접적·부수적·결과적 손해, 또는 데이터·기회·평판의 손실에 대하여, 자동 생성된 CV 데이터에 대한 의존을 포함하여 일체 책임을 지지 않습니다. 본 약관의 어떠한 내용도 법률상 제한할 수 없는 책임을 제한하지 않습니다.",
    terminationHeading: "이용 정지 및 해지",
    termination:
      "귀하는 언제든지 SigmaCV 이용을 중단할 수 있으며, 앱 내에서 계정과 관련된 모든 데이터를 삭제할 수 있습니다. 귀하가 본 약관을 중대하게 위반하거나 서비스 또는 그 이용자에게 해를 끼치는 방식으로 이용하는 경우, 당사는 접근을 정지하거나 종료할 수 있습니다(가능한 경우 사전 통지함). 서비스를 중단하는 경우, 귀하가 먼저 데이터를 내보낼 수 있도록 합리적인 사전 통지를 제공합니다.",
    changesHeading: "변경",
    changes:
      "당사는 서비스가 발전함에 따라 본 약관을 갱신할 수 있습니다. 중대한 변경이 있는 경우 본 페이지에 표시하고 아래 날짜를 갱신합니다. 변경 후에도 SigmaCV를 계속 이용하면 개정된 약관에 동의하는 것으로 봅니다. 변경에 동의하지 않으시면 계정을 삭제하십시오.",
    ipHeading: "지식재산권",
    ip: "SigmaCV 소프트웨어는 GitHub의 라이선스에 따라 제공되는 오픈소스이며, 코드에 대한 귀하의 권리는 해당 라이선스에서 비롯됩니다. SigmaCV의 명칭·외관·브랜드는 운영자에게 귀속되며 본 약관이나 소프트웨어 라이선스에 의해 부여되지 않습니다. 제3자 데이터와 인용 스타일은 각 출처의 소유로 남으며 각자의 약관에 따라 이용됩니다.",
    privacyHeading: "개인정보 보호",
    privacyBody:
      "당사가 귀하의 개인정보를 처리하는 방식(데이터 최소화, 식별자만을 이용한 매칭, 명시적 동의가 있는 경우에만 수행하는 연구 로깅)은 본 약관의 일부를 구성하는 «개인정보 및 데이터 보호 고지»에 설명되어 있습니다.",
    lawHeading: "준거법",
    law: "본 약관은 운영자가 소재한 일본의 법률에 따르며, 법의 저촉에 관한 규칙은 적용되지 않습니다. 귀하가 소비자로서 SigmaCV를 이용하는 경우, 본 조항은 귀하의 거주 국가(예: EU)의 강행적 소비자 보호 규정에 따른 보호를 박탈하지 않습니다. 당사는 모든 분쟁을 원만하게 해결하고자 하므로 먼저 당사에 연락해 주십시오.",
    contactHeading: "문의처",
    contact:
      "본 약관에 관한 문의가 있으신가요? 운영자(privacy@sigmacv.org)에게 이메일을 보내거나 문의 페이지를 이용해 주십시오.",
    authoritativeNote:
      "본 약관은 편의를 위해 여러 언어로 제공됩니다. 내용이 다를 경우 영어본이 우선합니다.",
    updatedNote: "최종 업데이트: 2026년 6월.",
    backLink: "← SigmaCV로 돌아가기",
    navLabel: "이용약관",
  },
  "ru-RU": {
    metaTitle: "Условия использования",
    metaDescription:
      "Условия, регулирующие использование SigmaCV — бесплатного сервиса с открытым исходным кодом, предоставляемого «как есть», который формирует академические CV из открытых данных исследований: ваши обязанности, наши оговорки и применимое право.",
    heading: "Условия использования",
    intro:
      "Настоящие Условия использования регулируют использование вами SigmaCV на сайте sigmacv.org и его страницах. Создавая учётную запись или иным образом используя SigmaCV, вы соглашаетесь с ними. Если вы не согласны, не используйте сервис. Они применяются вместе с нашим Уведомлением о конфиденциальности и защите данных, которое включено сюда посредством отсылки.",
    serviceHeading: "Сервис",
    service:
      "SigmaCV — это бесплатный инструмент с открытым исходным кодом, который формирует академическое CV из открытых научных метаданных и позволяет вам курировать, оформлять, экспортировать и, по желанию, публиковать его. Им управляет Basile Chrétien (PharmD, MSc, MPH) как независимым личным проектом — не университет или работодатель и не от их имени — и он предоставляется бесплатно для индивидуального некоммерческого использования.",
    eligibilityHeading: "Учётные записи и право пользования",
    eligibility:
      "Для использования SigmaCV необходимо войти через поддерживаемого провайдера (ORCID, Google или электронная почта). Вы несёте ответственность за действия в вашей учётной записи и за сохранность вашего способа входа. Чтобы создать учётную запись, вам должно быть не менее 16 лет либо вы должны достичь возраста цифрового согласия в вашей стране. Не выдавайте себя за других и не сообщайте ложные сведения о своей личности или аффилиации.",
    contentHeading: "Ваш контент",
    content:
      "Вы сохраняете право собственности на содержимое CV и любую добавленную вами фотографию профиля. Вы несёте ответственность за то, что содержит ваше CV, а если вы публикуете общедоступную страницу — за то, что делаете общедоступным, включая обеспечение того, что у вас есть право использовать всё загружаемое и что оно достоверно и не вводит в заблуждение. Вы предоставляете SigmaCV ограниченное разрешение, необходимое для хранения, обработки и отображения вашего контента, чтобы сервис мог работать, — например, для отображения вашего CV, формирования экспортов и обслуживания вашей общедоступной страницы, когда вы решите её опубликовать. Мы не претендуем на какие-либо иные права на ваш контент, и разрешение прекращается, когда вы удаляете контент или вашу учётную запись.",
    acceptableUseHeading: "Допустимое использование",
    acceptableUse:
      "Используйте SigmaCV только в законных целях и по назначению. Не следует: загружать или публиковать незаконный, нарушающий права, разжигающий ненависть или заведомо ложный контент; выдавать себя за другого исследователя или присваивать чужие работы; пытаться повредить, перегрузить, зондировать сервис или его инфраструктуру либо получить к ним несанкционированный доступ; массово извлекать данные средствами, отличными от предоставленных функций; или использовать сервис способом, нарушающим условия открытых источников данных, на которые он опирается. Мы можем удалять контент или ограничивать доступ, нарушающие эти правила.",
    accuracyHeading: "Автоматически формируемые данные",
    accuracy:
      "SigmaCV формирует ваше CV из сторонних открытых источников (OpenAlex, ORCID, Crossref, DataCite и других). Эти данные могут быть неполными, устаревшими или неверно атрибутированными — например, публикация другого исследователя с похожим именем. Сервис помечает вероятные несоответствия, но вы несёте ответственность за проверку и исправление вашего CV, прежде чем полагаться на него или публиковать его. Мы не гарантируем точность или полноту данных, полученных из этих источников.",
    warrantyHeading: "Отсутствие гарантий",
    warranty:
      "SigmaCV предоставляется «как есть» и «по мере доступности», без каких-либо гарантий, явных или подразумеваемых, включая пригодность для определённой цели, точность или бесперебойную доступность. Поскольку сервис бесплатный и поддерживается частным лицом, он может изменяться, становиться недоступным или прекращать работу в любое время. В максимально допустимой законом степени мы отказываемся от всех гарантий, прямо не указанных здесь.",
    liabilityHeading: "Ограничение ответственности",
    liability:
      "В максимально допустимой применимым правом степени оператор не несёт ответственности за любые косвенные, случайные или вытекающие убытки, а также за потерю данных, возможностей или репутации, возникающие в связи с использованием вами SigmaCV (или невозможностью его использования), включая любое доверие к автоматически сформированным данным CV. Ничто в настоящих условиях не ограничивает ответственность, которая не может быть ограничена по закону.",
    terminationHeading: "Приостановление и прекращение",
    termination:
      "Вы можете прекратить использование SigmaCV в любое время и удалить свою учётную запись и все связанные данные из приложения. Мы можем приостановить или прекратить доступ, если вы существенно нарушаете настоящие условия или используете сервис способом, причиняющим вред ему или его пользователям, — по возможности с уведомлением. Если сервис прекращает работу, мы предоставим разумное уведомление, чтобы вы могли сначала экспортировать свои данные.",
    changesHeading: "Изменения",
    changes:
      "Мы можем обновлять настоящие условия по мере развития сервиса. При существенных изменениях мы укажем их на этой странице и обновим дату ниже; продолжение использования SigmaCV после изменения означает ваше согласие с пересмотренными условиями. Если вы не согласны с изменением, удалите свою учётную запись.",
    ipHeading: "Интеллектуальная собственность",
    ip: "Программное обеспечение SigmaCV является открытым исходным кодом на условиях его лицензии на GitHub — ваши права на код вытекают из этой лицензии. Название, оформление и бренд SigmaCV принадлежат оператору и не предоставляются ни настоящими условиями, ни лицензией на программное обеспечение. Сторонние данные и стили цитирования остаются собственностью их источников и используются на их собственных условиях.",
    privacyHeading: "Конфиденциальность",
    privacyBody:
      "То, как мы обрабатываем ваши персональные данные — минимизация данных, сопоставление только по идентификатору и ведение исследовательских журналов только при наличии вашего явного согласия, — описано в нашем Уведомлении о конфиденциальности и защите данных, которое является частью настоящих условий.",
    lawHeading: "Применимое право",
    law: "Настоящие условия регулируются законодательством Японии, где учреждён оператор, без учёта коллизионных норм. Если вы используете SigmaCV как потребитель, это не лишает вас защиты императивных норм о защите прав потребителей вашей страны проживания — например, в ЕС. Мы стремимся разрешать любые споры мирным путём, поэтому сначала свяжитесь с нами.",
    contactHeading: "Контакты",
    contact:
      "Вопросы по этим условиям? Напишите оператору на privacy@sigmacv.org или воспользуйтесь страницей контактов.",
    authoritativeNote:
      "Настоящие условия предоставляются на нескольких языках для удобства; в случае расхождений преимущественную силу имеет английская версия.",
    updatedNote: "Последнее обновление: июнь 2026 г.",
    backLink: "← Назад к SigmaCV",
    navLabel: "Условия",
  },
};

/** Localized terms-of-use strings (falls back to English for unknown locales). */
export function termsStrings(locale: string): TermsStrings {
  return TERMS_I18N[asLocale(locale)];
}
