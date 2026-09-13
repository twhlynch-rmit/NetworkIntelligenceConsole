# Sprint 1 Week 3 - Acceptance Criteria and Test Scenarios

**Project:** Network Intelligence Console - Telstra Network-as-a-Product (NaaP)  
**Team:** Team 15  
**Prepared by:** Aditya Barot (Business Analyst)  
**Sprint:** Sprint 1 - Week 3  
**Task:** Finalise Acceptance Criteria & Test Scenarios  
**Status:** Sprint 2 handoff baseline  
**Prepared:** 12 September 2026

## Purpose

This is the Week 3 BA handoff for the SafeCall triage flow.

The job here is simple: take the requirements agreed during Weeks 1 and 2 and make them testable. As each part of the MVP is implemented and hardened, the team should be able to point to a requirement, show the acceptance criterion behind it, run the relevant scenario, and say whether it passed.

This is not a record of what happens to exist on `main` today. Sprint 1 is still setting the target that Sprint 2 development will build towards.

## Source basis and scope

The Telstra v2 project brief remains the main source for business scope and success criteria. Team 15's `REQUIREMENTS-BASELINE.md` is the working BA interpretation of that brief and the client discussions. The Week 2 API review adds the contract detail needed for testing.

The main sources used here are:

- Telstra `Network Intelligence Console - Capstone Project Brief v2`
- `docs/sprint-1/REQUIREMENTS-BASELINE.md`
- `docs/sprint-1/API-CONTRACT-REVIEW.md`
- `docs/sprint-1/COMMON-DATA-MODEL.md`
- `docs/PUBLIC_DATA_FEEDS.md`
- the current Team 15 OpenAPI files in `docs/openapi/`
- `OPERATOR-JOURNEY.md` and `HERO-SCENARIO-SCRIPT.md` as downstream UX references

The core Sprint 2 path is the SafeCall silent-pendant triage flow. The Mock Outage API, Device Fleet Simulator, Public Data Adapter, Root Cause Correlator and Network Intelligence Console are all part of the required solution.

At least two real Australian public-data feeds are required. VicEmergency and Bureau of Meteorology are the current working sources because they fit the hero scenario and have already been assessed technically.

The mocked Loss of Connectivity API remains stretch scope. Sprint 2 core acceptance must not depend on it.

The required location chain is:

```text
device / MSISDN
    -> last-known GPS from simulated SafeCall telemetry
    -> suburb + state + postcode
    -> Outage API lookup
```

The Outage API is not a location service. The geographic fields have to exist before the lookup is made.

## Core user story

As a SafeCall duty coordinator, I want a silent-pendant incident to be checked against the device's last-known location, Telstra-style outage information and relevant public-event data, so that I can see a defensible likely cause, the evidence behind it and what I should do next without manually checking several systems.

## Assumptions and test boundaries

A few things need to stay explicit so they do not turn into accidental requirements later:

- all SafeCall/customer telemetry used by the prototype is simulated;
- live Telstra production APIs and confidential Telstra data are out of scope;
- LOC remains stretch scope;
- the exact correlation formula, confidence calculation and action-mapping rules are Team 15 design decisions and must be documented before semantic verdict correctness is signed off;
- the brief's hero story mentions a result within 30 seconds, but the formal NFRs do not define a 30-second system SLA, so this document does not invent one;
- the brief describes SafeCall as having about 8,000 pendants, but the prototype performance target remains 1,000 simulated devices;
- public feeds must be used within their licence terms. VicEmergency attribution and BOM usage constraints still apply to the implemented solution.

## Test priority

| Priority | Meaning                                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| **P0**   | Needed to prove the raw Sprint 2 MVP end to end.                                                                |
| **P1**   | Required project behaviour, resilience or usability that can be hardened after the first end-to-end path works. |

## Acceptance criteria

### Core triage flow

**AC-01 - Use simulated SafeCall data**  
Given the prototype is running, when the SafeCall scenario is loaded, then the device records used by the workflow come from simulated SafeCall/device data, not real customer telemetry.

**AC-02 - Keep device identity clear**  
Given a simulated pendant becomes silent/offline, when the incident is processed, then the affected device can be identified and `deviceId` and `msisdn` remain separate values.

**AC-03 - Take last-known GPS from device telemetry**  
Given a silent device has a last-known GPS position, when triage starts, then that position comes from SafeCall/device simulator telemetry. LOC must not be treated as the source of GPS, suburb, state or postcode.

**AC-04 - Resolve location before calling Outage**  
Given a last-known GPS position is available, when the system prepares an Outage request, then the GPS position has already been resolved to `suburb`, `state` and `postcode`.

The resolution method is an implementation choice. Team 15 may use a suitable geographic dataset/service or a documented predefined mapping for the demo, as long as the required geographic fields are produced reliably and the implementation can be replaced later without changing the wider workflow.

**AC-05 - Support the geographic Outage lookup**  
Given valid `suburb`, `state`, `postcode` and the prototype's required correlation identifier, when `GET /outage/v0/status` is called, then the Mock Outage API returns `200` with the correlation value and the four outage collections: `current`, `past`, `near_future` and `far_future`.

**AC-06 - Handle all four Outage timing groups**  
Given a successful Outage response, when the project reads the response, then records from `current`, `past`, `near_future` and `far_future` remain distinguishable so downstream logic can tell which time window each record came from.

**AC-07 - Preserve Outage evidence without turning source cause into the verdict**  
Given an Outage record is used for correlation, when it is mapped into the project model, then the source-supported location, timing, `root_cause`, duration, description, planned status and technology remain available where supplied. `root_cause` stays source evidence and must not automatically become the final incident `likelyCause`.

**AC-08 - Use at least two real Australian public feeds**  
Given the Public Data Adapter is running normally, when the hero scenario is evaluated, then the core flow can use evidence from at least two real Australian public-data feeds.

**AC-09 - Keep evidence provenance**  
Given public, device or outage evidence is normalised, when it reaches the correlator or result model, then each evidence item retains a source identifier/label that shows where it came from.

**AC-10 - Preserve real geometry and do not invent missing geometry**  
Given a public source supplies usable point or area geometry, when it is normalised, then that geometry is retained. If the source does not provide usable geometry, the adapter must not create unsupported coordinates or polygons just to satisfy an internal schema.

**AC-11 - Take weather measurements from an observation source**  
Given temperature, wind or similar BOM measurements are used as evidence, when those values reach the correlator, then they come from an observation record that actually provides them rather than being inferred from warning text.

**AC-12 - Produce an incident-level likely cause**  
Given device state and the available outage/public evidence have been collected, when correlation completes, then the result contains a non-empty operator-facing `likelyCause` rather than exposing a raw source field as the whole incident verdict.

**AC-13 - Include confidence**  
Given a verdict has been produced, when it is returned to the console, then it includes a confidence indication. Where the current numeric contract is used, the value stays within the documented `0` to `1` range.

**AC-14 - Show the supporting evidence**  
Given a verdict is shown to the operator, when supporting evidence is viewed, then each evidence item identifies at least its source and evidence type, with any relevant available details needed to explain the conclusion.

**AC-15 - Show a recommended next action with its evidence**  
Given a verdict is available, when the operator views the result, then a recommended next action is shown and the evidence supporting that action is available from the same incident result. The action must follow the team's documented correlation/action rules.

This does not assume that the action is executed inside the console.

**AC-16 - Show the prescribed map, triage context and location chain**  
Given an incident result is available, when the operator opens the relevant view, then the console shows the device status and last-known location and provides the required geospatial context: pendant location/pins, relevant VicEmergency/BOM overlays, and an outage-area polygon/layer for the scenario.

For the hero result, the output must also preserve enough information to trace the required identity/location chain from device/MSISDN to last-known GPS and then to the resolved suburb/postcode used for the Outage lookup.

If no suitable real outage-geometry source is available, Team 15 may use documented derived or mocked outage-area geometry behind a stable interface. The source/provenance of that geometry must remain clear in the implementation and handover.

**AC-17 - Make the hero scenario replayable**  
Given the project is in a known demo state, when the scripted demo/play-scenario control is used, then the team can run the hero path from silent device through to verdict and reset it for another run without manually rebuilding the scenario data.

**AC-18 - Provide the five prescribed Outage demo states**  
Given the scenario controls are available, when outage scenarios are listed or selected, then the prototype can represent:

- regional planned maintenance window;
- metro unplanned outage, short duration;
- multi-region unplanned outage, major event;
- storm-correlated outage;
- no outages / clean state.

**AC-19 - Provide the prescribed Fleet Simulator behaviour**  
Given the acceptance configuration is loaded, when the Device Fleet Simulator is exercised, then it supports 1,000 simulated pendants across metropolitan Melbourne and regional Victoria, carries MSISDN and last-known GPS data, and can emit the prescribed heartbeat, movement, battery and signal-loss state changes at a configurable rate.

### Contract and error behaviour

**AC-20 - Validate mandatory Outage inputs**  
Given an Outage lookup is attempted, when `suburb`, `state`, `postcode` or the prototype-required `Correlation-Id` is missing, then the request is rejected through the active project contract.

For the prototype, `state` uses the v2 brief value set: `QLD`, `NSW`, `ACT`, `VIC`, `TAS`, `SA`, `WA`, `NT`, `NAT`.

The test must not claim that a four-digit postcode pattern is schema-enforced unless the active contract actually enforces that pattern.

**AC-21 - Carry the Outage correlation identifier**  
Given an Outage lookup is made, when the request succeeds, then the request carries `Correlation-Id` and the corresponding correlation value is retained/exposed with the successful transaction so the lookup can be traced across that API boundary.

**AC-22 - Keep API failure separate from 'no outage'**  
Given the Outage service returns a defined error such as `400`, `500` or `503`, when the consuming service handles it, then the failure is distinguishable from a successful `200` response containing no outages.

A failed request must not be presented as proof that no outage exists.

**AC-23 - Normalise source time values for correlation**  
Given device, outage, LOC (if implemented) or public-source timestamps use different source formats, when they are brought into the internal correlation model, then they are converted into a consistent internal time representation without changing the meaning of the original source time.

## Non-functional acceptance criteria

**NFR-AC-01 - Start the local stack within five minutes**  
Given the documented prerequisites are installed, when the full local stack is started through Docker Compose using the documented process, then the required local services reach a usable state in under five minutes.

**NFR-AC-02 - Handle 1,000 simulated devices without noticeable lag**  
Given 1,000 simulated devices are active, when the operator uses the console and runs the core scenario, then the application does not crash, lose the core update path or show obvious load-related stalls.

The test record must capture observed response/update timings and any failed or dropped updates. The source requirement does not define a numeric latency threshold, so one must not be invented here.

**NFR-AC-03 - Degrade gracefully when one public feed is unavailable**  
Given one public-data feed is unavailable and enough other evidence remains, when the incident is correlated, then the system still returns a useful result and the unavailable feed is not shown as though it returned evidence.

**NFR-AC-04 - Make the scenario understandable within five minutes**  
Given a first-time viewer is shown the scripted demo, when the walkthrough finishes, then it completes within five minutes and the viewer can explain:

- the problem being investigated;
- that the console combines device/network/public evidence;
- what action the console recommends in the demonstrated incident.

**NFR-AC-05 - Make the recommended action findable within ten seconds**  
Given a duty-coordinator proxy is shown a completed result, when they inspect the screen, then they can identify the recommended next action within ten seconds.

**NFR-AC-06 - Keep the verdict explainable**  
Given a verdict is shown, when the operator or demo viewer inspects it, then the likely cause, confidence, evidence and recommended action can be connected to one another without relying on an unexplained black-box result.

**NFR-AC-07 - Expose health checks**  
Given an implemented service is running, when its documented health endpoint is called, then that service reports healthy when its checked dependencies are available. Where Redis or PostgreSQL is part of the health check, a failed checked dependency must result in an unhealthy/degraded response rather than a false healthy response.

**NFR-AC-08 - Use structured logging**  
Given a backend service emits an operational log entry, when the entry is inspected, then it follows the current shared logging shape with `timestamp`, `level`, `service` and `message`, plus structured context where relevant.

**NFR-AC-09 - Apply basic input validation**  
Given an API receives input that breaks a mandatory field or documented validation rule, when the request is processed, then the service rejects or reports the invalid input through its defined error behaviour.

## Hero scenario

### TS-01 - SafeCall silent-pendant triage

**Priority:** P0  
**Covers:** AC-01 to AC-17, NFR-AC-06

**Preconditions**

- The mandatory services needed for the core flow are available.
- A reproducible SafeCall scenario is loaded with a known device, MSISDN and last-known GPS position.
- The hero evidence fixture contains a planned network-maintenance/outage record, relevant VicEmergency hazard evidence and BOM observation evidence.
- At least two real public-data feeds are configured.
- A specific expected cause/confidence/action is only asserted if the current correlation/action rules have been documented.

| Step | Action                                | Expected result                                                                                        |
| ---: | ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
|    1 | Start the scripted SafeCall scenario. | A simulated pendant enters the intended silent/offline state.                                          |
|    2 | Process the silent-device event.      | The affected device is identified and `deviceId` and `msisdn` remain distinct.                         |
|    3 | Read the last-known location.         | GPS comes from simulated SafeCall/device telemetry.                                                    |
|    4 | Prepare the Outage lookup.            | GPS has been resolved to suburb, state and postcode.                                                   |
|    5 | Query the Mock Outage API.            | A valid Outage response is returned for the resolved location.                                         |
|    6 | Collect public evidence.              | Evidence can be obtained from at least two real Australian public sources.                             |
|    7 | Run correlation.                      | Device, outage and public evidence are assessed together. Outage `root_cause` remains source evidence. |
|    8 | Produce the result.                   | The result contains likely cause, confidence, source-tagged evidence and a recommended next action.    |
|    9 | Open the console result.              | Device status, last-known location, risk/geographic context and the map are available.                 |
|   10 | Inspect the reasoning.                | The evidence shown is enough to explain why the result was reached.                                    |
|   11 | Reset and run it again.               | The scenario can be replayed without manually rebuilding its data.                                     |

**Pass condition:** The path completes with no missing P0 result fields and no break in the identity, location or evidence chain.

The brief's example values, including device `SC-P-4821` and confidence `0.91`, are useful hero-scenario fixture values rather than universal requirements.

For the hero test, the expected recommended action should come from the team's documented correlation/action rules rather than from a hard-coded example value.

## Failure and degraded scenarios

### TS-02 - One public feed is unavailable

**Priority:** P1  
**Covers:** NFR-AC-03, AC-09, AC-14

**Setup:** Make one configured public feed unavailable while leaving enough other evidence for correlation.

**Expected result:** The triage flow still returns a useful result. The missing feed is not represented as successful evidence, and the operator can still see which sources were actually available.

### TS-03 - Clean/no-outage state

**Priority:** P1  
**Covers:** AC-05, AC-07, AC-18

**Setup:** Activate the clean/no-outage scenario for the device location.

**Expected result:** The Outage lookup succeeds but returns no matching outage evidence. The correlator does not invent a network outage or reuse an unrelated `root_cause`.

### TS-04 - Invalid Outage lookup

**Priority:** P1  
**Covers:** AC-20, AC-21, AC-22, NFR-AC-09

**Setup:** Call the Outage status operation with a missing required geographic value or a value rejected by the active project contract.

**Expected result:** The request is rejected through the defined validation/error response. The failure is not treated as a successful clean/no-outage result.

### TS-05 - Outage service unavailable

**Priority:** P1  
**Covers:** AC-22

**Setup:** Make the Mock Outage API surface a `503` service-unavailable state.

**Expected result:** The consuming path can tell the difference between an unavailable service and a valid `200` response.

This does not create a new requirement that a final verdict must always be produced when the Outage API itself is unavailable. The agreed graceful-degradation requirement specifically covers a public-feed failure.

### TS-06 - Source cause conflicts with wider evidence

**Priority:** P1  
**Covers:** AC-07, AC-12, AC-14, NFR-AC-06

**Setup:** Provide an Outage record whose `root_cause` is only one part of the available evidence and include device/public evidence that changes the wider incident interpretation.

**Expected result:** The final likely cause comes from the correlator's evidence set. The Outage `root_cause` stays visible as source evidence and is not blindly copied into `likelyCause`.

## Mandatory service checks

| Test                              | Priority | What is checked                                                                                                                                       | Pass condition                                                                                                                                               |
| --------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **TS-07 - Fleet Simulator**       | P0       | 1,000 pendants across metro/regional Victoria, MSISDN/GPS, prescribed state changes and replayable scenarios.                                         | The simulator provides the identity, location and event behaviour needed by the core scenario.                                                               |
| **TS-08 - Mock Outage lookup**    | P0       | `GET /outage/v0/status` using suburb, state, postcode and `Correlation-Id`; response groups and source time values are mapped into the project model. | Valid request returns the active project success shape, the correlation value is retained, and source times remain semantically correct after normalisation. |
| **TS-09 - Five Outage scenarios** | P0       | The five brief-defined outage states can be selected.                                                                                                 | Each scenario is available and produces its intended outage state.                                                                                           |
| **TS-10 - Public Data Adapter**   | P0       | At least two real Australian feeds can be ingested/normalised.                                                                                        | Both configured sources can contribute valid records to the project data path.                                                                               |
| **TS-11 - Correlator result**     | P0       | Likely cause, confidence, evidence and recommended action are produced.                                                                               | All four concepts are present for the hero scenario. Semantic correctness is only signed off once the correlation/action rules are documented.               |
| **TS-12 - Console result view**   | P0       | Device state, last-known location, pendant pin, relevant VicEmergency/BOM overlays, outage-area layer, evidence and recommended action are presented. | The core incident and the evidence behind it can be understood from the operator view without manually checking backend data.                                |
| **TS-13 - Health endpoints**      | P1       | Planned service health checks follow the documented convention.                                                                                       | Healthy dependencies report healthy; checked dependency failure is not hidden.                                                                               |

The Results API remains Team 15's current frontend boundary. It should be tested as part of the implemented path where the architecture uses it, but it is a Team 15 service decision rather than a separately prescribed Telstra service.

## Non-functional test scenarios

| Test                                       | Priority | Procedure                                                                                                                         | Pass condition                                                                                                                     |
| ------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **TS-14 - Docker Compose startup**         | P1       | Start the documented local stack from a clean local setup and time it.                                                            | Required services are usable in under 5 minutes.                                                                                   |
| **TS-15 - 1,000-device load**              | P1       | Run 1,000 simulated devices and exercise the core flow. Record timings, failures and dropped updates.                             | No load-related crash or broken core update path. Observed lag is recorded against the source's qualitative requirement.           |
| **TS-16 - Five-minute first-viewer check** | P1       | Run the scripted demo for a first-time viewer, then ask them to explain the problem, evidence combination and recommended action. | Demo finishes within 5 minutes and the viewer correctly explains those points.                                                     |
| **TS-17 - Ten-second action check**        | P1       | Show a completed incident to a duty-coordinator proxy and time how long it takes them to find the recommended action.             | Action is identified within 10 seconds.                                                                                            |
| **TS-18 - Structured logging check**       | P1       | Exercise normal and degraded service behaviour and inspect service output.                                                        | Logging follows the project's structured convention and records meaningful state.                                                  |
| **TS-19 - Explainability check**           | P0       | Inspect a completed hero verdict.                                                                                                 | Likely cause, confidence and recommended action can be traced back to source-tagged evidence and the documented correlation rules. |

## Requirements traceability matrix

### Functional requirements

| Requirement                                                   | Acceptance criteria                   | Test scenarios                    | Priority |
| ------------------------------------------------------------- | ------------------------------------- | --------------------------------- | -------- |
| **FR-01** Simulated SafeCall data                             | AC-01 to AC-03, AC-19                 | TS-01, TS-07                      | P0       |
| **FR-02** Standalone Mock Outage API                          | AC-05 to AC-07, AC-18, AC-20 to AC-22 | TS-03 to TS-05, TS-08, TS-09      | P0       |
| **FR-03** At least two real Australian public feeds           | AC-08 to AC-11                        | TS-01, TS-02, TS-10               | P0       |
| **FR-04** Combine device, outage and public-event information | AC-04, AC-07 to AC-12                 | TS-01, TS-06, TS-11               | P0       |
| **FR-05** Correlator likely-cause result                      | AC-07, AC-12                          | TS-01, TS-06, TS-11, TS-19        | P0       |
| **FR-06** Confidence indication                               | AC-13                                 | TS-01, TS-11, TS-19               | P0       |
| **FR-07** Supporting evidence                                 | AC-09, AC-14                          | TS-01, TS-02, TS-06, TS-19        | P0       |
| **FR-08** Recommended next action                             | AC-15                                 | TS-01, TS-11, TS-12, TS-17, TS-19 | P0       |
| **FR-09** Device status and last-known location               | AC-02 to AC-04, AC-16, AC-19          | TS-01, TS-07, TS-12               | P0       |
| **FR-10** Geographic and risk context                         | AC-10, AC-16                          | TS-01, TS-10, TS-12               | P0       |
| **FR-11** Geospatial/map view                                 | AC-16                                 | TS-01, TS-12                      | P0       |
| **FR-12** Repeatable scripted demonstration                   | AC-17, AC-18                          | TS-01, TS-09, TS-16               | P0       |

### Week 2 API requirements

| Requirement                                                   | Acceptance criteria / test coverage          | Status       |
| ------------------------------------------------------------- | -------------------------------------------- | ------------ |
| **API-REQ-01** Outage lookup inputs                           | AC-04, AC-05, AC-20; TS-01, TS-04, TS-08     | Core         |
| **API-REQ-02** Geographic resolution                          | AC-03, AC-04; TS-01, TS-07                   | Core         |
| **API-REQ-03** Outage response groups                         | AC-06; TS-08                                 | Core         |
| **API-REQ-04** Preserve outage evidence                       | AC-06, AC-07, AC-14; TS-01, TS-06            | Core         |
| **API-REQ-05** Correlation identifiers                        | AC-20, AC-21; TS-04, TS-08                   | Core         |
| **API-REQ-06** Request validation                             | AC-20, NFR-AC-09; TS-04                      | Core         |
| **API-REQ-07** Error handling                                 | AC-22; TS-04, TS-05                          | Core         |
| **API-REQ-08 to API-REQ-10** LOC subscription/event behaviour | Not part of the Sprint 2 core acceptance set | Stretch      |
| **API-REQ-11** Identifier separation                          | AC-02; TS-01, TS-07                          | Core concept |
| **API-REQ-12** Location source                                | AC-03; TS-01, TS-07                          | Core         |
| **API-REQ-13** Time normalisation                             | AC-23; TS-01, TS-08                          | Core         |

### Non-functional requirements

| Requirement                                                  | Acceptance criterion | Test scenario | Priority |
| ------------------------------------------------------------ | -------------------- | ------------- | -------- |
| Docker Compose startup under 5 minutes                       | NFR-AC-01            | TS-14         | P1       |
| Useful result when one public feed is unavailable            | NFR-AC-03            | TS-02         | P1       |
| 1,000 simulated devices without noticeable lag               | NFR-AC-02            | TS-15         | P1       |
| First-time viewer understands the scenario within 5 minutes  | NFR-AC-04            | TS-16         | P1       |
| Operator identifies the recommended action within 10 seconds | NFR-AC-05            | TS-17         | P1       |
| Explainable correlation result                               | NFR-AC-06            | TS-19         | P0       |
| Health checks                                                | NFR-AC-07            | TS-13         | P1       |
| Structured logging                                           | NFR-AC-08            | TS-18         | P1       |
| Basic input validation                                       | NFR-AC-09            | TS-04         | P1       |

## Edge cases

These cases are worth keeping visible because they affect the core flow even though they are not separate features.

| Edge case                                                  | Expected behaviour                                                                                               |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| A silent device has no valid last-known GPS.               | Do not fabricate a location and do not issue an Outage lookup using invented suburb/state/postcode values.       |
| A public-data record has no usable coordinates or polygon. | Preserve the source truth. Do not manufacture geometry simply to make the record fit the map or internal schema. |

## Planner checklist coverage

| Planner item                                                     | Covered by                                        |
| ---------------------------------------------------------------- | ------------------------------------------------- |
| Review the current confirmed requirements                        | Source basis, assumptions and traceability matrix |
| Create testable acceptance criteria for the core triage workflow | AC-01 to AC-23                                    |
| Define the hero-scenario happy path                              | TS-01                                             |
| Define relevant failure-state scenarios                          | TS-02 to TS-06 plus the documented edge cases     |
| Cover mandatory services                                         | AC-05, AC-08, AC-12 to AC-19; TS-07 to TS-13      |
| Cover agreed non-functional requirements                         | NFR-AC-01 to NFR-AC-09; TS-14 to TS-19            |
| Link requirements to acceptance criteria/test scenarios          | Traceability matrix                               |
| Create the requirements traceability matrix                      | Functional, API and NFR tables                    |
| Prioritise the acceptance-test scenarios                         | P0/P1 priorities throughout                       |

The Planner currently repeats the prioritisation item. The same priority scheme covers both entries.

## Handoff note

For Sprint 2, the P0 scenarios are the minimum set for proving the raw end-to-end MVP. P1 scenarios are still real project requirements, but most sit in resilience, performance, infrastructure or usability hardening and can be completed once the first full path is working.

LOC stays outside the core acceptance set unless the team deliberately moves it into scope.

If a requirement or implementation contract changes later, update the affected acceptance criterion and traceability row at the same time so the handoff stays consistent. Correlation and action rules should remain documented alongside the implementation so the expected hero verdict stays testable.
