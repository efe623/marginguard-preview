# UnitPulse app: design system ("the ledger")

Scope: the signed-in app (Operate mode) plus auth, client portal and approval pages. The marketing landing page lives elsewhere and is untouched.

## Idea
UnitPulse is the record of agreed work and the money attached to it. The UI reads like a well-kept ledger: rows instead of cards, amounts aligned right in tabular numerals with dotted leaders, totals under a rule, status as a small marker plus a word. Nothing decorative. The accent (powder blue) only marks the primary action, the current location and focus.

## Structure (UX)
- No sidebar. A slim top bar: wordmark, primary nav (Today, Projects, Clients, Invoices, Reports, Calendar), a search/jump field that opens the command palette (Ctrl/Cmd+K), a New menu, activity bell and account menu.
- Mobile: compact top bar plus a fixed bottom tab bar (Today, Projects, Clients, Invoices, More).
- A project is a workspace with 6 tab groups instead of 10 flat tabs: Overview, Scope and changes (scope, requests, change orders), Money, Work (tasks and time, files), Conversation (messages, AI drafts), History (audit). Groups with several pages show a sub-tab row.
- Today (dashboard) is a work queue first: what needs a decision, ordered by urgency, one action per row. The money position is a statement (ledger), not four metric boxes.
- Lists are scannable rows or tables. A panel never contains another panel.

## Tokens (all in src/app/globals.css)
Dark is default; light is available. Use tokens, never hard-coded colours.
- Surfaces: `--paper` page, `--bar` top bar, `--surface` panels (`--paper-white` alias), `--surface-2` inset/hover (`--paper-deep` alias).
- Text: `--ink`, `--ink-soft` (secondary, 4.5:1+), `--ink-3` (tertiary, 4.5:1+ on `--surface`).
- Lines: `--line` hairlines, `--line-strong` control borders.
- Accent: `--signal` (alias `--accent`), `--signal-deep`, `--on-signal` text on accent, `--accent-soft` tinted background.
- Status: `--success` `--warning` `--danger` (always paired with a word or icon, never colour alone).
- Radius: `--radius-sm` 8 (controls), `--radius-md` 12 (panels), `--radius-lg` 14 (popovers, dialogs). Status chips 6. No pills except avatars.
- Type: `--font-display` (Bricolage Grotesque) only for page titles and a few big figures; `--font-body` (Hanken Grotesk) for everything else. Fixed scale: 12 label, 13 small, 15 body, 17 panel title, 22 section, 30 page title. Sentence case everywhere. Numerals are tabular by default.

## Vocabulary (use these; Tailwind utilities are fine for one-off layout)
Layout: `.page` `.page-narrow` `.page-head` `.page-title` `.page-sub` `.crumbs` `.page-actions` `.split` (main + 340px aside) `.stack` `.stack-sm` `.cluster`
Surfaces: `.panel` `.panel-flush` `.panel-head` `.panel-title` `.panel-sub` `.panel-body` `.notice` (+ `-info` `-warn` `-danger` `-success`) `.empty` (+ `.empty-title` `.empty-text`)
Lists: `.rows` `.row` (+ `a.row` is a link) `.row-lead` `.row-main` `.row-title` `.row-sub` `.row-end` `.table-wrap` `.table` (`.data-table` alias) `.num` (right-aligned tabular)
Money: `.ledger` `.ledger-line` `.ledger-label` `.ledger-value` `.ledger-line.is-total` `.facts` `.fact` `.fact-label` `.fact-value`
State: `.status` + `status-success|warning|danger|neutral` (via `<Status tone>`), `.pips` (usage meter), `.chips` `.chip` (`aria-pressed`)
Nav: `.tabs` `.tab` (`aria-current="page"`), `.subtabs` `.subtab`
Controls: `.button` + `button-primary|dark|outline|ghost|danger`, `.button-sm`, `.button-icon`; `.field` `.field-label` `.hint` `.field-error` `.input` `.select` `.textarea` `.form-grid` `.form-actions` `.check`
Text: `.quiet` (secondary) `.faint` (tertiary) `.signal` `.meta` (small secondary line)
Do not use: `.eyebrow` above headings, `.card`/`.metric` boxes, uppercase labels, coloured side borders, gradients, glass, nested boxes, emoji or unicode as icons (lucide only).

## States
Every interactive element has hover, focus-visible (2px accent ring), active, disabled. Loading uses skeleton rows or a disabled button with a label change. Empty states say what to do next and give the action. Errors say what went wrong and how to fix it, next to the field.

## Motion
150 to 200 ms colour/opacity/translate transitions answering input. The command palette and menus fade and rise 6px once. Nothing animates on load or scroll. Respects `prefers-reduced-motion`.

## Voice
Plain verbs, sentence case, buttons say the action ("Save scope", "Send for approval"). Money always with currency. Dates readable ("Sun 15 Nov").
