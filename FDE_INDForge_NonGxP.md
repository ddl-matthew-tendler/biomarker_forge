# FDE Spec: IND Forge
*Generated: 2026-05-01 | Target Persona: Translational Medicine Lead / Preclinical Pharm-Tox Lead | Phase: Preclinical → IND-Enabling | Classification: Non-GxP (preclinical IND-enabling work; pre-submission)*

---

## Scoping note

IND Forge is a **non-GxP** application that produces a preclinical-to-IND-enabling biomarker package for a single development compound. It picks up where BiomarkerForge stops: BiomarkerForge nominates the candidates and produces a translational shortlist; IND Forge takes those candidates plus the GLP tox, PK, and animal-omics record and assembles the **First-in-Human (FIH) dose justification**, the **safety biomarker panel**, the **PK/PD model with NOAEL/MABEL anchoring**, and the **IND dossier checklist** that a Type B pre-IND meeting expects to see.

The system itself is research-grade — it is *not* a 21 CFR Part 11 submission system. But because its outputs are read into the IND dossier, every artifact carries audit-trail metadata at a level that downstream regulatory affairs can lift directly into a Part-11-validated content management system without re-derivation. This is the explicit middle ground: non-GxP execution, GxP-ready output.

---

## Competitive Landscape Summary

- **Certara (Phoenix WinNonlin / Simcyp / PKPD-suite)** is the entrenched standard for PK/PD modeling and FIH dose simulation. Phoenix is what every pharm-tox group already runs. The gaps: (a) nothing about the **IND package** beyond the modeling section — no biomarker dossier, no safety panel cross-walk, no checklist, no audit chain back to GLP study source data; (b) **closed compute** — Simcyp jobs run on Certara's stack or on customer-managed Windows servers, with no story for routing a sensitivity sweep to on-prem SLURM where the animal-omics data actually lives; (c) modeler-centric UI — a translational medicine lead asking "what's our FIH dose and why" cannot self-serve in Phoenix without a dedicated PK modeler in the loop. IND Forge is not trying to replace Phoenix's PK kernel; it is trying to wrap Phoenix-grade output in a defensible, reproducible, package-ready surface.
- **Pumas-AI / Monolix (Lixoft, now Simulations Plus)** are the credible modern alternatives — code-first, open-ish, increasingly used at biotechs that find Phoenix licensing painful. Same gap: they end at the model, not at the IND. They produce a NONMEM-equivalent control stream and an HTML report; they do not produce the briefing-book paragraph, the safety biomarker panel, or the regulator-facing CoU statement.
- **Veeva Vault RIM, MasterControl, Lorenz docuBridge, Calyx**: these are the *submission* systems where the IND dossier eventually lives, post-Part-11 validation. They expect content to arrive structured. Today, the upstream content originates as Word documents and PDF appendices that translational and pharm-tox leads write by hand. The hand-written-then-Vault'd path is where defensibility breaks: the reasoning chain from raw GLP study to filed dose is fragmented across three groups and two tools, and six months later nobody can reconstruct it. IND Forge sits **upstream of Vault** and produces the structured artifact, with a clean handoff into RIM.
- **Tempus, Recursion, Owkin, Insitro**: AI-first preclinical and translational platforms producing biomarker discovery and target validation outputs. They generally do *not* produce the IND-enabling package; their wedge is upstream (target ID, mechanism, response prediction) and their outputs become **inputs** to IND Forge, not substitutes for it.
- **Internal / build-your-own**: at every top-20 pharma, the actual workflow is a senior pharm-tox scientist running a Phoenix project on a Windows VM, a translational lead writing the biomarker section in Word from a Tableau dashboard, a regulatory affairs analyst stitching the appendices into Vault, and a Slack channel arguing about NOAEL exposure margins for two weeks. The audit trail lives in three filesystems and an Outlook thread. The "I lost my reasoning chain six months later" failure mode is universal and catastrophic at FDA Type B meetings, where reviewers ask "show me the bridging" and the response is a 90-second tab-scroll on a shared screen. IND Forge's wedge is replacing that ad-hoc seam with a single governed package.
- **What every competitor misses (in descending order of importance)**: (1) **One package, one source of truth** — FIH dose, MABEL cross-check, safety panel, bridging, exposure justification, briefing-book paragraph, audit chain, all derived from the same pinned dataset snapshot and the same pinned model version; (2) **Compute residency as a first-class workflow choice** — animal-omics and GLP tox data are routinely IT-restricted to on-prem storage, and the sensitivity sweep must run *where the data already lives*, not in a cloud cluster that triggers a data-transfer review and a six-week IT escalation; (3) **Defensibility-by-construction** — every number in the briefing book traces, in one click, back to the GLP study, the parameter set, the model version, and the user who approved it; (4) **A checklist that mirrors the FDA expectation** rather than the modeler's mental model — CoU, analytical validation, bridging, safety panel, PK/PD, biomarker qualification, pre-IND briefing, audit trail — so the user can see at a glance what is done and what blocks the submission.

---

## Persona Context — Translational Medicine Lead / Preclinical Pharm-Tox Lead

**Primary persona:** the human who owns the question *"what dose do we give the first patient, and why?"* That role is split, in different orgs, across:
- **Translational Medicine Lead** (often MD, MD/PhD, or PhD; 12–20 years; sits at the seam between Discovery and Clinical Development; owns the biomarker/PD strategy and the FIH protocol's experimental design).
- **Preclinical Pharm-Tox Lead** (often DABT-certified, PharmD, or PhD; owns the GLP tox studies, NOAEL determination, and the pre-IND/IND nonclinical package).
- A meaningful subset of these leads are **ex-FDA reviewers** (typically 3–8 years at CDER's Office of New Drugs or OCP) who took industry roles. They think about the package the way a reviewer thinks about it, which is the lens IND Forge optimizes for.

- **Daily reality:** their week is a rolling negotiation between (a) the modelers, who want another month to refine the population PK fit, (b) clinical operations, who are cost-locked into a protocol start date, (c) regulatory affairs, who want bullet-proof bridging because the agency burned them on a prior program, and (d) the program team, who want a starting dose that doesn't require eight-cohort dose escalation. They live in Phoenix WinNonlin, Word documents in tracked changes, a Tableau dashboard built by an analyst who left the company, and the GLP CRO portal. Mondays are tox study reads. Tuesdays are PK model reviews. Wednesdays are the biomarker working group. Thursdays are pre-IND prep. Fridays are the cross-functional sync where the dose number is argued. Three times a year they walk into a Type B meeting at FDA and defend a starting dose to a reviewer who has 90 minutes and two pages of pre-prepared questions.

- **Top frustrations:**
  1. **"The dose justification is stitched together from six tools and a Slack thread."** The NOAEL comes from Provantis. The HED comes from a Phoenix project. The MABEL comes from an in-house spreadsheet. The receptor occupancy assumption came from a 2019 binding study that one person remembers. The exposure margin lives in a deck. None of it cross-references; if the reviewer asks "what receptor Kd did you assume for MABEL," the team has to track down the analyst.
  2. **"The animal-omics and GLP tox data cannot legally go to the cloud."** The bridging and sensitivity sweep is a genuinely parallel HPC workload — bootstrap PK/PD across 256 parameter combinations is exactly the kind of thing a SLURM cluster eats for breakfast. But the data-residency rules say the omics matrices and the GLP raw outputs stay on-prem. Running it in AWS triggers a data-transfer review that costs four to six weeks of legal/IT/QA time. So the sweep doesn't get run, or it gets run on a single workstation overnight and the team takes the point estimate.
  3. **"I cannot reconstruct the reasoning chain six months later."** The classic failure mode: the IND filed in Q1, the agency comes back in Q3 with a clinical-hold-adjacent question about the safety biomarker panel ("why is your DILI panel just ALT and not ALT + AST + ALP + total bilirubin?"), and the team spends three weeks reverse-engineering the rationale because the original Word document referenced a SharePoint link that has since been re-orged. This kills careers. It is not theoretical. Every senior pharm-tox lead has a story like this.
  4. **"The FDA 2005 Maximum Safe Starting Dose guidance is the spec, but nobody actually follows it cleanly."** The FDA's "Estimating the Maximum Safe Starting Dose in Initial Clinical Trials for Therapeutics in Adult Healthy Volunteers" (2005) lays out the algorithm — NOAEL → HED → MRSD with safety factor → PAD cross-check. In practice, every program reinvents the worksheet. There is no canonical, parameterized implementation that the lead can run, edit, and defend.
  5. **"MABEL is required for biologics/immunomodulators per EMA, and we wing it every time."** The EMA's 2017 *Guideline on Strategies to Identify and Mitigate Risks for First-in-Human and Early Clinical Trials with Investigational Medicinal Products* explicitly requires the MABEL approach for high-risk biologics. The math (target receptor occupancy at projected exposure, anchored on in vitro Kd and clinical-format isoform) is well-defined but is run case-by-case in a spreadsheet that nobody else can audit.
  6. **"The biomarker section of the IND is treated as a bolt-on."** Reviewers increasingly expect a fit-for-purpose Context of Use statement, an analytical validation plan (ICH M10 alignment), a bridging story, and a defined PD signal. Most teams write this section last, in 48 hours, at 80% of the quality of the rest of the package. It is a vulnerability.

- **Career wins:** dose accepted at the pre-IND meeting without a clinical-hold-style follow-up; safety biomarker panel cited approvingly in a Type B response; one IND filed without a bridging-data clarification request; cycle time from "GLP-002 read" to "IND submitted" cut from 9 months to 5.

- **AI/automation fears:** "an AI-generated FIH dose will end my career"; "I cannot defend a black-box model to a reviewer"; "the model will silently use stale tox data and the audit will catch it"; "if the LLM generates a briefing-book paragraph that misstates a study finding, I'm the one who signed the IND." Reassurance comes from radical transparency: every number on screen has a click-through to the source GLP study, the parameter sheet, the model version, and the timestamp. The LLM never speaks unless it has a citation. The dose computation is reviewable arithmetic, not a learned function.

**Secondary personas:**
- **Regulatory Strategy Lead** — wants the package to be Part-11-ready when it crosses into Vault; treats IND Forge's audit metadata as a non-negotiable deliverable.
- **Translational Scientist** — owns the biomarker handoff from BiomarkerForge into IND Forge; wants the candidate evidence to flow through without re-keying.
- **Biostatistician (preclinical)** — runs the bootstrap sensitivity sweeps; cares about the SLURM partition story because they personally feel the wall-clock pain.
- **R&D Program Lead / VP Development** — wants the one-page summary view; wants to know which IND submissions in the portfolio are blocked on which checklist items.

---

## SECTION 1: Submitter Information

| Field | Value |
|-------|-------|
| Full name | Matthew Tendler |
| Work email | matthew.tendler@dominodatalab.com |
| Role | — fill in — |
| Submission date | [auto-populated by portal] |
| Notes | IND Forge is a **Non-GxP, preclinical / IND-enabling** use case. Outputs feed IND submissions and pre-IND interactions but the system itself is research-grade. Not 21 CFR Part 11; downstream content is lifted into a Part-11 RIM/Vault system by Regulatory Affairs. Designed to slot in **after** BiomarkerForge in the same Domino tenant, sharing the candidate substrate. |

---

## SECTION 2: Prospect Overview

| Field | Value |
|-------|-------|
| Company / prospect name | [fill in per engagement] |
| Region | [fill in per engagement] |
| Industry vertical | Pharma / biotech — most relevant to organizations with active IND pipelines (typical sweet spot: 3–15 INDs per year, oncology / immunology / rare disease / immune-modulator biologics) |
| Relationship stage | [Early discovery / Active evaluation / POC / Late stage — fill in per engagement] |
| Primary contact name | [fill in per engagement] |
| Primary contact title / role | [Typically VP Translational Medicine, Head of Preclinical Pharm-Tox, Senior Director DMPK / Pharmacology, or Head of Regulatory Strategy. An ex-FDA reviewer in that role is a strong leading indicator of fit and short sales cycle.] |
| Estimated data science team size | [fill in — typical preclinical pharm-tox + DMPK groups are 8–30 at a mid-size biotech, 50–150 at top-20 pharma; biostatistical / modeling support 4–25 alongside] |
| Additional context | Look for sponsors who (a) recently received an FDA information request about FIH dose justification, (b) had a Type B clinical-hold or partial-hold related to nonclinical bridging, (c) are running biologics or immune-modulators where MABEL is non-negotiable, (d) have an on-prem HPC (Cambridge / NJ / Basel HPC are common) and a stated data-residency policy keeping animal omics behind the firewall. Penn, Bristol Myers Squibb, Merck, Regeneron, GSK, AstraZeneca, Genmab, Roche/Genentech, and Vertex all fit the pattern. |

---

## SECTION 3: Business Problem

### High-level problem description

Preclinical pharm-tox and translational medicine leads spend 6–12 weeks per program assembling the IND-enabling biomarker and FIH dose package. The work is real and irreducible — read the GLP tox studies, derive NOAEL and HED, compute MABEL for biologics, build a PK/PD model, define the safety biomarker panel, write the Context of Use and analytical validation plan, draft the pre-IND briefing book — but the *seam* between these tasks is artisanal. The artifacts live in six tools, the reasoning chain is verbal, the sensitivity analyses don't get run because the cluster story is broken, and the resulting package is defensible the day it ships and undefendable six months later. IND Forge replaces that seam with a single governed application that produces the IND-enabling package as a structured, auditable artifact — without forcing the team out of their existing modeling tools.

### Business objectives

1. **Compress the IND-enabling biomarker / FIH-dose package cycle** from 8–12 weeks to 2–3 weeks per program, without sacrificing the quality bar a Type B reviewer expects.
2. **Make every dose number defensible six months later** with a one-click reconstruction of the reasoning chain back to GLP study source data, parameter sheet, model version, and approver identity.
3. **Run the bridging and sensitivity sweep on every program** — instead of skipping it because the cloud-data-transfer review is too painful — by routing the workload to the on-prem SLURM cluster where the data already lives.
4. **Standardize the FIH dose algorithm** to the FDA 2005 MRSD guidance with explicit MABEL cross-check (per EMA 2017), implemented as parameterized, auditable arithmetic that a reviewer can step through.
5. **Treat the biomarker section of the IND as a first-class deliverable** — Context of Use, analytical validation plan, bridging, safety panel, qualification dossier, briefing-book paragraph — not a 48-hour bolt-on.
6. **Free the pharm-tox lead's senior bandwidth** to spend on hypothesis generation and reviewer-anticipation work, not on document stitching and version-reconciliation.

### Current state

At a typical mid-to-large biotech today: GLP-001 (rat 28-day) and GLP-002 (NHP 28-day) come back from the CRO as PDFs and tabular appendices. The pharm-tox lead reads them, derives NOAEL by hand, and notes the findings ("mild ALT elevation @ 30 mg/kg," "transient IL-6 spike @ 20 mg/kg") in a Word document. A DMPK scientist runs Phoenix WinNonlin to fit a non-compartmental PK model and exports a CSV. A biostatistician opens a separate Phoenix project to fit an Emax exposure–response model on the lead PD biomarker (say, CXCL9 from BiomarkerForge's earlier nomination) and produces another CSV. The translational lead opens both CSVs in a Tableau dashboard built by an analyst who left the company. The MABEL cross-check is computed in a one-off Excel sheet by a senior modeler from receptor-occupancy assumptions inherited from a 2019 binding study. Someone copies the resulting starting dose ("0.8 mg, 1/10th of NHP NOAEL HED, MABEL-anchored at 10% RO") into the briefing book draft. The bridging and sensitivity sweep is supposed to be run but typically isn't — the cluster story is broken, and the team takes the point estimate. The biomarker section is written in 48 hours over a weekend. The package goes through three rounds of internal review, lands in Vault for QA's Part-11 process, and ships. Six months later the FDA reviewer sends a follow-up question, and the team spends three weeks reverse-engineering the rationale because the original SharePoint structure has been re-orged.

### Pain points

- **"The dose number is the answer to a six-tool question, and I cannot trace it end-to-end."** Provantis → Phoenix → Excel → Word → Tableau → Vault. No two of those tools share a primary key. When a reviewer asks "what receptor Kd did you assume in MABEL," the lead has to chase down the analyst.
- **"The on-prem cluster is faster, cheaper, and the data already lives there — and I still can't easily target it."** The animal-omics matrices and the GLP raw outputs are pinned to on-prem storage by IT policy. The natural compute target is the Cambridge or NJ on-prem SLURM cluster. Every translational lead has been told "you need to run that in the cloud" by a platform team that doesn't understand the data-residency constraints, then waited six weeks for a data-transfer review that ended in "no, you can't." The result: the sensitivity sweep is the part of the package that gets cut.
- **"NOAEL is not the same number across rats and cynos and I have to defend the one I picked."** Standard practice: take the most sensitive species (typically NHP for biologics), apply an allometric Body Weight^0.67 or Body Surface Area scaling to compute Human Equivalent Dose (HED), apply a 10× safety factor (the "1/10th of NOAEL HED" heuristic from FDA 2005). Each step has an explicit citation. Each step has a knob. Today, those knobs live in the modeler's head.
- **"MABEL is mandatory for biologics and we treat it as if it were optional."** EMA's 2017 FIH guideline (post-TGN1412) is unambiguous: for high-risk biologics — agonistic immune modulators, novel mechanisms, narrow therapeutic windows — the MABEL approach must be considered. The arithmetic is straightforward (target receptor occupancy at projected human exposure, derived from in vitro Kd, clinical-format protein, target tissue concentration), but in practice it is run case-by-case in spreadsheets that don't survive the analyst rotating off.
- **"Safety biomarker selection is tribal knowledge."** ALT/AST for DILI, cTnI for cardiac, creatinine for renal, IL-6 for CRS. Every team knows the panel, but the *justification* (why these and not those, what's the analytical performance, what's the dynamic range in your population) is reconstructed from memory each time.
- **"Bridging studies are written in Word and don't slot into the dossier structure."** Animal-to-human bridging (ortholog assay match, species-conserved pathway, antibody cross-reactivity) is the connective tissue between BiomarkerForge's nomination and IND Forge's package. Today it is narrative prose. It needs to be a structured artifact.
- **"The IND package checklist exists in everyone's head and never on screen."** CoU, analytical validation, bridging, safety panel, PK/PD, qualification, pre-IND briefing, audit trail. Every IND has the same eight things. None of them are tracked in a single place. The status is: "I think we're done with the biomarker section, but let me check with regulatory."

### Success metrics

- **Cycle time** — GLP study read to IND-package draft: from 8–12 weeks → 2–3 weeks (≥75% reduction). Measurable per-program.
- **Defensibility** — six months post-submission, time to reconstruct the reasoning chain for an FDA information-request response: from 2–3 weeks → < 1 day. Measured by tracked clarification responses.
- **Sensitivity-sweep coverage** — fraction of programs that ship with a documented bridging + bootstrap PK/PD sensitivity sweep: from < 30% → 100%. Measured by audit log.
- **MABEL-anchoring discipline** — for every biologic / immune-modulator program, MABEL cross-check is computed, documented, and presented alongside NOAEL-derived dose: 100% (vs. ~50% today, anecdotally).
- **Reviewer follow-up rate** — fraction of INDs that receive an FDA information request specifically about FIH dose justification or biomarker bridging: target ≤ 20% (vs. industry baseline, anecdotally 40–50%).
- **Senior-scientist time recovered** — hours per program spent on document stitching and version reconciliation, redirected to hypothesis-generation and reviewer-anticipation: ≥ 40 hours / IND.
- **Pre-IND meeting confidence** — translational and pharm-tox leads self-report ≥ 8/10 confidence walking into the Type B meeting (vs. baseline ~6/10).

### Key stakeholders

`Translational Medicine Lead (primary)` `Preclinical Pharm-Tox Lead (primary)` `DMPK Scientist` `Biostatistician (preclinical)` `Translational Bioinformatician` `Biomarker / Bioanalytical Lead` `Regulatory Strategy Lead (read-write on package metadata)` `QA / Regulatory Operations (Vault hand-off)` `Program Lead / VP Development (summary view)` `External GLP CRO contacts` `IT / HPC platform owner (for SLURM integration)` `IT Security / Data Governance (for residency review)`

### Urgency and timeline drivers

- **IND filing dates are the schedule.** Every week saved on the biomarker / FIH-dose package is a week gained on protocol activation and clinical site startup. For an oncology program, that is one week of trial duration that competitors aren't getting.
- **Type B meeting cadence.** Pre-IND briefing books are due ~30 days before the meeting; the dose justification and biomarker section are the parts most likely to slip. Late slips trigger meeting cancellation, which sets the program back a quarter.
- **Post-TGN1412 regulatory expectation has hardened.** EMA 2017 and FDA's increased scrutiny of biologic FIH starting doses (especially immune-modulators) mean that thin MABEL analysis is no longer acceptable.
- **GLP CRO bottlenecks.** Top-tier GLP tox CROs (Charles River, Labcorp, Inotiv) are capacity-constrained; teams that turn around the IND-enabling package fast can re-run a study and still hit the original IND date. Teams that don't, can't.
- **Capital constraints on biotechs.** A clinical hold or partial-hold from FDA at IND stage is a $5–15M setback at a biotech and frequently a financing-event-killer. Defensibility is no longer a nice-to-have.
- **ICH S9 (oncology) and ICH M3(R2) (general nonclinical safety) are the operative guidances** and both expect structured nonclinical safety packages. Reviewers reading dozens of INDs per year reward structure heavily.
- **21 CFR Part 11 expectation downstream.** Even though IND Forge is non-GxP, the audit metadata it produces must be Part-11-liftable so QA can validate the downstream RIM/Vault hand-off without re-deriving anything.

---

## SECTION 4: Data Assets

### Data overview

A single program's IND-enabling biomarker package draws from: GLP tox study deliverables (rat + NHP, typically 28-day repeat-dose; cardiovascular safety pharmacology; in vitro hERG; genotox panel summary), nonclinical PK studies (single-dose and repeat-dose, multiple species), animal multi-omics from the same studies (RNA-seq, proteomics, occasional metabolomics — the substrate that BiomarkerForge nominated against), in vitro target-binding data (Kd, IC50 against the clinical-format protein), the BiomarkerForge candidate output (the scored shortlist re-ranked on IND-enabling evidence), public reference (TCGA / GTEx for translational mapping, UniProt and Ensembl for ortholog matching), and study metadata (dose, timepoint, species, treatment arm, PK exposure, animal IDs). Data volumes are modest by ML standards but defensibility-critical: every byte must carry version metadata.

### Data sources

**Source 1 — GLP tox study deliverables (CRO outputs)**
- System type: Document store *(CRO portal — Charles River REACH, Labcorp Drug Development, Inotiv portals)*; On-prem object storage *(once landed, often a NetApp share)*
- Data formats: Structured (tabular) *(in-life observations, clin chem, hematology, PK)*; Unstructured text *(study reports — narrative findings, pathology)*; PDF *(signed final reports)*
- Access status: Already accessible *(under MSA)*
- Notes: GLP studies carry the GLP audit chain end-to-end. IND Forge must not break that chain — the raw CRO deliverable hashes must be preserved and surfaced in the audit trail. Pathology narratives are the highest-value unstructured text in this entire substrate; LLM extraction with mandatory human review is the right design.

**Source 2 — Nonclinical PK and DMPK study outputs**
- System type: On-prem relational database *(in-house DMPK system — typically Provantis, Pristima, or a Watson LIMS deployment)*; Document store *(Phoenix WinNonlin project files, NONMEM / Monolix control streams)*
- Data formats: Structured (tabular) *(plasma concentration vs. time, derived PK parameters — Cmax, AUC, t½, CL, Vss)*; Semi-structured *(Phoenix project XML)*
- Access status: Already accessible
- Notes: PK parameters are the input to allometric scaling (HED) and to the Emax exposure–response fit. IND Forge consumes the derived parameters, not the raw concentration-time data — but must link back to it for the audit trail.

**Source 3 — Animal-omics matrices (RNA-seq, proteomics, metabolomics from the same animals)**
- System type: On-prem object storage *(genomics core S3-compatible bucket, proteomics CRO landing)*; Cloud data warehouse *(internal mirror)*
- Data formats: Structured (tabular) *(counts matrices, NPX / RFU matrices, metabolite intensities)*; Semi-structured *(QC reports)*
- Access status: Already accessible — **but residency-restricted to on-prem in most large-pharma deployments**
- Notes: This is the data that drives the bridging and sensitivity sweep. The compute that operates on it must run **where the data lives**. Hence on-prem SLURM as the default target.

**Source 4 — In vitro target-binding and pharmacology data**
- System type: On-prem relational database *(in-house pharmacology DB)*; Document store *(study reports)*
- Data formats: Structured (Kd, IC50, EC50 against clinical-format and surrogate protein)
- Access status: Already accessible
- Notes: Required input to the MABEL calculation. The receptor occupancy math is: RO = [drug] / ([drug] + Kd), evaluated at projected human exposure (Cmax or steady-state). 10% RO is the canonical MABEL anchor for high-risk biologics; some programs use 20% or 50% with explicit justification.

**Source 5 — BiomarkerForge candidate output**
- System type: Domino-internal object storage *(project artifact volume — `biomarker-forge-outputs`)*
- Data formats: Structured (tabular) *(ranked candidate shortlist with translational scores)*; JSON *(per-candidate evidence payload)*
- Access status: Already accessible (internal, project-scoped)
- Notes: IND Forge re-ranks BiomarkerForge candidates on IND-enabling evidence — species concordance, assay feasibility, PD dynamic range, organ-tox safety overlap. The handoff is in-tenant, no cross-system transfer. (Demonstrates the multi-app composition story.)

**Source 6 — Public reference data**
- System type: REST API *(UniProt, Ensembl, OpenTargets, GTEx, TCGA / GDC)*; Cloud data warehouse *(internal mirror in larger orgs)*
- Data formats: Structured; Semi-structured (JSON)
- Access status: Already accessible
- Notes: Used for cross-species ortholog confirmation, human reference expression priors (e.g., is the PD biomarker expressed in the proposed Phase 1 patient population's tissue of interest), and translational mapping. **Versioned local mirrors** are mandatory — reproducibility cannot depend on live API calls that move under the team's feet.

**Source 7 — Literature and regulatory guidance corpus (RAG substrate)**
- System type: REST API *(PubMed / PMC, Semantic Scholar, OpenAlex, FDA guidance documents, EMA scientific advice publications)*; Document store *(internally-curated MoA dossiers)*
- Data formats: Unstructured text; PDF; Embeddings / vectors
- Access status: Already accessible
- Notes: Powers the briefing-book paragraph drafting and the CoU justification. Every LLM-generated sentence must cite a retrieved source. FDA's "Estimating the Maximum Safe Starting Dose..." (2005), ICH M3(R2), ICH S9, ICH M10, EMA 2017 FIH guidance, and FDA BEST taxonomy are all in-scope references that must be retrievable and citable.

**Source 8 — Study metadata, dose, timepoint, treatment arm**
- System type: On-prem relational database *(Provantis / Pristima / in-house study DB)*
- Data formats: Structured (tabular)
- Access status: Already accessible
- Notes: Critical for contextualizing every biomarker reading and every PK datapoint. Without this, the package is mechanistically meaningless. The single most common silent failure mode is timepoint mismatching across modalities.

**Source 9 — Internal regulatory precedent (prior INDs at the sponsor)**
- System type: Document store *(internal RIM system — Vault RIM, MasterControl, Lorenz, or in-house)*; Document store *(internal pre-IND meeting minutes and FDA correspondence)*
- Data formats: PDF; structured (submission metadata)
- Access status: Access pending per customer *(usually requires regulatory affairs coordination — Vault content is access-controlled)*
- Notes: Internal precedent is gold for "how have we justified this before" and "what did FDA push back on last time." Not required for v1 but high-value for v2 — RAG over the sponsor's prior IND submissions, specifically the dose-justification and biomarker sections.

### Estimated total data volume

**5–50GB per program**. Breakdown: GLP study deliverables ~1–5GB (mostly PDF + tabular appendices); PK / DMPK study outputs ~0.5–2GB; animal-omics ~5–30GB (the dominant component, RNA-seq counts matrices and proteomics matrices); in vitro pharmacology ~0.1GB; public reference snapshots cached ~5GB (shared across programs); literature embeddings ~5–15GB (shared). Per-tenant aggregate across an active IND pipeline: **50–500GB**. Well within Domino's data-handling capacity.

### Data velocity / freshness

**Batch / episodic.** New GLP study reads land every 4–12 weeks per program; PK studies land alongside; the package is rebuilt as new evidence arrives but the cadence is weeks, not seconds. **Freezing is mandatory** — every IND-enabling package run pins a dataset snapshot that is immutable for the duration of the IND lifecycle. Real-time or streaming inputs are neither needed nor desirable; reproducibility demands frozen snapshots.

### Known data quality issues

- **Animal ID reconciliation across modalities** — clin chem, PK, and omics often arrive on different ID schemes from the same study. The single most common source of silently wrong analyses, mirroring the BiomarkerForge sample-ID problem one stage earlier.
- **Pathology narrative variability** — different toxicologic pathologists describe the same finding with different language; LLM-assisted extraction must be conservative and human-reviewed.
- **PK parameter derivation is method-dependent** — non-compartmental analysis vs. compartmental fitting can produce 10–30% differences in AUC and Cmax, which propagates into HED and MABEL. The method must be pinned and disclosed.
- **In vitro Kd values vary across binding assays** — SPR (Biacore), ITC, and cell-based binding give different numbers for the same molecule. The MABEL anchor must specify which assay and which concentration regime.
- **Cross-species ortholog matching has silent failure modes** — for biologics, the cyno ortholog of the human target sometimes binds differently; the bridging story has to flag this explicitly rather than assuming concordance.
- **Public reference data versions drift** — UniProt and Ensembl release on different cadences; pinning matters for reproducibility.
- **GLP raw data hashes drift** when CROs reissue final reports** — IND Forge must capture the hash at first ingest and the hash at every subsequent re-ingest, with explicit reconciliation.

### Data access notes

All data is customer-internal or from public APIs / guidance corpora. **No clinical patient data, no EDC, no PHI** — the system is preclinical-only by design, which is the central scoping decision keeping it out of GxP. Public reference data is rate-limited; cache locally. CRO portals are typically reached via SFTP or signed-URL S3; no direct API in many cases. Internal RIM access (for v2 precedent retrieval) requires a separate scoped service account.

---

## SECTION 5: Governance & Compliance

### Applicable regulatory frameworks

- [ ] HIPAA *(no patient data — confirmed scoping decision)*
- [ ] GDPR *(no EU-subject patient data; sponsor employee metadata only, handled by tenant)*
- [ ] CCPA / CPRA
- [x] SOC 2 *(inherited from the Domino tenant)*
- [ ] FedRAMP
- [ ] PCI-DSS
- [ ] FINRA / SEC
- [ ] BASEL / BCBS
- [ ] DORA
- [ ] EU AI Act *(watch item — once the IND-enabling output influences a clinical-stage product, downstream uses may cross into "high-risk AI" territory; at preclinical IND-enabling, currently out of scope, but the model card and audit chain are designed to be portable to a high-risk classification if needed later)*
- [ ] None identified
- [x] **Other (specify):**
  - **GLP (21 CFR Part 58)** — IND Forge consumes GLP study deliverables; it does not generate GLP data, but it must preserve the GLP audit chain end-to-end. Hashes of CRO final reports captured at ingest, never silently re-derived.
  - **FDA "Estimating the Maximum Safe Starting Dose in Initial Clinical Trials for Therapeutics in Adult Healthy Volunteers" (2005)** — the canonical reference for the FIH dose algorithm. IND Forge implements it parameterically: NOAEL → HED via allometric BW^0.67 (Boxenbaum) or BSA scaling (FDA default for small molecules) → MRSD with safety factor (typically 10×) → PAD cross-check.
  - **EMA "Guideline on Strategies to Identify and Mitigate Risks for First-in-Human and Early Clinical Trials with Investigational Medicinal Products" (2017, EMEA/CHMP/SWP/28367/07 Rev. 1)** — post-TGN1412; mandates MABEL approach for high-risk biologics.
  - **ICH M3(R2)** — nonclinical safety studies for the conduct of human clinical trials (general).
  - **ICH S9** — nonclinical evaluation for anticancer pharmaceuticals (oncology programs).
  - **ICH S6(R1)** — preclinical safety evaluation of biotechnology-derived pharmaceuticals.
  - **ICH M10** — bioanalytical method validation, applicable once a biomarker advances to clinical assay.
  - **FDA BEST (Biomarkers, EndpointS, and other Tools) terminology and Biomarker Qualification Program (BQP)** — for fit-for-purpose Context of Use statements.
  - **21 CFR Part 11 readiness (downstream)** — IND Forge is *not* itself a Part-11 submission system, but its audit metadata (record-of-record, electronic signature placeholders, immutable timestamps, hash chains) is structured to be lifted into a Part-11 RIM/Vault system without re-derivation. This is the explicit middle ground: non-GxP execution, GxP-ready output.

### Data residency requirements

**This is the central architectural constraint of IND Forge.** Most large-pharma sponsors restrict animal-omics matrices and GLP raw data to on-prem storage, by IT policy, by contractual MSA terms with the genomics core, or by global data-handling policy that predates the cloud era. The constraint is real, enforced, and not negotiable on the timeline of an IND program.

The architectural consequence: the bridging and sensitivity sweep — a genuinely parallel HPC workload — must run **where the data already lives**. That is, on-prem SLURM. The compute residency is not a preference; it is a compliance requirement. Routing the workload to a cloud cluster triggers a data-transfer review (legal, IT security, QA, sometimes regulatory) that costs 4–6 weeks of elapsed time and frequently ends in a "no, route it on-prem." The sensitivity sweep is therefore the first thing cut from the package when teams try to brute-force a cloud-only architecture.

IND Forge addresses this with first-class, governed compute-target selection. The cluster picker presents:
- **Cambridge HPC (On-Prem SLURM)** — recommended default. No egress, no data-transfer review, GLP audit chain preserved end-to-end.
- **NJ Research HPC (On-Prem SLURM)** — secondary on-prem option if Cambridge queue is saturated.
- **Domino-managed Ray cluster (cloud)** — available, but flagged as "public omics only — data-transfer review required for preclinical animal omics."
- **AWS EKS (cloud)** — burst capacity, flagged for data-transfer review and egress cost.

The "why this matters" rationale is surfaced in the UI: *"Your animal-omics and GLP tox data is restricted to on-prem storage. On-prem SLURM is recommended — no egress, no data-transfer review."* The recommendation is not a suggestion; it is a compliance posture made explicit.

For sponsors without an on-prem HPC, the architecture supports a Domino-managed compute target inside the same private tenant where the data lives — the principle (compute follows data) is preserved even when the literal SLURM cluster isn't on-prem.

Other residency notes: US and EU regional residency for large-pharma; APAC for Japanese pharma. Public reference snapshots (TCGA, GTEx) mirrored in-region for performance.

### Data access restrictions

- **Program-level access control** is mandatory. An IND-enabling package for a confidential target must be visible only to the program team. Cross-program read access is rare and revocable.
- **GLP CRO data carries contractual onward-sharing restrictions** that must be respected at the user level, not just the org level.
- **Internal IND precedent (RIM content)** is access-controlled by Regulatory Affairs and typically requires a separate scoped service account for retrieval.
- **External GLP CROs and regulatory consultants** may need read-only access to specific package sections; time-boxed, audit-logged entitlements are expected.

### Input/output logging requirements

Every analysis run captures: input dataset snapshot IDs (with hashes), parameter values (NOAEL, HED scaling exponent, safety factor, MABEL receptor occupancy threshold, Kd source assay), code / model version, container image hash, user identity, timestamp, and output artifact hashes. Every LLM-generated paragraph logs the prompt, the retrieved context chunks with citations, and the generated output. Logs queryable for the life of the IND plus the typical sponsor's record-retention horizon (NDA/BLA + 10 years is the conservative target). The downstream Part-11 RIM system inherits these logs by reference rather than by re-derivation.

### Decision audit trail requirements

For each IND-enabling package, the audit trail reconstructs in one click:
1. Which GLP studies (with hashes) contributed the NOAEL.
2. Which species was selected as the most sensitive, with the scaling method and exponent applied.
3. Which Kd value was used for MABEL, from which binding assay, on which protein construct.
4. Which receptor occupancy threshold was used (10% / 20% / 50%) and the cited justification.
5. The exposure margin vs. NOAEL at the projected starting dose.
6. The PK/PD model fit (Emax parameters, ECxx, residuals, bootstrap CIs from the sensitivity sweep) and the compute target it ran on.
7. The safety biomarker panel selection rationale.
8. Every human override or re-ranking with its rationale and approver.
9. The LLM-generated briefing-book paragraphs with retrieved-context citations.
10. The hand-off metadata (artifact hashes, signatures placeholders) for downstream RIM ingestion.

This is the **defensibility layer** — without it, IND Forge is just a faster Phoenix.

### Explainability requirements

**Non-negotiable, and stricter than BiomarkerForge.** The FIH dose computation is reviewable arithmetic, not a learned function. Every number on every screen has a click-through to the source GLP study, the parameter sheet, the model version, and the timestamp. Every ML-driven ranking (the IND-enabling re-rank of BiomarkerForge candidates) carries SHAP / coefficient attribution. Every LLM paragraph is grounded in retrieved evidence with inline citations — no free-form generation, no synthesized clinical claims, no hallucinated study findings.

The translational lead must be able to walk a Type B reviewer through the package by clicking down through every assertion to the underlying source data. "Black box with a confidence score" is a non-starter. "Auto-generated from NHP NOAEL with allometric scaling (HED), cross-checked against MABEL (10% receptor occupancy)" is acceptable only if every term in that sentence is a hyperlink to a source.

### Result consumer access restrictions

- **Translational Medicine Lead, Preclinical Pharm-Tox Lead, DMPK Scientist, Biostatistician, Translational Bioinformatician**: full author/editor access.
- **Bioanalyst / Assay Development**: read access to safety panel and analytical validation sections; comment access; cannot edit dose justification.
- **Regulatory Strategy Lead**: read-write access to package metadata (target submission date, hand-off status, version pins); read access to all scientific content.
- **QA / Regulatory Operations**: read-only access; receives the package hash chain at hand-off into Vault.
- **VP Development / Program Lead**: curated summary view (the IND Package checklist page).
- **External GLP CRO contacts, regulatory consultants**: explicit, time-boxed, scoped entitlements; all access events logged.
- **R&D ExCom, BD&L, Commercial**: no default access — these are confidential clinical-development plans.

### Additional governance notes

- **LLM provider boundary**: LLM calls route to the customer's validated endpoint (AWS Bedrock / Azure OpenAI / Vertex AI) or a self-hosted open-weight model (Llama 3 / Mistral / Qwen-class) for sponsors that mandate on-tenant inference. No prompt or retrieved context leaves the customer environment.
- **Model version pinning** per analysis run, included in the audit trail. Any model upgrade triggers a re-validation checkpoint for the briefing-book generation layer. Silent model drift is a defensibility risk and is explicitly disallowed.
- **Content safety**: guard against fabricated study findings, hallucinated dose numbers, and over-confident clinical recommendations. The system never produces output framed as clinical-use guidance without explicit scientist review and signature.
- **Hand-off to Part-11 systems**: package export produces a structured payload with hash chain, signature placeholders, and immutable timestamps. The Vault ingestion path is QA-validated separately; IND Forge does not claim Part-11 itself.
- **GLP audit chain preservation**: at every ingest, the CRO final report hash is captured and surfaced in the audit trail. Re-ingests are reconciled, never silently overwritten.

---

## SECTION 6: Solution Requirements

### Deployment environment

**Customer-owned Domino tenant (AWS / Azure / GCP) or hybrid (Domino orchestration + on-prem SLURM compute target)** — hybrid is the typical large-pharma deployment because the bridging / sensitivity sweep must run on-prem alongside the animal-omics data. Domino Cloud (Domino-managed) is appropriate for biotechs without an on-prem HPC and without strict animal-omics residency policies, but the *compute follows data* principle is non-negotiable: wherever the data lives, the compute target must run there.

### Prototype timeline expectation

**4–8 weeks** for a single-program POC: ingest one program's GLP tox + PK + animal-omics + BiomarkerForge candidate output, implement the FIH dose calculation with MABEL cross-check, fit the PK/PD Emax model with bootstrap sensitivity, route the sweep to an on-prem SLURM target, generate the IND package checklist, draft the biomarker section paragraphs with LLM + RAG over guidance corpus, present an end-to-end package for one compound. **8–16 weeks** to reach steady-state production (multi-program, scheduled refresh cadence, governance workflow, RIM hand-off integration, internal IND precedent retrieval).

### Deployment notes

- Deploy inside the customer's existing Domino environment so analysis code, data, and model artifacts live together. The IND Forge app is the surface; the underlying R/Python/Phoenix interop lives in Domino projects that translational and pharm-tox leads can drop into directly.
- **SLURM connector** must be production-grade: SSH/REST submission, partition selection, job monitoring, log retrieval, artifact return path. This is the workflow that highlights Domino's on-prem SLURM capability and is the demo showpiece.
- **Phoenix WinNonlin interop**: read-only ingestion of Phoenix project XML for PK parameters; do not try to replace Phoenix's PK kernel in v1. Phoenix is entrenched and trusted; ripping it out kills adoption.
- **R and Python parity**: pharm-tox and DMPK split fairly evenly. Anything Python-only alienates half the users.
- **LLM endpoint** routes to the customer's validated provider (Bedrock / Azure OpenAI / Vertex / on-tenant open-weight). Streaming required for paragraph drafting UX.
- **App UI** is a Domino App with full notebook drop-in; every button has a "show me the code" affordance.

### Integration requirements

**Integration 1 — GLP CRO portals and deliverables**
- System / tool name: Charles River REACH, Labcorp Drug Development portal, Inotiv portal (also: Eurofins, WuXi AppTec); SFTP / signed-URL S3 for final reports
- Integration type: Read data from it
- Notes: Ingestion captures CRO final report hashes for the GLP audit chain. Pathology narrative extraction with LLM-assisted parsing and mandatory human review. Re-ingests reconciled, never silently overwritten.

**Integration 2 — Phoenix WinNonlin (read-only)**
- System / tool name: Certara Phoenix WinNonlin
- Integration type: Read data from it *(import Phoenix project XML for PK parameters and exposure-response fits)*
- Notes: Do not replace Phoenix in v1. Ingest derived parameters; the audit trail links back to the Phoenix project file for full reproducibility.

**Integration 3 — On-prem SLURM cluster (the headline integration)**
- System / tool name: Customer-managed SLURM (Cambridge HPC, NJ Research HPC, or equivalent — Slurm Workload Manager 22+)
- Integration type: Submit compute jobs *(species-bridging + bootstrap PK/PD sensitivity sweeps run as SLURM array jobs)*
- Notes: The differentiator. Submission via Domino's SLURM connector — partition selection, resource specification, real-time queue/log monitoring, artifact return. The cluster picker UI surfaces residency rationale ("no egress, no data-transfer review") and treats on-prem as the recommended default for animal-omics workloads. Cloud Ray / EKS targets exist as fallbacks but carry explicit data-transfer-review flags.

**Integration 4 — Domino-managed Ray cluster (fallback compute)**
- System / tool name: Domino-managed Ray
- Integration type: Submit compute jobs
- Notes: Available for non-animal-omics workloads (public reference data, simulation-only sweeps). Surfaced in the cluster picker with explicit "data-transfer review required for preclinical animal omics" flag.

**Integration 5 — BiomarkerForge candidate substrate**
- System / tool name: BiomarkerForge (sister Domino app)
- Integration type: Read data from it *(scored shortlist + per-candidate evidence)*
- Notes: Same Domino tenant; in-tenant transfer via project artifact volume. This is the multi-app composition story.

**Integration 6 — Internal DMPK / preclinical study database**
- System / tool name: Provantis, Pristima, or in-house study DB
- Integration type: Read data from it
- Notes: Required for sample provenance, dose, timepoint, treatment arm, PK exposure context.

**Integration 7 — In vitro pharmacology and target-binding database**
- System / tool name: In-house pharmacology DB
- Integration type: Read data from it *(Kd, IC50, EC50 — required for MABEL anchoring)*

**Integration 8 — Public reference and guidance corpus**
- System / tool name: UniProt, Ensembl, OpenTargets, GTEx, TCGA / GDC; PubMed / PMC, Semantic Scholar, OpenAlex; FDA guidance documents, EMA scientific advice
- Integration type: Read data from it
- Notes: Versioned local mirrors. Reproducibility cannot depend on live API drift.

**Integration 9 — Vault RIM / regulatory operations (downstream)**
- System / tool name: Veeva Vault RIM, MasterControl, Lorenz docuBridge, Calyx
- Integration type: Write data to it *(structured package hand-off with hash chain, signature placeholders, immutable timestamps)*
- Notes: IND Forge does not run Part-11 itself; it produces a Part-11-ready payload that QA's downstream validation can ingest without re-derivation. v1 produces the export bundle; v2 wires the direct RIM hand-off.

**Integration 10 — Single sign-on**
- System / tool name: Customer IdP (Okta, Azure AD, Ping)
- Integration type: Authentication / SSO
- Notes: Standard. No standalone user management.

### UX and delivery requirements

- **Primary UI: a four-tab Domino App.** Candidates (the BiomarkerForge handoff re-ranked on IND-enabling evidence). Safety & Tox (organ-tox overlap heatmap; GLP study summary). PK/PD & FIH Dose (the centerpiece — Emax exposure–response with NOAEL / EC50 / MABEL plotlines, dose card, sensitivity-sweep launcher). IND Package (the dossier checklist with status per section). Each tab is a stop on the package-builder workflow; together they produce the exportable IND-enabling package.
- **The cluster picker is the showpiece.** Modal that opens when the user runs the bridging + sensitivity sweep. Lists clusters with location, capacity, partitions, cost, compliance posture, and a "why this" rationale per option. On-prem SLURM is recommended and labeled. Cloud targets exist but carry explicit data-transfer-review flags. Submission produces a job ID and a "why this matters" callout — this is where the on-prem residency story lands for the buyer.
- **Dose card is the headline artifact.** Single number ("0.8 mg projected starting dose"), one-line rationale ("1/10th of NHP NOAEL HED + MABEL cross-check"), expandable to the full reasoning chain. Click anywhere → audit trail.
- **Outputs must be export-ready.** PDF and DOCX export of the FIH dose justification, the biomarker section, the bridging summary, and the briefing-book paragraph. Every export carries the audit hash chain in metadata and a printable footer.
- **Traceability UI everywhere.** Every number clicks through to source. Every LLM paragraph cites every claim. Every dose computation is steppable arithmetic.
- **Comparison view.** Side-by-side compare of FIH dose options (rat-derived vs. NHP-derived; BSA vs. BW^0.67 scaling; 10% vs. 20% RO MABEL anchor) with the rationale for each.
- **Live-vs-dummy data toggle**, in the search-card top-right. The app ships with a complete dummy package (compound INDF-127 with CXCL9 as lead PD biomarker) so a demo always works even when the live API is offline.
- **Conservative defaults, power-user depth.** Out of the box, FDA 2005 algorithm with 10× safety factor and 10% MABEL RO. For the modeler, full parameter exposure without leaving the tool.

### Target user personas

`Translational Medicine Lead (primary)` `Preclinical Pharm-Tox Lead (primary)` `DMPK Scientist (primary)` `Biostatistician (primary, for sensitivity sweep)` `Translational Bioinformatician (primary)` `Biomarker / Bioanalytical Lead` `Regulatory Strategy Lead (read-write on metadata, read all)` `QA / Regulatory Operations (read-only, ingests at hand-off)` `Program Lead / VP Development (summary view)`.

### Priority level

**High** — directly tied to IND filing dates and pre-IND meeting cadence; one of the highest-leverage time-recovery wedges in the preclinical → clinical handoff. Compelling demo because the output is a tangible dose number with a clean reasoning chain — not an abstract analytic. The on-prem SLURM workflow is a strong showcase for Domino's hybrid-compute story.

### Technology constraints

- **Compute residency follows data residency.** This is the architectural primary constraint. No data egress to third-party SaaS for analysis. The bridging / sensitivity sweep targets on-prem SLURM by default; cloud targets exist but are flagged for data-transfer review.
- **LLM on customer-sanctioned endpoints** — Bedrock / Azure OpenAI / Vertex / self-hosted open-weight for stricter customers. Prompt and retrieved context never leave the tenant.
- **Reproducibility**: every package run pins dataset snapshot, container image, parameter set, model version, and compute target. One-click re-run six months later must produce byte-identical (or cryptographically-verified equivalent) outputs.
- **R and Python parity** for the modeling layer. Phoenix WinNonlin interop required (read-only).
- **No browser-local analysis state**; everything persists server-side for auditability.
- **Audit metadata is Part-11-liftable** even though the system itself is non-GxP.

### Predictive ML models toggle

Yes — but with a deliberate boundary. ML is used for: (a) re-ranking BiomarkerForge candidates on IND-enabling evidence (gradient-boosted model with SHAP attribution, trained on historical IND-enabling decisions where retrievable); (b) the bootstrap PK/PD sensitivity sweep (resampling-based, not learned — but compute-bound, hence the SLURM target); (c) optional learned components in safety-overlap scoring (similarity model on tox finding patterns).

ML is **not** used for the FIH dose computation itself. That is reviewable arithmetic — NOAEL → HED → MRSD with safety factor → MABEL cross-check at receptor occupancy threshold. Every term is a hyperlinked, parameterized number. A learned dose model is a defensibility risk and is explicitly out of scope.

### Generative AI / LLMs toggle

Yes.

- **GenAI use case types:** Text generation / drafting *(briefing-book paragraphs for the FIH dose section, the biomarker section, and the safety-pharmacology section; CoU statements; analytical validation plan first drafts)*; Summarization *(condensing GLP final reports and FDA guidance into the relevant package section)*; Document Q&A *(natural-language queries over the package — "show me how the NHP NOAEL was derived")*; Entity / info extraction *(pulling toxicologic findings from pathology narratives, with mandatory human review)*; RAG *(retrieval over guidance corpus — FDA 2005 MRSD guidance, ICH M3(R2), ICH S9, EMA 2017 FIH guidance, ICH M10 — plus internal MoA dossiers and, in v2, internal IND precedent)*; Agents / autonomous tasks *(bounded agentic orchestration of the package-builder workflow with explicit human-in-the-loop checkpoints at every section boundary; no autonomous package finalization)*.
- **Preferred LLM providers:** Anthropic Claude *(default — strong reasoning, long context, citation fidelity)*; AWS Bedrock; Azure OpenAI; Open source / self-hosted *(required for sponsors with on-tenant inference mandates — Llama 3, Mistral, Qwen-class)*; final choice customer-governed.
- **Must use self-hosted / open-source models only:** No (default); Yes for sponsors with strict on-tenant inference mandates.
- **Approach:** RAG (primary, over guidance corpus + internal dossiers); Prompt engineering (for structured paragraph templates); Agentic workflows with explicit human checkpoints; Fine-tuning explicitly **not** required for v1 — prompt + RAG gets ≥90% of the value.
- **Context window / document size needs:** 100K+ tokens — briefing-book paragraph synthesis may retrieve full relevant guidance excerpts, multiple GLP study findings sections, internal precedent passages, and the structured evidence package in one call.
- **Streaming responses required:** Yes (paragraph drafting and Q&A UX).
- **Content safety / guardrails required:** Yes — fabricated study findings, hallucinated dose numbers, and over-confident clinical recommendations are explicitly disallowed. Every claim cites a retrieved source. The system never produces content framed as clinical-use guidance without explicit scientist review.
- **Specific model version requirements:** Pin per analysis run; included in audit trail; any model upgrade triggers a re-validation checkpoint for the briefing-book layer. No silent model drift.

### Real-time / online inference toggle

No. Analysis is episodic and batch-oriented. Interactive Q&A on the package uses the LLM synchronously but does not require sub-second inference; near-real-time at the conversational level is sufficient. The bridging / sensitivity sweep is a multi-minute parallel HPC workload, not a real-time inference path.

### Methodology — the math

This section documents the algorithms IND Forge implements, so a reviewer (FDA or internal QA) can step through every number.

**1. NOAEL → HED (Human Equivalent Dose)**

Given the NOAEL (mg/kg) in the most sensitive species, scale to the human equivalent dose using either:
- **Body Weight allometric scaling (Boxenbaum):** HED = NOAEL × (W_animal / W_human)^(1−b), where b is the allometric exponent. Default: b = 0.67 for clearance-driven scaling (BW^0.67), giving HED = NOAEL × (W_animal / W_human)^0.33. For a 6 mg/kg NHP NOAEL with W_NHP = 4 kg, W_human = 60 kg: HED ≈ 6 × (4/60)^0.33 ≈ 6 × 0.41 ≈ 2.5 mg/kg, or 150 mg for a 60 kg adult.
- **Body Surface Area scaling (FDA 2005 default for small molecules):** HED = NOAEL ÷ (Km_animal / Km_human), where Km is the mg/kg-to-mg/m² conversion factor. For NHP, Km ≈ 12; for adult human, Km ≈ 37; HED = NOAEL × (12/37) ≈ NOAEL × 0.32.

Both methods are in scope. The user picks; the audit trail records the choice.

**2. MRSD (Maximum Recommended Starting Dose)**

MRSD = HED ÷ Safety Factor. Default safety factor: **10×**, per FDA 2005. The user can adjust with explicit justification (e.g., 100× for novel mechanisms, 5× for well-characterized targets in oncology per ICH S9).

For the worked example: MRSD = 150 mg ÷ 10 = 15 mg.

**3. MABEL cross-check (mandatory for high-risk biologics)**

Receptor occupancy at projected human exposure: RO = [drug] / ([drug] + Kd), evaluated at projected Cmax or steady-state. The MABEL is the dose at which RO = the chosen anchor (default 10%; some programs use 20% or 50% with cited justification per EMA 2017 and ICH S6(R1)).

For the worked dummy example (INDF-127, CXCL9 as PD biomarker): MABEL AUC is anchored at 420 ng·h/mL, projected to a starting dose of 0.8 mg. The 1/10th-of-NHP-NOAEL approach gives the same number for this molecule, which is presented as confirmatory.

**4. Final FIH starting dose**

The lower of MRSD and MABEL-derived dose. The rationale ("1/10th of NHP NOAEL HED + MABEL cross-check") is recorded with both numbers and the choice surfaced.

**5. Exposure margin vs. NOAEL**

Margin = NOAEL_AUC ÷ projected_human_AUC at starting dose. For INDF-127: 3800 ÷ 420 ≈ 9× margin. Reviewers typically want ≥10× for biologics; 9× would be flagged for justification.

**6. PK/PD Emax model**

Standard Emax: response = E0 + (Emax × C) / (EC50 + C), fit by non-linear regression to the exposure–response data. Bootstrap sensitivity sweep resamples the underlying observations to produce confidence intervals on Emax, EC50, and the projected starting-dose exposure margin. The sweep is the SLURM workload — typically 64–256 bootstrap iterations across parameter perturbations, parallelized as a SLURM array job. Wall-clock on Cambridge HPC at 64 bootstraps: ~5 minutes; at 256: ~20 minutes.

**7. Species bridging**

Ortholog confirmation (UniProt + Ensembl) for the target and the PD biomarker. Cross-species concordance scored on:
- Sequence identity (human vs. NHP vs. rat, target and biomarker).
- Tissue expression concordance (GTEx for human, internal for animal).
- Functional concordance (in vitro Kd against human vs. cyno protein).
- Pathway membership (Reactome / KEGG) conservation.

The species concordance score on each candidate (e.g., CXCL9: 0.92) is the weighted aggregate.

### Validation gates

- **Gold-set check against historical IND submissions** where the actual filed FIH dose is known internally. The system's recommended starting dose should fall within ±2× of the historically-filed dose for a held-out set of past INDs from the sponsor (and from public IND records where retrievable). Any program where the system's recommendation diverges by >2× is flagged for explicit user review with a rationale required.
- **Reproducibility under retraining**: re-running an analysis from a 6-month-old pinned snapshot must produce byte-identical (or cryptographically-verified equivalent) outputs. CI tests the snapshot-replay path quarterly.
- **MABEL coverage** for biologic / immune-modulator programs: 100% of such programs must compute and document MABEL alongside NOAEL-derived dose. The system enforces this — biologic programs cannot export the package without MABEL evidence.
- **Audit chain integrity**: hash-chain verification across ingest → analysis → export. Any break is a blocker for export.
- **LLM citation grounding**: every paragraph claim must trace to a retrieved chunk; spot-audit quarterly with sampled human review.
- **Cross-method consistency**: BSA-scaling and BW^0.67-scaling HED computations should agree within ~2× for typical molecules; large divergence is flagged for explicit method-choice justification.

### Wedge — what's different from "I could just use a SAS macro" or "we already have Phoenix"

The honest objection from a senior pharm-tox lead is: "I have Phoenix WinNonlin, I have a SAS macro library, I have a worksheet template. I don't need a new tool." IND Forge's response is three differentiators that none of those existing assets deliver:

1. **One package, one source of truth.** Phoenix produces a PK report. The SAS macro produces a NOAEL summary. The worksheet computes MABEL. They don't talk to each other; the integration is a senior scientist's brain. IND Forge integrates them — same dataset snapshot, same model versions, same audit chain — and produces the package as a single artifact.
2. **Compute residency built in.** No SAS macro and no Phoenix project routes a sensitivity sweep to on-prem SLURM with the data-transfer rationale surfaced in the UI. This is the workflow that the sponsor's IT and data-governance teams have been blocking; IND Forge unblocks it.
3. **Defensibility-by-construction at six months.** A SAS macro produces output. It does not produce an audit trail that lets you walk a Type B reviewer's follow-up question through the entire reasoning chain in an afternoon. IND Forge's hash chain, parameter pinning, and one-click traceback exists for exactly that scenario. This is the part that pays for the tool the day a clinical-hold-adjacent question lands.

A fourth, secondary differentiator: **the biomarker section of the IND is a first-class artifact**, not a 48-hour bolt-on. CoU, analytical validation, bridging, safety panel, qualification, briefing-book paragraph — all generated, all traceable, all version-pinned.

### Additional solution notes

Three commitments visible from the first demo:

1. **"Dose-to-package in a single click"** — from candidate shortlist + GLP tox + PK to FIH dose, MABEL cross-check, safety panel, briefing-book paragraph, and exportable bundle. The wedge is package coherence, not a better PK kernel.
2. **"On-prem compute as a recommended default."** The cluster picker is the showpiece. Animal-omics and GLP tox stays where it lives; on-prem SLURM runs the sweep; the data-transfer review never starts. This is the most concrete demonstration of Domino's hybrid-compute story in a regulated workflow.
3. **"Defensibility as a product surface."** Every number traces to source in one click. Every LLM sentence cites a retrieved source. Every dose computation is steppable arithmetic. The audit chain ships with the package, not as a separate after-the-fact deliverable.

What to explicitly *not* build in v1: a replacement for Phoenix WinNonlin's PK kernel (interop, don't rebuild); a Part-11 submission system (hand off to Vault); fully-autonomous package finalization (every section requires human approval); cloud-only deployment for sponsors with on-prem residency rules (the architecture must be hybrid-first or the deal doesn't close).

### Open scope ambiguities (flagged for FDE discovery)

- **Internal IND precedent retrieval (Source 9)**: high-value but Vault-access-controlled. v1 ships without; v2 wires it. Confirm with Regulatory Affairs at scope.
- **Pathology narrative LLM extraction**: high-leverage but defensibility-sensitive. v1 ships with mandatory human review of every extracted finding; consider whether the customer's QA process accepts LLM-pre-extracted-then-human-confirmed as a workflow.
- **Bridging study auto-generation vs. assisted-drafting**: v1 produces a structured bridging artifact and an LLM-drafted summary. Whether the customer wants it auto-promoted to the dossier section or kept as draft pending modeler review is sponsor-specific.
- **EU AI Act forward compatibility**: when the IND-enabling output influences a clinical-stage product, downstream uses may cross into "high-risk AI." Architecture is designed for portability; explicit classification is a sponsor-by-sponsor call.
- **Multi-program portfolio view**: v1 is single-program. Several customers will want the program-portfolio view ("which INDs in our pipeline are blocked on which checklist items"). Out of scope for v1, planned for v2.
- **Sponsor-specific safety-factor convention**: default 10×, but oncology under ICH S9 sometimes goes to 5× or lower. The system supports customization with required justification — confirm the sponsor's standard convention at scope.
