# API Contract Review

**Project:** Network Intelligence Console — Telstra Network-as-a-Product (NaaP)  
**Team:** Team 15  
**Sprint:** Sprint 1 - Week 2  
**Role:** Business Analyst  
**Task:** Review API Contracts & Define Common Data Model  
**Document:** API Contract Review  
**Prepared:** 6 September 2026

## Purpose

This document reviews the two API contracts supplied for the Network Intelligence Console:

- **IoT Monitoring Outage API** — OpenAPI 3.0.2, version 1.1.0
- **IoT Monitoring Loss of Connectivity API** — OpenAPI 3.0.2, version 0.8.0

The aim is to record what those contracts actually require at the API boundary. That includes the relevant operations, request and response fields, required headers, validation rules, authentication requirements and error behaviour.

The review also checks the supplied contracts against the Telstra Project Brief v2 and the current Sprint 1 Requirements Baseline. Where the project prototype uses a slightly different or stronger contract, that is recorded as a project implementation choice. It does not change what the supplied contract itself says.

The common vocabulary used across device, outage, public-event and verdict data is defined separately in `COMMON-DATA-MODEL.md`. The detailed list of contract differences and unresolved specification items is kept in `API-ALIGNMENT-GAPS.md`.

## Sources

The review uses the following sources:

- Telstra **Network Intelligence Console — Capstone Project Brief v2**, July 2026
- Team 15 **Sprint 1 Requirements Baseline**, last updated 26 August 2026
- `outage-api-swagger.json`
- `loss-of-connectivity-swagger.json`
- current project OpenAPI definitions where they affect how the supplied contracts are represented in the prototype

For business scope and expected prototype behaviour, the v2 brief and Requirements Baseline are used. For the exact mechanics of the two supplied APIs, the relevant Swagger file is used.

A useful distinction throughout this document is the difference between:

- a rule the OpenAPI schema formally enforces; and
- a rule that is only stated in a field description or example.

That difference matters when requirements and tests are written later.

---

## 1. Outage API

### 1.1 What the contract does

The supplied Outage contract is:

- OpenAPI `3.0.2`
- title `iot-monitoring-outage`
- version `1.1.0`

For the SafeCall scenario, the main operation is a geographic outage lookup. The API is not queried with an MSISDN or a device identifier. The caller must already know the location in the form expected by the API.

The lookup inputs are:

```text
suburb + state + postcode
```

That fits the project flow described in the v2 brief and Requirements Baseline: device telemetry provides the last-known GPS position, the location is resolved to the required geographic fields, and those fields are then used for the outage lookup.

### 1.2 Relevant operations

| Method | Path                      | Purpose                                                      | Main success response             |
| ------ | ------------------------- | ------------------------------------------------------------ | --------------------------------- |
| `GET`  | `/outage/v0/health-check` | Check whether the service is available                       | `200`                             |
| `GET`  | `/outage/v0/status`       | Retrieve outage information for a suburb, state and postcode | `200` with `OutageStatusResponse` |

The health-check route has no request body and simply returns `200` when the service is healthy.

The status route is the operation used by the incident-triage flow.

### 1.3 Required request headers

`GET /outage/v0/status` declares five required headers:

| Header             | Required | Contract meaning                          |
| ------------------ | -------- | ----------------------------------------- |
| `Accept-Charset`   | Yes      | Acceptable character set for the response |
| `Accept`           | Yes      | Acceptable media type for the response    |
| `Correlation-Id`   | Yes      | Identifier used to trace the transaction  |
| `Content-Language` | Yes      | Language of the content                   |
| `Content-Type`     | Yes      | Content type of the request               |

The supplied OpenAPI components also contain a generic `authorization` field, but `Authorization` is **not** attached to `GET /outage/v0/status` as a required operation parameter.

This is worth keeping precise. The file contains authentication-related definitions, but the supplied status operation does not formally require an authorization header.

The v2 brief separately says that production-style authentication is a stretch goal for the mock. That means authentication should not be treated as a mandatory Sprint 2 requirement merely because a generic authorization property exists elsewhere in the Swagger file.

### 1.4 Required query fields

The status operation requires all three query fields below.

| Field      | Type   | Required | Contract rule                      |
| ---------- | ------ | -------- | ---------------------------------- |
| `suburb`   | string | Yes      | Suburb or town                     |
| `state`    | string | Yes      | Must match the supplied enum       |
| `postcode` | string | Yes      | Described as a four-digit postcode |

#### `suburb`

There is no enum or pattern. The field is simply required as a string.

#### `state`

The supplied Swagger allows:

```text
QLD
NSW
ACT
VIC
TAS
SA
WA
NT
INT
OT
```

The Telstra v2 brief uses a different final value: `NAT`, rather than `INT` and `OT`.

This is a genuine difference between the supplied sources. It should not be hidden by silently changing one source to match the other.

#### `postcode`

The field description says the postcode is four digits. The schema itself does not include a regex or another pattern that formally enforces four digits.

So there are two separate facts:

- the intended business format is a four-digit postcode;
- the supplied OpenAPI schema does not enforce that format with a pattern.

### 1.5 Status response

The supplied `OutageStatusResponse` contains:

- `correlation-id`
- `past`
- `near_future`
- `far_future`
- `current`

The four arrays group outages by their timing relative to the request.

| Response field   | Type   | Meaning                                 |
| ---------------- | ------ | --------------------------------------- |
| `correlation-id` | string | Correlation identifier for the request  |
| `past`           | array  | Past outages for the location           |
| `current`        | array  | Current outages for the location        |
| `near_future`    | array  | Upcoming outages in the next 24 hours   |
| `far_future`     | array  | Scheduled outages further in the future |

The supplied response schema does **not** provide a top-level `required` list. In other words, these fields are defined, but the schema does not formally say that every one must be present in every successful response.

The v2 brief describes a more stable response shape and also shows `status` and `timestamp` at the top level. Those two fields are not present in the supplied `OutageStatusResponse` schema.

### 1.6 Outage item fields

Each response array contains `OutageStatusItem` objects.

The supplied item fields are:

| Field             | Type             | Meaning                                       |
| ----------------- | ---------------- | --------------------------------------------- |
| `state`           | string           | State abbreviation                            |
| `suburb`          | string           | Suburb or town                                |
| `postcode`        | string           | Postcode                                      |
| `start_timestamp` | string           | Outage start time                             |
| `end_timestamp`   | string or `null` | Outage end time, or `null` if ongoing         |
| `root_cause`      | string           | Cause reported by the outage source           |
| `duration`        | integer          | Duration in seconds                           |
| `description`     | string           | Human-readable outage information             |
| `is_planned`      | boolean          | Whether the outage is planned                 |
| `technology`      | string           | Affected technology, for example `4G` or `5G` |

The supplied `OutageStatusItem` also has no `required` list. The fields are defined and used in the examples, but their presence is not made mandatory by the schema.

A few field details matter to the project.

#### `start_timestamp`

This is a string. The supplied schema does not use OpenAPI `format: date-time`.

#### `end_timestamp`

This is also a string, with `nullable: true`. An ongoing outage can therefore have a null end time.

The schema again does not use `format: date-time`.

#### `root_cause`

This is the cause reported by the outage source. It is evidence for the wider incident investigation.

It should stay separate from the final **likely cause** produced by the Root Cause Correlator. The final verdict can consider device state, outage information and public-event evidence together.

#### `duration`

The field is defined as an integer and described as the outage duration in seconds.

### 1.7 Validation behaviour

The supplied contract gives us the following validation rules.

**Formally enforced by the operation or schema:**

- `suburb` is required.
- `state` is required.
- `postcode` is required.
- `state` must be one of the values in the supplied enum.
- the five request headers listed in section 1.3 are required.

**Described, but not fully enforced by the schema:**

- `postcode` is intended to contain four digits.
- the outage timestamps represent times with a timezone, but they are plain strings rather than OpenAPI date-time values.

That distinction should carry into later testing. A test should not claim that the source schema contains a rule that exists only in descriptive text.

### 1.8 Error behaviour

`GET /outage/v0/status` defines:

| Status | Meaning                                      |
| ------ | -------------------------------------------- |
| `200`  | Outage status returned successfully          |
| `400`  | Invalid request / validation failure         |
| `500`  | Unexpected internal error                    |
| `503`  | Service or downstream dependency unavailable |

The supplied error model uses an `ErrorEnvelope` containing an `errors` array.

Each `ErrorItem` requires:

- `code`
- `issue`
- `suggested_action`

It can also include:

- `fieldName`
- `location`
- `value`
- `link`

That structure is useful because a validation failure can point to the field that caused the problem and where the problem occurred.

For example, the supplied `400` response shows field-level errors for a missing `suburb` query value and a missing correlation ID header.

### 1.9 Comparison with the v2 brief and baseline

The main business behaviour lines up well.

The v2 brief, Requirements Baseline and supplied Swagger all describe a geographic outage lookup using suburb, state and postcode. They also use the same four time buckets and the same main outage item concepts.

The differences are narrower:

1. **State enum**
    - v2 brief: includes `NAT`
    - supplied Swagger: includes `INT` and `OT`

2. **Top-level metadata**
    - v2 brief: includes `status` and `timestamp`
    - supplied Swagger: does not define those fields in `OutageStatusResponse`

3. **Requiredness**
    - the brief describes a stable response structure
    - the supplied response and outage-item schemas do not mark those fields as required

These differences are carried into `API-ALIGNMENT-GAPS.md`.

### 1.10 Current prototype contract position

The project prototype keeps the main outage behaviour intact:

- the lookup still uses `suburb`, `state` and `postcode`;
- a correlation ID is required;
- the same outage buckets and item concepts are used;
- authentication remains outside the mandatory core scope;
- stronger requiredness is used where the prototype depends on a stable response shape;
- `status` and `timestamp` are included in the prototype response, matching the v2 brief;
- demo-only scenario controls are added so the required outage scenarios can be switched on and off.

The prototype retains the required `Correlation-Id` header but intentionally omits the supplied contract's `Accept-Charset`, `Accept`, `Content-Language` and `Content-Type` headers as a prototype simplification. The supplied Swagger still remains the reference for what the external contract defines.

The `NAT` versus `INT` / `OT` difference remains a source-level question and should stay visible until it is confirmed.

---

## 2. Loss of Connectivity API

### 2.1 What the contract does

The supplied Loss of Connectivity contract is:

- OpenAPI `3.0.2`
- title `iot-monitoring-loss-connectivity`
- version `0.8.0`

This API works differently from the Outage API.

It is a subscription and webhook service. A caller registers one or more MSISDNs against a callback URL. When a subscribed device loses connectivity, an event is sent to that callback.

The API is keyed around MSISDN and subscription information. It does **not** provide GPS, suburb, state or postcode.

That matches the v2 brief. Device location has to come from SafeCall or simulated device telemetry.

The Requirements Baseline keeps LOC in stretch scope, so this contract is reviewed in full without making LOC part of the mandatory Sprint 2 path.

### 2.2 Relevant operations

| Method   | Path                                                      | Purpose                              | Main success response |
| -------- | --------------------------------------------------------- | ------------------------------------ | --------------------- |
| `GET`    | `/health-check`                                           | Check service health                 | `200`                 |
| `POST`   | `/loss-of-connectivity/v0/subscriptions`                  | Create subscriptions                 | `201` or `207`        |
| `GET`    | `/loss-of-connectivity/v0/subscriptions`                  | List subscriptions                   | `200`                 |
| `GET`    | `/loss-of-connectivity/v0/subscriptions/{subscriptionId}` | Get one subscription                 | `200`                 |
| `DELETE` | `/loss-of-connectivity/v0/subscriptions/{subscriptionId}` | Delete one subscription              | `204`                 |
| `POST`   | `/loss-of-connectivity/v0/events`                         | Receive a Loss of Connectivity event | `202`                 |

The subscription routes are normal request/response operations.

The event route is different. It represents asynchronous delivery of a connectivity event to a callback.

### 2.3 Authentication and headers

The subscription-management operations explicitly declare these headers as required:

- `Authorization`
- `Accept-Charset`
- `Accept`
- `correlation-id`
- `Content-Language`
- `Content-Type`

The authorization header is described in bearer-token form.

The `correlation-id` is defined as a UUID and uses a UUID v4 pattern.

The webhook event operation does **not** declare that same authentication/header set.

That should be read exactly as supplied. Callback authentication should not be invented from the subscription routes if the event operation does not define it.

### 2.4 Create-subscription request

`POST /loss-of-connectivity/v0/subscriptions` requires a body with:

- `monitoringType`
- `subscriptions`

Both are required.

`subscriptions` is an array with `minItems: 1`.

Each item in that array requires:

- `msisdn`
- `notificationDestination`

#### `monitoringType`

The description says the value will be `LOSS_OF_CONNECTIVITY`.

The request schema defines it as a required string, but does not restrict it with an enum.

That is slightly different from the event payload, where `monitoringType` is formally restricted to `LOSS_OF_CONNECTIVITY`.

#### `msisdn`

The request-side `msisdn` field is an array.

The supplied contract states:

- at least one MSISDN must be supplied;
- values in an MSISDN array must be unique;
- duplicate MSISDN values across the overall payload are rejected;
- the numbers are Australian mobile E.164 values starting with `614` or `619`.

The supplied schema does not apply a regex to enforce the `614` / `619` rule. That rule is written in the description.

#### `notificationDestination`

This is the callback URL used for event delivery.

The supplied schema defines it as a string and describes it as a callback URL. It does not apply `format: uri`.

### 2.5 Create-subscription response

The create operation supports:

- `201` when the subscriptions are created successfully;
- `207` when the request is only partially successful.

The response can contain:

- `correlation-id`
- `status`
- `timeStamp`
- `message`
- `subscriptions`
- optional `errors`

Each successful subscription result contains:

- `subscriptionId`
- `msisdn`
- `status`
- `notificationDestination`

The request and response use MSISDN differently:

- request: `msisdn` is an array so several numbers can be submitted;
- response: `msisdn` is a scalar because each result refers to one number.

That is expected batch-processing behaviour.

### 2.6 Partial success

HTTP `207` is an important part of the LOC contract.

A partial-success response can contain successful subscription results and errors at the same time. It must not be handled as though the whole request failed.

The per-entry error structure can include:

- `type`
- `message-content`
- `status`
- `msisdn`
- `notificationDestination`
- `reason`

The supplied examples include authorization failures and an existing-subscription case.

If LOC is implemented, later tests need to check the outcome at individual-MSISDN level, not only the top-level HTTP code.

### 2.7 Listing subscriptions

`GET /loss-of-connectivity/v0/subscriptions` supports two optional query parameters:

- `limit`
- `cursor`

The response contains a `subscriptions` collection and can also return:

- `nextCursor`
- `limit`

This is a cursor-based paging model. Consumers should not assume that one response always contains every subscription.

### 2.8 Get and delete by subscription ID

Both item operations use `subscriptionId` as a required path parameter.

The supplied contract describes it as the identifier of the subscription resource. It does not consistently apply a UUID format to every place where a subscription ID appears.

A successful delete returns:

```text
204 No Content
```

A `204` response has no response body.

### 2.9 Event payload

`POST /loss-of-connectivity/v0/events` receives the connectivity event.

The event object contains:

- `subscriptionId`
- `monitoringEventReports`

In the supplied file, those two top-level properties are defined but are not placed in a top-level `required` array.

Each item inside `monitoringEventReports` does require:

- `monitoringType`
- `msisdn`
- `eventTime`

It can also contain:

- `lossOfConnectReason`

The event-side `monitoringType` is restricted to:

```text
LOSS_OF_CONNECTIVITY
```

`eventTime` is a string with OpenAPI `format: date-time`.

### 2.10 Loss-of-connectivity reason codes

`lossOfConnectReason` is an optional integer.

The field description lists these values:

| Code | Description in supplied contract   |
| ---: | ---------------------------------- |
|  `0` | `UE_DETACHED_MME`                  |
|  `1` | `UE_DETACHED_SGSN`                 |
|  `2` | `MAX_DETECTION_TIME_EXPIRED_MME`   |
|  `3` | `MAX_DETECTION_TIME_EXPIRED_SGSN`  |
|  `4` | `UE_PURGED_MME`                    |
|  `5` | `UE_PURGED_SGSN`                   |
|  `6` | `DEREGISTERED (AMF)`               |
|  `7` | `MAX_DETECTION_TIME_EXPIRED (AMF)` |
|  `8` | `PURGED (AMF)`                     |

The schema itself does not define an enum, minimum or maximum for the field.

The safest data treatment is therefore to preserve the original numeric value and, if the project adds a readable label internally, keep that mapping documented rather than replacing the source value.

### 2.11 Event acknowledgement

The event endpoint returns `202` when the event is accepted.

The response contains:

- `status`
- `timeStamp`

A `202` response means the event has been accepted for asynchronous processing. It does not mean that the final root-cause verdict has already been calculated.

### 2.12 Validation behaviour

The main LOC rules can be separated into schema-enforced rules and description-only rules.

**Formally enforced by the operation or schema:**

- the subscription request body is required;
- `monitoringType` is required in the create request;
- `subscriptions` is required;
- `subscriptions` has at least one item;
- each subscription item requires `msisdn` and `notificationDestination`;
- each request-side `msisdn` array has at least one item;
- MSISDN values within that array must be unique;
- the subscription-management `correlation-id` follows the supplied UUID v4 rule;
- each monitoring report requires `monitoringType`, `msisdn` and `eventTime`;
- event-side `monitoringType` is restricted to `LOSS_OF_CONNECTIVITY`;
- `eventTime` uses `format: date-time`.

**Stated in descriptions rather than fully enforced by the supplied schema:**

- MSISDN values should be Australian mobile E.164 numbers starting with `614` or `619`;
- duplicate MSISDNs across the full payload are rejected;
- `notificationDestination` should be a callback URL;
- request-side `monitoringType` should be `LOSS_OF_CONNECTIVITY`.

These rules are still useful requirements. The point is simply to record where the rule comes from.

### 2.13 Error behaviour

The LOC subscription operations use a wider set of responses than the Outage API.

Across the create, list, get and delete operations, the contract uses combinations of:

| Status | Meaning                          |
| ------ | -------------------------------- |
| `400`  | Bad request / validation failure |
| `401`  | Authentication required          |
| `403`  | Caller not authorised            |
| `404`  | Subscription/resource not found  |
| `405`  | Method not allowed               |
| `500`  | Internal server error            |
| `503`  | Service unavailable              |

Create subscription also uses:

| Status | Meaning               |
| ------ | --------------------- |
| `201`  | Subscriptions created |
| `207`  | Partial success       |

There is an inconsistency in the supplied LOC file: some `503` responses reference the `response502` component/example. That appears to be a contract-definition inconsistency in the source file rather than a business rule.

### 2.14 Comparison with the v2 brief and baseline

The overall LOC model lines up with the v2 brief:

- it is a subscription and webhook service;
- subscriptions are keyed around MSISDN;
- the callback is supplied through `notificationDestination`;
- the event carries MSISDN and connectivity information;
- the API does not provide the location needed for the Outage lookup;
- LOC remains stretch scope.

The supplied OpenAPI contains more operation-level detail than the brief, especially around headers, paging and error responses.

The main places where the source schema is looser than the business description are:

- the AU MSISDN prefix rule;
- callback URL formatting;
- request-side `monitoringType`;
- top-level event requiredness.

### 2.15 Current prototype contract position

The prototype keeps the supplied LOC interaction model while making a few practical contract choices:

- the health route is `/health-check`, matching the supplied LOC contract;
- `correlation-id` remains required on subscription-management operations;
- full authentication is not part of the mandatory prototype path because authentication is stretch scope;
- `Accept-Charset`, `Accept`, `Content-Language` and `Content-Type` are intentionally omitted from the prototype contract, while `correlation-id` remains required;
- the AU MSISDN rule is enforced more strongly with a pattern;
- `notificationDestination` is enforced as a URI;
- core event fields are made required so an accepted event has the information needed downstream;
- service-unavailable handling is defined directly instead of reproducing the source file's `503` to `response502` mismatch.

These are prototype contract decisions. They should not be mistaken for properties of the original supplied Swagger.

---

## 3. What the contracts mean for the SafeCall flow

The two APIs answer different questions.

The Outage API answers:

> What network outage information exists for this geographic area?

The LOC API answers:

> Has a subscribed MSISDN lost connectivity?

Neither API, by itself, provides the full context needed by the console.

### 3.1 Identifier chain

The project needs to keep these identifiers separate:

- `deviceId` — the project's device identifier;
- `msisdn` — the mobile number used by the LOC contract;
- `subscriptionId` — the identifier for a LOC subscription.

They can be related, but they are not interchangeable.

A connectivity event keyed by MSISDN must still be linked to the correct simulated device before the console can obtain that device's last-known location.

### 3.2 Location chain

The required composition is:

```text
device / SafeCall record
        ↓
MSISDN
        ↓
last-known GPS from device telemetry
        ↓
resolve GPS to suburb + state + postcode
        ↓
GET /outage/v0/status
```

The LOC contract does not supply the GPS or the resolved geographic fields.

The geographic-resolution step is therefore part of the project composition, not part of either supplied API.

### 3.3 Source cause versus final verdict

The Outage field `root_cause` is one piece of evidence.

The final console verdict is wider because it can combine:

- device state;
- outage information;
- public-event information.

The internal model should not reuse `root_cause` as though it were automatically the final incident verdict.

### 3.4 Correlation identifiers

Both supplied APIs use correlation identifiers, but the exact naming differs by boundary.

The project can use one consistent internal name after ingestion, while still preserving the exact external header or field required by each API.

### 3.5 Time values

The supplied contracts use more than one time representation:

- Outage timestamps are strings without OpenAPI date-time formatting;
- LOC `eventTime` uses `format: date-time`;
- LOC `timeStamp` is an integer epoch value.

The internal data model should normalise these values into a consistent time representation for correlation, while preserving the meaning and source value where traceability is useful.

---

## 4. Requirements derived from the contract review

These requirements add contract-level detail to the existing Requirements Baseline. They do not replace the baseline functional requirements.

### API-REQ-01 — Outage lookup inputs

The system shall support an outage lookup using `suburb`, `state` and `postcode`.

### API-REQ-02 — Geographic resolution

Before an Outage API lookup is made, the system shall be able to resolve the device's last-known GPS location into the geographic fields required by the Outage contract.

### API-REQ-03 — Outage response groups

The system shall be able to process outage information from the `past`, `current`, `near_future` and `far_future` response groups.

### API-REQ-04 — Outage evidence

The system shall preserve outage evidence needed by downstream correlation, including the outage location, timing, source-reported cause, duration, description, planned status and affected technology where supplied.

### API-REQ-05 — Correlation identifiers

Where a contract operation requires a correlation identifier, the system shall send and retain that identifier in the form expected at that API boundary.

### API-REQ-06 — Request validation

The system shall validate mandatory request fields before sending requests to the mocked or external-style APIs.

Validation rules that come from descriptive contract text shall remain distinguishable from rules that are formally enforced by the source schema.

### API-REQ-07 — Error handling

The system shall handle the status and error responses defined by each relevant contract rather than treating every non-success response as the same failure.

### API-REQ-08 — LOC batch subscriptions

If LOC support is implemented, the system shall support batch subscription requests containing one or more MSISDNs.

### API-REQ-09 — LOC partial success

If LOC support is implemented, the system shall handle HTTP `207` as partial success and retain the outcome for each affected MSISDN.

### API-REQ-10 — LOC event handling

If LOC support is implemented, the system shall accept Loss of Connectivity event reports containing the subscription context, MSISDN, monitoring type and event time, and shall return the expected asynchronous acceptance response.

### API-REQ-11 — Identifier separation

The system shall keep `deviceId`, `msisdn` and `subscriptionId` as separate identifiers and maintain the relationships required to move between them.

### API-REQ-12 — Location source

The system shall obtain the last-known GPS position from device or SafeCall telemetry. It shall not assume that the LOC API supplies GPS, suburb, state or postcode.

### API-REQ-13 — Time normalisation

The system shall normalise source time values into a consistent internal representation for correlation without changing the meaning of the original source data.

---

## 5. Effect on the current Requirements Baseline

This review does not require a rewrite of the existing `FR-01` to `FR-12` requirements.

The findings mainly add detail to requirements that already exist:

- `FR-02` is supported by the supplied Outage contract and the geographic lookup model.
- `FR-04` depends on keeping device, outage and public-event evidence separate before correlation.
- `FR-05` to `FR-08` remain result-level requirements and should not be confused with source-specific fields such as Outage `root_cause`.
- `FR-09` is supported by the identifier and location composition described above.
- LOC remains stretch scope, so its detailed subscription and webhook behaviour does not change the core Sprint 2 path.

The current non-functional requirements also remain valid. In particular, basic input validation, health checks and graceful handling of unavailable dependencies are consistent with the behaviour exposed by the supplied contracts.

Any source discrepancy that could change external compatibility or the agreed response shape is recorded in `API-ALIGNMENT-GAPS.md` rather than being used to silently alter the baseline.

---

## 6. Contract findings carried forward

The detailed gap register is kept separately, but this review leaves five points that need to remain visible.

### Outage state enum

The v2 brief uses `NAT`; the supplied Swagger uses `INT` and `OT`.

This is the clearest unresolved difference between the two client sources.

### Outage `status` and `timestamp`

The v2 brief includes these fields in the response description. The supplied `OutageStatusResponse` does not define them.

The prototype currently includes them, but they should not be described as fields that came from the supplied Swagger.

### Outage response requiredness

The supplied Swagger does not make the response or outage-item fields mandatory at schema level.

The prototype uses stronger requiredness where a stable response is needed. That is a project contract choice.

### LOC `503` response reference

The supplied LOC file contains `503` responses that reference a `502` response component/example.

That should be treated as a source-file inconsistency rather than copied as business behaviour.

### LOC description-only validation

The supplied contract describes several rules that it does not fully enforce in the schema, particularly:

- AU MSISDN prefixes;
- callback URL formatting;
- request-side monitoring type.

The prototype can enforce those rules more strongly, but the difference should remain traceable.

---

## 7. Review outcome

The supplied contracts are clear enough to support the current prototype when they are read alongside the v2 brief and Requirements Baseline.

The main contract behaviour is straightforward:

- Outage is a geographic status lookup.
- LOC is a subscription and webhook API keyed around MSISDN.
- LOC carries no device location.
- The project therefore needs an explicit identifier and location composition before an Outage query can be made.
- Validation and error behaviour differ between the two APIs.
- Some business rules are described more strongly than the source schemas enforce.
- A small number of differences remain between the v2 brief and the supplied Swagger files.

Those differences do not change the core SafeCall workflow. They do need to stay visible so the prototype contracts, common data model and later tests all use the same interpretation.

---

## 8. Planner checklist coverage

This document is one part of the Sprint 1 Week 2 BA deliverable set.

|   # | Planner checklist item                                            | Where it is covered                   |
| --: | ----------------------------------------------------------------- | ------------------------------------- |
|   1 | Review the client-supplied OpenAPI files                          | Sections 1 and 2                      |
|   2 | Catalogue relevant API operations                                 | Sections 1.2 and 2.2                  |
|   3 | Record authentication requirements                                | Sections 1.3, 2.3 and 3.4             |
|   4 | Catalogue important request and response fields                   | Sections 1.4-1.6 and 2.4-2.11         |
|   5 | Identify validation requirements                                  | Sections 1.7 and 2.12                 |
|   6 | Identify API error cases                                          | Sections 1.8 and 2.13                 |
|   7 | Translate validation and error behaviour into requirements        | Section 4                             |
|   8 | Map outage, device and public-event data into a common vocabulary | `COMMON-DATA-MODEL.md`                |
|   9 | Create the proposed data dictionary                               | `COMMON-DATA-MODEL.md`                |
|  10 | Compare the OpenAPI contracts against the Telstra project brief   | Sections 1.9, 2.14 and 5              |
|  11 | Flag differences or unclear items for client confirmation         | Section 6 and `API-ALIGNMENT-GAPS.md` |
