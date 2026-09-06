# Week 1 — Operator Journey & Dashboard Information Hierarchy

**Network Intelligence Console — SafeCall Duress**

Prepared by: Abin Siju (UX Designer, Team 15)
Sprint 1, Week 1 — Design/Product track

_Sources: Telstra RMIT Capstone Brief v2, Sprint 1 Requirements Baseline (Aditya Barot), Outage API v1.1.0, Loss of Connectivity API v0.8.0._

_Labelling key: CONFIRMED (stated in brief/spec/BA doc) · INFERRED · ASSUMPTION · NEEDS VALIDATION_

---

## 1. Operator Journey

### Before the operator sees anything (system-side)

Pendant goes silent → LOC API webhook fires (`msisdn`, `lossOfConnectReason`, `eventTime`) → system resolves last-known GPS/suburb/postcode from SafeCall telemetry → queries Outage API → checks public data feeds → correlator produces a verdict. **CONFIRMED**, FR-04/FR-05 (Sprint 1 Requirements Baseline).

This happens automatically. The operator does not manually walk through each check — that manual cross-system walkthrough is the exact problem the product exists to remove (brief, Section 2).

### What the operator actually experiences

| Stage                                    | What happens                                                                                                     | Information shown                                                 | Traces to                         |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------- |
| 1. Escalation appears                    | A new escalation surfaces (queue or single-incident view — see open question)                                    | Device/worker identity, time silent, at-a-glance urgency          | FR-09                             |
| 2. Operator opens it                     | Sees the finished verdict as one unit — cause, confidence, location, action together, not assembled step by step | Likely cause, confidence, last-known location, recommended action | FR-05, FR-06, FR-08, FR-09, FR-10 |
| 3. Operator inspects evidence (optional) | Expands into the reasoning behind the verdict                                                                    | Evidence list, source-tagged (outage record, VicEmergency, BOM)   | FR-07                             |
| 4. Operator decides / acts               | Escalates, holds, or dismisses — mechanism still unconfirmed                                                     | Recommended action, any time-conditional caveat                   | FR-08                             |

Map and general risk/geo context (FR-10, FR-11) are persistent, always-visible context rather than a discrete stage in this flow.

---

## 2. Dashboard Information Hierarchy

### Level 0 — Glance (escalation list/queue item, unopened)

For triage across multiple escalations without opening any one of them:

- Device / assigned worker
- Time since silent
- Urgency indicator (non-colour-only signal required)
- Likely cause, short label only (not full verdict)

_Depends on the queue-vs-single-incident open question below — if answered "single incident only," this level does not apply._

### Level 1 — Escalation opened (core screen)

The complete verdict, visible without further clicks — this is the "within seconds" screen the hero scenario describes:

- Likely cause, in plain operator language (not raw API enum values)
- Confidence — paired with a qualitative label, not numeric-only
- Last-known location (suburb/postcode; ideally reflected on the persistent map)
- Recommended action, with any time-conditional caveat surfaced directly
- Visually distinct grouping of FACT / SYSTEM INFERENCE / RECOMMENDATION

### Level 2 — Evidence, expanded (progressive disclosure)

Opened only if the coordinator wants to verify the system's reasoning:

- Each evidence item, source-tagged: outage record (`root_cause`, `is_planned`, `end_timestamp`), VicEmergency event (type, distance, severity), BOM observation (temperature, wind)

### Persistent (not tied to a single escalation)

- Map: pendant pins + Telstra outage polygons + VicEmergency/BOM overlays (FR-11)
- General fleet/risk overlay context (FR-10)

---

## 3. Open Questions — Unconfirmed Operator Behaviours

Required for client review per Week 1 acceptance criteria.

| #   | Question                                                                                                                               | Why it matters                                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | Does the console handle multiple simultaneous escalations (a queue), or is single-incident investigation the correct scope?            | Determines whether the Level 0 glance view exists at all             |
| 2   | Is the recommended action something the operator clicks to execute, or purely advisory text they act on outside the system?            | Determines whether the Level 1 action block is interactive or static |
| 3   | Does "alert the on-call safety coordinator" require an in-console notification mechanism, or is it outside this system's scope?        | Determines whether a notification-sent state needs to be designed    |
| 4   | Does an escalation have a tracked lifecycle/status (new → investigating → resolved), or does the console only ever show current state? | Affects both the journey's end state and the data model              |

---

## 4. Assumptions Carried Into Week 2

- Queue view is designed for by default (Level 0 included) since it is the safer assumption to wireframe against; will be removed if Q1 is answered otherwise.
- Evidence is presented as an expandable panel (progressive disclosure) rather than always-visible, to protect the "10-second recommended action" success criterion — **DESIGN DECISION**, not confirmed by brief or BA doc.
