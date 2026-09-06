# Sprint 1 Requirements Baseline

**Project:** Network Intelligence Console — Telstra Network-as-a-Product (NaaP)  
**Team:** Team 15  
**Prepared by:** Aditya Barot (Business Analyst)  
**Prepared:** 21 August 2026  
**Last updated:** 26 August 2026  
**Status:** Active requirements baseline for Sprint 2 implementation

## 1. Purpose

This document captures Team 15’s current understanding of the business problem, target users, Sprint 2 core feature, and main requirements for the Network Intelligence Console.

This baseline is based on the Telstra v2 project brief, the 10, 17 and 24 August client discussions, and Team 15’s Sprint 1 plan.

The main aim is to provide Team 15 with a clear working requirements baseline for Sprint 2 implementation while keeping the product, UX and technical work aligned to the agreed project direction.

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

SafeCall's pendant users include people such as home-visit nurses, community health workers, lone workers, regional maintenance and utilities crews, domestic-violence safety-alert users, and workers or contractors in remote or hazardous areas.

### Secondary users

The console will also be used by Telstra Enterprise staff as a demonstration tool.

That means the product has to work for two different situations: it needs to make sense to an operator handling an incident, but it also needs to be easy to explain in a short customer demo.

## 4. Sprint 2 core feature

For Sprint 2, Team 15 will use the end-to-end SafeCall silent-pendant triage flow as the main core feature.

A simple version of that flow is:

1. A simulated SafeCall pendant stops reporting.
2. The system identifies the affected device and its last-known location.
3. The system maps the last-known GPS position to the suburb, state and postcode required to query the mocked Telstra Outage API.
4. The system checks the mocked Telstra outage information for that area.
5. It checks relevant Australian public-data sources for events that may explain the issue.
6. The Root Cause Correlator combines the available evidence.
7. The console shows the most likely cause, a confidence indication, the supporting evidence, and a recommended next action.

The required location composition is:

**MSISDN → last-known GPS → suburb/postcode**

The point of the feature is not just to show several data sources on one screen. It is to turn those sources into a useful and explainable answer for the operator.

The mocked Loss of Connectivity API is not required for this core Sprint 2 flow and remains stretch scope.

## 5. Functional requirements

| ID    | Requirement                                                                                                                                                                              |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-01 | The system must use simulated SafeCall pendant/device data rather than real customer telemetry.                                                                                          |
| FR-02 | The system must include a standalone mocked Telstra Outage API based on the supplied API contract.                                                                                       |
| FR-03 | The system must use at least two real Australian public-data feeds.                                                                                                                      |
| FR-04 | The system must combine device, outage, and public-event information as part of the incident investigation.                                                                              |
| FR-05 | The Root Cause Correlator must produce a likely-cause result for the incident.                                                                                                           |
| FR-06 | The result must include a confidence indication.                                                                                                                                         |
| FR-07 | The result must show the evidence that contributed to the conclusion.                                                                                                                    |
| FR-08 | The console must give the operator a recommended next action.                                                                                                                            |
| FR-09 | The dashboard must show the device status and last-known location, including the required MSISDN → last-known GPS → suburb/postcode location composition where relevant to the incident. |
| FR-10 | The dashboard must show relevant geographic and risk context.                                                                                                                            |
| FR-11 | The solution must include a geospatial/map view.                                                                                                                                         |
| FR-12 | The core scenario must be repeatable as a scripted demonstration.                                                                                                                        |

VicEmergency and Bureau of Meteorology remain the current starting points for the real public-data feeds because they directly support the SafeCall hero scenario. Final implementation remains subject to the Week 2 technical feasibility assessment.

If an additional desired data source cannot be accessed—for example, a suitable distribution-level power-outage source—the team may document the unavailable source and use a mock or substitute implementation behind a defined interface. This does not replace the requirement for at least two real Australian public-data feeds.

Detailed API fields, validation rules, error responses, authentication requirements, and data mappings will be documented separately during the Week 2 API contract review.

Backend service contracts should be documented through clear OpenAPI specifications as they are defined so that frontend integration, testing and eventual handover are supported.

## 6. Non-functional requirements

The current baseline includes the following quality requirements:

- the solution is a project prototype and is not intended for production use
- the full local stack should be able to start through Docker Compose within five minutes
- the system should continue to return a useful result if one public-data feed is unavailable, provided enough evidence remains
- unavailable or uncertain optional external dependencies should not prevent development from progressing where they can be isolated behind a defined interface and replaced with an appropriate mock or substitute implementation
- the console should handle 1,000 simulated devices without noticeable lag
- a first-time viewer should be able to understand the main scenario within five minutes
- an operator should be able to identify the recommended next action within ten seconds of seeing the result
- the correlation result should be explainable, including the evidence and confidence behind it
- services should expose basic health checks and use structured logging
- basic input validation is required

The 1,000-device requirement remains the baseline performance target. Testing or supporting higher device counts is desirable where practical, but no higher mandatory target was established in the 24 August client discussion.

The method used to translate GPS coordinates into the required geographic context is an implementation decision. The 24 August discussion identified ABS Local Government Area geospatial polygon data as one possible source of geographic boundary information.

## 7. Scope

### In scope

The current core scope includes:

- Device Fleet Simulator
- mocked Telstra Outage API
- at least two real Australian public-data feeds
- Public Data Adapter
- Root Cause Correlator
- Network Intelligence Console dashboard
- MSISDN → last-known GPS → suburb/postcode location composition
- map/geospatial view
- relevant geographic and risk context
- likely cause, confidence, supporting evidence, and recommended action
- Docker Compose local deployment
- a repeatable SafeCall demo scenario
- supporting API, architecture, setup, and handover documentation

### Stretch scope

These items should only be attempted once the mandatory workflow is working and stable:

- mocked Loss of Connectivity API and the supporting network-state/event simulation required for it
- authentication and authorisation
- time-travel or replay features
- additional metrics and observability features
- Kubernetes deployment
- other secondary features that are not needed for the core scenario

The Loss of Connectivity API remains stretch scope. Its OpenAPI specification has been provided to Team 15 in the API specifications ZIP. If the team reaches this feature later in the project, it will require additional network-state and event-delivery behaviour beyond the simpler mocked Outage API.

### Out of scope

The project prototype will not use:

- live Telstra production APIs
- confidential Telstra implementation details
- real SafeCall customer data
- real production incident workflows
- production deployment
