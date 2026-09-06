# API Alignment and Gaps

**Project:** Network Intelligence Console - Telstra Network-as-a-Product (NaaP)  
**Team:** Team 15  
**Prepared by:** Aditya Barot, Business Analyst  
**Sprint:** Sprint 1 - Week 2  
**Status:** Current alignment register for requirements and testing

## 1. Purpose

This document records the places where the main project sources do not say exactly the same thing.

The comparison covers:

- the Telstra Project Brief v2;
- the active Sprint 1 Requirements Baseline;
- the supplied Outage and Loss of Connectivity Swagger files;
- the current prototype contracts where they affect requirements or shared data meaning;
- the current public-data assessment for VicEmergency and Bureau of Meteorology sources.

The aim is to keep real source differences visible without treating every implementation choice as a client issue.

Some differences need clarification. Others are deliberate prototype decisions, stronger validation, normalisation choices or integration details. Those cases are separated so later requirements and tests can tell the difference.

Detailed API behaviour is in `API-CONTRACT-REVIEW.md`.

Shared field names and mappings are in `COMMON-DATA-MODEL.md`.

## 2. Status meanings

Each item is given a status based on the type of difference or alignment involved.

| Status                   | Meaning                                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Source discrepancy**   | Two authoritative project sources disagree and the difference should remain visible until clarified                                    |
| **Prototype decision**   | The project deliberately simplifies, strengthens or extends a supplied contract                                                        |
| **Integration point**    | The requirement is clear, but the value has to be produced or carried between services                                                 |
| **Technical validation** | The intended behaviour is clear enough, but the exact external source, mapping or matching approach still needs technical confirmation |
| **Aligned**              | The sources and current project position are consistent enough that no further action is needed                                        |
| **Resolved by mapping**  | Different field names or structures have been reconciled through the Common Data Model without changing their meaning                  |

A prototype decision is not automatically a gap. It only becomes a problem if it is described as behaviour that came from the supplied external contract when it did not.

---

## 3. Alignment summary

| ID      | Topic                                        | Telstra v2 / Requirements Baseline                                                                          | Supplied contract or current source                                                                                                                                                   | Current project position                                                                  | Status                   |
| ------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------ |
| `AG-01` | Outage state enum                            | Uses `NAT`                                                                                                  | Swagger uses `INT` and `OT`                                                                                                                                                           | Keep difference visible                                                                   | **Source discrepancy**   |
| `AG-02` | Outage response `status` and `timestamp`     | Included in v2 response shape                                                                               | Not defined in supplied `OutageStatusResponse`                                                                                                                                        | Prototype includes both                                                                   | **Source discrepancy**   |
| `AG-03` | Outage response requiredness                 | Stable fields are expected by the prototype flow                                                            | Supplied response and item schemas do not declare top-level required fields                                                                                                           | Prototype requires its core fields                                                        | **Prototype decision**   |
| `AG-04` | Outage request headers                       | No business requirement for all generic headers                                                             | Supplied status operation requires five headers                                                                                                                                       | Prototype keeps correlation ID and omits several standard headers                         | **Prototype decision**   |
| `AG-05` | Outage authentication                        | Authentication is stretch for the mock                                                                      | Supplied status operation does not formally require `Authorization`                                                                                                                   | Authentication is outside the mandatory core path                                         | **Aligned**              |
| `AG-06` | Outage polygon / area                        | v2 refers to outage polygons in the dashboard scenario                                                      | Supplied Outage schema has no polygon field                                                                                                                                           | Map overlay can use project-derived geometry                                              | **Integration point**    |
| `AG-07` | Outage identifier                            | Dashboard scenarios benefit from stable outage IDs                                                          | Supplied Outage item has no outage ID                                                                                                                                                 | Project may generate an internal outage ID                                                | **Prototype decision**   |
| `AG-08` | GPS to Outage lookup                         | Requires GPS → suburb/state/postcode → Outage                                                               | Outage API only accepts suburb/state/postcode                                                                                                                                         | Geographic resolution is required before lookup                                           | **Integration point**    |
| `AG-09` | `state` in shared location data              | Needed for Outage lookup                                                                                    | Device location begins with GPS and may not carry state directly                                                                                                                      | Common model includes `state` before the Outage boundary                                  | **Integration point**    |
| `AG-10` | Full result identity chain                   | v2 requires MSISDN → GPS → suburb/postcode to remain defensible                                             | Results response does not repeat every identity field                                                                                                                                 | Full chain must remain recoverable across the system                                      | **Integration point**    |
| `AG-11` | LOC scope                                    | Stretch                                                                                                     | Supplied LOC contract is fully defined                                                                                                                                                | Common model covers LOC without making it core                                            | **Aligned**              |
| `AG-12` | LOC auth and standard headers                | Auth is stretch                                                                                             | Supplied subscription operations declare auth and several headers                                                                                                                     | Prototype simplifies these requirements                                                   | **Prototype decision**   |
| `AG-13` | LOC MSISDN / callback validation             | Descriptions expect AU E.164 and callback URL                                                               | Supplied schema describes some rules without fully enforcing them                                                                                                                     | Prototype applies stronger validation                                                     | **Prototype decision**   |
| `AG-14` | LOC event requiredness                       | Event payload has clear required business content                                                           | Supplied top-level event schema has no `required` list                                                                                                                                | Prototype makes core event fields required                                                | **Prototype decision**   |
| `AG-15` | LOC `503` definition                         | Service-unavailable behaviour is expected                                                                   | Supplied file points some `503` responses to a `502` component/example                                                                                                                | Prototype defines `503` directly                                                          | **Prototype decision**   |
| `AG-16` | VicEmergency affected-area data              | v2 points to VicEmergency GeoJSON and affected areas                                                        | Current source assessment uses live VicEmergency GeoJSON with source geometry                                                                                                         | Geometry is retained for correlation and map use                                          | **Aligned**              |
| `AG-17` | BOM weather observations                     | v2 hero scenario needs weather context such as temperature and wind                                         | Current source assessment uses a BOM observation product with station coordinates and measured weather values                                                                         | Observation evidence can be matched to device location by station proximity and freshness | **Aligned**              |
| `AG-18` | BOM weather warnings                         | v2 refers to weather warnings as public evidence                                                            | Current source assessment includes structured BOM warning products                                                                                                                    | Warning metadata can be normalised, but some warnings may not provide usable geometry     | **Technical validation** |
| `AG-19` | Public-event severity                        | Useful where a source supports it                                                                           | VicEmergency CAP and BOM warning products can expose severity; BOM observations do not need it                                                                                        | Severity remains source-dependent and optional                                            | **Aligned**              |
| `AG-20` | Public-event geometry                        | Area overlap is useful for correlation and map display                                                      | VicEmergency can provide source geometry; BOM observations provide station coordinates; some BOM warnings may not provide geometry                                                    | Common model preserves geometry where supplied and does not invent it where absent        | **Aligned**              |
| `AG-21` | Public-event naming                          | Public sources and service contracts use different field names                                              | `id/type/publishedAt`, source-specific fields and service-specific names differ                                                                                                       | Canonical mapping defined in Common Data Model                                            | **Resolved by mapping**  |
| `AG-22` | Public-event timestamp                       | Public records use different source timestamps                                                              | Current normalised shape uses required `publishedAt`                                                                                                                                  | Creation, issue or observation time maps to one canonical public timestamp                | **Resolved by mapping**  |
| `AG-23` | Weather measurements reaching the correlator | Results evidence can include temperature and wind                                                           | BOM observations provide the measurements, but the current merged `PublicEvent` stream schema does not carry a `measurements` object                                                  | Define how BOM measurements reach the correlator through the agreed service/event path    | **Integration point**    |
| `AG-24` | Demo scenario endpoints                      | v2 requires repeatable scenarios                                                                            | Not part of supplied Telstra APIs                                                                                                                                                     | Project adds scenario-control routes                                                      | **Prototype decision**   |
| `AG-25` | Public Data Adapter event shape              | Current merged `PublicEvent` requires `location` with `lat` and `lon` and uses optional `area` for geometry | Latest public-data assessment now defines a `NormalisedEvent` to `PublicEvent` mapping, but BOM warnings without usable geometry still cannot naturally satisfy the required location | Keep the mapping and resolve the no-geometry warning case without inventing coordinates   | **Technical validation** |

---

## 4. Outage API gaps

## 4.1 `NAT` versus `INT` and `OT`

This remains the clearest unresolved difference between the supplied client sources.

The v2 brief uses:

```text
QLD, NSW, ACT, VIC, TAS, SA, WA, NT, NAT
```

The supplied Outage Swagger uses:

```text
QLD, NSW, ACT, VIC, TAS, SA, WA, NT, INT, OT
```

The difference affects a required query field, so it cannot be treated as a harmless naming variation.

### BA position

Keep the difference explicit.

The prototype needs one consistent enum for validation, but that implementation choice should not be presented as proof that the other supplied source is wrong.

### Clarification needed

Confirm whether the intended external contract uses:

- `NAT`; or
- `INT` and `OT`.

---

## 4.2 Outage response `status` and `timestamp`

The v2 brief describes a successful Outage response containing:

- `correlation-id`;
- `status`;
- `timestamp`;
- `past`;
- `near_future`;
- `far_future`;
- `current`.

The supplied `OutageStatusResponse` does not define `status` or `timestamp`.

The prototype includes them.

### BA position

The prototype can keep these fields because they match the v2 response description.

They should still be treated as part of the prototype interpretation rather than fields proven to exist in the supplied Swagger.

### Clarification needed

If exact external compatibility matters, confirm whether `status` and `timestamp` belong in the intended Outage response contract.

---

## 4.3 Outage response requiredness

The supplied Outage Swagger defines response fields but does not declare a top-level `required` list for:

- `OutageStatusResponse`; or
- `OutageStatusItem`.

The prototype uses stronger requiredness because its downstream flow depends on a stable response shape.

### BA position

This is a reasonable prototype decision.

Testing should distinguish between:

- what the supplied Swagger formally requires; and
- what the prototype requires for its own stable contract.

No client clarification is needed simply because the prototype is stricter.

---

## 4.4 Required Outage headers

The supplied `GET /outage/v0/status` operation requires:

- `Accept-Charset`;
- `Accept`;
- `Correlation-Id`;
- `Content-Language`;
- `Content-Type`.

The prototype keeps the correlation header but does not repeat every generic HTTP header.

### BA position

Treat this as a prototype simplification.

The API Contract Review should still record the supplied five-header requirement accurately.

No extra business requirement is needed for headers that are intentionally omitted from the prototype.

---

## 4.5 Authentication

The v2 brief treats authentication as optional/stretch for the mock.

The supplied Outage Swagger contains authentication-related definitions, but `GET /outage/v0/status` does not formally attach `Authorization` as a required operation parameter.

### BA position

There is no core-scope conflict.

Authentication can remain outside the mandatory Sprint 2 path unless scope changes.

---

## 4.6 Outage polygons

The v2 brief refers to outage polygons in the dashboard and hero scenario.

The supplied Outage item contains location, timing, cause, duration, description, planned status and technology. It does not contain polygon geometry.

### BA position

A polygon used by the prototype should be treated as project-derived map or correlation data unless another source supplies it directly.

For example:

```text
Outage API record
      +
project scenario / geographic derivation
      ↓
OutageOverlay.affectedArea
```

The source of that geometry should remain clear.

### Clarification worth keeping visible

If future work is expected to mirror a real Telstra integration, confirm whether outage-area geometry exists through another Telstra source or is expected to remain a prototype-derived layer.

---

## 4.7 Outage IDs

The supplied `OutageStatusItem` has no outage identifier.

The project Results API benefits from an `outageId` for map overlays, scenario control and stable UI references.

### BA position

An internal outage identifier is acceptable.

It should be described as project-generated rather than as an external Outage API field.

---

## 5. Identity and location gaps

## 5.1 MSISDN is not a device location

The supplied LOC API is keyed by MSISDN and subscription data.

It does not contain GPS, suburb, state or postcode.

The v2 brief and Requirements Baseline require the project to compose:

```text
MSISDN / device identity
        ↓
last-known GPS from device telemetry
        ↓
suburb + state + postcode
```

### BA position

Keep identity and location as separate concepts.

The common model therefore treats:

- `deviceId`;
- `msisdn`;
- `lastKnownLocation`;
- `suburb`;
- `state`;
- `postcode`;

as related but different fields.

---

## 5.2 `state` has to exist before the Outage call

The Outage API requires `state`.

A device location can begin with GPS and may not carry state directly.

### BA position

`state` is part of the canonical location model because it is mandatory at the Outage boundary.

It can be produced during GPS-to-geography resolution.

The service calling Outage must have:

```text
suburb + state + postcode
```

before it sends the request.

---

## 5.3 The identity and location chain has to remain recoverable

The v2 brief requires the result to remain defensible.

A single Results API response does not have to repeat every source field, but the system must not lose the association between:

- `deviceId`;
- `msisdn`;
- last-known GPS;
- resolved suburb/postcode;
- evidence used by the correlator.

### BA position

Treat this as a traceability requirement across the system.

For testing, a result should be traceable back to the device and location used for its evidence lookup.

---

## 6. Loss of Connectivity gaps

LOC remains stretch scope. These points matter mainly if it is implemented.

## 6.1 Authentication and generic headers

The supplied LOC subscription operations require bearer authorization and several standard headers.

The prototype contract is lighter because authentication is not part of the mandatory core path.

### BA position

This is an intentional prototype simplification.

If authentication is later brought into scope, the supplied contract should be revisited.

---

## 6.2 Stronger MSISDN validation

The supplied LOC descriptions say MSISDN values should:

- use Australian E.164 form;
- start with `614` or `619`;
- be unique where specified.

The source schema does not enforce every part of that wording with a regex.

The prototype uses a stronger pattern.

### BA position

The stronger validation is acceptable because it enforces the documented field meaning.

Requirements and tests should still record that it is stricter than the source schema.

---

## 6.3 Callback URI validation

The supplied contract describes `notificationDestination` as a callback URL but does not formally use `format: uri`.

The prototype does.

### BA position

This is another deliberate strengthening of a description-level rule.

No separate clarification is needed unless the intended callback format changes.

---

## 6.4 LOC event requiredness

The supplied `LossOfConnectivityEvent` defines:

- `subscriptionId`;
- `monitoringEventReports`;

but does not put those top-level fields in a `required` list.

Inside each report, the supplied contract does require:

- `monitoringType`;
- `msisdn`;
- `eventTime`.

The prototype makes the core top-level event structure required as well.

### BA position

Use the stronger prototype rule for Team 15 testing while keeping the source distinction visible in the API Contract Review.

---

## 6.5 `503` referencing a `502` component

Some supplied LOC `503` responses reference a response component or example labelled for `502`.

### BA position

For project behaviour, service unavailable should be represented as `503`.

The prototype can define it directly instead of reproducing the source-definition inconsistency.

---

## 7. Public-data alignment

The public-data picture is now much clearer than it was during the earlier assessment.

The current source set provides:

- VicEmergency GeoJSON for emergency warnings/incidents and affected-area geometry;
- BOM weather observations for measured environmental data;
- BOM structured warning products for warning metadata.

These sources do not need to be identical. They need to be normalised without losing the parts that make each source useful.

## 7.1 VicEmergency GeoJSON

The v2 brief points to VicEmergency GeoJSON and uses affected areas in the correlation and dashboard story.

The current assessment now uses a live GeoJSON source that can carry point and polygon geometry together with structured warning metadata.

Useful source fields include:

- event identifier;
- event type;
- severity;
- urgency;
- certainty;
- location description;
- creation/update times;
- source geometry.

### BA position

This is aligned with the v2 intent.

The adapter should preserve source geometry rather than flattening every record to a latitude/longitude point.

A source `Polygon`, `MultiPolygon` or `GeometryCollection` should remain available for spatial correlation where useful.

No client clarification is needed for the normalisation shape itself.

---

## 7.2 BOM weather observations

The v2 hero scenario needs environmental evidence such as temperature and wind.

The current BOM observation source provides:

- station coordinates;
- observation time;
- air temperature;
- apparent temperature;
- wind speed;
- wind gust;
- wind direction;
- rainfall;
- humidity;
- pressure.

### BA position

This source now covers the measured weather evidence needed by the prototype.

The main matching rule is straightforward:

1. identify a suitable nearby station;
2. check that the observation is fresh enough for the incident;
3. use only measurements that are present.

Distance and freshness checks are derived project logic. They are not fields supplied by BOM.

---

## 7.3 BOM structured warnings

The current assessment also includes structured BOM warning products.

These can provide:

- warning identifier;
- issue time;
- expiry time;
- warning title;
- named warning area;
- hazard type;
- severity;
- urgency;
- certainty.

The sampled warning product does not necessarily provide usable map geometry.

### BA position

Use BOM warning metadata where it helps explain environmental risk.

Do not invent coordinates or polygons when the warning source only provides a named area.

If direct geographic overlap is needed, either:

- use source geometry where a suitable BOM warning product provides it; or
- treat the warning as named-area evidence rather than point-in-polygon evidence.

VicEmergency remains the clearer source for affected-area polygon correlation in the current model.

### Status

This remains a technical validation point rather than a client-contract question.

---

## 7.4 Public-event severity

Severity is not meaningful for every public record.

VicEmergency CAP data can provide an explicit severity.

BOM warning products can also provide warning severity.

BOM observations are measurements and do not need a warning-severity field.

### BA position

Keep severity optional and source-dependent.

When an explicit source value exists, preserve it or map it through a documented normalisation rule.

Do not infer severity from unrelated fields.

---

## 7.5 Public-event geometry

The current source set uses geometry in different ways.

### VicEmergency

Can provide source GeoJSON geometry, including affected-area polygons.

### BOM observations

Provide station `lat` / `lon`, which can be converted into a GeoJSON Point.

### BOM warnings

May provide a named area without usable source geometry.

### BA position

The common model should support GeoJSON geometry without requiring every source to provide it.

That allows each source to keep the geographic information it actually has.

---

## 7.6 Public-event timestamps

The source timestamp differs by record type:

- VicEmergency creation time;
- BOM observation time;
- BOM warning issue time.

The normalised model uses one required field:

```text
publishedAt
```

### BA position

This is resolved through mapping.

`publishedAt` represents the main source time used for correlation. `updatedAt` and `expiresAt` remain optional because they are only available for some records.

---

## 7.7 Public-event naming differences

Public sources and service contracts use different field names for the same ideas.

Examples:

| Source / adapter concept | Common model            |
| ------------------------ | ----------------------- |
| `id`                     | `publicEventId`         |
| `source`                 | `publicEventSource`     |
| `kind`                   | `publicEventKind`       |
| `type`                   | `publicEventType`       |
| `status`                 | `eventStatus`           |
| `location.name`          | `location.locationName` |
| `location.geometry`      | `location.geometry`     |
| `publishedAt`            | `publishedAt`           |
| `measurements`           | `measurements`          |
| `raw`                    | `rawSourceRecord`       |

### BA position

This is not an unresolved gap.

The Common Data Model provides the translation layer.

## 7.8 NormalisedEvent to PublicEvent mapping

The current Public Data Adapter uses two different shapes for different purposes.

`NormalisedEvent` is the adapter's internal representation of source data.

`PublicEvent` is the current Team 15 contract published to the `public-events` Redis Stream.

The latest public-data assessment now defines the transformation between those two shapes, including:

- `id` → `eventId`;
- `type` → `eventType`;
- `severity` → `severity`;
- `location.geometry` → `area`;
- `publishedAt` → `publishedAt`.

The two shapes therefore do not need to become identical.

Two integration details still need to remain visible.

First, the merged `PublicEvent` contract requires `location` with `lat` and `lon`. A BOM warning that only supplies a named area and no usable geometry cannot naturally satisfy that requirement.

Second, BOM measurements such as temperature and wind exist in the internal normalised model but are not currently included in the published `PublicEvent` stream schema.

### BA position

Missing coordinates should not be invented simply to satisfy the existing `PublicEvent` schema.

If BOM measurements are required by the correlator, they also need a documented path from the Public Data Adapter to the correlator. Any change to that path should stay consistent with the agreed service architecture.

These are Team 15 technical integration issues, not Telstra clarification items.

---

## 8. Prototype-only fields and routes

Several fields and routes exist to make the prototype repeatable and usable.

Examples include:

- outage scenario-control routes;
- fleet scenario routes;
- project-generated outage IDs;
- outage and public-event map overlays;
- `affectedDevices`;
- `causeHint`;
- confidence scores;
- recommended-action enum values.

These are useful project features.

They are not fields or routes from the supplied Outage or LOC Swagger unless explicitly stated there.

### BA position

Keep provenance clear.

A project extension should be documented as a project contract rather than folded into the description of a supplied external API.

---

## 9. What actually needs clarification

Not every difference in this register should become a client question.

The items worth carrying as genuine specification questions are narrow.

## 9.1 Outage state enum

Confirm whether the intended value set uses:

```text
NAT
```

or:

```text
INT + OT
```

## 9.2 Outage `status` and `timestamp`

Confirm whether these fields belong in the intended Outage response contract or are only part of the v2 example/prototype response shape.

## 9.3 Outage affected-area geometry

If the project is expected to mirror a real Telstra-style integration later, confirm whether outage polygon geometry comes from another Telstra source or is expected to remain a prototype-derived map layer.

The following should not be raised as client questions by default:

- omission of standard HTTP headers in the prototype;
- stronger prototype requiredness;
- stronger MSISDN regex validation;
- URI validation for callback destinations;
- prototype scenario routes;
- internal canonical field names;
- internal outage IDs;
- internal recommended-action enum values;
- public-source field-name normalisation;
- BOM station selection logic;
- conversion of source coordinates into GeoJSON Points.

Those are project contract, normalisation or implementation choices.

The remaining public-data work is technical: confirm how BOM warnings without usable geometry are represented when `PublicEvent.location` requires coordinates, and define how BOM weather measurements reach the correlator when those measurements are not currently part of the published `PublicEvent` stream contract.

---

## 10. Requirements carried forward

The gap review leaves the following requirements clear enough to use for implementation and testing.

### GAP-REQ-01 - Preserve source contract meaning

The system shall preserve the externally defined meaning of supplied Outage and LOC fields at their API boundaries, even where internal canonical names differ.

### GAP-REQ-02 - Keep identifiers separate

The system shall not treat `deviceId`, `msisdn`, `subscriptionId`, public-event identifiers or project-generated outage identifiers as interchangeable values.

### GAP-REQ-03 - Resolve device location before Outage lookup

The system shall resolve the device's last-known GPS location into `suburb`, `state` and `postcode` before calling the Outage status operation.

### GAP-REQ-04 - Preserve evidence provenance

Each piece of correlation evidence shall retain enough source information to identify where it came from.

### GAP-REQ-05 - Keep source cause and final likely cause separate

The supplied Outage `root_cause` shall be treated as source evidence. It shall not automatically replace the final `likelyCause` produced by the correlator.

### GAP-REQ-06 - Preserve public-source geometry

Where a public source provides useful geometry, the adapter shall retain that geometry rather than reducing it unnecessarily.

### GAP-REQ-07 - Do not invent missing public geometry

Where a public source does not provide usable geometry, the adapter shall not create unsupported coordinates or polygons.

### GAP-REQ-08 - Keep weather observations separate from warnings

Measured weather values such as temperature and wind shall come from an observation source that actually provides those measurements rather than being inferred from warning text.

### GAP-REQ-09 - Preserve source-supported severity

Where a public source provides explicit severity, the system shall retain or normalise it through a documented rule. Severity shall remain optional for records where it does not apply.

### GAP-REQ-10 - Use a common public timestamp

Each normalised public record shall expose a `publishedAt` value mapped from the appropriate source creation, issue or observation time.

### GAP-REQ-11 - Support degraded evidence

The result model shall allow a useful verdict to be represented when one optional public source is unavailable, provided enough evidence remains.

### GAP-REQ-12 - Keep project extensions traceable

Project-generated fields and routes shall remain distinguishable from fields and operations defined by the supplied external contracts.

### GAP-REQ-13 - Keep unresolved source discrepancies visible

Unresolved differences between the v2 brief and supplied Swagger shall remain documented until confirmed rather than being silently removed from requirements or tests.

### GAP-REQ-14 - Carry weather measurements to the correlator

Where BOM weather measurements are used as correlation evidence, the system shall carry those values to the correlator through a documented integration path.

---

## 11. Current position

The core SafeCall flow is aligned across the main project sources:

```text
silent device
    ↓
identify device / MSISDN
    ↓
retrieve last-known GPS
    ↓
resolve suburb + state + postcode
    ↓
query Outage
    ↓
collect public evidence
        ├─ VicEmergency warnings / incidents
        ├─ BOM weather observations
        └─ BOM warning metadata
    ↓
correlate evidence
    ↓
likely cause + confidence + evidence + recommended action
```

Most of the remaining differences do not change that flow.

The genuine source-level questions are still narrow:

- the Outage state enum;
- the extra Outage response fields shown in v2;
- the provenance of outage-area geometry.

The public-data position is now much stronger.

VicEmergency provides the geometry needed for affected-area correlation. BOM observations provide actual measured weather values and station coordinates. BOM warnings provide warning metadata, with geographic matching depending on what geometry the selected warning product exposes.

The remaining public-data work is therefore mainly about technical matching and implementation detail, not about redefining the BA requirements.

That keeps the requirements usable without claiming more certainty than the source material supports.
