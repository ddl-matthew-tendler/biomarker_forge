# UX Review: Translatability Sweep tab

Reviewed against Domino's design-system guidelines and the project CLAUDE.md UX checklist. Captured at 1440×900 (config + modal) and 1440×2200 (full results) using the live FastAPI app.

## Summary

The page tells the SLURM-on-prem story clearly and the layout is on-brand, but **two button-hierarchy violations** (Primary CTA conflicts) and **one duplicated control** (bootstrap input in both the config card and the modal) need fixing before the keynote. Several smaller polish items will tighten the demo.

---

## High severity

### 1. Two Primary buttons visible on the config view
The page header shows **"Generate IND package"** (Primary, top-right) at the same time as **"Run translatability sweep"** (Primary, large, in the run row). Domino's rule is one Primary per view.

- **Recommendation:** Demote the global "Generate IND package" header button to **Secondary** (`#EDECFB` bg, `#C9C5F2` border, `#1820A0` text). It's an app-wide action; the per-tab CTA should own the Primary slot. Edit at [indforge_static/app.js:879](indforge_static/app.js#L879) — change `type: 'primary'` to `type: 'default'` with secondary class, or to `ghost`.
- This issue exists across all tabs, but it's most visible here because the in-view Primary is so prominent.

### 2. Two Primary buttons on the results view
Same issue, different surface: the **Audit & lineage** panel renders **"Open in Audit Trail"** as Primary while the global **"Generate IND package"** Primary is still in the header.

- **Recommendation:** Make "Open in Audit Trail" **Secondary**. The audit drill-in is supportive context, not the headline action of the results page. Fix at [indforge_static/app.js](indforge_static/app.js) in the `SweepPage` audit block — change `type: 'primary'` on the audit-trail button to `type: 'default'`.

### 3. Bootstrap iterations is configured in two places
The config card has a **"Bootstrap iterations"** field (1000) and the SLURM modal has a separate **"Bootstraps (sensitivity runs)"** input (defaulting to 1000). Two sources of truth for the same parameter.

- **Recommendation:** Hide the modal's bootstraps input when the picker is opened from the sweep page. Add a `hideBootstraps` prop to `ClusterPicker`. The sweep page already owns this parameter — the modal should only own compute selection. Without this fix the demo opens a question the user can't answer ("which one wins?").

### 4. "Open in Audit Trail" leads nowhere
The button uses `href="#"` — clicking does nothing. Domino's first principle is "no dead ends."

- **Recommendation:** Either disable the button with a tooltip ("Audit Trail integration in v2") or remove it for the keynote. A live primary that does nothing on stage is worse than no button.

---

## Medium severity

### 5. Residency pill in config view doesn't preview cluster changes
If a user opens the SLURM modal, selects "Domino-managed Ray cluster", and clicks **Cancel**, the residency pill on the page still says "Animal omics stays on-prem". The pill only updates after a successful submit. A user inspecting alternatives gets stale state.

- **Recommendation:** Lift cluster selection state up to `SweepPage` and pass it through to the modal as controlled state. The pill then tracks the live selection. Or: only show the pill after the user has actually run something (i.e., on the results view).

### 6. Heatmap x-axis labels are crowded
30 features with -55° rotation at 1440px width — many feature names visually overlap, especially in the `tryptophan / kynurenine / lactate / creatinine / bilirubin` cluster.

- **Recommendation:** Either reduce to top-20 features (most informative across factors) or wrap the chart in a horizontally-scrollable container with a wider min-width. Tooltips do exist, but legibility at a glance matters for the keynote audience.

### 7. "PD" / "Tox" status pills assume audience vocabulary
The Status column shows `✓ PD` and `⚠ Tox`. Two-letter codes are dense and not all attendees will read "PD" as "pharmacodynamic."

- **Recommendation:** Use full words: `✓ Efficacy / PD` and `⚠ Safety / Tox`. The Role column already uses full phrasing — make Status match.

### 8. Stat card label wraps awkwardly at 1440px
"BOOTSTRAP ITERATIONS" wraps to two lines while neighbors fit on one. Visual rhythm broken.

- **Recommendation:** Either shorten to **"BOOTSTRAPS"** or constrain stat-card label to a single line (`white-space: nowrap; text-overflow: ellipsis`). Same applies to "COMPUTE TARGET" → "COMPUTE".

### 9. "Configure new sweep" button is too quiet for the path it owns
On the results view, the only way back to configure is a small default-style button next to the Run ID. For a workflow this stateful, it deserves more visual weight.

- **Recommendation:** Promote to **Secondary** (Domino purple-tinted) or place it as a "Back" action with a left-arrow icon at top-left of the results view.

---

## Low severity

### 10. Run ID treatment could match Domino governance pattern
The Run ID is shown as `Run ID: SWEEP-2026-05-03-A` in a purple chip. Good, but pairs awkwardly with the inline "Configure new sweep" button. Consider giving Run ID its own header row above the stat cards, with timestamp metadata under it.

### 11. Stage chips don't visibly progress
In the running view, the stage chips ("Queued", "Running on Cambridge HPC", "Aggregating bootstrap", "Succeeded") show "active" or "done" states but the transitions are abrupt — the demo flashes 68% → done. Consider a smoother progression with one chip lighting up at each ~25% step. Increases user confidence by making progress legible.

### 12. Empty Drawer state for Bootstrap distribution
The drawer's bootstrap histogram renders 1000 simulated draws — pretty — but if a future user opens it for a candidate with no bootstrap (live data not yet computed), there's no empty-state handling. Add a "Bootstrap not yet computed" message with a CTA to re-run.

### 13. Heatmap legend label is just `1 / 0 / -1`
Numbers without units. Add label "Factor weight" next to the legend so the audience knows what they're seeing.

### 14. The "Why this matters" wording in the modal is excellent but only fires post-submit
Currently shown only in the success Alert (not visible when called via `onSubmitted`). Sweep page never gets this educational copy.

- **Recommendation:** Surface a one-line version of "Why this matters" inline below the residency pill on the config view, so the rationale is visible *before* the user runs the sweep — not only after.

### 15. Copy / capitalization
- "Open in Audit Trail" → "Open audit trail" (sentence case + verb-first; matches Domino style).
- "Configure new sweep" → "Configure new sweep" is already sentence case — fine.
- "Submit to SLURM" / "Submit to RAY" — RAY is all-caps because the cluster type is uppercased in code. Should read **"Submit to Ray"** for consistency with sentence case. Fix at [indforge_static/app.js](indforge_static/app.js) in the modal footer: `selected.type === 'slurm' ? 'SLURM' : selected.type.toUpperCase()` — keep SLURM (acronym) but title-case the others.

---

## What's working well

- **Story arc is intact end-to-end.** Residency context (cohort + data sources cards) → compute selector with on-prem recommendation → progress with stage chips → results with confidence intervals → audit panel showing "no egress." A 60-second walkthrough lands.
- **Visual hierarchy follows the 1:2 rule** — tight rows inside cards, generous gaps between cards. Stat cards, panels, and cards align cleanly.
- **Heatmap divergent palette** (`#FF6543` → white → `#543FDE`) is on-brand and centers correctly at zero. Color stops in `colorAxis` are correctly configured.
- **CI bar visualization** in the envelope table is a nice custom touch — shows uncertainty at a glance, sortable by both score and CI width.
- **Drawer pattern** is preserved (overlay, not push) — table doesn't get crushed.
- **Audit panel monospace + green check accents** read as a real audit trail, not generic UI. Good signal for a regulatory-aware audience.
- **ClusterPicker reuse** worked: visually identical to the PK/PD tab, just with adjusted description copy as the spec required. The `onSubmitted` extension was minimally invasive.
- **Residency pill flips ok→warn live** based on the cluster the job actually ran on (in the results view) — the safety-first story is reinforced visually.
- **Proxy-safe URLs verified clean** — no leading-slash paths anywhere.

---

## Suggested fix order before keynote

1. Demote two header/audit Primary buttons (5 min).
2. Hide bootstrap input from modal when used by sweep (10 min).
3. Disable or remove "Open in Audit Trail" dead-end (2 min).
4. Lift cluster state up so the pill previews correctly (15 min).
5. Spell out "Efficacy / PD" and "Safety / Tox" in Status column (3 min).
6. Smooth stage-chip progression and shorten stat-card labels (10 min).

Total: ~45 minutes of polish for a noticeably tighter demo.
