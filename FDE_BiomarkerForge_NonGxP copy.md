# FDE Spec: BiomarkerForge
*Generated: 2026-04-21 | Target Persona: Translational Scientist | Phase: Translational & Preclinical Insights | Classification: Non-GxP (preclinical discovery; pre-IND)*

---

## Competitive Landscape Summary

- **QIAGEN OmicSoft / IPA** is the enterprise default for curated public omics and pathway enrichment, but stops at "here are 47 candidates" — no clinical validation plan, no species-bridging scorecard, and no mechanistic narrative explaining why a candidate made the shortlist. IPA's activation predictions are trusted; its handoff to translational teams is still a CSV and a deck.
- **SomaLogic (SomaScan + DataDelve Statistics)** dominates high-plex proteomics discovery but is proteomics-centric by construction. Multi-modal integration with RNA-seq / metabolomics / phospho-flow requires manual reconciliation, and their "Data Consulting Services" model means biomarker narratives are written by humans on a SOW, not generated from your data.
- **DNAnexus + Panomics (Dec 2024 partnership), Seven Bridges/Velsera, BioTuring Talk2Data** are the credible emerging threats — all of them solve multi-omics *storage and compute*, but none generate a **translational validation plan** (assay format, patient population, sample size, specimen SOP, cost envelope). That gap is the wedge.
- **Academic/open-source reality**: the actual daily workflow is `Bioconductor (DESeq2/limma/edgeR) + MOFA+/DIABLO/mixOmics + Seurat/Scanpy + IPA for enrichment`. Translational scientists already live in R and Python. Any tool that forces them out of code loses. BiomarkerForge must sit *next to* their code, not replace it.
- **What every competitor misses (in descending order of importance)**: (1) structured output that bridges discovery → clinical validation plan, (2) LLM-authored mechanistic narrative with citations, traceable to the underlying stats, (3) translatability / species-bridging / assay-feasibility scoring baked into the shortlist, (4) reproducibility audit trail at the candidate level so a biomarker can be defended six months later at a pre-IND meeting.

## Persona Context — Translational Scientist

- Sits between discovery biology and clinical development. Their week alternates between arguing with bioinformaticians about sample ID reconciliation and arguing with clinical ops about whether a PD assay is feasible in a Phase 1b protocol.
- Owns the **translational strategy doc** and the **biomarker nomination board**. Gets paged the moment a VP of R&D asks "why these three and not those twelve?" Can lose a Friday to rebuilding a justification for a candidate nominated four months ago whose original Rmd has since been archived.
- Thinks in **translatability**, **species bridging**, **context of use**, **pharmacodynamic vs. stratification biomarker**, **signature robustness**, **assay feasibility**. Will instantly mistrust any tool whose output they cannot paste into a pre-IND briefing book.
- Career wins: biomarker survives FDA Type B pre-IND meeting; 2-3 biomarkers carry into Phase 1b with them as co-author on the poster; time-to-nomination-decision cut from 6 months to 3.
- Fears about AI: overfit signatures with no biological plausibility, black-box predictions they can't defend to R&D leadership, proprietary models they can't reproduce for a qualification package, and — most of all — nominating a biomarker on an ML call that blows up in Phase 1b and ends a program.

---

## SECTION 1: Submitter Information

- **Full name:** Matthew Tendler
- **Work email:** matthew.tendler@dominodatalab.com
- **Role:** — fill in —
- **Submission date:** [auto-populated by portal]
- **Notes:** BiomarkerForge is a **Non-GxP, pre-IND / translational research** use case. It operates on preclinical multi-omics cohorts (mouse / rat / cynomolgus studies, patient-derived models, and limited human reference data). It is *not* submission-bound; its outputs feed translational strategy docs, biomarker nomination boards, and IND-enabling work, but are not themselves GxP deliverables. Regulatory framing is GLP-adjacent (for pivotal tox bridging) and "fit-for-purpose" qualification per FDA BEST/BQP terminology, not 21 CFR Part 11.

## SECTION 2: Prospect Overview

- **Company / prospect name:** [fill in per engagement]
- **Region:** [fill in per engagement]
- **Industry vertical:** [fill in per engagement — typically biotech (oncology, immunology, rare disease) or mid/large pharma translational medicine group]
- **Relationship stage:** [Early discovery / Active evaluation / POC / Late stage — fill in per engagement]
- **Primary contact name:** [fill in per engagement]
- **Primary contact title / role:** [fill in per engagement — typically Head of Translational Medicine, Director of Translational Sciences, or VP of Translational / Precision Medicine]
- **Estimated data science team size:** [fill in per engagement — typical range 4–25 for translational bioinformatics within a mid-sized biotech; 50+ at top-20 pharma]
- **Additional context:** [fill in per engagement — flag whether the prospect already owns QIAGEN IPA, SomaScan service contracts, or DNAnexus, since BiomarkerForge needs to slot in *next to* these, not replace them]

## SECTION 3: Business Problem

### High-level problem description

Translational scientists drown in candidate biomarkers after every preclinical multi-omics study and have no systematic way to turn that list into a defensible, clinically-actionable shortlist. Today's workflow is: bioinformaticians ship a CSV of 47 hits, the translational scientist spends weeks reconciling modalities, builds a biological narrative by hand, re-derives assay feasibility from memory, and writes a translational strategy doc in Word. Six months later, when a regulator or a VP of R&D asks "why these three?", the audit trail lives in an archived Rmd and a lab notebook. The result is slow, inconsistent, and brittle biomarker nomination.

### Business objectives

Compress biomarker nomination from multi-omics data to a defensible, translationally-scored shortlist and a first-draft clinical validation plan — from months to days — while making every decision reproducible and defensible at a pre-IND meeting. Success means (a) higher-quality shortlists that survive downstream assay development and clinical validation, (b) a structured translational validation plan automatically generated from the discovery results, and (c) an auditable trail that lets the translational scientist defend every nomination six months later without re-running the analysis.

### Current state

- Bioinformatics delivers per-modality CSVs (DESeq2 / limma results, SomaScan differentials, MOFA+ factor loadings, Seurat marker tables) via email or shared drive.
- Sample ID reconciliation across RNA-seq, proteomics, metabolomics, and IHC happens in Excel, with three competing master spreadsheets.
- Pathway enrichment runs in QIAGEN IPA; outputs are static tables and PDFs pasted into slides.
- The translational strategy doc is a Word file with embedded images, tracked changes from 3–5 reviewers, and a regulatory section copy-pasted from 2015-era EMA guidance.
- Species bridging, assay feasibility, and specimen availability are judged from memory by the translational scientist during shortlist review — no systematic scoring.
- Reproducibility is aspirational: most teams cannot regenerate last quarter's shortlist without tracking down the original analyst.

### Pain points

- **"Every omics modality is in a different system and I'm the human ETL layer."** RNA-seq from the core, proteomics from a CRO (SomaScan or Olink), metabolomics from a third vendor, flow/CyTOF from in-house — different sample nomenclature schemes, different QC reports, different delivery cadence. The translational scientist loses Monday mornings to reconciling IDs in Excel before any science can happen.
- **"I can't explain why a biomarker made the shortlist three months later."** A candidate went in based on volcano-plot significance, 2-fold change, and someone's recollection of a mechanism-of-action paper. Now a regulator asks for the rationale and the analyst has moved teams. The threshold lives in a code comment. Biological plausibility lives in a lab notebook. This kills pre-IND meetings.
- **"The shortlist ignores whether we can actually measure the biomarker in humans."** Beautiful 15-gene signatures get nominated that require fresh frozen tumor tissue nobody collects in this indication, or rely on an antibody with no validated clinical assay, or live in a pathway where the human ortholog behaves differently. We find out at assay development, four months later.
- **"Multi-omics integration is still a PhD project."** MOFA+ and DIABLO work, but setting them up on a new study takes weeks, and the outputs don't slot into the translational strategy doc. Every new program re-does this from scratch.
- **"Species bridging is tribal knowledge."** The translational scientist holds in their head which antibodies cross-react cyno-to-human, which mouse pathways don't translate, which PD readouts have failed in the past. None of that is in the discovery tool.
- **"I'm scared of AI because I can't defend a black-box shortlist at a pre-IND."** Scientists like the speed, but a confidence score isn't a biological hypothesis. If BiomarkerForge says "this 12-gene signature, AUC 0.94," and they can't explain why those 12 genes, they won't put it in a briefing book.

### Success metrics

- **Nomination cycle time:** biomarker shortlist from multi-omics data → reviewed translational strategy draft. Target: from 8–12 weeks to 1–2 weeks.
- **Shortlist quality / downstream retention:** percentage of nominated biomarkers that survive assay feasibility review and advance to qualification. Target: raise from ~30% (current painful attrition) to >60%.
- **Defensibility:** zero "rework loops" triggered by inability to reconstruct rationale; each nominated biomarker has a complete, one-click audit package including raw data link, statistical parameters, biological narrative, species-bridging assessment, and assay-feasibility scorecard.
- **Translatability scoring coverage:** 100% of nominated candidates carry a structured translatability score (tissue availability, assay feasibility, species conservation, regulatory path) before entering the nomination board.
- **Regulatory readiness:** first-draft clinical validation plan generated for every top-ranked candidate (assay format, patient population, sample size with power calc, specimen SOP, 12-month timeline, cost envelope) — zero are produced by hand.
- **Adoption:** number of biomarker nomination boards that use the BiomarkerForge-generated package as the primary input document within 6 months of deployment.

### Key stakeholders

`Translational Scientist (primary user)`, `Head of Translational Medicine`, `Translational Bioinformatics Lead`, `Director of Precision Medicine`, `Bioanalyst / Assay Development`, `Preclinical Pharmacology Lead`, `VP R&D / Program Lead`, `Regulatory Affairs (pre-IND / BQP liaison)`, `Clinical Operations (for specimen feasibility)`, `External CRO contacts (SomaLogic, Olink, genomics vendor)`.

### Urgency and timeline drivers

- **IND-enabling timelines.** Biomarker strategy has to be locked in before the pre-IND meeting. Every week saved on nomination is a week gained on assay qualification.
- **Portfolio pressure.** Most translational teams are running 4–8 programs simultaneously; the bottleneck is not compute but the human capacity to build defensible nomination packages. Cutting per-program effort by 70% is the difference between shipping a portfolio and dropping programs.
- **FDA BEST / Biomarker Qualification Program expectations.** Regulators increasingly expect structured justification, reproducibility, and fit-for-purpose evidence. Teams that can't produce that are being pushed into longer qualification cycles.
- **Competitive benchmarking.** Teams using Tempus, Owkin, or Recursion-style AI-driven discovery are compressing translational timelines. Customers feel they are falling behind if they can't demonstrate a modern, reproducible multi-omics workflow.

## SECTION 4: Data Assets

### Data overview

Preclinical multi-omics cohorts — typically 20–200 samples per study, spanning mouse / rat / cynomolgus / patient-derived models, with optional human reference from public atlases (TCGA, GTEx, DepMap, HPA) or internal biobanks. Modalities include bulk RNA-seq, single-cell / single-nucleus RNA-seq, SomaScan or Olink proteomics, global / targeted metabolomics, phospho-flow / CyTOF, IHC and multiplex imaging, plus study metadata (dose, timepoint, treatment arm, PK exposure). Nothing GxP-regulated; some pivotal tox data may be GLP, which implies audit-trail expectations but not 21 CFR Part 11.

### Data sources

**Source 1 — Internal genomics core / LIMS outputs (bulk and single-cell RNA-seq)**
- System type: On-prem relational database *(frequently: LIMS-backed object storage with an S3-compatible bucket for FASTQ/BAM/counts)*
- Data formats: Structured (tabular) *(counts matrices, metadata)*; Semi-structured (JSON, XML) *(MultiQC / fastqc reports)*; Unstructured text *(sample submission forms, QC narratives)*
- Access status: Already accessible
- Notes: Counts matrices and sample metadata are the operational inputs for BiomarkerForge. Raw FASTQ access is occasionally needed for re-alignment or allele-specific expression but is not required for the core workflow.

**Source 2 — Proteomics (SomaScan, Olink, MS-based) — typically from external vendor**
- System type: SaaS CRM *(vendor portal — SomaLogic data delivery, Olink Analysis Service, or Biognosys portal)*; Cloud data warehouse *(once landed internally, usually Snowflake / Redshift / S3)*
- Data formats: Structured (tabular) *(RFU / NPX matrices, QC flags)*; Semi-structured (JSON, XML) *(assay QC metadata)*
- Access status: Already accessible *(internal landing)*; Access pending *(direct vendor API in some orgs)*
- Notes: Sample ID mapping between vendor IDs and internal study IDs is the single most common data-integration headache. BiomarkerForge needs first-class support for ID reconciliation, not an afterthought.

**Source 3 — Metabolomics and targeted biomarker panels (CRO deliverables)**
- System type: Document store *(CRO Excel / CSV deliverables)*; Cloud data warehouse *(once landed)*
- Data formats: Structured (tabular)
- Access status: Already accessible
- Notes: Schema varies per CRO. Expect manual mapping for the first study, then a reusable template per vendor.

**Source 4 — Flow cytometry / CyTOF / spectral flow**
- System type: Document store *(FCS files + analyst-exported frequency tables)*; On-prem relational database
- Data formats: Structured (tabular) *(cluster frequencies, MFI)*; Semi-structured (JSON, XML) *(panel metadata, gating strategy exports)*
- Access status: Already accessible
- Notes: BiomarkerForge consumes analyst-curated frequency / MFI tables, not raw FCS. Integration with OMIQ, FlowJo, or Cytobank exports is sufficient.

**Source 5 — Histology / IHC / multiplex imaging (Visiopharm, HALO, Indica Labs)**
- System type: Document store *(image analysis exports, tissue microarray summaries)*
- Data formats: Structured (tabular) *(cell-type abundances, H-scores)*; Images / video *(whole-slide images, not routinely consumed by the biomarker model but linked for QC)*
- Access status: Already accessible
- Notes: BiomarkerForge uses quantified outputs (cell-type counts, positivity scores), not raw WSIs. WSI viewer links are surfaced in the audit trail.

**Source 6 — Study metadata, PK, dose, and clinical observations (for preclinical studies)**
- System type: On-prem relational database *(Provantis, Pristima, or in-house study DB)*; Document store *(study reports)*
- Data formats: Structured (tabular); Unstructured text *(study protocol sections, pathology narratives)*
- Access status: Already accessible
- Notes: Critical for contextualizing biomarker hits (which dose? which timepoint? which PK exposure?). Without this, shortlists are mechanistically meaningless.

**Source 7 — Public reference data**
- System type: REST / GraphQL API *(TCGA / GDC, GTEx, DepMap, Human Protein Atlas, OpenTargets, Ensembl, UniProt)*; Cloud data warehouse *(customer-internal mirror in many large pharma)*
- Data formats: Structured (tabular); Semi-structured (JSON, XML)
- Access status: Already accessible *(public APIs)*; Unknown *(for internally-mirrored copies — varies by org)*
- Notes: Used for cross-species conservation checks, human expression priors, and target-disease association scoring. Must be cacheable; live API calls during analysis are too slow.

**Source 8 — Literature and ontology corpus (mechanistic narration and biological plausibility)**
- System type: REST / GraphQL API *(PubMed / PMC, Semantic Scholar, OpenAlex, MeSH, Gene Ontology, Reactome, KEGG, WikiPathways)*; Document store *(internally-curated mechanism-of-action dossiers, target reviews)*
- Data formats: Unstructured text; Semi-structured (JSON, XML); Embeddings / vectors *(for RAG over internal dossiers)*
- Access status: Already accessible
- Notes: Powers the "why did this biomarker make the shortlist?" narrative generation. Retrieval-augmented to keep citations grounded.

### Estimated total data volume

10–100GB *(per typical program / year. Bulk RNA-seq counts matrices and proteomics deliverables are small; single-cell studies, imaging exports, and reference data pull the total into this range. Raw FASTQ / WSI not routinely co-located with BiomarkerForge inputs.)*

### Data velocity / freshness

Batch (daily or less frequent) *(biomarker nomination is episodic — a new cohort lands, the analysis runs, the shortlist is reviewed. Real-time is neither needed nor desirable; reproducibility demands frozen snapshots per analysis.)*

### Known data quality issues

- Sample ID mismatch across modalities (internal vs. vendor IDs) is pervasive and is the #1 source of silently-wrong analyses.
- Vendor QC flags are inconsistently surfaced — samples that failed SomaScan QC sometimes make it into downstream analyses because the flag is in a separate worksheet.
- Metadata completeness drops sharply beyond dose/timepoint — tissue quality, RIN, collection time, and freezer history are often missing or free-text.
- Species annotations in public reference data (TCGA is human, DepMap is human cell lines, most preclinical data is mouse/rat/cyno) must be rigorously tracked; cross-species gene symbol mapping is a common silent failure mode.
- IHC / imaging analyst-to-analyst variability is higher than teams like to admit; BiomarkerForge should surface the analyst and pipeline version, not treat the export as ground truth.

### Data access notes

All data is customer-internal or from public APIs. No EDC, no PHI, no clinical-trial production data. Vendor deliverables (SomaLogic, Olink, metabolomics CROs) arrive under standard MSA data-use terms — no additional procurement expected for the analysis step. Public reference APIs are rate-limited; BiomarkerForge should maintain a local cache of TCGA / GTEx / DepMap / OpenTargets snapshots, versioned alongside the analysis.

## SECTION 5: Governance & Compliance

### Applicable regulatory frameworks

- [x] HIPAA *(only to the extent human reference samples / internal biobank data are involved; most workflows are preclinical animal data and de-identified public human data)*
- [x] GDPR *(same rationale — applicable when any EU-subject-derived tissue or data is used; most preclinical data is out of scope)*
- [ ] CCPA / CPRA
- [x] SOC 2
- [ ] FedRAMP
- [ ] PCI-DSS
- [ ] FINRA / SEC
- [ ] BASEL / BCBS
- [ ] DORA
- [ ] EU AI Act *(watch item — if BiomarkerForge outputs ever influence clinical-stage CDx or patient stratification, it crosses into "high-risk AI" territory; at preclinical nomination, currently out of scope)*
- [ ] None identified
- [x] **Other (specify):** **GLP (21 CFR Part 58)** for any biomarker work that feeds pivotal IND-enabling tox studies; **FDA BEST / Biomarker Qualification Program (BQP)** terminology and evidentiary expectations (context of use, analytical validation, fit-for-purpose); **ICH M10** for bioanalytical method validation once biomarker advances to clinical assay; **ICH S6(R1)** for biotherapeutic preclinical safety where biomarker supports dose selection. **Not 21 CFR Part 11 — BiomarkerForge outputs are preclinical research artifacts, not electronic records in a GxP submission system.**

### Data residency requirements

Typically US and EU regional residency for large-pharma customers; occasionally APAC (Japan for Japanese pharma with local translational groups). Must respect customer-specific tenancy — no data crosses borders without explicit configuration. Public reference snapshots (TCGA, GTEx) are non-restricted but should be mirrored in-region for performance.

### Data access restrictions

- Program-level access controls: biomarker work on a confidential target must be visible only to the program team. Cross-program read access is rare and revocable.
- Vendor-delivered data (SomaScan, Olink) often carries contractual restrictions on onward sharing; BiomarkerForge must not surface raw vendor data to unauthorized users even within the same org.
- Internal biobank data (human reference samples) typically requires IRB-approval-linked access; BiomarkerForge should respect a pre-existing entitlement system and not re-implement one.
- External CROs and consultants occasionally need project-scoped access; time-boxed, audit-logged entitlements are expected.

### Input/output logging requirements

Every analysis run must capture: input dataset snapshot IDs, parameter values, code / model version, user identity, timestamp, and output artifact hashes. Every LLM narration or recommendation must log the prompt, retrieved context chunks with citations, and the generated output. Logs must be queryable for at least the life of the program plus three years, aligning with typical internal R&D record-retention policies.

### Decision audit trail requirements

For each nominated biomarker, the audit trail must reconstruct: (1) which samples contributed, (2) which statistical thresholds and models produced the hit, (3) the cross-omics support, (4) the species-bridging and assay-feasibility scores with their underlying evidence, (5) the mechanistic narrative with full citation chain back to publications / internal dossiers, and (6) every human override or re-ranking with its rationale. This is the defensibility layer — without it, BiomarkerForge is just another omics tool.

### Explainability requirements

Non-negotiable. Every ML-driven ranking must carry a feature-level explanation (SHAP / permutation importance / coefficient-level attribution depending on model class). Every LLM narrative must be grounded in retrieved evidence with inline citations — no free-form hallucination. Translational scientists must be able to click a biomarker → see why the model ranked it → see the biological hypothesis → see the citations → export the full package as a PDF for the nomination board. "Black box with a confidence score" is a non-starter.

### Result consumer access restrictions

Translational scientists, translational bioinformatics, and immediate program team have author/editor access. Bioanalysts and assay development see read-only access to translatability scorecards and validation plan drafts. Regulatory affairs sees read-only access to the audit package. VP R&D and program leads see curated summary views. External collaborators (CROs, academic partners) require explicit, time-boxed, scoped entitlements. All access events logged.

### Additional governance notes

BiomarkerForge is preclinical / translational research. It is *not* a submission-regulated system. However, because its outputs directly feed IND-enabling work and pre-IND regulatory interactions, it inherits GLP-adjacent expectations: reproducibility, version control, audit trail, validated compute. Recommend deploying under the customer's existing R&D data-governance framework rather than attempting to shoehorn it under the GxP validation program — that would be over-validation and would slow adoption without improving scientific integrity.

## SECTION 6: Solution Requirements

### Deployment environment

Domino Cloud (Domino-managed) *(default for mid-size biotechs without a deep IT footprint)* **or** AWS / Microsoft Azure / Google Cloud Platform *(customer-owned tenant — typical for top-20 pharma where translational IT is part of the enterprise cloud)*. On-premises is rare for translational groups and should not be the default assumption. Hybrid is plausible for organizations with an on-prem genomics core feeding a cloud analytics layer.

### Prototype timeline expectation

4–8 weeks *(single indication, single multi-omics cohort, two modalities integrated (typically RNA-seq + proteomics), end-to-end from ingest through shortlist and first-draft validation plan. Ambitious but achievable given Domino's primitives and customer-owned data already landed.)*

### Deployment notes

Prefer deployment inside the customer's existing Domino environment so that analysis code, data, and model artifacts live together and reproducibility is guaranteed. Translational scientists should access BiomarkerForge through a Domino App interface *and* retain direct R/Python access to the underlying project — they will always want to drop into code for bespoke analysis, and forcing them out is a losing strategy. LLM calls route to the customer's validated LLM endpoint (Bedrock / Azure OpenAI / Vertex, or a self-hosted open-weight model for stricter customers); no prompt or retrieved context leaves the customer environment.

### Integration requirements

**Integration 1 — QIAGEN IPA (or equivalent pathway-enrichment tool)**
- System / tool name: QIAGEN Ingenuity Pathway Analysis
- Integration type: Read data from it *(import IPA exports: canonical pathways, upstream regulators, diseases and functions)*
- Notes: Do not try to replace IPA in year one — it is entrenched and trusted. Import IPA exports, surface them inside the BiomarkerForge narrative, and let the scientist continue their IPA workflow. Over time, BiomarkerForge's own pathway layer can reduce dependency, but ripping IPA out on day one will kill adoption.

**Integration 2 — SomaLogic / Olink proteomics deliverables**
- System / tool name: SomaLogic SomaScan data delivery + Olink NPX Signature / Analysis Service
- Integration type: Read data from it
- Notes: Accept both vendor formats natively, reconcile sample IDs to internal study IDs with user-confirmed mappings, carry QC flags all the way through. This is table stakes for any biomarker work involving high-plex proteomics.

**Integration 3 — Public reference datasets**
- System / tool name: TCGA / GDC, GTEx, DepMap, Human Protein Atlas, OpenTargets, Ensembl, UniProt, Reactome, KEGG
- Integration type: Read data from it
- Notes: Maintain versioned local mirrors rather than live API calls during analysis. Reproducibility demands that re-running a six-month-old analysis uses the same reference snapshot.

**Integration 4 — Literature and ontology corpus**
- System / tool name: PubMed / PMC, Semantic Scholar, OpenAlex, internal MoA / target dossier store
- Integration type: Read data from it
- Notes: Feeds the retrieval layer for mechanistic narrative generation. Must attach citations to every claim; scientists will not trust narration without a paper behind each sentence.

**Integration 5 — Internal LIMS and study metadata**
- System / tool name: Customer-internal LIMS (Benchling, Labguru, or home-grown), preclinical study DB (Provantis, Pristima)
- Integration type: Read data from it
- Notes: Required for sample provenance, dose, timepoint, treatment arm, PK exposure context. Without this, biomarker hits are mechanistically meaningless.

**Integration 6 — Assay-development and IHC/imaging platforms**
- System / tool name: OMIQ / FlowJo / Cytobank (flow), Visiopharm / HALO / Indica Labs (imaging)
- Integration type: Read data from it
- Notes: Consume analyst-curated exports, not raw files. Preserve pipeline version and analyst identity in the audit trail.

**Integration 7 — Electronic Lab Notebook (ELN) and document systems**
- System / tool name: Benchling, LabArchives, Signals Notebook; SharePoint / Box / Confluence for strategy docs
- Integration type: Write data to it *(push generated audit packages and validation plan drafts)*; Embed / surface results in it
- Notes: Scientists live in their ELN; delivering the BiomarkerForge output there — rather than forcing them into another portal — dramatically increases adoption.

**Integration 8 — Single sign-on**
- System / tool name: Customer IdP (Okta, Azure AD, Ping)
- Integration type: Authentication / SSO
- Notes: Standard enterprise requirement; no standalone user management.

### UX and delivery requirements

- **Primary UI: a Domino App + notebook hybrid.** App view for the translational scientist who wants a ranked shortlist, a translatability scorecard, a mechanistic narrative, and a one-click validation plan draft. Notebook access for the bioinformatician who wants to reproduce, extend, or override the analysis. Every button in the app must have a "show me the code" affordance.
- **Outputs must be export-ready.** The translational scientist needs to paste a shortlist table, a scorecard, a figure, and a narrative block into the translational strategy doc today — not after begging IT for a reformatter. Export to DOCX, PDF, and PPTX natively.
- **Traceability UI.** Every biomarker in the shortlist clicks through to its evidence: statistical parameters, cross-omics support, species-bridging evidence, assay-feasibility rationale, mechanistic citations, human overrides.
- **Comparison view.** Ability to compare multiple candidate shortlists side-by-side (this study vs. last study, this model vs. challenger model, this threshold vs. looser threshold). Nomination boards live off this kind of comparison.
- **Narrative drafting.** LLM-authored first drafts of (a) the biomarker justification paragraph and (b) the clinical validation plan. Scientist edits, accepts, or rejects. Their edits are logged and feed a per-team style guide over time.
- **Conservative defaults, power-user depth.** Out of the box, a sensible analysis for each modality pair. For the translational bioinformatician, full parameter exposure without leaving the tool.

### Target user personas

`Translational Scientist (primary)`, `Translational Bioinformatician (primary)`, `Head of Translational Medicine`, `Bioanalyst / Assay Development`, `Preclinical Pharmacologist`, `Regulatory Affairs liaison (read-only)`, `Program Lead / VP R&D (summary view)`.

### Priority level

High *(Broader Value 9, Sizzle 8 on the GxP-100 scoring rubric; episodic-but-high-stakes workflow; compelling demo because the output is a tangible shortlist + translational plan, not an abstract analytic)*.

### Technology constraints

- Must run entirely within the customer's Domino environment; no data egress to third-party SaaS for analysis or narration.
- LLM must be deployable against customer-sanctioned endpoints (AWS Bedrock / Azure OpenAI / Vertex AI) or self-hosted open-weight models (Llama 3 / Mistral / Qwen-class) for customers who mandate on-tenant inference.
- Reproducibility: every analysis run pins dataset snapshot, container image, parameter set, and model version; one-click re-run six months later must produce byte-identical (or cryptographically-verified equivalent) outputs.
- R and Python parity: translational bioinformaticians split fairly evenly between the two. Anything Python-only will alienate half the target users.
- No browser-local storage of analysis state; everything persists server-side for auditability.

### Predictive ML models toggle

Yes — BiomarkerForge uses predictive models for (a) multi-omics integration (factor models such as MOFA+ or supervised integration via DIABLO / mixOmics-style methods), (b) biomarker ranking (elastic net, random forest, gradient-boosted trees, with SHAP-based explanations), (c) translatability scoring (rule-based + learned models combining species conservation, assay feasibility, tissue availability), and (d) sample-size / power calculation for proposed validation studies.

### Generative AI / LLMs toggle

Yes.

- **GenAI use case types:** Text generation / drafting *(biomarker justification narratives, clinical validation plan drafts, pre-IND briefing-book paragraphs)*; Summarization *(condensing literature and internal dossiers into a mechanistic narrative)*; Document Q&A *(natural-language Q&A over the shortlist — "why is biomarker X ranked above Y?")*; Entity / info extraction *(pulling biomarker mentions, assay formats, sample types from literature and internal dossiers)*; RAG *(retrieval over PubMed / PMC / OpenAlex + internal MoA dossiers, grounded with citations)*; Agents / autonomous tasks *(bounded agentic orchestration of the discovery → ranking → narrative → plan pipeline with human-in-the-loop checkpoints at shortlist and plan-draft stages — no fully autonomous nomination)*.
- **Preferred LLM providers:** Anthropic Claude *(default — strong reasoning, long context, citation fidelity)*; AWS Bedrock *(typical deployment target for large-pharma AWS tenants)*; Azure OpenAI *(typical deployment target for Azure-standard customers)*; Open source / self-hosted *(required for customers with strict on-tenant inference mandates — Llama 3, Mistral, Qwen-class)*; No preference *(final choice is customer-governed)*.
- **Must use self-hosted / open-source models only:** No *(default — most customers are comfortable with validated managed endpoints in their own cloud tenant; self-hosted open-weight is supported where required)*.
- **Approach:** RAG *(primary — over literature and internal dossiers)*; Prompt engineering only *(for structured narrative generation with tight templates)*; Agentic workflows / tool use *(for the multi-step discovery-to-plan pipeline, with explicit human checkpoints)*; Fine-tuning / PEFT *(explicitly not required for v1 — prompt + RAG gets 90% of the value; fine-tuning only if a specific customer invests in it)*.
- **Context window / document size needs:** 100K+ tokens *(mechanistic narrative synthesis may retrieve dozens of abstracts, several pathway summaries, internal dossier excerpts, and the statistical evidence package in a single call; long-context models materially reduce orchestration complexity)*.
- **Streaming responses required:** Yes *(narrative drafting and Q&A UX expect token streaming; batch-only response degrades the authoring experience)*.
- **Content safety / guardrails required:** Yes *(guard against fabricated citations — every claim must trace to a retrieved document; guard against over-confident clinical recommendations; enforce that the tool never produces output framed as clinical-use guidance without explicit scientist review)*.
- **Specific model version requirements:** Pin a specific model version per analysis run and include it in the audit trail; any model upgrade triggers a re-validation checkpoint for the mechanistic-narrative layer. Do not allow silent model drift.

### Real-time / online inference toggle

No *(analysis is episodic and batch-oriented. Interactive Q&A on the shortlist uses the LLM synchronously but does not require sub-second inference; "near-real-time" at the conversational level is sufficient and the tool is not on any critical real-time path.)*

### Additional solution notes

Three commitments that should be visible from the first demo:

1. **"Biomarker-to-protocol" in a single click.** The wedge is not better integration — it is generating a first-draft clinical validation plan (assay format, patient population, sample size with power calc, specimen SOP, timeline, cost envelope) from the discovery results. This is what QIAGEN / SomaLogic / DNAnexus do not do, and it is the output a Head of Translational Medicine will pay for.
2. **Translatability scoring baked into the shortlist.** Every candidate carries species-bridging, assay-feasibility, and tissue-availability scores with evidence — so scientists fail fast on infeasible candidates before sinking $500K into assay development.
3. **Defensibility as a first-class feature.** Every nomination has a one-click audit package that holds up at a pre-IND meeting six months later. No other tool in this space treats defensibility as a product surface; BiomarkerForge should.

What to explicitly *not* build in v1: full EDC / clinical-trial-data integration (out of scope for preclinical nomination); a replacement for QIAGEN IPA's curated pathway content (integrate, don't rebuild); a fully-autonomous biomarker nomination agent (scientists will reject it — every human checkpoint earns trust, every skipped one loses a customer).
