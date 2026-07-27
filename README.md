# Automation Opportunity Scanner — deXevel (v3)

Interactive lead magnet. Puts a euro/pound figure on the revenue a business leaks to manual process. Solar, recruitment, and marketing-agency specific. Client-side only, £0 cost, no backend, no LLM.

**Live v1:** `https://dexevel.com/tools/automation-scanner/`
**This project:** v3 — pre-filled reports, New Game+ what-if, pipeline-stall visualizer, internal email draft.

## Architecture

Built on the proven v1 engine (51 tests carried forward). v3 adds four new modules on top, all pure HTML/CSS/JS.

### v1 engine (unchanged, carried forward)

| File | Role |
|------|------|
| `js/scoring.js` | 18 gap rules, 0–100 maturity/opportunity score, 4 bands |
| `js/calculations.js` | 5-component revenue-leak model, currency-localised |
| `js/engine.js` | 25-automation library, trigger-based priority scoring, roadmap |
| `js/workflow.js` | Node/edge workflow diagram per industry |
| `js/report.js` | Orchestrator tying all engines together |
| `js/pdf.js` | Branded jsPDF generator |
| `js/lead-capture.js` | Web3Forms soft gate |
| `js/validation.js` | Wizard step validation |
| `js/icons.js` | SVG icon library |
| `js/data/*.js` | Questions, industries, automations, insights, free-fixes |

### v3 new modules

| File | Feature | Lines |
|------|---------|-------|
| `js/urlparams.js` | §2.1 Pre-filled reports via URL params — parses DM-friendly vocab, translates to v1 internal keys, auto-generates report when `auto=1` | ~240 |
| `js/whatif.js` | §2.2 New Game+ what-if — clones answers, applies gap fixes, re-runs engine, diffs deltas; progressive disclosure (#1, #1+#2, #1+#2+#3, fully optimised) | ~160 |
| `js/pipeline-stall.js` | §2.3 Pipeline-stall visualizer — 5-stage per-industry pipeline, throughput from answers, bottleneck detection, animated token flow with reduced-motion fallback | ~310 |
| `js/email-draft.js` | §2.4 Internal email draft — first-person template the prospect copies to their MD/partner, clipboard API with fallback | ~150 |

### UI

| File | Role |
|------|------|
| `index.html` | Shell: N5 floating pill nav, ticker, pre-fill banner, hero, wizard mount, report mount, climax CTA, Ft2 footer |
| `app.css` | Hallmark-designed within locked `design.md` tokens — dark teal-tinted, Space Grotesk + IBM Plex |
| `tokens.css` | Locked design token system (OKLCH palette, 4pt spacing, easings) |
| `js/app.js` | Orchestrator: URL param init, wizard state, ticker, report rendering |
| `js/ui.js` | DOM rendering: gauge, alerts, leak breakdown, opportunities, roadmap, pipeline, what-if, email draft, CTA |

## The "I ran your numbers" play (v3 §2.1)

Send a personalised link in a DM:

```
https://dexevel.com/tools/automation-scanner/?industry=solar&region=IE&employees=12&monthlyLeads=80&crm=spreadsheet&followup=manual&auto=1
```

The prospect sees a complete report before answering a single question. A banner says "Pre-filled from your business profile — adjust to refine" with an "Edit answers" button.

**Minimum for auto-generate:** `industry` + `monthlyLeads` + `avgDeal`. Missing answers are filled with industry defaults.

## Tests

```bash
node --test test/*.test.js
```

**88 tests, 0 failures.** 49 carried forward from v1 + 39 new v3 tests.

## Run locally

```bash
npx serve -l 4173 .
```

## Design system

Locked in `design.md` — dark teal-tinted near-black paper, Space Grotesk display, IBM Plex Sans body, IBM Plex Mono labels. Workbench macrostructure family. N5 floating pill nav, Ft2 inline footer. Accent footprint ≤5%. No decorative animations. Reduced-motion respected everywhere.

## Constraints

- £0 marginal cost — static hosting, no server, no paid API
- No LLM/AI call inside the tool
- Client-side only, deterministic
- All v1 tests still pass
