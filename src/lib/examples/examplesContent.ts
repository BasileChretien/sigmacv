// Illustrative, FICTIONAL example CVs for the /examples gallery (C5), keyed by slug.
// Made-up researchers + fabricated publications (no real people/papers/DOIs); each
// page carries a visible "illustrative example" disclaimer. English-first.
import type { ExampleContent, ExampleSlug } from "./examples";

export const EXAMPLE_CONTENT: Record<ExampleSlug, ExampleContent> = {
  "grad-school-cv-biology": {
    metaTitle: "Academic CV example — Biology Master's/PhD applicant",
    metaDescription:
      "Academic CV example for a biology graduate school applicant. See how to structure Education, Research experience, Skills, and Awards for a life sciences CV.",
    navLabel: "Master's/PhD CV (Biology)",
    heading: "Academic CV example: Master's/PhD applicant in Biology",
    intro: [
      "This academic CV example shows how a biology student applying to Master's or PhD programmes can present their profile. It highlights Education, Research experience (lab rotations, undergraduate thesis), technical and statistical Skills, Poster presentations, Awards and scholarships, and a note on references — the sections that matter most when publication output is still limited.",
      "For life sciences at this career stage, conventions favour a chronological education section first, followed by hands-on laboratory research experience. Publications and posters are listed honestly (preprints or conference abstracts labelled as such). The APA citation style is used throughout, and the Modern template gives the CV a clean, reader-friendly layout suitable for both digital and printed submissions.",
    ],
    person: {
      name: "Mia Engström",
      credentials: "BSc",
      headline: "Biology graduate and Master's/PhD applicant — Molecular & Cell Biology",
      affiliation: "Department of Biological Sciences, Lakeview University",
      location: "Uppsala, Sweden",
    },
    citationStyle: "APA",
    templateLabel: "Modern",
    sections: [
      {
        title: "Education",
        items: [
          "BSc in Biology (Honours), Lakeview University, Uppsala, Sweden — 2021–2024. Graduated with First-Class Honours (GPA 3.9/4.0). Thesis: 'Differential expression of stress-response genes in Arabidopsis thaliana under UV-B irradiation.'",
          "International Exchange Semester, Faculty of Natural Sciences, Maastricht University, Netherlands — Spring 2023. Coursework in Advanced Cell Biology and Bioinformatics Tools.",
        ],
      },
      {
        title: "Research experience",
        items: [
          "Undergraduate Thesis Researcher, Plant Molecular Biology Lab (Prof. K. Lindqvist), Lakeview University — Sep 2023–Jun 2024. Designed and carried out RT-qPCR experiments to quantify expression of seven stress-related transcription factors in UV-B-stressed Arabidopsis seedlings. Established the lab's standard RNA extraction and cDNA synthesis protocol; analysed data with R (DESeq2, ggplot2).",
          "Research Assistant (voluntary), Ecology & Evolution Lab (Dr. P. Söderström), Lakeview University — Jun–Aug 2023. Assisted with field sampling of freshwater macroinvertebrates in three lakes; conducted morphological identification and entered data into a shared PostgreSQL database.",
          "Student Internship, Biomedical Research Institute, Karolinska Hospital, Stockholm — Jun–Aug 2022. Supported cell-culture maintenance (HEK 293, primary mouse hepatocytes) and Western blot assays under supervision of a postdoctoral researcher. Attended weekly journal clubs.",
        ],
      },
      {
        title: "Publications & posters",
        items: [
          "Engström, M., & Lindqvist, K. (2024, June). UV-B-responsive transcription factors in Arabidopsis: a quantitative gene-expression study [Poster presentation]. Nordic Plant Science Meeting, Gothenburg, Sweden.",
          "Söderström, P., Henriksson, J., & Engström, M. (2024). Seasonal shifts in macroinvertebrate community composition across oligotrophic Swedish lakes [Preprint]. bioRxiv. doi:10.0000/bio2024.03.12",
        ],
      },
      {
        title: "Awards & scholarships",
        items: [
          "Lakeview University Dean's List — 2022, 2023, 2024 (top 5% of cohort).",
          "SULF Travel Scholarship (Swedish Association of University Teachers and Researchers) — 2024. Awarded to support attendance at the Nordic Plant Science Meeting.",
          "Best Undergraduate Thesis Prize, Department of Biological Sciences, Lakeview University — 2024.",
          "Erasmus+ Mobility Grant, European Commission — 2023. Funded exchange semester at Maastricht University.",
        ],
      },
      {
        title: "Skills",
        items: [
          "Molecular biology: RNA extraction, RT-qPCR, Western blotting, gel electrophoresis, cell culture (mammalian and plant systems), aseptic technique.",
          "Bioinformatics & statistics: R (DESeq2, ggplot2, tidyverse), Python (pandas, biopython, basic scripting), BLAST, MEGA (phylogenetic analysis), ImageJ.",
          "Field & ecology methods: freshwater macroinvertebrate sampling, morphological identification using dichotomous keys, GPS data logging.",
          "Laboratory management: chemical safety (COSHH-equivalent Swedish regulations), equipment calibration logs, electronic lab notebook (ELN).",
          "Languages: Swedish (native), English (fluent — C2), German (intermediate — B1).",
        ],
      },
      {
        title: "Presentations & outreach",
        items: [
          "Oral presentation: 'Gene regulation under light stress in Arabidopsis' — Lakeview University Undergraduate Research Symposium, May 2024.",
          "Science communicator, Lakeview University Open Day — 2022, 2023. Delivered guided lab demonstrations for prospective students and the public.",
          "Volunteer, Pint of Science festival, Uppsala — 2023. Assisted with event organisation and public engagement activities.",
        ],
      },
      {
        title: "References",
        items: ["References available on request."],
      },
    ],
  },
  "phd-cv-computer-science": {
    metaTitle: "Academic CV example — PhD candidate in Computer Science",
    metaDescription:
      "Academic CV example for a PhD candidate in computer science and machine learning. See how to structure publications, research experience, and skills in IEEE style.",
    navLabel: "PhD CV (Computer Science)",
    heading: "Academic CV example: PhD candidate in Computer Science (Machine Learning)",
    intro: [
      "This academic CV example illustrates how a PhD candidate in computer science and machine learning typically presents their research profile. It covers conference publications in IEEE citation style, research assistantships, teaching experience, and a concise skills section — the core building blocks recruiters and PhD committees look for.",
      "Computer science CVs at the PhD stage are publication-centred: conference papers at top venues (NeurIPS, CVPR, ICLR equivalents) carry as much weight as journal articles. Citations follow the IEEE numbered format, and the sidebar template keeps personal details and skills visible while the main column showcases research output.",
    ],
    person: {
      name: "Yara Okonkwo",
      credentials: "PhD candidate",
      headline: "PhD candidate in Machine Learning",
      affiliation: "Department of Computer Science, Harwell Institute of Technology",
      location: "Bristol, United Kingdom",
    },
    citationStyle: "IEEE",
    templateLabel: "Sidebar",
    sections: [
      {
        title: "Education",
        items: [
          "PhD in Computer Science (Machine Learning), Harwell Institute of Technology, Bristol, UK — expected 2026. Thesis: 'Efficient Uncertainty Quantification in Large-Scale Graph Neural Networks'. Supervisor: Prof. R. Castellano.",
          "MSc in Artificial Intelligence (Distinction), Harwell Institute of Technology, Bristol, UK — 2021.",
          "BSc in Mathematics and Computer Science (First Class Honours), University of Midvale, Birmingham, UK — 2020.",
        ],
      },
      {
        title: "Research experience",
        items: [
          "Graduate Research Assistant, Adaptive Learning Systems Lab, Harwell Institute of Technology, 2021–present. Developing scalable Bayesian inference methods for graph-structured data; maintaining the lab's open-source benchmarking toolkit.",
          "Research Intern, DeepSense AI (industry), London, UK, Summer 2023. Investigated test-time adaptation strategies for distribution-shifted medical imaging; work incorporated into internal product pipeline.",
          "Undergraduate Research Assistant, Optimisation and Learning Group, University of Midvale, 2019–2020. Implemented gradient-free optimisation baselines for hyperparameter search; contributed to codebase used in two subsequent lab publications.",
        ],
      },
      {
        title: "Publications",
        items: [
          "[1] Y. Okonkwo, R. Castellano, and P. Ferreira, 'Calibrated Posterior Estimates for Node Classification via Stochastic Depth Sampling,' in Proc. Int. Conf. Neural Information Processing Systems (NIPS-X), Montreal, Canada, Dec. 2023, pp. 4812–4825.",
          "[2] Y. Okonkwo and R. Castellano, 'Laplacian Dropout Regularisation for Graph Convolutional Networks,' in Proc. Int. Conf. Learning Representations (ICLR-W), Workshop on Geometrical and Topological Representation Learning, Vienna, Austria, May 2023.",
          "[3] Y. Okonkwo, S. Ndiaye, and L. Hartman, 'BenchGNN: A Reproducible Evaluation Suite for Uncertainty in Graph Neural Networks,' arXiv preprint arXiv:2311.09182, 2023. [Preprint]",
          "[4] S. Ndiaye, Y. Okonkwo, and R. Castellano, 'Scalable Variational Inference for Deep Graph Models,' IEEE Trans. Neural Netw. Learn. Syst., vol. 35, no. 4, pp. 1923–1936, Apr. 2024. doi:10.0000/tnnls.2024.00412",
          "[5] Y. Okonkwo, T. Bergstrom, and R. Castellano, 'Test-Time Uncertainty Adaptation under Covariate Shift for Medical Image Segmentation,' in Proc. IEEE/CVF Conf. Computer Vision and Pattern Recognition Workshops (CVPRW), Seattle, USA, Jun. 2024, pp. 301–308.",
        ],
      },
      {
        title: "Teaching",
        items: [
          "Teaching Assistant, CS3420 — Deep Learning (undergraduate), Harwell Institute of Technology, Spring 2024. Delivered weekly lab sessions (60 students); designed three assessed practicals in PyTorch.",
          "Teaching Assistant, CS2210 — Algorithms and Data Structures (undergraduate), Harwell Institute of Technology, Autumn 2022 and Autumn 2023. Led problem-solving tutorials; held weekly office hours.",
          "Guest Lecturer, MSc AI Research Methods module, Harwell Institute of Technology, Feb. 2024. One-hour lecture on 'Reproducibility and Open Science in Machine Learning'.",
        ],
      },
      {
        title: "Conference presentations",
        items: [
          "Oral presentation: 'Calibrated Posterior Estimates for Node Classification via Stochastic Depth Sampling,' NIPS-X, Montreal, Canada, Dec. 2023.",
          "Poster: 'Laplacian Dropout Regularisation for Graph Convolutional Networks,' ICLR-W Workshop on Geometrical and Topological Representation Learning, Vienna, Austria, May 2023.",
          "Poster: 'Test-Time Uncertainty Adaptation under Covariate Shift,' CVPRW, Seattle, USA, Jun. 2024.",
          "Talk: 'Open Benchmarking Practices for Graph Neural Networks,' UK Machine Learning PhD Symposium, Edinburgh, UK, Sep. 2023.",
        ],
      },
      {
        title: "Awards & honours",
        items: [
          "EPSRC Doctoral Training Partnership Studentship (full fees + stipend), 2021–2025.",
          "Best Student Paper Runner-Up, UK Machine Learning PhD Symposium, 2023.",
          "Faculty Prize for Outstanding MSc Dissertation, Harwell Institute of Technology, 2021.",
          "Dean's List, University of Midvale, 2018–2020.",
        ],
      },
      {
        title: "Skills",
        items: [
          "Programming languages: Python (expert), C++ (proficient), Julia (familiar), Bash.",
          "ML frameworks: PyTorch, PyTorch Geometric, JAX, scikit-learn, Hugging Face Transformers.",
          "Tools & infrastructure: Git, Docker, Weights & Biases, SLURM (HPC), LaTeX.",
          "Research methods: Bayesian deep learning, graph neural networks, uncertainty quantification, distribution shift, reproducibility.",
          "Languages: English (native), French (intermediate).",
        ],
      },
    ],
  },
  "phd-cv-psychology": {
    metaTitle: "Academic CV example — PhD candidate in Psychology",
    metaDescription:
      "Academic CV example for a PhD candidate in cognitive and clinical psychology. See how to structure publications, research experience, and skills in APA style.",
    navLabel: "PhD CV (Psychology)",
    heading: "Academic CV example: PhD candidate in cognitive and clinical psychology",
    intro: [
      "This academic CV example is written for a third-year PhD candidate specialising in cognitive and clinical psychology. It illustrates how to present a developing publication record alongside research experience, conference work, teaching duties, and funding — exactly the combination of sections most useful when applying for postdoctoral positions, fellowships, or clinical research roles.",
      "The example follows APA 7th edition citation format throughout the Publications section, which is standard practice in psychology. Preprints and poster presentations are labelled clearly and kept separate from peer-reviewed journal articles. Skills are broken into statistical methods and software, a convention common in quantitative psychology CVs.",
    ],
    person: {
      name: "Mara Lindqvist",
      credentials: "MSc, PhD candidate",
      headline: "PhD candidate in Cognitive and Clinical Psychology",
      affiliation: "Department of Psychology, Hartwell University",
      location: "Utrecht, Netherlands",
    },
    citationStyle: "APA",
    templateLabel: "Classic",
    sections: [
      {
        title: "Education",
        items: [
          "PhD in Psychology (expected 2026) — Hartwell University, Utrecht, Netherlands. Thesis: 'Attentional bias modification and its effect on worry in generalised anxiety disorder: a randomised controlled trial.'",
          "MSc in Research Methods in Psychology (with Distinction), 2021 — Hartwell University, Utrecht, Netherlands.",
          "BSc in Psychology (Honours, First Class), 2019 — University of Veendam, Groningen, Netherlands.",
        ],
      },
      {
        title: "Research experience",
        items: [
          "Doctoral Researcher, Anxiety and Cognition Lab, Hartwell University (2021–present). Conducting a pre-registered RCT of web-delivered attentional bias modification in adults with generalised anxiety disorder (N = 180). Responsible for trial coordination, data collection, fMRI pre-processing (FSL), and statistical analysis.",
          "Research Assistant, Clinical Cognition Group, Hartwell University (2020–2021). Assisted with data collection and coding for a longitudinal study examining rumination and executive function in recurrent depression (n = 120 community sample). Managed SPSS and R data pipelines.",
          "Research Intern, Centre for Mental Health Innovation, University of Veendam (2019). Conducted a systematic literature search and meta-analytic data extraction for a review of interpretation bias in social anxiety. Co-authored the resulting manuscript.",
        ],
      },
      {
        title: "Publications",
        items: [
          "Lindqvist, M., Bakker, T., & Verhulst, S. (2024). Attentional bias modification via web-delivered training: A pilot randomised controlled trial in generalised anxiety disorder. Journal of Anxiety Disorders, 94, 102741. doi:10.0000/jad.2024.102741",
          "Lindqvist, M., & Verhulst, S. (2023). Does attentional bias predict worry severity? A meta-analytic review. Clinical Psychology Review, 102, 102285. doi:10.0000/cpr.2023.102285",
          "Kowalczyk, R., Lindqvist, M., De Vries, P., & Mulder, E. (2023). Executive function deficits as a transdiagnostic risk factor: Evidence from a community sample. Psychological Medicine, 53(8), 3412–3421. doi:10.0000/psymed.2023.3412",
          "Lindqvist, M., Bakker, T., & Verhulst, S. (2025, April). Neural correlates of attentional bias reduction following web-based ABM training: Preliminary fMRI findings. [Preprint]. PsyArXiv. doi:10.0000/psyarxiv.2025.abm",
        ],
      },
      {
        title: "Conference presentations and posters",
        items: [
          "Lindqvist, M., Bakker, T., & Verhulst, S. (2024, September). Attentional bias modification in GAD: RCT interim results. Paper presented at the European Congress of Behavioural and Cognitive Therapies (EABCT), Vienna, Austria.",
          "Lindqvist, M., & Verhulst, S. (2023, July). Interpretation bias in worry: Stimulus specificity matters. Poster presented at the International Congress of Psychology (ICP), Prague, Czech Republic.",
          "Lindqvist, M. (2022, May). Measuring attentional bias reliably: A comparison of dot-probe paradigm variants. Poster presented at the Netherlands Annual Psychology Congress (NJC), Amsterdam, Netherlands.",
        ],
      },
      {
        title: "Teaching",
        items: [
          "Teaching Assistant, Research Methods II (undergraduate), Hartwell University (2022–2024). Led weekly seminars (n = 25 students), marked coursework, and provided feedback on quantitative research reports.",
          "Guest Lecturer, 'Cognitive models of anxiety' (MSc Clinical Psychology module), Hartwell University (March 2024). One 90-minute lecture on attentional and interpretive biases in anxiety disorders.",
          "Thesis Supervisor (co-supervision), Hartwell University (2023–present). Co-supervising two BSc final-year project students on eye-tracking studies of attentional bias.",
        ],
      },
      {
        title: "Awards and funding",
        items: [
          "NWO PhD Scholarship (PhDs in the Humanities and Social Sciences), Netherlands Organisation for Scientific Research (2021–2025). Full funding for doctoral project.",
          "Best Poster Award, Netherlands Annual Psychology Congress (NJC), 2022.",
          "Faculty Excellence Award for Outstanding MSc Dissertation, Hartwell University, 2021.",
          "Hartwell University Research Travel Grant (€1,200) for EABCT 2024 attendance.",
        ],
      },
      {
        title: "Professional memberships",
        items: [
          "European Association for Behavioural and Cognitive Therapies (EABCT) — Student member",
          "Association for Psychological Science (APS) — Student affiliate",
          "Netherlands Institute of Psychologists (NIP) — Graduate member",
        ],
      },
      {
        title: "Skills",
        items: [
          "Statistical methods: General linear models, mixed-effects models (linear and logistic), meta-analysis (fixed- and random-effects, heterogeneity, publication bias), power analysis, mediation and moderation (PROCESS macro), pre-registration (OSF).",
          "Software: R (tidyverse, lme4, metafor, ggplot2), SPSS, Python (basic data wrangling), FSL (fMRI pre-processing and GLM analysis), E-Prime (experimental presentation), Qualtrics, JASP.",
          "Languages: Dutch (native), English (fluent, C2), German (intermediate, B2).",
        ],
      },
    ],
  },
  "postdoc-cv-economics": {
    metaTitle: "Academic CV example — Postdoc in Economics",
    metaDescription:
      "Academic CV example for a postdoctoral researcher in economics. See how publications, working papers, grants, and service are presented in Chicago author-date style.",
    navLabel: "Postdoc CV (Economics)",
    heading: "Academic CV example: postdoctoral researcher in Economics",
    intro: [
      "This academic CV example is designed for early-career economists at the postdoctoral stage — typically 1–4 years after the PhD, applying for assistant-professor positions or a second postdoc. It demonstrates how to present working papers (including a clearly labeled job-market paper), peer-reviewed publications, grant history, teaching experience, conference presentations, and journal refereeing service in a clean, field-standard layout.",
      "Economics CVs follow a distinctive set of conventions: working papers are listed separately and prominently because they represent active research; publications use Chicago author-date citations; the job-market paper is flagged at the top of the working-papers section; and the researcher's own name appears in full in every citation. This example uses the Classic template and Chicago (author-date) citation style, consistent with standard practice at leading economics departments.",
    ],
    person: {
      name: "Dr. Tomás Herrera",
      credentials: "PhD",
      headline: "Postdoctoral Research Fellow in Economics",
      affiliation: "Department of Economics, Hartwell University",
      location: "Boston, MA, United States",
    },
    citationStyle: "Chicago (author-date)",
    templateLabel: "Classic",
    sections: [
      {
        title: "Education",
        items: [
          "PhD in Economics, Eastbridge University, 2023. Dissertation: 'Fiscal Transfers, Local Labor Markets, and Household Insurance.' Committee: Prof. Gunnar Oström (chair), Prof. Cecilia Vance, Prof. Dmitri Wolff.",
          "MA in Economics, Eastbridge University, 2019.",
          "BSc in Economics and Statistics (First Class Honours), Marlowe College, University of Carwick, 2017.",
        ],
      },
      {
        title: "Appointments",
        items: [
          "Postdoctoral Research Fellow, Department of Economics, Hartwell University, 2023–present. Host: Prof. Renata Solis.",
          "Visiting Researcher, Institute for Fiscal Studies, London, UK, Summer 2022.",
          "Research Assistant to Prof. Gunnar Oström (Eastbridge University), 2018–2020.",
        ],
      },
      {
        title: "Working Papers",
        items: [
          "★ Job Market Paper — Herrera, Tomás. 'Place-Based Transfers and Worker Mobility: Evidence from a Regional Equalization Reform.' Under review at the Journal of Political Economy.",
          "Herrera, Tomás, and Tobias Ferrante. 'Unemployment Insurance Generosity and Spousal Labor Supply: Quasi-Experimental Evidence.' Revise and resubmit at the Review of Economic Studies.",
          "Herrera, Tomás, Priya Acharya, and Sven Holmgren. 'Housing Costs and Internal Migration Responses to Local Fiscal Shocks.' NBER Working Paper No. 00042. National Bureau of Economic Research, 2024.",
          "Herrera, Tomás. 'Fiscal Capacity Constraints and Public-Good Provision in Developing Economies.' Hartwell University, Department of Economics Working Paper No. 2024-11.",
        ],
      },
      {
        title: "Publications",
        items: [
          "Herrera, Tomás, and Cecilia Vance. 2023. 'Intergovernmental Grants and Local Fiscal Behavior: A Regression-Discontinuity Approach.' American Economic Journal: Economic Policy 15 (3): 188–227.",
          "Herrera, Tomás. 2022. 'Consumption Smoothing and the Timing of Benefit Receipt: Evidence from Administrative Data.' Journal of Public Economics 214: 104728.",
          "Herrera, Tomás, and Dmitri Wolff. 2021. 'Do Minimum Wage Increases Reduce Household Poverty? New Evidence from Linked Employer–Employee Records.' Journal of Labor Economics 39 (2): 451–489.",
          "Ferrante, Tobias, and Tomás Herrera. 2021. 'Earnings Volatility and Precautionary Savings over the Life Cycle.' Review of Income and Wealth 67 (4): 912–938.",
          "Herrera, Tomás, Priya Acharya, and Gunnar Oström. 2020. 'Capital Grants and Manufacturing Employment: Firm-Level Evidence from a European Regional Policy.' Economic Journal 130 (632): 2345–2381.",
          "Herrera, Tomás. 2019. 'Tax Salience and Behavioral Responses to Income Taxation: A Field Experiment.' Journal of Public Economics 178: 104065.",
        ],
      },
      {
        title: "Grants & Fellowships",
        items: [
          "Postdoctoral Research Grant, Hartwell University Office of Research, $45,000, 2024–2025.",
          "National Science Foundation Doctoral Dissertation Research Improvement Grant (DDRIG), 'Regional Fiscal Transfers and Labor-Market Adjustment,' $18,500, 2021–2022.",
          "Eastbridge University Graduate Research Fellowship (full tuition + stipend), 2018–2023.",
          "Institute for Fiscal Studies Research Bursary, £3,000, 2022.",
          "Marlowe College Undergraduate Research Scholarship, £1,200, 2016.",
        ],
      },
      {
        title: "Teaching",
        items: [
          "Instructor of Record — Public Economics (undergraduate), Hartwell University, Fall 2024. Enrollment: 42. Teaching evaluations: 4.6/5.0.",
          "Teaching Assistant — Econometrics II (graduate), Eastbridge University, 2021–2022.",
          "Teaching Assistant — Principles of Macroeconomics (undergraduate), Eastbridge University, 2019–2020.",
          "Guest Lecturer — 'Fiscal Federalism and Local Public Finance,' Advanced Public Finance (graduate), Hartwell University, Spring 2024.",
        ],
      },
      {
        title: "Conference Presentations",
        items: [
          "National Bureau of Economic Research Summer Institute (Public Economics), Cambridge, MA, July 2024.",
          "American Economic Association Annual Meeting, San Antonio, TX, January 2024.",
          "Society of Labor Economists Annual Meeting, Vancouver, BC, May 2023.",
          "European Economic Association Annual Congress, Barcelona, Spain, August 2022.",
          "Midwest Economics Association Annual Meeting, Cleveland, OH, March 2022.",
          "Eastbridge University Graduate Economics Conference (Best Paper Award), 2021.",
        ],
      },
      {
        title: "Awards & Honors",
        items: [
          "Best Paper Award, Eastbridge University Graduate Economics Conference, 2021.",
          "Eastbridge University Graduate Teaching Award (nominated by students), 2022.",
          "Marlowe College Prize in Economics (highest-ranked BSc graduate), University of Carwick, 2017.",
        ],
      },
      {
        title: "Service",
        items: [
          "Referee: American Economic Review, Journal of Political Economy, Review of Economic Studies, Quarterly Journal of Economics, Journal of Public Economics (×4), American Economic Journal: Economic Policy (×3), Journal of Labor Economics (×2), Economic Journal.",
          "Co-organizer, Hartwell University Applied Economics Workshop, 2023–present.",
          "Graduate Student Representative, Eastbridge University Department of Economics, 2020–2021.",
          "Session chair, Midwest Economics Association Annual Meeting, Cleveland, OH, 2022.",
        ],
      },
    ],
  },
  "postdoc-cv-chemistry": {
    metaTitle: "Academic CV example — Postdoc in Chemistry",
    metaDescription:
      "A realistic academic CV example for a postdoctoral researcher in chemistry (ACS style). See how to present publications, fellowships, and skills.",
    navLabel: "Postdoc CV (Chemistry)",
    heading: "Academic CV example: postdoctoral researcher in Chemistry",
    intro: [
      "This academic CV example is written for a postdoctoral researcher in synthetic and physical organic chemistry with three years of postdoctoral experience. It illustrates how to present a chemistry CV in ACS citation style, with a publication list as the centrepiece, alongside fellowships, conference presentations, and technical skills sections — the structure expected by hiring committees for faculty and industry research roles.",
      "Citations follow American Chemical Society (ACS) style: author surnames and initials, italicised journal abbreviation, bold volume number, year, and page range. Equal-contribution and corresponding-author notations are included where applicable. Section ordering follows the convention for chemistry postdocs: Education and appointments first, then publications, then funding and activities.",
    ],
    person: {
      name: "Dr. Mira Svensson",
      credentials: "PhD",
      headline: "Postdoctoral researcher in synthetic and physical organic chemistry",
      affiliation: "Department of Chemistry, Alderwick University",
      location: "Bristol, United Kingdom",
    },
    citationStyle: "ACS",
    templateLabel: "Modern",
    sections: [
      {
        title: "Education",
        items: [
          "PhD in Organic Chemistry — Alderwick University, Bristol, UK (2018–2022). Thesis: 'Strain-Release Cyclisation Strategies for the Synthesis of Bicyclic Lactams.' Supervisor: Prof. T. Hargreaves.",
          "MSc in Chemistry (Distinction) — University of Vastholm, Vastholm, Sweden (2016–2018). Thesis: 'Solvent Effects on the Asymmetric Mannich Reaction Using Bifunctional Thiourea Catalysts.'",
          "BSc (Hons) in Chemistry, First Class — University of Vastholm, Vastholm, Sweden (2013–2016).",
        ],
      },
      {
        title: "Research appointments",
        items: [
          "Postdoctoral Research Associate — Department of Chemistry, Alderwick University, Bristol, UK (Jan 2023–present). Supervisor: Prof. C. Oduya. Developing photoredox-mediated C–N cross-coupling reactions for the rapid assembly of medicinally relevant nitrogen heterocycles.",
          "Postdoctoral Fellow (EMBO Short-Term Fellowship) — Institute of Chemical Biology, ETH Lausanne, Lausanne, Switzerland (Jul–Dec 2022). Host: Dr. F. Brandt. Mechanistic studies of radical-mediated desymmetrisation of meso-epoxides.",
          "Graduate Research Assistant — Hargreaves Group, Alderwick University, Bristol, UK (2018–2022). Total synthesis of strained bicyclic scaffolds and development of novel ring-opening/closing metathesis sequences.",
        ],
      },
      {
        title: "Publications",
        items: [
          "Svensson, M.; Oduya, C. Photoredox-Enabled C–N Coupling of Aryl Bromides with Secondary Amines Under Mild Aqueous Conditions. *J. Am. Chem. Soc.* **2025**, *147*, 8312–8325. (Corresponding author)",
          "Walters, P.; Svensson, M.; Oduya, C. Visible-Light-Driven Decarboxylative Radical Addition to Imines: Scope and Mechanistic Insight. *ACS Catal.* **2024**, *14*, 11204–11219.",
          "Svensson, M.*; Brandt, F.* Stereocontrolled Radical Desymmetrisation of meso-Epoxides via Chiral Phosphoric Acid Catalysis. *Angew. Chem. Int. Ed.* **2023**, *62*, e202214877. (*Equal contribution)",
          "Svensson, M.; Hargreaves, T.; Lindqvist, A. Strain-Release [2+2] Cycloaddition of Bicyclo[1.1.0]butanes with Nitrosoarenes: A Route to 2-Azabicyclo[2.1.1]hexanes. *J. Org. Chem.* **2022**, *87*, 9540–9553.",
          "Hargreaves, T.; Svensson, M.; Maddox, R.; Yuen, K. Ring-Opening Metathesis Polymerisation of Oxanorbornene Derivatives for Functional Polymer Synthesis. *Macromolecules* **2021**, *54*, 7781–7794.",
          "Svensson, M.; Lindqvist, A.; Hargreaves, T. Diastereoselective Construction of cis-Fused Lactam Cores via Intramolecular Aza-Michael Cyclisation. *Org. Lett.* **2020**, *22*, 4103–4107.",
          "Lindqvist, A.; Svensson, M.; Ekberg, J. Enantioselective Hydrophosphonylation of Ketimine Derivatives Catalysed by Bifunctional Cinchona Alkaloids. *Synthesis* **2019**, *51*, 3872–3882.",
          "Svensson, M.*; Persson, H.* Solvent Polarity Effects on Reaction Rate and Enantioselectivity in Thiourea-Catalysed Mannich Reactions: A Combined Kinetic and Computational Study. *Chem. Eur. J.* **2018**, *24*, 14567–14576. (*Equal contribution)",
          "Ekberg, J.; Svensson, M.; Lindqvist, A. Microwave-Assisted Synthesis of 2,4-Disubstituted Thiazolopyridines as Potential Kinase Inhibitor Scaffolds. *Synlett* **2017**, *28*, 2209–2214.",
          "… and 2 additional peer-reviewed articles.",
        ],
      },
      {
        title: "Fellowships & grants",
        items: [
          "Royal Society of Chemistry Researcher Mobility Grant (£4,800) — 2024. Collaborative visit to the Kramer Laboratory, University of Mannheim, Germany.",
          "EMBO Short-Term Fellowship (CHF 6,000) — 2022. Institute of Chemical Biology, ETH Lausanne.",
          "Alderwick University PhD Excellence Scholarship (full fees + £18,000 stipend p.a.) — 2018–2022.",
          "Swedish Chemical Society Travel Award (SEK 15,000) — 2017. Attended IUPAC World Chemistry Congress, São Paulo.",
        ],
      },
      {
        title: "Conference presentations",
        items: [
          "Svensson, M. 'Photoredox C–N Coupling in Water: Scope and Synthetic Applications.' Oral, RSC Organic Division Early Career Symposium, Manchester, UK, March 2025.",
          "Svensson, M.; Walters, P.; Oduya, C. 'Radical Decarboxylative Additions to Imines Under Visible-Light Irradiation.' Poster, American Chemical Society National Meeting, San Francisco, CA, August 2024.",
          "Svensson, M.; Brandt, F. 'Chiral Phosphoric Acid-Catalysed Radical Desymmetrisation of meso-Epoxides.' Oral, ORCHEM 2023 (Gesellschaft Deutscher Chemiker), Berlin, Germany, September 2023.",
          "Svensson, M.; Hargreaves, T. 'Bicyclo[1.1.0]butane Ring-Opening as a Gateway to Strained Heterocyclic Scaffolds.' Poster, RSC Synthesis in Biology & Medicine, Cambridge, UK, November 2021.",
        ],
      },
      {
        title: "Teaching & mentoring",
        items: [
          "Undergraduate practical demonstrator, 2nd-year Organic Synthesis Laboratory — Alderwick University (2019–2022, ~80 h/year).",
          "Guest lecturer, MSc module 'Advanced Synthetic Methods' (two 1-hour lectures on C–N bond formation) — Alderwick University, 2024.",
          "Primary mentor for two final-year MChem project students (Alderwick, 2023–2024); both students subsequently enrolled in PhD programmes.",
          "Peer tutor, Organic Chemistry I for first-year students — University of Vastholm (2017–2018).",
        ],
      },
      {
        title: "Awards & honours",
        items: [
          "RSC Organic Division Prize for Best Oral Presentation by an Early-Career Researcher — 2025.",
          "Alderwick University Faculty of Science Best PhD Thesis Prize — 2023.",
          "IUPAC Poster Prize (Physical Organic Chemistry) — IUPAC World Chemistry Congress, São Paulo, 2017.",
        ],
      },
      {
        title: "Technical skills",
        items: [
          "Synthesis & techniques: multi-step total synthesis; photoredox catalysis; asymmetric organocatalysis; olefin metathesis; flow chemistry; Schlenk/glovebox air-free operations.",
          "Characterisation & instrumentation: 1H/13C/31P NMR (up to 600 MHz, including 2D COSY/HSQC/HMBC/NOESY); high-resolution mass spectrometry (ESI-HRMS, APCI); FT-IR; UV-Vis; polarimetry; X-ray crystallography (data collection and SHELXL refinement).",
          "Chromatography & purification: preparative HPLC (chiral and achiral); flash column chromatography; MPLC; GC-MS.",
          "Computational: Gaussian 16 (DFT geometry optimisations, transition-state searches); SPARTAN; SciFinder; Reaxys; Python (data processing, reaction visualisation with RDKit).",
          "Languages: English (fluent), Swedish (native), German (conversational).",
        ],
      },
    ],
  },
  "faculty-cv-physics": {
    metaTitle: "Academic CV example — Associate Professor in Physics",
    metaDescription:
      "A complete academic CV example for an Associate Professor in condensed matter physics, showing publications, grants, teaching, supervision, and service sections.",
    navLabel: "Associate Professor CV (Physics)",
    heading: "Academic CV example: Associate Professor in Condensed Matter Physics",
    intro: [
      "This academic CV example illustrates a strong mid-career faculty profile in condensed matter physics. It covers all the sections typically expected of an Associate Professor: education, academic appointments, a curated list of peer-reviewed publications (formatted in AIP/Physical Review numbered style), competitive grant funding, PhD and postdoctoral supervision, teaching responsibilities, invited conference talks, honours, and professional service. Use it as a benchmark when building or updating your own academic CV.",
      "Conventions followed here reflect North American and European physics norms: publications are numbered and ordered reverse-chronologically, grant entries include funding agency, award number, amount, and dates, and the emphasis is on research output and external funding track record. The 'Sidebar' template places contact details, metrics, and a brief research summary in the left column, with the main CV content flowing on the right.",
    ],
    person: {
      name: "Dr. Priya Raman",
      credentials: "PhD",
      headline: "Associate Professor of Condensed Matter Physics",
      affiliation: "Department of Physics and Astronomy, Westholm University",
      location: "Uppsala, Sweden",
    },
    citationStyle: "AIP / Physical Review (numbered)",
    templateLabel: "Sidebar",
    sections: [
      {
        title: "Education",
        items: [
          "PhD in Physics, University of Aarhus, Denmark, 2009. Thesis: 'Spin-charge separation and Luttinger liquid signatures in quasi-one-dimensional organic conductors.' Supervisor: Prof. H. Bergstrom.",
          "MSc in Physics (with distinction), University of Aarhus, Denmark, 2005.",
          "BSc in Physics and Mathematics, Lund University, Sweden, 2003.",
        ],
      },
      {
        title: "Academic appointments",
        items: [
          "Associate Professor (Universitetslektor), Department of Physics and Astronomy, Westholm University, Uppsala, Sweden, 2018–present.",
          "Assistant Professor, Department of Physics and Astronomy, Westholm University, 2015–2018.",
          "Postdoctoral Research Fellow, Max Planck Institute for Solid State Research, Stuttgart, Germany, 2012–2015. Host: Dr. F. Krauss.",
          "Postdoctoral Associate, Institute for Quantum Materials, ETH Zurich, Switzerland, 2009–2012. Host: Prof. C. Muster.",
        ],
      },
      {
        title: "Selected publications",
        items: [
          "[1] M. Raman, T. Eriksen, and P. Sorensen, 'Nematic order and quantum criticality in an iron-based superconductor under uniaxial strain,' Phys. Rev. B 109, 014511 (2024). doi:10.0000/phb109014511",
          "[2] M. Raman, J. Holmberg, A. Nystrom, and R. Voss, 'Topological edge states in a strained kagome lattice: angle-resolved photoemission and ab initio study,' Nat. Commun. 14, 3872 (2023). doi:10.0000/ncomms143872",
          "[3] S. Palmqvist and M. Raman, 'Disorder-driven insulator-to-metal crossover in Mott-Hubbard thin films probed by terahertz spectroscopy,' Phys. Rev. Lett. 130, 256402 (2023). doi:10.0000/prl130256402",
          "[4] M. Raman, C. Brandt, and L. Novak, 'Charge-density-wave pinning and coherence lengths in NbSe2 monolayers on graphene substrates,' 2D Mater. 9, 035018 (2022). doi:10.0000/2dm9035018",
          "[5] M. Raman and T. Eriksen, 'Anomalous Hall effect in twisted bilayer transition-metal dichalcogenides: a Chern-band perspective,' Phys. Rev. B 105, 195139 (2022). doi:10.0000/phb105195139",
          "[6] J. Holmberg, M. Raman, P. Sorensen, and K. Ingvarsson, 'Kondo lattice signatures in angle-resolved photoemission of a heavy-fermion compound,' J. Phys.: Condens. Matter 33, 385602 (2021). doi:10.0000/jpcm33385602",
          "[7] M. Raman, F. Krauss, and D. Engel, 'Spectral weight transfer in a correlated oxide thin film: a dynamical mean-field theory analysis,' Phys. Rev. B 101, 125114 (2020). doi:10.0000/phb101125114",
          "[8] A. Nystrom and M. Raman, 'Strain-tunable superconducting dome in electron-doped cuprate films,' Supercond. Sci. Technol. 32, 085006 (2019). doi:10.0000/sust32085006",
          "[9] M. Raman, C. Muster, and R. Voss, 'Ultrafast quench of nematic fluctuations in FeSe by femtosecond laser excitation,' Phys. Rev. Lett. 121, 087002 (2018). doi:10.0000/prl121087002",
          "[10] M. Raman and F. Krauss, 'Orbital-selective Mott transition in a two-band Hubbard model on a triangular lattice,' Phys. Rev. B 97, 035150 (2018). doi:10.0000/phb97035150",
          "[11] R. Voss, M. Raman, and C. Muster, 'Imaging charge order in a correlated oxide heterostructure by scanning tunnelling microscopy,' ACS Nano 11, 9403 (2017). doi:10.0000/acsnano119403",
          "[12] M. Raman, H. Bergstrom, and G. Karstad, 'Low-energy excitations in the Luttinger liquid phase of (TMTTF)2PF6 by millimetre-wave spectroscopy,' Phys. Rev. B 83, 155118 (2011). doi:10.0000/phb83155118",
          "[13] M. Raman and H. Bergstrom, 'Pressure-tuned Mott transition in the quasi-one-dimensional Fabre salt series,' J. Low Temp. Phys. 161, 234 (2010). doi:10.0000/jltp161234",
          "... and 30 additional peer-reviewed articles in Physical Review B, Physical Review Letters, Nature Communications, npj Quantum Materials, and related journals.",
        ],
      },
      {
        title: "Grants & funding",
        items: [
          "Swedish Research Council (Vetenskapsradet), Project Grant 2023-04817: 'Topological and nematic order at the interface of correlated oxides.' PI: M. Raman. SEK 3,600,000. 2024–2027.",
          "Wallenberg Academy Fellowship, Knut and Alice Wallenberg Foundation, Grant KAW-2019-0203. PI: M. Raman. SEK 7,500,000. 2020–2025.",
          "Swedish Research Council, Starting Grant 2016-04128: 'Ultrafast dynamics of symmetry-broken phases in iron-based superconductors.' PI: M. Raman. SEK 2,800,000. 2017–2020.",
          "Carl Trygger Foundation for Scientific Research, Grant CTS 18:112: 'Charge-density-wave instabilities in van der Waals heterostructures.' PI: M. Raman. SEK 400,000. 2018–2020.",
          "European Research Council (ERC), Starting Grant CoNeMat, Grant No. 716284 (collaborating institution). Co-I: M. Raman. EUR 1,500,000 (total award). 2017–2022.",
        ],
      },
      {
        title: "PhD and postdoctoral supervision",
        items: [
          "Current PhD students: E. Bergman (2022–, nematic phases in cuprates); O. Thorvaldsen (2023–, topological magnons); I. Svensson (2024–, moiré correlated systems).",
          "Graduated PhD students: S. Palmqvist (2020, now postdoc at Chalmers); A. Nystrom (2018, now staff scientist at ESRF Grenoble); J. Holmberg (2022, now postdoc at University of Geneva).",
          "Current postdoctoral researchers: Dr. C. Brandt (2022–, charge order in 2D materials); Dr. P. Sorensen (2023–, heavy-fermion spectroscopy).",
          "Former postdoctoral researchers: Dr. T. Eriksen (2019–2022, now Assistant Professor at Oslo University); Dr. L. Novak (2020–2023, now research scientist at IBM Research Zurich).",
        ],
      },
      {
        title: "Teaching",
        items: [
          "Condensed Matter Physics I (PHYS3410), undergraduate, 30 ECTS, Westholm University, 2016–present (sole instructor).",
          "Advanced Topics in Quantum Materials (PHYS7620), graduate seminar course, 7.5 ECTS, Westholm University, 2017–present (course creator and instructor).",
          "Electromagnetism and Optics (PHYS1220), undergraduate, 30 ECTS, Westholm University, 2015–2017.",
          "Lab course in experimental physics (PHYS2100), undergraduate practical, Westholm University, 2015–2016.",
          "Teaching merit: Westholm University Teaching Excellence Recognition, Faculty of Science, 2021.",
        ],
      },
      {
        title: "Invited talks",
        items: [
          "Invited talk, APS March Meeting, Las Vegas, USA, 'Nematic criticality under uniaxial strain in iron-based superconductors,' March 2024.",
          "Invited seminar, Max Planck Institute for the Physics of Complex Systems, Dresden, Germany, 'Topological edge states in kagome metals from ARPES and theory,' November 2023.",
          "Keynote, Nordic Workshop on Correlated Electrons, Oslo, Norway, 'Charge and spin order at correlated oxide interfaces,' June 2023.",
          "Invited talk, International Conference on Strongly Correlated Electron Systems (SCES), Amsterdam, Netherlands, 'Orbital-selective Mott physics in multi-band models,' July 2022.",
          "Invited seminar, Institut Neel, CNRS Grenoble, France, 'CDW pinning and coherence in NbSe2 monolayers,' September 2021.",
          "Invited talk, Gordon Research Conference on Superconductivity, New London, USA, 'Ultrafast quench of nematic fluctuations in FeSe,' July 2019.",
          "Invited talk, European Physical Society Conference on Condensed Matter Physics (CMD), Berlin, Germany, 'Luttinger liquid spectroscopy in organic conductors,' September 2016.",
        ],
      },
      {
        title: "Awards and honours",
        items: [
          "Wallenberg Academy Fellow, Knut and Alice Wallenberg Foundation, 2019.",
          "Young Investigator Award, Swedish Physical Society, 2018.",
          "Westholm University Research Excellence Award (Faculty of Science), 2021.",
          "EPS Condensed Matter Physics Division prize (runner-up), European Physical Society, 2017.",
          "Best Doctoral Thesis in Experimental Condensed Matter Physics, Danish Physical Society, 2010.",
          "DAAD Postdoctoral Research Fellowship (Germany), 2012–2014.",
        ],
      },
      {
        title: "Service",
        items: [
          "Associate Editor, Physical Review B (Condensed Matter and Materials Physics section), American Physical Society, 2023–present.",
          "Editorial Advisory Board, npj Quantum Materials (Springer Nature), 2021–present.",
          "Referee (regular): Physical Review Letters, Physical Review B, Nature Communications, npj Quantum Materials, 2D Materials, Journal of Physics: Condensed Matter.",
          "Panel reviewer: Swedish Research Council (VR) Physics Panel, 2020, 2022, 2024; ERC Starting Grants (Physics), 2021, 2023.",
          "Chair, Condensed Matter Physics Section, Swedish Physical Society annual meeting, 2022.",
          "Member, Faculty Recruitment and Promotion Committee, Department of Physics and Astronomy, Westholm University, 2020–present.",
          "Organiser, Uppsala Quantum Materials Symposium, Westholm University, 2019, 2021, 2023.",
          "Member, Graduate School Committee (Physics), Westholm University, 2016–2020.",
        ],
      },
    ],
  },
  "faculty-cv-history": {
    metaTitle: "Academic CV example — Professor of History",
    metaDescription:
      "A full academic CV example for a professor of history (humanities). See how books, edited volumes, chapters, grants, and teaching appear on a faculty CV.",
    navLabel: "Professor CV (History)",
    heading: "Academic CV example: Professor of History (humanities)",
    intro: [
      "This academic CV example is designed for a mid-career or senior faculty member in history. It demonstrates how a humanities professor structures a full curriculum vitae, with books and book chapters as the centrepiece — reflecting the discipline's emphasis on long-form scholarship — alongside grants, fellowships, invited lectures, doctoral supervision, and service.",
      "In history and the broader humanities, monographs published by academic presses carry the most weight for tenure and promotion. This example follows Chicago Notes-Bibliography style for citations and uses the 'Classic' template, which suits the text-heavy format typical of a humanities CV. The author's own surname is highlighted in each citation.",
    ],
    person: {
      name: "Dr. Marguerite Voss",
      credentials: "PhD",
      headline: "Professor of Modern European History",
      affiliation: "Department of History, Westbridge University",
      location: "Edinburgh, United Kingdom",
    },
    citationStyle: "Chicago Notes-Bibliography",
    templateLabel: "Classic",
    sections: [
      {
        title: "Education",
        items: [
          "PhD in Modern European History, University of Dunmore, 2002. Dissertation: 'Contested Ground: Land Reform and Rural Protest in the Rhineland, 1848–1880.' Supervisor: Prof. H. Lindhout.",
          "MA in History, University of Dunmore, 1997.",
          "BA (Hons) in History and French, Castleport University, 1996. First-class honours.",
        ],
      },
      {
        title: "Academic Appointments",
        items: [
          "Professor of Modern European History, Westbridge University, 2018–present.",
          "Reader in Modern European History, Westbridge University, 2012–2018.",
          "Senior Lecturer in History, Westbridge University, 2008–2012.",
          "Lecturer in European History, Aldgate College, University of London, 2003–2008.",
          "Postdoctoral Research Fellow, European History Institute, University of Dunmore, 2002–2003.",
        ],
      },
      {
        title: "Books",
        items: [
          "Voss, Marguerite. Harvests of Discontent: Agrarian Politics and Social Order in Nineteenth-Century Prussia. Dunmore University Press, 2023.",
          "Voss, Marguerite. The Fractured Republic: Nationalism, Minority Rights, and the Weimar Settlement, 1919–1933. Cornerstone Academic Press, 2015.",
          "Voss, Marguerite. Contested Ground: Land Reform and Rural Protest in the Rhineland, 1848–1880. Aldgate Historical Studies, 2005. [Revised edition of doctoral dissertation.]",
        ],
      },
      {
        title: "Edited Volumes",
        items: [
          "Voss, Marguerite, and Tobias Renner, eds. Borderlands and Belonging: Identity Politics in Central Europe, 1880–1945. Westbridge University Press, 2020.",
          "Voss, Marguerite, ed. Empire, Nation, Region: New Perspectives on German Unification. Aldgate Historical Studies, 2010.",
        ],
      },
      {
        title: "Peer-Reviewed Articles and Chapters",
        items: [
          "Voss, Marguerite. 'Memory, Myth, and the Peasant: Commemorative Culture in Rural Prussia, 1870–1914.' German History 41, no. 2 (2023): 187–214.",
          "Voss, Marguerite. 'Property, Protest, and the Prussian State: Eviction Disputes in the Rhineland, 1860–1880.' Central European History 55, no. 1 (2022): 44–72.",
          "Voss, Marguerite. 'Between Weimar and Versailles: Minority Treaties and the Limits of International Law.' Journal of Modern European History 19, no. 3 (2021): 310–338.",
          "Voss, Marguerite. 'Agrarian Populism and the Rise of the Rural League, 1919–1924.' In Borderlands and Belonging: Identity Politics in Central Europe, 1880–1945, edited by Marguerite Voss and Tobias Renner, 78–107. Westbridge University Press, 2020.",
          "Voss, Marguerite, and Katarina Sievert. 'Women, Property, and the Courts in Wilhelmine Germany.' Women's History Review 28, no. 4 (2019): 601–624.",
          "Voss, Marguerite. 'The Limits of Liberalism: Free Trade and Agrarian Discontent in the 1870s.' European History Quarterly 47, no. 2 (2017): 255–283.",
          "Voss, Marguerite. 'Nation-Building and the German School System, 1870–1900.' History of Education 44, no. 1 (2015): 22–47.",
          "Voss, Marguerite. 'Peasant Courts and Customary Law in Rhineland Prussia.' Law and History Review 30, no. 3 (2012): 751–785.",
          "Voss, Marguerite. 'The Politics of Partition: Polish Territories and German National Identity, 1886–1914.' Slavonic and East European Review 87, no. 4 (2009): 621–653.",
          "Voss, Marguerite. 'Rural Migration and Urban Memory in Wilhelmine Berlin.' Urban History 34, no. 2 (2007): 203–228.",
          "Voss, Marguerite. 'Land, Law, and Loyalty: The Rhineland Peasantry and the Prussian State.' Historical Journal 49, no. 1 (2006): 113–140.",
          "… and 7 additional peer-reviewed articles and book chapters.",
        ],
      },
      {
        title: "Grants and Fellowships",
        items: [
          "European Research Council (ERC) Consolidator Grant, 'Agrarian Modernity in the German-Speaking World, 1848–1918' (€1.4 million), 2019–2024.",
          "British Academy Mid-Career Fellowship, 'Property Regimes and Social Conflict in Nineteenth-Century Prussia,' 2016–2017.",
          "Leverhulme Trust Research Project Grant (co-investigator with Dr. K. Sievert), 'Gender, Law, and Land in Wilhelmine Germany' (£185,000), 2014–2016.",
          "AHRC Research Fellowship, 'The Weimar Settlement and European Minority Rights' (£92,000), 2010–2012.",
          "Fritz Thyssen Foundation Travel Grant, 2007.",
          "Gerda Henkel Foundation Dissertation Fellowship, 2001–2002.",
        ],
      },
      {
        title: "Invited Lectures",
        items: [
          "'Harvests of Discontent: New Directions in Agrarian History,' Keynote Address, Annual Conference of the German History Society, Cambridge, 2023.",
          "'Property, Protest, and the Prussian State,' German Historical Institute, London, 2022.",
          "'Weimar's Long Shadow: Minority Rights and the Interwar Order,' University of Vienna, 2021.",
          "'Nationalism and the Courts in Wilhelmine Germany,' Max Planck Institute for Legal History, Frankfurt, 2019.",
          "'Borders, Belonging, and the Nation-State,' Seminar in Modern European History, Harvard University, 2017.",
          "'Land, Law, and Loyalty,' École des Hautes Études en Sciences Sociales (EHESS), Paris, 2014.",
          "'Gender and Property in Imperial Germany,' Institute of Historical Research, London, 2011.",
        ],
      },
      {
        title: "Teaching",
        items: [
          "Undergraduate: European History, 1789–1918; Germany and the Two World Wars; Nationalism and the Nation-State; Peasants, Markets, and Modernity.",
          "Postgraduate: Research Methods in History; Agrarian History of Modern Europe; Nationalism and Minority Rights, 1848–1939.",
          "Supervisor, MA in Modern European History, Westbridge University, 2008–present (22 dissertations completed).",
          "Module leader, Department of History, Westbridge University, 2008–present.",
        ],
      },
      {
        title: "Doctoral Supervision",
        items: [
          "Current doctoral students: 4 (topics: rural credit markets in Prussia; memory and the Franco-Prussian War; Habsburg minorities policy; German settlement in Eastern Europe).",
          "Completed doctorates as primary supervisor: 11 (2008–present).",
          "Completed doctorates as secondary supervisor: 6 (2008–present).",
          "External examiner for doctoral theses, Universities of Cambridge, Exeter, and St Andrews.",
        ],
      },
      {
        title: "Awards and Honours",
        items: [
          "Royal Historical Society Fellow (FRHistS), elected 2013.",
          "German History Society Book Prize, for The Fractured Republic, 2016.",
          "Whitmore Prize for Best Article in European History, Historical Journal, 2006.",
          "Dunmore University Prize for Best Doctoral Thesis, Faculty of Arts, 2002.",
        ],
      },
      {
        title: "Service",
        items: [
          "Head of Department, Department of History, Westbridge University, 2020–2023.",
          "Editor, European History Review, 2017–present.",
          "Member, Publications Committee, Royal Historical Society, 2019–present.",
          "Co-chair, Programme Committee, German History Society Annual Conference, 2021.",
          "Peer reviewer for German History, Historical Journal, Central European History, Journal of Modern History, Past & Present.",
          "Member, AHRC Peer Review College, 2013–present.",
          "Admissions Tutor, Department of History, Westbridge University, 2009–2012.",
        ],
      },
    ],
  },
  "research-cv-public-health": {
    metaTitle: "Academic CV example — Research Scientist in Epidemiology",
    metaDescription:
      "Academic CV example for a research scientist and epidemiologist on a non-tenure research track in public health. Shows publications in Vancouver style.",
    navLabel: "Research Scientist CV (Public Health)",
    heading: "Academic CV example: research scientist in public health epidemiology",
    intro: [
      "This academic CV example is for a mid-career research scientist working on a non-tenure research track in public health and epidemiology. It illustrates how to present a publication-heavy CV when most output consists of multi-author journal articles, grant-funded projects, and conference contributions rather than independent teaching or a tenure dossier.",
      "Publications are formatted in Vancouver style — numbered, with all authors listed up to six before truncating with 'et al.' — the convention used in biomedical and public health journals. The ATS-friendly plain template is chosen here because research-track scientists frequently apply through institutional HR portals that use applicant-tracking systems, so clean, parseable formatting is prioritised over visual flair.",
    ],
    person: {
      name: "Dr. Saoirse Kavanaugh",
      credentials: "PhD, MPH",
      headline: "Research Scientist in Infectious Disease Epidemiology",
      affiliation: "Department of Epidemiology and Global Health, Aldermoor University",
      location: "Bristol, United Kingdom",
    },
    citationStyle: "Vancouver",
    templateLabel: "ATS",
    sections: [
      {
        title: "Education",
        items: [
          "PhD, Epidemiology — Aldermoor University, Bristol, UK, 2017. Thesis: 'Heterogeneity in tuberculosis transmission dynamics across urban slum settings: a molecular-epidemiological analysis.'",
          "MPH, Global Health — University of Hartwell, Edinburgh, UK, 2012.",
          "BSc (Hons), Biomedical Science — University of Hartwell, Edinburgh, UK, 2011.",
        ],
      },
      {
        title: "Research positions",
        items: [
          "Senior Research Scientist — Department of Epidemiology and Global Health, Aldermoor University, Bristol, UK. 2022–present. Lead infectious disease modelling programme; PI on two externally funded grants; line management of two postdoctoral fellows.",
          "Research Scientist — MRC Centre for Infectious Disease Epidemiology, Aldermoor University, Bristol, UK. 2019–2022. Conducted burden-of-disease analyses for WHO technical advisory groups; contributed to SARS-CoV-2 vaccine-effectiveness surveillance consortium.",
          "Postdoctoral Research Fellow — Department of Infectious Disease Epidemiology, Aldermoor University, Bristol, UK. 2017–2019. Awarded Wellcome Trust Early Career Fellowship. Designed and led a prospective cohort study of tuberculosis household contacts in three high-burden countries.",
        ],
      },
      {
        title: "Publications",
        items: [
          "1. Kavanaugh S, Oduya P, Bergmann LK, Nkosi T, Reyes-Fuentes C, Acheson M, et al. Spatial clustering of drug-resistant tuberculosis and socioeconomic determinants in peri-urban communities: a whole-genome sequencing study. Lancet Infect Dis. 2024;24(3):278–89.",
          "2. Kavanaugh S, Adeyemo R, Voss HJ, Pietersen E, Lindqvist B. Vaccine effectiveness against severe COVID-19 during Omicron BA.4/BA.5 circulation: a matched test-negative case-control study. BMJ. 2023;381:e073514.",
          "3. Kavanaugh S, Tanigawa K, Oduya P, Ferreira-Santos G, Acheson M. Estimating the population-level impact of mass drug administration on malaria incidence in sub-Saharan Africa: a generalised synthetic-control analysis. PLoS Med. 2023;20(7):e1004215.",
          "4. Bergmann LK, Kavanaugh S, Nkosi T, Reyes-Fuentes C, Mwangi JN, Sorensen LF, et al. Household transmission dynamics of Mycobacterium tuberculosis by drug-resistance profile in three high-burden African settings. J Infect Dis. 2022;226(8):1334–44.",
          "5. Kavanaugh S, Lindqvist B, Adeyemo R, Voss HJ. Waning protection after two-dose BNT162b2 against Delta variant hospitalisation: an observational cohort study in NHS England. Nat Med. 2022;28(4):834–41.",
          "6. Kavanaugh S, Tanigawa K, Oduya P, Acheson M. Interrupted time-series analysis of non-pharmaceutical interventions and respiratory syncytial virus hospitalisation rates in England, 2020–2021. Epidemiol Infect. 2021;149:e178.",
          "7. Kavanaugh S, Pietersen E, Bergmann LK, Ferreira-Santos G, Sorensen LF. Probabilistic record linkage of tuberculosis surveillance and pharmacy dispensing data to estimate treatment success: a methods study. Int J Epidemiol. 2020;49(5):1614–24.",
          "8. Adeyemo R, Kavanaugh S, Mwangi JN, Lindqvist B, Voss HJ, Tanigawa K. Excess all-cause mortality attributable to influenza in low- and middle-income countries, 2010–2019: a systematic review and meta-analysis. Bull World Health Organ. 2020;98(12):821–31.",
          "9. Kavanaugh S, Oduya P, Acheson M, Bergmann LK. Secondary attack rates and risk factors for tuberculosis transmission within households: a prospective cohort study in Nigeria, Ethiopia and Peru. Thorax. 2019;74(9):861–70.",
          "10. Kavanaugh S, Ferreira-Santos G, Nkosi T. Measuring socioeconomic inequalities in tuberculosis notification rates using concentration indices: a cross-national analysis of 28 high-burden countries. Soc Sci Med. 2018;213:145–52.",
          "11. Sorensen LF, Kavanaugh S, Pietersen E, Lindqvist B, Reyes-Fuentes C. Progression from latent to active tuberculosis in household contacts: a five-year prospective follow-up study. Clin Infect Dis. 2018;67(7):1037–45.",
          "12. Kavanaugh S. Bayesian latent-class models for correcting misclassification in tuberculosis exposure classification studies. Stat Methods Med Res. 2017;26(6):2563–78.",
        ],
      },
      {
        title: "Grants and funding",
        items: [
          "PI — Wellcome Trust Research Development Award. 'Drivers of heterogeneous SARS-CoV-2 immunity waning across sociodemographic strata in England.' GBP 498,000. 2023–2026.",
          "Co-I — Medical Research Council Programme Grant (Lead PI: Prof. L.K. Bergmann). 'Integrated surveillance and genomic epidemiology of antimicrobial-resistant pathogens in West Africa.' GBP 1.2 million. 2022–2027.",
          "PI — Aldermoor University Internal Research Fund. 'Synthetic-control methods for interrupted infectious-disease surveillance series.' GBP 28,500. 2020–2021.",
          "Fellow — Wellcome Trust Early Career Fellowship. 'Prospective household-contact study of tuberculosis transmission in high-burden settings.' GBP 260,000. 2017–2019.",
        ],
      },
      {
        title: "Conference presentations",
        items: [
          "Kavanaugh S, Oduya P, Bergmann LK. 'Genomic clustering of drug-resistant tuberculosis in peri-urban Nigeria: findings from a 3-year prospective study.' Oral presentation. European Congress of Clinical Microbiology and Infectious Diseases (ECCMID), Barcelona, Spain, April 2024.",
          "Kavanaugh S, Adeyemo R, Voss HJ. 'Waning COVID-19 vaccine effectiveness against Delta hospitalisation: interrupted time-series analysis in NHS England.' Oral presentation. Epidemiology Congress of the Americas, Bogotá, Colombia, June 2022.",
          "Kavanaugh S, Tanigawa K. 'Evaluating the causal impact of non-pharmaceutical interventions on RSV seasonality using synthetic-control methods.' Poster. Society for Epidemiologic Research Annual Meeting, Austin, USA, June 2021.",
          "Kavanaugh S, Pietersen E, Bergmann LK. 'Probabilistic linkage of tuberculosis registry and pharmacy data to estimate true treatment success in South Africa.' Oral presentation. Union World Conference on Lung Health, Hyderabad, India, October 2018.",
        ],
      },
      {
        title: "Teaching",
        items: [
          "Module co-lead — 'Applied Infectious Disease Epidemiology' (MSc Global Health, Aldermoor University). 2022–present. Lecture series on transmission dynamics, outbreak investigation, and vaccine-effectiveness study design.",
          "Seminar tutor — 'Epidemiological Methods I' (MPH, Aldermoor University). 2019–2022. Weekly case-based seminars; marking of coursework assignments.",
          "Dissertation supervisor — six MSc Global Health students, Aldermoor University. 2020–present.",
          "Short-course facilitator — 'Introduction to R for Epidemiologists', Aldermoor University continuing-education programme. 2020, 2021, 2023.",
        ],
      },
      {
        title: "Professional memberships",
        items: [
          "Member — International Epidemiological Association (IEA).",
          "Member — Society for Epidemiologic Research (SER).",
          "Member — European Respiratory Society (ERS), Epidemiology and Environment Assembly.",
          "Peer reviewer — Lancet Infectious Diseases, BMJ, International Journal of Epidemiology, Epidemiology and Infection, PLOS Medicine.",
        ],
      },
      {
        title: "Skills",
        items: [
          "Epidemiological methods: cohort and case-control study design, interrupted time-series analysis, synthetic-control methods, Bayesian latent-class modelling, spatial clustering analysis, meta-analysis.",
          "Statistical software: R (tidyverse, survival, lme4, brms, sf/tmap for GIS), Stata, Python (pandas, statsmodels).",
          "Geographic information systems (GIS): QGIS, R (sf, tmap); spatial regression and cluster detection (SaTScan).",
          "Genomic epidemiology: whole-genome sequencing data analysis, maximum-likelihood phylogenetic inference (IQ-TREE), transmission network reconstruction (TransPhylo).",
          "Data management: REDCap, SQL (PostgreSQL), probabilistic record linkage.",
          "Languages: English (native), French (professional working proficiency).",
        ],
      },
    ],
  },
};
