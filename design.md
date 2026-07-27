# Design — deXevel Automation Opportunity Scanner

A locked design system for this app. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · studied-DNA: authkit structure · designed-as-app */

## Genre

modern-minimal (dark technical tool)

## Macrostructure family

- Marketing pages: **Workbench** — short claim + product surface (assessment + workflow canvas). Left-biased section heads. No eyebrow cascade.
- App / diagnostic results: **Workbench continua** — denser UI, same tokens, function over enrichment.
- Vertical pages: same Workbench family; pain points as asymmetric statement list (not equal 3-up cards).

## Inspiration DNA (structure only)

Source: https://www.authkit.com/ (public reference for structure restraint).

Carry forward: product-in-frame hero, sparse nav, low chrome footers, restrained accent footprint, hairline rules, demo-led sections.

Do **not** carry: light paper, login-card theatre, purple/indigo Accents from reference, flood decoration.

## Theme

Dark paper tinted toward brand teal. Single accent family (teal → core green). Accent footprint ≤ ~5% per viewport.

Tokens live in `tokens.css` and are re-exported from `:root` in `assets/css/base.css`.

- Paper · near-black with teal tint
- Ink · off-white
- Accent · deXevel teal `#00cab1` / `--color-primary`
- Core signal · `#0fdb7e` / `--color-core` (success / core workflow steps only)
- Focus · primary hairline ring

## Typography

- Display: **Space Grotesk** 600–700, tracking tight (−0.03em to −0.055em), `font-style: normal` always
- Body: **IBM Plex Sans** 400–500
- Mono / labels / metrics: **IBM Plex Mono** 500–600
- No Inter as the design face. No italic headers.

## Spacing

4-point named scale via `--space-*` tokens. Pages use named tokens, never ad-hoc hex spacing inline where avoidable.

## Motion

- Easings: `--ease-out` only for UI state
- Decorative infinite animations: **off** (no border sweep, no CTA shimmer, no card sheen)
- Reveals: none on marketing; optional opacity on assessment step change
- Reduced-motion: opacity ≤ 150ms, animations cancelled

## Microinteractions stance

- Silent success preferred
- Hover: border / surface only — no `translateY` card lifts, no glow blooms
- Focus rings instant (`:focus-visible`)
- Primary CTA: solid fill (brand gradient stopped — flat primary or two-stop only if both tokens)

## CTA voice

- Primary: solid `--color-primary`, dark ink, 8px radius (not pill floods), half-round only for compact nav chip
- Secondary: transparent fill, strong border
- Ghost: text + soft hover fill

## Nav / Footer

- Nav: **N9 edge-aligned** — logo left, few text links, one solid CTA right; sticky with hairline bottom; no broadsheet menu
- Footer: **Ft2 inline single line** — wordmark/tag + scan links + copyright; no multi-column sitemap

## What pages MUST share

- deXevel wordmark + X mark asset
- Accent colour + placement discipline
- Display + body + mono fonts
- CTA voice
- Left-aligned section heads
- Workflow node status colours (core / gap / enhance)

## What pages MAY differ on

- Hero product surface content (home = general flow showcase; verticals = industry language + packed checklist)
- Pain / proof blocks content only
- Assessment pre-selected industry on vertical routes

## Per-page allowances

- Marketing does **not** ship a demo workflow graph.
- Report results do **not** mount the workflow system map (engine retained for future use).
- No stock photography, no fake browser chrome, no invented metrics.

## Exports

### tokens.css

See project root `tokens.css`.
