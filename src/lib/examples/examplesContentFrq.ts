// The French CV-FRQ example for the /examples gallery: a FICTIONAL early-career
// pharmacologist's "CV descriptif" laid out as the Fonds de recherche du Québec
// asks. Three sections under the FRQ's own headings, up to ten contributions each
// with its period, audience (A/B/C), role and impact, the owner's name in bold and
// an asterisk after each supervisee's name. Every person, institution, drug,
// journal, DOI and regulatory document is invented (drug names end in "-fictine";
// DOIs use the 10.0000 test prefix). The two regulators named (Santé Canada, FDA)
// are real, because the regulatory framing was the point of the request, so every
// event attributed to them is tagged "(événement fictif)" in the text itself, not
// only in the page disclaimer. Written to answer a Québec librarian's question:
// how does a narrative CV "prove" a contribution. By a chain the reader can
// follow, never by an invented number. Plain sentences, no dashes.
import type { ExampleContent } from "./examples";

export const FRQ_EXAMPLE: ExampleContent = {
  metaTitle: "Exemple de CV-FRQ (CV descriptif) : pharmacologie clinique",
  metaDescription:
    "Exemple fictif de CV descriptif du Fonds de recherche du Québec pour une pharmacologue en début de carrière : les trois sections du CV-FRQ, dix contributions avec période, clientèle A/B/C, rôle et retombées documentées, noms en gras et astérisques de supervision.",
  navLabel: "CV-FRQ (pharmacologie, français)",
  heading: "Exemple de CV-FRQ : pharmacologue clinicienne en début de carrière",
  intro: [
    "Voici à quoi peut ressembler le CV descriptif du Fonds de recherche du Québec (CV-FRQ) pour une chercheuse en pharmacologie clinique et en pharmacovigilance qui postule à un programme de début de carrière. Le document suit les instructions du FRQ : trois sections sous les intitulés du FRQ, dix contributions au plus, chacune datée, adressée à une clientèle (A pour le milieu académique, B pour le milieu de pratique, C pour le grand public), avec le rôle joué et les retombées. Les publications sont en style APA, le nom de la candidate en gras, et chaque personne supervisée porte un astérisque après son nom.",
    "Regardez surtout la façon d'écrire les retombées. Aucun indicateur n'est inventé. Chaque contribution décrit une chaîne que la personne évaluatrice peut suivre : le produit, avec son DOI ou son numéro d'enregistrement, ce qu'il a changé, et le document où ce changement est consigné, par exemple une monographie de produit, un avis de l'organisme de réglementation, un rapport ministériel ou une ligne directrice. Quand l'effet ne peut pas être documenté, la contribution dit son importance et le rôle joué, puis s'arrête. C'est ce qu'un CV narratif attend, en pharmacologie comme ailleurs.",
    "Dans SigmaCV, ce document s'obtient en appliquant la mise en page « CV-FRQ, CV descriptif (français) » au CV bâti depuis le dossier ORCID et OpenAlex. Seules les trois sections du FRQ restent visibles, et une affirmation peut pointer vers une entrée réelle du dossier par un lien de preuve. Le texte se colle ensuite dans le modèle Word du FRQ et se joint en PDF dans FRQnet. Six pages au maximum en français.",
  ],
  person: {
    name: "Léa Bouchard-Nadeau",
    credentials: "B. Pharm., M. Sc., Ph. D.",
    headline:
      "Professeure adjointe en pharmacologie clinique. Pharmacovigilance, détection de signaux et sécurité des médicaments en oncologie",
    affiliation: "Faculté de pharmacie, Université du Saint-Laurent (fictive)",
    location: "Québec (Québec), Canada",
  },
  citationStyle: "APA",
  templateLabel: "Classic",
  byline:
    "Pharmacologie clinique · Professeure adjointe (début de carrière) · citations APA · mise en page CV-FRQ",
  sources: [
    { label: "CV-FRQ : la page du FRQ", href: "https://frq.gouv.qc.ca/cv-frq/" },
    {
      label: "Instructions du CV-FRQ (PDF, juillet 2025)",
      href: "https://frq.gouv.qc.ca/app/uploads/2025/10/cv-frq_instructions.pdf",
    },
    {
      label: "Modèle Word du CV-FRQ",
      href: "https://frqnet.frq.gouv.qc.ca/Documents/CV-FRQ_modele.docx",
    },
    {
      label: "CV des trois organismes fédéraux (page des IRSC)",
      href: "https://cihr-irsc.gc.ca/f/53574.html",
    },
    { label: "Notre guide du CV-FRQ", href: "/guides/frq-narrative-cv" },
  ],
  sections: [
    {
      title: "Première section : Parcours et compétences de la personne candidate",
      items: [
        "Parcours. Pharmacienne d'hôpital de formation (B. Pharm., Université du Saint-Laurent, 2013, puis résidence en pharmacie hospitalière au Centre hospitalier de la Rive fictive, 2014), j'ai fait une maîtrise en pharmacologie (2016) et un doctorat en pharmacoépidémiologie (2020) sur la détection de signaux d'innocuité dans les bases de pharmacovigilance. J'ai poursuivi par un stage postdoctoral à l'Unité de pharmacovigilance du Centre de recherche Laurentia (fictif, 2020 à 2021). Professeure adjointe depuis 2021, je dirige le laboratoire Signal-Onco, qui étudie la sécurité des thérapies ciblées en oncologie après leur mise en marché.",
        "Expertise pertinente pour le programme. Méthodes de détection de signaux (analyses de disproportionnalité, séries de cas, études cas-témoins nichées), pharmacoépidémiologie sur données administratives québécoises, essais cliniques selon les BPC de l'ICH (co-investigatrice sur deux essais de phase II), et cadre réglementaire des médicaments au Canada et aux États-Unis. J'ai rédigé deux notifications de signal évaluées par Santé Canada (événements fictifs) et suivi de près la procédure d'étiquetage de la FDA pendant mon postdoctorat. La programmation proposée demande exactement cette combinaison : suivre un signal du système déclaratif jusqu'à la décision réglementaire, puis mesurer l'effet de cette décision sur la pratique.",
        "Leadership et collaborations. Co-responsable depuis 2022 du volet « sécurité des traitements » du Réseau québécois de recherche en oncologie de précision (fictif), qui réunit sept centres. Membre du comité scientifique du Centre régional de pharmacovigilance de la Capitale (fictif). Partenariats de recherche continus avec la Direction de la pharmacovigilance du ministère fictif de la Santé et avec l'Association des pharmaciens en oncologie du Québec (fictive), pour qui je conçois des formations. Grâce à ces liens, mes travaux passent du signal à la pratique en quelques mois plutôt qu'en années.",
        "Effets concrets de mes travaux antérieurs. Trois de mes signaux ont mené à une modification de monographie de produit au Canada (2022, 2023 et 2024, événements fictifs). L'un d'eux a été repris dans une communication de sécurité de la FDA (2023, événement fictif). L'outil de triage des déclarations que j'ai développé pendant mon doctorat est utilisé au Centre régional de pharmacovigilance de la Capitale depuis 2021. La deuxième section détaille ces retombées avec leurs références.",
        "Reconnaissances. Prix de la relève en pharmacologie de la Société fictive de pharmacologie du Québec (2022). Bourse de carrière de chercheuse-boursière junior 1 (fictive, 2022 à 2026). Prix de la meilleure communication orale au Congrès canadien fictif de pharmacovigilance (2019).",
        "Aptitudes et compétences acquises. Bilingue français-anglais, avec rédaction scientifique dans les deux langues. Programmation en R et SAS, gestion de bases de données de pharmacovigilance au format E2B. Deux années de chronique santé à la radio communautaire m'ont appris à parler de médicaments au grand public (voir la contribution 8).",
      ],
    },
    {
      title: "Deuxième section : Contributions et expériences les plus importantes",
      items: [
        "1. Signal d'atteinte hépatique sous vorafictine et modification de la monographie canadienne (2021 à 2023 · clientèles A et B). Rôle : chercheuse principale, conception de l'analyse et rédaction de la notification de signal. Retombées : l'analyse de disproportionnalité sur la base canadienne des déclarations, confirmée par une série de 14 cas, a documenté un risque d'hépatotoxicité sévère absent de la monographie. La notification transmise en juin 2022 a mené à l'ajout d'une mise en garde et d'un suivi hépatique mensuel dans la monographie révisée de septembre 2023. La FDA a publié une communication de sécurité de portée comparable en novembre 2023 (événements fictifs, comme le médicament). La chaîne se vérifie : l'article, la monographie datée, l'avis public de l'organisme. Référence : Bouchard-Nadeau, L., Kaur, P.*, Moreau, D., & Tremblay, S. (2022). Hepatotoxicity signal associated with vorafictine in post-marketing reports: A disproportionality analysis and case series. Revue fictive de pharmacovigilance, 18(4), 233-245. https://doi.org/10.0000/rfpv.2022.0418",
        "2. Outil SIGNALTRI de triage des déclarations spontanées (2018 à 2021, en usage depuis · clientèle B). Rôle : conception et développement pendant le doctorat, puis transfert au centre régional. Retombées : l'outil classe les déclarations d'effets indésirables par priorité d'évaluation. Validé sur 3 200 déclarations, il a réduit de 40 % le délai médian entre la réception d'une déclaration et son évaluation au Centre régional de pharmacovigilance de la Capitale (fictif). Le centre a fait cette mesure sur les années 2021 à 2023 et l'a rapportée dans son bilan annuel 2023. Code ouvert (licence MIT). Références : Bouchard-Nadeau, L., & Moreau, D. (2021). SIGNALTRI: A validated triage score for spontaneous adverse-event reports. Journal fictif d'informatique en santé, 9(2), 77-90. https://doi.org/10.0000/jfis.2021.0902 ; Bouchard-Nadeau, L. (2021). SIGNALTRI (version 1.4) [Logiciel]. Zenodo. https://doi.org/10.0000/zenodo.0000001",
        "3. Programme provincial de surveillance active des thérapies ciblées en oncologie (2022 à aujourd'hui · clientèles A et B). Rôle : co-conceptrice du protocole et responsable de l'analyse. Retombées : une cohorte prospective de 1 850 patients dans sept centres du réseau a permis de mesurer l'incidence réelle des toxicités cardiaques de deux inhibiteurs de kinases. La Direction de la pharmacovigilance du ministère fictif de la Santé a repris le protocole dans son Plan d'action 2024-2027 sur la sécurité des médicaments en oncologie (section 3.2), qui cite l'étude. Référence : Bouchard-Nadeau, L., Nguyen, T.-A.*, Fortin, É., & Tremblay, S. (2024). Real-world cardiotoxicity of kinase inhibitors in Québec: A prospective multicentre surveillance cohort. Revue fictive d'oncologie clinique, 31(1), 12-24. https://doi.org/10.0000/rfoc.2024.3101",
        "4. Avis au ministère sur la déclaration obligatoire des effets indésirables graves par les pharmaciens (2023 · clientèle B). Rôle : rédactrice principale du mémoire déposé par le Réseau québécois de recherche en oncologie de précision (fictif). Retombées : le rapport de consultation du ministère fictif de la Santé cite le mémoire (2023, p. 41-43). Deux de ses recommandations, le formulaire simplifié et le retour d'information systématique au déclarant, figurent dans la directive ministérielle entrée en vigueur en janvier 2024. Le mémoire est public. Référence : Réseau québécois de recherche en oncologie de précision. (2023). Mémoire sur la déclaration des effets indésirables graves en pharmacie (L. Bouchard-Nadeau, réd.). https://doi.org/10.0000/rqrop.2023.memoire",
        "5. Méthode d'ajustement des analyses de disproportionnalité pour le biais de notoriété (2019 à 2020 · clientèle A). Rôle : première auteure, conception de la méthode. Retombées : la méthode corrige l'inflation des signaux qui suit une alerte médiatique. Les lignes directrices méthodologiques fictives du Réseau canadien de pharmacovigilance la décrivent (2022, annexe C), et deux équipes européennes l'ont reprise, comme le montrent les travaux qui la citent. Importance : c'est ma contribution méthodologique la plus fondamentale, et celle que la présente proposition poursuit. Référence : Bouchard-Nadeau, L., & Moreau, D. (2020). Adjusting disproportionality measures for notoriety bias: A time-stratified approach. Revue fictive de pharmacoépidémiologie, 27(6), 501-513. https://doi.org/10.0000/rfpe.2020.2706",
        "6. Essai de phase II PROTECT-ONC sur la prévention des mucosites (2021 à 2024 · clientèles A et B). Rôle : co-investigatrice responsable de la surveillance des effets indésirables et de la pharmacovigilance de l'essai, selon les BPC de l'ICH. Retombées : essai multicentrique randomisé enregistré (fictif, NCT00000000), 212 participants. L'analyse de sécurité que j'ai dirigée a conduit à un amendement du protocole en 2022, un ajustement de dose chez les patients de plus de 75 ans, approuvé par le comité d'éthique. Résultats publiés en 2025. Référence : Fortin, É., Bouchard-Nadeau, L., Nguyen, T.-A.*, et al. (2025). Oral cryotherapy plus fictinol for the prevention of chemotherapy-induced mucositis: The PROTECT-ONC randomized trial. Journal fictif d'oncologie, 43(2), 145-157. https://doi.org/10.0000/jfo.2025.4302",
        "7. Formation continue « Lire un signal de pharmacovigilance » pour les pharmaciens d'oncologie (2022 à aujourd'hui · clientèle B). Rôle : conceptrice et formatrice principale, avec l'Association des pharmaciens en oncologie du Québec (fictive). Retombées : un atelier de trois heures accrédité, donné neuf fois à 410 pharmaciens dans quatre régions. D'après l'évaluation post-formation, la proportion de participants qui déclarent un effet indésirable dans les six mois passe de 22 % à 51 % (données de l'association, 2024). Cette contribution relie mes méthodes à la pratique quotidienne.",
        "8. Chronique « Le médicament en question » à la radio communautaire CKFX fictive (2019 à 2021 · clientèle C). Rôle : chroniqueuse. Retombées : 84 chroniques hebdomadaires de dix minutes sur la sécurité des médicaments, dont trois sur la façon de déclarer un effet indésirable soi-même. La radio a repris la série en balado (fictif), et le magazine fictif Le Consommateur averti l'a citée dans un dossier sur la pharmacovigilance citoyenne (mars 2021). Je n'ai pas de mesure de son effet sur les déclarations, et je ne prétends donc à aucun effet.",
        "9. Jeu de données ouvert QC-ADR-ONCO (2023 · clientèles A et B). Rôle : responsable de la curation et de la documentation. Retombées : un jeu de données anonymisé de 12 400 déclarations d'effets indésirables en oncologie, codées MedDRA, déposé avec un dictionnaire de données. Trois équipes hors du réseau l'ont réutilisé à ce jour. Référence : Bouchard-Nadeau, L., Kaur, P.*, & Moreau, D. (2023). QC-ADR-ONCO: Curated oncology adverse-event reports, Québec 2015-2022 (version 2) [Jeu de données]. Dépôt fictif de données de recherche du Québec. https://doi.org/10.0000/ddrq.2023.0042",
        "10. Évaluation par les pairs et jurys (2020 à aujourd'hui · clientèle A). Rôle : évaluatrice régulière pour la Revue fictive de pharmacovigilance et la Revue fictive de pharmacoépidémiologie, une vingtaine de rapports. Membre d'un comité d'évaluation de bourses d'études du programme fictif de formation en oncologie (2023 et 2024). Importance : un service à la discipline, sans retombées mesurables à revendiquer.",
      ],
    },
    {
      title: "Troisième section : Activités de supervision et de mentorat",
      items: [
        "Encadrement de la relève étudiante. Depuis 2021, direction de deux étudiantes au doctorat : Priya Kaur*, en pharmacoépidémiologie, dépôt prévu en 2026, et Thi-Anh Nguyen*, en pharmacologie clinique, depuis 2022. Codirection d'un étudiant à la maîtrise diplômé en 2024, Samuel Gagnon*, aujourd'hui pharmacien en établissement. Supervision de six stagiaires de premier cycle en pharmacie, dont trois ont présenté une affiche dans un congrès. Chaque personne supervisée est coauteure d'au moins une publication de la deuxième section. C'est un choix : la première publication se fait pendant la formation, avec mon appui, pas après.",
        "Personnel hautement qualifié. Formation et supervision d'une coordonnatrice de recherche et d'un analyste de données depuis 2022. À ma demande, l'analyste a suivi la formation aux BPC de l'ICH et signe maintenant les rapports de sécurité de l'essai PROTECT-ONC.",
        "Enseignement et ateliers. Cours de pharmacovigilance et de pharmacoépidémiologie au programme de doctorat professionnel en pharmacie, 45 heures par année depuis 2021. Atelier annuel « Détecter un signal en trois heures » pour les résidents en pharmacie hospitalière de la province (2022, 2023 et 2024). Formation continue décrite à la contribution 7.",
        "Mentorat. Mentore de deux chercheuses en début de carrière dans le programme fictif de mentorat de la Société de pharmacologie du Québec depuis 2023. Mentorat informel de pharmaciens cliniciens qui veulent publier leurs séries de cas : trois publications en ont résulté depuis 2022, dont je ne suis pas coauteure.",
        "Milieux de recherche sûrs, équitables et inclusifs. Le laboratoire Signal-Onco applique une charte de coauteurs rédigée avec les étudiants (ordre des auteurs décidé au début du projet, rôles CRediT consignés) et une plage horaire de réunions compatible avec les responsabilités familiales. Chaque année, une place de stage est réservée à un étudiant d'un programme collégial de techniques de laboratoire, en partenariat avec le Cégep fictif de la Capitale.",
      ],
    },
  ],
};
