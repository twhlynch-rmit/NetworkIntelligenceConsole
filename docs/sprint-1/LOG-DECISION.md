# Telstra Network Intelligence Console — Design Decision & Assumption Log Update

_Week 3 — Sprint 1 (Design & Bootstrap)_

_Source: Paul Atkins (Telstra) + Winsy Lok — email to Rishi Verma, Winsy Lok, Syed Raees Hussain, cc Alessio Bonti, 28 August 2026, "Re: RMIT Capstone NaaP Team 15 - Sprint 1 UX Clarifications."_

## Governing Principle (client-stated)

The console is a diagnostic / insight tool, not an alerting or incident-management system. It never sends the duress alert itself and never replaces SafeCall's own escalation process. It is expected to draw the operator's attention to new insights and to track operator interaction with them. This principle is the basis for every decision below.

## Decision Log — updated entries

### Decision 1: Advisory-only recommended action

| Field                   | Content                                                                                                                                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Context                 | The Recommended Action block needed to be either advisory text or an executable control (e.g. a dispatch button).                                                                                                                 |
| Evidence                | "Advisory, you have it right. The console tells the operator the likely cause and the recommended next step, and the operator acts on it outside the system. The console does not execute the action or handle the alert itself." |
| Alternatives considered | Executable action with confirmation step (rejected — outside the console's stated diagnostic/insight identity).                                                                                                                   |
| Decision made           | Advisory-only recommended action, no executable control. No design change required — current UI (static text block, footnote stating the console does not execute the action) already matches.                                    |
| Reason                  | Matches the client's explicit statement of the product's identity as a diagnostic tool, not an incident-management system.                                                                                                        |
| Trade-offs              | None — this was already the working design.                                                                                                                                                                                       |
| Impact on future design | None. Confirmed, not revised.                                                                                                                                                                                                     |
| Validation required     | None — client-confirmed in writing.                                                                                                                                                                                               |
| Status                  | **CONFIRMED** (was previously logged as an assumption; now a client-confirmed decision)                                                                                                                                           |

### Decision 2: Single-incident scope — revised, not simply confirmed

| Field                   | Content                                                                                                                                                                                                                                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Context                 | Sprint 1 was designed and built around a single active escalation, with the open question of whether SafeCall needs a queue/list of concurrent escalations.                                                                                                                                                                              |
| Evidence                | "One at a time is fine for this term, but design as if many are coming... we would love the data model and UI to assume a list or queue of active insights even if you only build out the single investigation view properly for now. Just try not to hard code a 'one active incident' assumption that you would have to unpick later." |
| Alternatives considered | (a) Keep the current single-incident-only data model as-is. (b) Build a full queue UI now.                                                                                                                                                                                                                                               |
| Decision made           | UI: single-incident view remains as built for Sprint 1 (no queue UI required this term). Data model: escalations must be represented as a collection/list from the start, not a singleton, so a queue can be added later without a data-model rework.                                                                                    |
| Reason                  | Client explicitly wants to avoid a costly later rework of the data layer, while agreeing the Sprint 1 UI scope is correctly single-incident for now.                                                                                                                                                                                     |
| Trade-offs              | Slightly more upfront data-model work now (collection instead of singleton) in exchange for avoiding a breaking change later.                                                                                                                                                                                                            |
| Impact on future design | Level 0's "Active Escalations" panel is a natural fit for later queue expansion (Sprint 3) since it already reads from a collection, even though it currently renders one row.                                                                                                                                                           |
| Validation required     | Confirm with Aditya Barot that the correlator/data pipeline already models escalations as a collection, not a singleton, before Sprint 1 close.                                                                                                                                                                                          |
| Status                  | **REVISED** — was logged as a flat "single-incident scope" decision; now correctly scoped as single-incident UI + collection-shaped data model                                                                                                                                                                                           |

## New Requirements Introduced (client-initiated, not previously scoped)

These were not among the three questions the team asked. Paul introduced them unprompted. They are explicitly Sprint 3 (Refine MVP) scope per the client's own sequencing instruction quoted below — not to be designed or built during Sprint 1/2.

### New Requirement 1: Operator alerting (toast/banner)

| Field            | Content                                                                                                                                                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence         | "Alerting the operator (the console's own user) that a new high priority insight needs attention, yes please, that is good UX. A toast or banner with an 'Acknowledge' button so it cannot be silently missed would genuinely make us happy."  |
| Scope note       | Notifying the third-party safety coordinator remains a recommended action in the UI copy only — the console itself does not send that notification. An outbound SMS/email to the coordinator is explicitly a stretch/bonus, not a requirement. |
| Design status    | **NOT YET DESIGNED** — no toast/banner/acknowledge pattern exists in the current 8 screens.                                                                                                                                                    |
| Sprint placement | Sprint 3 (Refine MVP), per client's explicit sequencing instruction below.                                                                                                                                                                     |

### New Requirement 2: Escalation lifecycle with timestamps

| Field                 | Content                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence              | "We would like to see a simple lifecycle of New, then Acknowledged, then Actioned... Where this gets really valuable for us as the customer is a progress or status stepper on the front end with a timestamp at each stage. That lets us capture how long it takes to understand and act on an event, which is exactly the kind of metric that justifies the tool. Keep the states simple, the timestamps are the gold." |
| States                | New (console surfaced it) → Acknowledged (operator saw/acknowledged, e.g. via the toast) → Actioned (operator marks it done after acting externally).                                                                                                                                                                                                                                                                     |
| Business significance | This is the client's stated ROI metric for the tool — treat as high priority within its assigned sprint, not a cosmetic nice-to-have.                                                                                                                                                                                                                                                                                     |
| Design status         | **NOT YET DESIGNED** — no status stepper or timestamp display exists in the current 8 screens.                                                                                                                                                                                                                                                                                                                            |
| Sprint placement      | Sprint 3 (Refine MVP), per client's explicit sequencing instruction below.                                                                                                                                                                                                                                                                                                                                                |

## Client-Set Sprint Sequencing (explicit instruction — do not skip)

> "None of the 'nice to have' bits above should come at the expense of the core, which is the correlator, the map, and a clean end to end hero scenario. Get that solid first, then layer these in during Refine MVP. A polished core beats a broad but shallow build every time."

**Action for Week 3:** do not begin designing the toast/acknowledge pattern or the status stepper now. Confirm the current data model does not foreclose them later (see Decision 2 validation step), and move on.

## Assumption Log — status changes

| Assumption                                 | Previous status                                                               | New status                                                                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Single-incident scope (not a queue)        | OPEN (had drifted into being called a "locked decision" without confirmation) | **VALIDATED** — with revision (see Decision 2). Superseded by the collection-shaped data model requirement.             |
| Advisory-only recommended action           | OPEN (had drifted into being called a "locked decision" without confirmation) | **VALIDATED** — no revision (see Decision 1).                                                                           |
| Escalation lifecycle / close-out behaviour | OPEN                                                                          | **VALIDATED** — client wants New → Acknowledged → Actioned with timestamps (see New Requirement 2). Scoped to Sprint 3. |
