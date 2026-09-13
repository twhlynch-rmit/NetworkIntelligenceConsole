# NIC Component Notes

_Sprint 1, Week 3. Reusable UI components drawn from the 8 shipped screens in Figma._

This isn't a full design-system spec — it's the working notes on each component's job, what it's allowed to show, and how it behaves when the data behind it isn't in its default state. Anything not listed here (hover/focus/active mechanics, spacing tokens, colour values) still lives in Figma; this document covers meaning and behaviour, not pixels.

## Masthead

The persistent top bar. Its only job is orientation — logo, product name, client badge, environment badge, a live clock, and the signed-in user. It never carries navigation or actions, and it doesn't change between screens.

- **Default** — Fixed and identical across all 8 screens. _(only state in use)_

## Fleetbar

A one-line summary of fleet health, sitting under the masthead so the operator can judge overall state before opening anything. Five chips: Monitored, Reporting, Degraded, Loss of Connectivity, and a Last Poll timestamp. Counts only — no device-level detail belongs here.

- **Default** — Populated counts, refreshed on the poll interval.
- **Loading** — Chips render as skeleton placeholders until the first fetch resolves (Screen 01).

## Escalation row

A single-line summary of one active escalation, and the main entry point into an investigation. Shows the escalation ID, MSISDN, a status pill, a short role/location line, and the last-report/silent-duration meta. The whole row is the click target.

- **Default** — Rendered when an escalation exists (Screens 03 and 07).
- **Loading** — Skeleton bars stand in for real content; the row isn't clickable yet (Screen 01).
- **Selected** — A 3px left-border accent marks the row whose detail is currently open.

## Empty state

Tells the operator the fleet is genuinely nominal, not that something failed to load. Icon, a short title, one line of body copy, and three meta rows (monitored / reporting / last poll) so there's still some context even with nothing to investigate. Reserved for a true zero count — never used as a stand-in for a failed fetch.

- **Default** — Shown only when the active-escalation count is zero (Screen 02). _(only state in use)_

## Status pill

A compact inline tag showing an escalation's assessment stage without requiring the operator to open the detail view. Always carries a text label — colour is never the only signal, per the accessibility requirement against colour-only states.

- **Assessing** — Shown at Level 0 while the correlator hasn't yet returned a verdict. _(only state in use)_

## Map area

Geographic context for the escalation. What it shows changes by level: a bare marker at Level 0, and outage-extent, hazard, and an overlay-key legend once the operator is at Level 1 — there's nothing to explain yet at the glance level, so overlays don't appear until they're needed.

- **Default** — Marker only (Level 0), or marker plus overlays (Level 1).
- **Basemap offline** — Tiles are replaced with a dashed-border fallback panel — icon, a short "Basemap unavailable" title, and one line of explanation. Marker and overlay data underneath are unaffected; the degradation is contained to the map, not the whole screen (Screen 07).

## Correlator Assessment block

States the system's inferred cause and its confidence. This is the moment the product lives or dies on for trust, so it's always labelled `[SYSTEM INFERENCE]` rather than presented as settled fact — a one-to-two-line cause statement, a confidence percentage, and a ten-tick meter that doesn't rely on colour alone.

- **Default** — Cause and confidence both rendered (Screens 04, 05, 08).
- **Pending** — Cause text is replaced by shimmer bars; confidence is replaced by a spinner and a status line ("Querying outage and public hazard feeds — Ns elapsed"). No cause or confidence figure is ever shown while pending — there's no placeholder percentage to fall back on (Screen 06).

## Evidence toggle

A progressive-disclosure control that keeps Level 1 scannable by default while the full evidence trail stays one click away. The label states the source count directly ("Supporting Evidence — 3 sources"), and collapsed/expanded is stated in text, not left to a chevron icon alone.

- **Collapsed** — The default state on first arrival at Level 1 (Screen 04).
- **Expanded** — Reveals the evidence table and correlation trace beneath it, pushing the Recommended Action block further down (Screens 05, 08).

## Evidence table

Lists every source the correlator queried, always in the same order, so the verdict can be audited source by source: Telstra Outage API, VicEmergency, Bureau of Meteorology. Each row states what that source actually observed — the three aren't blended into a single summary sentence.

- **Observed** — The source was queried successfully and its observation is shown (Screen 05).
- **Not retrieved** — The source's feed was unreachable. The row gets a dashed border and an amber accent, and is explicitly labelled "NOT RETRIEVED" with a one-line reason — it's never quietly dropped from the list (Screen 08). This is the graceful-degradation behaviour the brief asks for: missing evidence gets stated, not hidden.

## Correlation trace

Answers "how was this derived" — separate from the evidence table, which lists sources rather than reasoning. A rail of six nodes: MSISDN, last known GPS, resolved suburb/postcode, outage record, public hazard, assessed cause.

- **Default** — Only appears once evidence is expanded (Screens 05, 08); it depends on that context being visible first. _(only state in use)_

## Recommended Action block

The operator's next step — always advisory, since the console doesn't execute anything itself (confirmed by the client, see the decision log). An action statement, a "hold condition" box for any caveat such as holding dispatch pending a maintenance window, and a footnote restating that the console doesn't act on the operator's behalf.

- **Default** — Rendered once the correlator has produced a verdict (Screens 04, 05, 08).
- **Not yet available** — A dashed-border placeholder reading "NOT YET AVAILABLE — no action from partial evidence." The system never guesses at a recommendation from incomplete data (Screen 06).

## Demo strip

A footer used to facilitate the scripted walkthrough. It's a facilitation aid, not part of the operational product surface, and shouldn't be treated as a component the live product needs.

- **Default** — Present across the screens used in the hero-scenario walkthrough. _(only state in use)_
