# Sprint 1 Requirements Baseline

**Project:** Network Intelligence Console — Telstra Network-as-a-Product (NaaP)  
**Team:** Team 15  
**Prepared by:** Aditya Barot (Business Analyst)  
**Prepared:** 21 August 2026  
**Last updated:** 23 August 2026  
**Status:** For Telstra review and confirmation  

## 1. Purpose

This document captures Team 15’s current understanding of the problem, the users, the proposed Sprint 2 core feature, and the main requirements for the Network Intelligence Console.

This baseline is based on the Telstra v2 project brief, the 10 and 17 August client discussions, and Team 15’s Sprint 1 plan.

The main aim is to confirm that our interpretation is correct before we move further into Sprint 2 implementation.

## 2. Business problem

SafeCall uses GPS-enabled duress pendants for people working or living in higher-risk situations.

When one of these pendants stops reporting, the person handling the incident needs to work out what is most likely happening. The issue could be with the device itself, the Telstra network, or an external event such as a bushfire, severe weather, flooding, or a power-related incident.

At the moment, that type of investigation can mean checking several systems and sources separately. That takes time and can make it harder to explain why a particular action was taken.

The Network Intelligence Console is intended to bring the relevant information together and give the operator one clear view of the likely cause, the evidence behind it, and what they should do next.

## 3. Target users

### Primary users

The main users are SafeCall duty coordinators and service-desk operators who need to investigate a silent or abnormal pendant.

They need to be able to understand the situation quickly and decide whether the issue is likely to be:

- device-related
- network-related
- connected to an external hazard

The SafeCall use case includes people such as home-visit nurses, lone workers, regional maintenance crews, domestic-violence safety-alert users, and workers in remote or hazardous areas.

### Secondary users

The console will also be used by Telstra Enterprise staff as a demonstration tool.

That means the product has to work for two different situations: it needs to make sense to an operator handling an incident, but it also needs to be easy to explain in a short customer demo.

## 4. Proposed Sprint 2 core feature

For Sprint 2, Team 15 proposes that the main feature should be the end-to-end SafeCall silent-pendant triage flow.

A simple version of that flow is:

1. A simulated SafeCall pendant stops reporting.
2. The system identifies the affected device and its last known location.
3. The system checks the mocked Telstra outage information for that area.
4. It checks relevant Australian public-data sources for events that may explain the issue.
5. The correlator combines the available evidence.
6. The console shows the most likely cause, a confidence level, the evidence used, and a recommended next action.

The point of the feature is not just to show several data sources on one screen. It is to turn those sources into a useful answer for the operator.

## 5. Functional requirements

| ID | Requirement |
|---|---|
| FR-01 | The system must use simulated SafeCall pendant/device data rather than real customer telemetry. |
| FR-02 | The system must include a standalone mocked Telstra Outage API based on the supplied API contract. |
| FR-03 | The system must use at least two real Australian public-data feeds. |
| FR-04 | The system must combine device, outage, and public-event information as part of the incident investigation. |
| FR-05 | The Root Cause Correlator must produce a likely-cause result for the incident. |
| FR-06 | The result must include a confidence indication. |
| FR-07 | The result must show the evidence that contributed to the conclusion. |
| FR-08 | The console must give the operator a recommended next action. |
| FR-09 | The dashboard must show the device status and last known location. |
| FR-10 | The dashboard must show relevant geographic and risk context. |
| FR-11 | The solution must include a geospatial/map view. |
| FR-12 | The core scenario must be repeatable as a scripted demonstration. |

Detailed API fields, validation rules, error responses, and data mappings will be documented separately during the API contract review.

## 6. Non-functional requirements

The current baseline also includes the following quality requirements:

- the solution is a project prototype and is not intended for production use
- the full local stack should be able to start through Docker Compose within five minutes
- the system should continue to return a useful result if one public-data feed is unavailable, provided enough evidence remains
- the console should handle 1,000 simulated devices without noticeable lag
- a first-time viewer should be able to understand the main scenario within five minutes
- an operator should be able to identify the recommended next action within ten seconds of seeing the result
- the correlation result should be explainable, including the evidence and confidence behind it
- services should expose basic health checks and use structured logging
- basic input validation is required

## 7. Scope

### In scope

The current core scope includes:

- Device Fleet Simulator
- mocked Telstra Outage API
- at least two Australian public-data feeds
- Public Data Adapter
- Root Cause Correlator
- Network Intelligence Console dashboard
- map/geospatial view
- likely cause, confidence, supporting evidence, and recommended action
- Docker Compose local deployment
- a repeatable SafeCall demo scenario
- supporting API, architecture, setup, and handover documentation

### Stretch scope

These items should only be attempted once the main workflow is working and stable:

- mocked Loss of Connectivity API
- authentication and authorisation
- time-travel or replay features
- additional metrics and observability features
- Kubernetes deployment
- other secondary features that are not needed for the core scenario

### Out of scope

The project prototype will not use:

- live Telstra production APIs
- confidential Telstra implementation details
- real SafeCall customer data
- real production incident workflows
- production deployment

## 8. Assumptions

At this stage, Team 15 is working with the following assumptions:

1. SafeCall is a fictional reference customer and all pendant data will be simulated.
2. The Loss of Connectivity API is not required for the Sprint 2 core feature unless Telstra asks us to move it into core scope.
3. VicEmergency and Bureau of Meteorology are strong candidates for the public-data feeds, but the final choice still depends on technical feasibility and suitability.
4. The exact correlation logic is a Team 15 design decision, as long as the result is explainable and supported by evidence.
5. Any differences identified between the Telstra brief and the supplied OpenAPI files will be raised with Telstra for clarification before implementation.

## 9. Items for Telstra confirmation

We would like to confirm the following before Sprint 2 implementation progresses further:

1. Is the SafeCall silent-pendant triage flow described in Section 4 the right single core feature for Sprint 2?
2. Are VicEmergency and Bureau of Meteorology appropriate choices for the two public-data feeds, subject to the team confirming technical feasibility?
3. Should the Sprint 2 demo explicitly show the full location chain from the device/network identifier through to last known GPS and suburb/postcode?
4. Is the current split between core scope, stretch scope, and out-of-scope work correct?
5. Is there any performance target Telstra expects beyond the existing requirement to handle 1,000 simulated devices without noticeable lag?

Once these points are confirmed, Team 15 can treat this document as the agreed starting baseline for Sprint 2.