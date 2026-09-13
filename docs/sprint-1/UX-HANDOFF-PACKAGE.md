# NIC UX Handoff Package

_Sprint 1, Week 3. Implementation-ready notes for the 8 current screens, cross-referenced against the Telstra Outage API and Loss of Connectivity API specs in the project brief._

Each screen below covers what the operator is trying to do, how the layout is put together, which components appear, and the practical detail a developer would otherwise have to guess at — data source, accessibility behaviour, and how the layout should respond at narrower widths. Component-level detail (states, content rules) lives in the companion [Component Notes](./COMPONENT-NOTES.md) document rather than being repeated here.

## 01 — Escalation List — Loading

_Understand the console is fetching current state, not that something's broken._

Standard three-band layout — Masthead, Fleetbar, then a Workspace split between the Map Column and Detail Column. The Detail Column carries a skeleton escalation row and a loading note with a spinner; nothing in the Map Column is resolved yet.

- **Interaction** — No click targets are active. The screen transitions on its own to Screen 02 or 03 once the fetch resolves — there's no manual dismiss.
- **Data** — Initial GET against the Loss of Connectivity API. Nothing renders as real content until the first response lands.
- **Accessibility** — The loading state should be announced via `aria-live="polite"` — the shimmer animation alone doesn't communicate "in progress" to a screen reader.
- **Responsive** — Skeleton widths scale with the Detail Column; the Map Column placeholder scales down to tablet without breaking its proportions.

## 02 — Escalation List — Empty

_Confirm the fleet is nominal, with confidence the console actually checked._

Same macro-layout as Screens 01 and 03 — the only change is that the Detail Column shows the Empty state component instead of a row.

- **Interaction** — There's no action to take here. It's a reassuring terminal state, not a dead end the operator needs to resolve.
- **Data** — Loss of Connectivity API returns zero active records. Fleetbar metrics still populate independently from the fleet status feed.
- **Accessibility** — The empty-state icon is decorative (`aria-hidden`); the title and body copy carry the actual meaning for assistive tech.
- **Responsive** — The empty-state content block stays centred in the Detail Column at every supported width.

## 03 — Escalation List — Active (Level 0)

_Notice a new escalation and decide whether to open it._

This is the hero-scenario's entry point: Masthead, Fleetbar, a Map Column with a single marker and no overlays yet, and a Detail Column holding one escalation row plus a short list note.

- **Interaction** — Clicking the row opens Screen 04 (Level 1, evidence collapsed). The map marker is context only at this level — not yet interactive.
- **Data** — Loss of Connectivity API record for the device (MSISDN, last report, silent duration), plus a reverse-geocoded last-known position for the marker.
- **Accessibility** — The escalation row is a real button or link, not a div with a click handler — keyboard-focusable with a visible focus ring.
- **Responsive** — Below the tablet breakpoint the Map Column should stack under the Detail Column rather than compress — exact breakpoint to be confirmed in mid-fi.

## 04 — Escalation Detail (Level 1) — Evidence collapsed

_Get the verdict, confidence, and recommended action quickly, without being forced through the full evidence trail first._

Map Area now carries outage and hazard overlays. The Detail Column runs back-navigation, device header, facts, the assessment block, the evidence toggle (collapsed), and the recommended action, top to bottom.

- **Interaction** — Expanding the evidence toggle reshapes the same screen into Screen 05's layout — it's an in-place disclosure, not a route change. Back returns to Screen 03.
- **Data** — Correlator output (cause, confidence) from the correlation service; Outage API record for the overlay polygon; VicEmergency feed for the hazard marker.
- **Accessibility** — The `[SYSTEM INFERENCE]` label needs to be real text, not a tooltip — it must read without hover or focus. The confidence meter needs a numeric percentage alongside the visual bar.
- **Responsive** — The Detail Column is the natural collapse target on narrower viewports, becoming the primary panel with the map reachable via a toggle.

## 05 — Escalation Detail (Level 1) — Evidence expanded

_Audit the verdict — see which sources were checked and how the cause was actually derived._

Same structure as Screen 04 on a taller canvas: the evidence table and correlation trace sit between the toggle and the recommended action once expanded.

- **Interaction** — Collapsing the toggle returns to Screen 04's shorter layout. This state is local to the session, not persisted.
- **Data** — Same as Screen 04, plus the VicEmergency and BOM feeds, each surfaced as its own row in the evidence table.
- **Accessibility** — Evidence rows should be structured as a semantic grouping — source name paired with its observation — rather than a plain paragraph, so they can be navigated row by row.
- **Responsive** — The evidence table and trace stack full-width in the Detail Column at every breakpoint; there's no side-by-side layout at Level 1.

## 06 — Escalation Detail (Level 1) — Assessment Pending

_Trust that the system is actively working, not stalled — and not receive a guessed or premature recommendation._

Same macro-layout as Screen 04, but the Map Area has no overlays yet, and the assessment and action blocks both render their pending variants.

- **Interaction** — No recommended action is clickable, or even present as real text — the block states unavailability directly. The screen moves on to Screen 04 automatically once the correlator resolves.
- **Data** — The correlation service hasn't returned yet; the screen renders from partial data (device facts only) while that call is in flight.
- **Accessibility** — The pending status line ("Querying outage and public hazard feeds — Ns elapsed") should update via `aria-live` so screen-reader users get progress without needing to re-poll manually.
- **Responsive** — Same collapse pattern as Screen 04.

## 07 — Escalation List — Basemap Offline

_Keep investigating through the list even though the map tiles are down, and trust the degradation is contained._

Same macro-layout as Screen 03, with the Map Column replaced by a dashed-border fallback panel — icon, title, and a short explanation.

- **Interaction** — The escalation row stays fully clickable. Losing the map doesn't block investigation, it only removes the spatial view.
- **Data** — The map tile request fails or times out; everything else — Loss of Connectivity API, device facts — loads normally.
- **Accessibility** — The fallback explanation needs to be real, selectable text, not an image with only alt text.
- **Responsive** — The fallback panel scales the same way the Map Column it replaces would.

## 08 — Escalation Detail (Level 1) — Evidence expanded, feed degraded

_Get a usable verdict even when one source is unavailable, and know exactly which source is missing rather than assuming all three were checked._

Identical to Screen 05, except the BOM row in the evidence table is swapped for its "not retrieved" variant.

- **Interaction** — Same as Screen 05. The verdict and recommended action still render — losing one source reduces stated confidence and evidence completeness, it doesn't block the correlator from reaching an assessment.
- **Data** — The BOM feed fails or times out; the correlator proceeds on the remaining two sources. The "not retrieved" reason text should come from the actual feed-failure response, not be inferred client-side.
- **Accessibility** — The "NOT RETRIEVED" tag carries text, a border-style change, and an icon together — never colour alone.
- **Responsive** — Same pattern as Screen 05.
