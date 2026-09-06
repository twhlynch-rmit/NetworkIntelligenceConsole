# Common Data Model

**Project:** Network Intelligence Console - Telstra Network-as-a-Product (NaaP)  
**Team:** Team 15  
**Prepared by:** Aditya Barot, Business Analyst  
**Sprint:** Sprint 1 - Week 2  
**Status:** Working common model for requirements, implementation and testing

## 1. Purpose

The project combines device telemetry, Telstra-style network information and public-event data that all arrive in different formats.

This document gives those sources a shared vocabulary.

It does not replace the supplied Outage or Loss of Connectivity contracts. External fields should still be accepted and returned using the names defined by their API contract. The common model is used after data crosses the service boundary so the rest of the system can work with one consistent meaning.

The model supports:

- the SafeCall silent-pendant flow;
- the Device Fleet Simulator;
- the mocked Outage API;
- the stretch Loss of Connectivity flow;
- the Public Data Adapter;
- the Root Cause Correlator;
- the Results API and dashboard;
- requirements traceability and testing.

## 2. Source basis

The model is based on:

- Telstra Project Brief v2;
- the active Sprint 1 Requirements Baseline;
- the supplied `outage-api-swagger.json`;
- the supplied `loss-of-connectivity-swagger.json`;
- the current Team 15 service contracts for the Fleet Simulator, Public Data Adapter, Correlator and Results API;
- the current public-data assessment for VicEmergency and Bureau of Meteorology sources.

Where those sources use different names for the same concept, this document proposes one internal name and records the mapping.

Where a source does not provide a value, the model does not invent one.

## 3. Core composition

The main identity and location chain is:

```text
MSISDN / device identifier
        ↓
last-known GPS
        ↓
suburb + state + postcode
        ↓
Outage API query
        ↓
network evidence
```

The wider incident flow is:

```text
Device Fleet Simulator
        │
        │ DeviceEvent
        ▼
device-events Redis Stream
        │
        ├──────────────────────────────┐
        │                              │
        │                    Public Data Adapter
        │                              │
        │                              │ PublicEvent
        │                              ▼
        │                    public-events Redis Stream
        │                              │
        └──────────────┬───────────────┘
                       ▼
              Root Cause Correlator
                + Outage evidence
                       │
                       ▼
                    Verdict
                       │
                       ▼
                 Results service
                       │
                       ▼
                   Dashboard
```

The Public Data Adapter may use `NormalisedEvent` internally when converting source-specific records. The current Team 15 stream contract publishes `PublicEvent` objects to the `public-events` Redis Stream.

The Loss of Connectivity API, if implemented, contributes a network event keyed by MSISDN. It does not provide device location.

## 4. Naming rules

The common model uses `camelCase` for internal field names.

Examples:

- `deviceId`
- `lastKnownLocation`
- `outageStartAt`
- `recommendedAction`

External names are not renamed at the API boundary.

Examples:

- Outage `start_timestamp` maps internally to `outageStartAt`;
- Outage `end_timestamp` maps internally to `outageEndAt`;
- LOC `notificationDestination` keeps the same meaning internally;
- public-feed source fields are normalised before downstream use.

Identifiers are kept separate. `deviceId`, `msisdn`, `subscriptionId`, public-event identifiers and any project-generated outage identifier are different concepts and must not be treated as interchangeable.

## 5. Device

A device represents one simulated SafeCall pendant.

| Canonical field     | Type       | Required | Meaning                                              | Main source                        |
| ------------------- | ---------- | -------- | ---------------------------------------------------- | ---------------------------------- |
| `deviceId`          | string     | Yes      | Team 15 identifier for the simulated pendant         | Fleet Simulator                    |
| `msisdn`            | string     | Yes      | Mobile-network identifier associated with the device | Fleet Simulator / LOC              |
| `deviceStatus`      | enum       | Yes      | Current simulated device state                       | Fleet Simulator                    |
| `lastKnownLocation` | `Location` | Yes      | Most recent location available for the device        | SafeCall-style simulated telemetry |
| `lastSeenAt`        | date-time  | Yes      | Time of the most recent heartbeat or observation     | Fleet Simulator                    |
| `assignedTo`        | string     | No       | Person or role associated with the pendant           | Fleet Simulator / scenario data    |
| `batteryPercent`    | integer    | No       | Simulated battery percentage                         | Fleet Simulator                    |
| `signalDbm`         | integer    | No       | Simulated signal strength in dBm                     | Fleet Simulator                    |

### 5.1 Device status vocabulary

| Value         | Meaning                                             |
| ------------- | --------------------------------------------------- |
| `ONLINE`      | Device is reporting normally                        |
| `MOVING`      | Device is reporting and movement is being simulated |
| `LOW_BATTERY` | Device is reporting but battery is low              |
| `SILENT`      | Device has stopped reporting as expected            |
| `OFFLINE`     | Device is treated as unavailable or disconnected    |

`SILENT` is the main trigger state for the SafeCall triage scenario.

### 5.2 Device field mapping

| Team 15 service field | Canonical field     |
| --------------------- | ------------------- |
| `deviceId`            | `deviceId`          |
| `msisdn`              | `msisdn`            |
| `status`              | `deviceStatus`      |
| `lastKnownLocation`   | `lastKnownLocation` |
| `lastSeenAt`          | `lastSeenAt`        |
| `assignedTo`          | `assignedTo`        |
| `battery`             | `batteryPercent`    |
| `signal`              | `signalDbm`         |

The canonical names `batteryPercent` and `signalDbm` make the units clear. A service can still expose `battery` and `signal` if that is its defined contract.

## 6. Device event

A `DeviceEvent` represents a state change published by the Fleet Simulator.

| Canonical field     | Type        | Required | Meaning                                    |
| ------------------- | ----------- | -------- | ------------------------------------------ |
| `deviceId`          | string      | Yes      | Device that produced the event             |
| `msisdn`            | string      | Yes      | Network identifier for that device         |
| `deviceStatus`      | enum        | Yes      | Device state after the event               |
| `lastKnownLocation` | `Location`  | Yes      | Latest available device location           |
| `lastSeenAt`        | date-time   | Yes      | Last heartbeat time                        |
| `assignedTo`        | string      | No       | Person or role associated with the pendant |
| `eventType`         | enum/string | Yes      | State change that produced the event       |
| `eventAt`           | date-time   | Yes      | Time the event was generated               |

Current event types are:

- `heartbeat`
- `movement`
- `battery`
- `signal-loss`
- `status-change`

The Team 15 service field `timestamp` maps to canonical `eventAt`.

## 7. Location

Location is the shared geographic model used when joining device, outage and public-event data.

| Canonical field  | Type             | Required                      | Meaning                                                               |
| ---------------- | ---------------- | ----------------------------- | --------------------------------------------------------------------- |
| `latitude`       | number           | Yes for a GPS device position | Latitude in decimal degrees                                           |
| `longitude`      | number           | Yes for a GPS device position | Longitude in decimal degrees                                          |
| `suburb`         | string           | Required before Outage lookup | Resolved suburb or town                                               |
| `state`          | string           | Required before Outage lookup | Australian state or territory code                                    |
| `postcode`       | string           | Required before Outage lookup | Four-digit Australian postcode                                        |
| `locationName`   | string           | No                            | Human-readable place, station or warning-area name                    |
| `locationSource` | string           | No                            | Where the location came from                                          |
| `geometry`       | GeoJSON geometry | No                            | Point, Polygon, MultiPolygon or other source geometry where available |

### 7.1 Important location rule

A GPS position is not enough to call the Outage API.

Before an Outage lookup, the system must have:

```text
suburb + state + postcode
```

The method used to derive those values from GPS is an implementation decision. The result must be available to the service making the Outage request.

The current Team 15 `Location` schema uses `lat` and `lon`. These map to:

- `lat` → `latitude`;
- `lon` → `longitude`;
- `source` → `locationSource`.

`state` is part of the canonical model because it is required by the Outage contract even if it is produced during geographic resolution rather than stored on the original device record.

### 7.2 Location provenance

Location should retain enough provenance to show where it came from.

Examples:

- `SafeCall device telemetry`
- `GPS-to-suburb resolver`
- `VicEmergency`
- `BOM weather station`

A derived suburb or postcode should not be presented as though it came directly from a GPS device.

## 8. Loss of Connectivity

Loss of Connectivity is stretch scope, but its vocabulary still matters because it uses the same MSISDN identity as the core device model.

### 8.1 LOC subscription

| Canonical field           | Type            | Required      | Meaning                                         | Supplied field             |
| ------------------------- | --------------- | ------------- | ----------------------------------------------- | -------------------------- |
| `monitoringType`          | string          | Yes           | Type of monitoring being requested              | `monitoringType`           |
| `msisdns`                 | array of string | Yes           | Devices included in the subscription request    | `subscriptions[].msisdn[]` |
| `notificationDestination` | URI/string      | Yes           | Callback destination for LOC events             | `notificationDestination`  |
| `subscriptionId`          | string          | Response-side | Identifier assigned to the created subscription | `subscriptionId`           |
| `subscriptionStatus`      | integer         | Response-side | Per-MSISDN result code                          | `status`                   |
| `correlationId`           | UUID/string     | Response-side | Request correlation value                       | `correlation-id`           |

The request can contain a batch of MSISDNs. A successful result is returned per individual MSISDN, so the request array and response scalar are not a conflict.

### 8.2 LOC event

| Canonical field                | Type      | Required     | Meaning                                 | Supplied field        |
| ------------------------------ | --------- | ------------ | --------------------------------------- | --------------------- |
| `subscriptionId`               | string    | Event-level  | Subscription that produced the callback | `subscriptionId`      |
| `monitoringType`               | string    | Report-level | LOC event type                          | `monitoringType`      |
| `msisdn`                       | string    | Report-level | Device affected by the event            | `msisdn`              |
| `lossOfConnectivityReasonCode` | integer   | No           | Network reason code, when supplied      | `lossOfConnectReason` |
| `eventAt`                      | date-time | Yes          | Time connectivity loss was reported     | `eventTime`           |

The supplied LOC contract carries no GPS, suburb, state or postcode. Those values must come from the device side of the system.

### 8.3 LOC reason codes

The supplied contract describes values `0` to `8` for `lossOfConnectReason`.

The common model keeps the numeric code and, if the implementation translates it, a human-readable reason.

Example:

```text
lossOfConnectivityReasonCode = 0
lossOfConnectivityReason = UE_DETACHED_MME
```

The numeric code should be preserved because it is the source value.

## 9. Outage query

The canonical Outage query is deliberately small because the supplied API only accepts geographic lookup data.

| Canonical field | Type        | Required       | Supplied field   |
| --------------- | ----------- | -------------- | ---------------- |
| `suburb`        | string      | Yes            | `suburb`         |
| `state`         | enum/string | Yes            | `state`          |
| `postcode`      | string      | Yes            | `postcode`       |
| `correlationId` | string      | Request header | `Correlation-Id` |

The Outage API is not queried by:

- `deviceId`;
- `msisdn`;
- GPS coordinates.

Those values belong to the composition logic around the API, not to the Outage request itself.

## 10. Outage record

An outage record is one item from any of the four supplied outage groups.

| Canonical field   | Type                           | Meaning                                 | Supplied field                                 |
| ----------------- | ------------------------------ | --------------------------------------- | ---------------------------------------------- |
| `state`           | string                         | State or territory code                 | `state`                                        |
| `suburb`          | string                         | Suburb or town                          | `suburb`                                       |
| `postcode`        | string                         | Postcode                                | `postcode`                                     |
| `outageStartAt`   | string/date-time value         | Start of outage                         | `start_timestamp`                              |
| `outageEndAt`     | string/date-time value or null | End of outage; null when ongoing        | `end_timestamp`                                |
| `rootCause`       | string                         | Cause reported by the outage source     | `root_cause`                                   |
| `durationSeconds` | integer                        | Outage duration in seconds              | `duration`                                     |
| `description`     | string                         | Human-readable outage description       | `description`                                  |
| `isPlanned`       | boolean                        | Whether the outage is planned           | `is_planned`                                   |
| `technology`      | string                         | Affected network technology             | `technology`                                   |
| `outageWindow`    | enum                           | Response collection containing the item | `current`, `past`, `near_future`, `far_future` |

`outageWindow` is an internal classification derived from the response array containing the record.

### 10.1 Outage response

| Canonical field     | Meaning                                                 |
| ------------------- | ------------------------------------------------------- |
| `correlationId`     | Correlation value returned with the outage response     |
| `statusCode`        | Response status where the prototype exposes it          |
| `generatedAt`       | Response generation time where the prototype exposes it |
| `currentOutages`    | Current outages                                         |
| `pastOutages`       | Past outages                                            |
| `nearFutureOutages` | Outages in the near-future window                       |
| `farFutureOutages`  | Outages in the far-future window                        |

The supplied Swagger defines the correlation value and four outage collections. The v2 brief also describes `status` and `timestamp`, which the prototype may expose. That difference is recorded in `API-ALIGNMENT-GAPS.md`.

## 11. Public data

The public-data layer now covers three distinct kinds of source record:

- VicEmergency warnings and incidents;
- BOM weather observations;
- BOM structured weather warnings.

These records should not be forced into identical source fields. The Public Data Adapter should preserve their meaning and normalise them into one shape before publishing them downstream.

### 11.1 Canonical public-data fields

| Canonical field     | Type                   | Required | Meaning                                                                        |
| ------------------- | ---------------------- | -------- | ------------------------------------------------------------------------------ |
| `publicEventId`     | string                 | Yes      | Stable identifier for deduplication and traceability                           |
| `publicEventSource` | enum/string            | Yes      | Upstream source, currently VicEmergency or BOM                                 |
| `publicEventKind`   | enum                   | Yes      | `warning`, `incident` or `observation`                                         |
| `publicEventType`   | string                 | Yes      | Source-supported event or observation type                                     |
| `title`             | string                 | Yes      | Short human-readable label                                                     |
| `description`       | string                 | No       | Additional source detail                                                       |
| `severity`          | string                 | No       | Source-supported severity where applicable                                     |
| `eventStatus`       | string/enum            | No       | Active, updated, resolved or unknown where a source supports lifecycle mapping |
| `location`          | `Location`             | No       | Point, named area or source geometry where available                           |
| `publishedAt`       | date-time              | Yes      | Creation, issue or observation time used as the main event timestamp           |
| `updatedAt`         | date-time              | No       | Latest source update time                                                      |
| `expiresAt`         | date-time              | No       | Source expiry time                                                             |
| `measurements`      | `WeatherMeasurements`  | No       | Structured BOM weather measurements                                            |
| `sourceUrl`         | URI/string             | No       | Link to the source product where useful                                        |
| `rawSourceRecord`   | source-specific object | No       | Original record retained for debugging and traceability                        |

### 11.2 Current merged PublicEvent contract

The current merged Team 15 Public Data Adapter contract uses the following `PublicEvent` fields:

- `eventId`
- `source`
- `eventType`
- `severity`
- `description`
- `location`
- `area`
- `publishedAt`

The merged contract currently requires `eventId`, `source`, `eventType`, `location` and `publishedAt`.

Its `location` object requires `lat` and `lon`.

The optional `area` field is used for GeoJSON polygon or multipolygon data where a source provides an affected area.

| Current Team 15 field | Canonical field           |
| --------------------- | ------------------------- |
| `eventId`             | `publicEventId`           |
| `source`              | `publicEventSource`       |
| `eventType`           | `publicEventType`         |
| `severity`            | `severity`                |
| `description`         | `description`             |
| `location.lat`        | `location.latitude`       |
| `location.lon`        | `location.longitude`      |
| `location.suburb`     | `location.suburb`         |
| `location.postcode`   | `location.postcode`       |
| `location.source`     | `location.locationSource` |
| `area`                | `location.geometry`       |
| `publishedAt`         | `publishedAt`             |

### 11.3 Current public-data assessment proposal

The newer public-data assessment proposes a richer normalised shape with:

- `id`
- `source`
- `kind`
- `type`
- `title`
- `description`
- `severity`
- `status`
- `location.name`
- `location.geometry`
- `publishedAt`
- `updatedAt`
- `expiresAt`
- `measurements`
- `sourceUrl`
- `raw`

The canonical mapping is:

| Proposed normalised field | Canonical field         |
| ------------------------- | ----------------------- |
| `id`                      | `publicEventId`         |
| `source`                  | `publicEventSource`     |
| `kind`                    | `publicEventKind`       |
| `type`                    | `publicEventType`       |
| `title`                   | `title`                 |
| `description`             | `description`           |
| `severity`                | `severity`              |
| `status`                  | `eventStatus`           |
| `location.name`           | `location.locationName` |
| `location.geometry`       | `location.geometry`     |
| `publishedAt`             | `publishedAt`           |
| `updatedAt`               | `updatedAt`             |
| `expiresAt`               | `expiresAt`             |
| `measurements`            | `measurements`          |
| `sourceUrl`               | `sourceUrl`             |
| `raw`                     | `rawSourceRecord`       |

The two shapes represent different layers and do not need to be identical. The latest public-data assessment now defines the transformation from the adapter's internal `NormalisedEvent` shape into the stream-facing `PublicEvent` contract.

For example, `id` maps to `eventId`, `type` maps to `eventType`, `location.geometry` maps to `area`, and `publishedAt` maps directly.

One edge case remains. The merged `PublicEvent` contract requires a `location` containing `lat` and `lon`, while a BOM warning may only provide a named warning area with no usable geometry. That case still needs an implementation rule or contract adjustment. Missing coordinates should not be invented simply to satisfy the schema.

## 12. VicEmergency

The current public-data assessment uses the VicEmergency live GeoJSON feed.

A response is a GeoJSON `FeatureCollection` containing one or more `Feature` objects.

A feature can contain source geometry and structured metadata. Representative fields include:

- `properties.id`;
- `properties.feedType`;
- `properties.cap.event`;
- `properties.cap.severity`;
- `properties.cap.urgency`;
- `properties.cap.certainty`;
- `properties.location`;
- `properties.created`;
- `properties.updated`;
- `properties.text`;
- the original GeoJSON geometry.

The geometry can include a point, polygon or geometry collection.

### 12.1 VicEmergency mapping

| VicEmergency source field                           | Canonical field                   |
| --------------------------------------------------- | --------------------------------- |
| `properties.id`                                     | `publicEventId`                   |
| constant `vicEmergency`                             | `publicEventSource`               |
| `properties.feedType`                               | `publicEventKind`                 |
| `properties.cap.event`                              | `publicEventType`                 |
| `properties.name` or event information              | `title`                           |
| `properties.text`                                   | `description`                     |
| `properties.cap.severity`                           | `severity`                        |
| explicit lifecycle data such as `properties.action` | `eventStatus` where safely mapped |
| `properties.location`                               | `location.locationName`           |
| source GeoJSON geometry                             | `location.geometry`               |
| `properties.created`                                | `publishedAt`                     |
| `properties.updated`                                | `updatedAt`                       |
| source expiry, where present                        | `expiresAt`                       |
| entire source feature                               | `rawSourceRecord`                 |

### 12.2 Geometry handling

VicEmergency geometry should be kept in its source form where practical.

This matters because different geometry types answer different questions:

- a `Point` can show where an incident is located;
- a `Polygon` or `MultiPolygon` can describe an affected area;
- a `GeometryCollection` can contain more than one spatial representation.

For point-in-area correlation, a source polygon is more useful than reducing the event to one point.

GeoJSON coordinates use longitude followed by latitude.

### 12.3 Severity and status

Where VicEmergency supplies an explicit CAP severity, the adapter should keep that value or map it through a documented normalisation rule.

For example:

```text
Minor → minor
```

Severity must not be guessed from unrelated fields such as category or incident size.

Status should also be handled conservatively. If an explicit source lifecycle value can be mapped safely, the adapter can use it. If the meaning is unclear, `unknown` is better than a guessed state.

## 13. Bureau of Meteorology observations

The current public-data assessment uses BOM weather observations as measured weather evidence.

The Ballarat observation product assessed for the prototype includes:

- station identifier;
- station name;
- observation timestamp;
- latitude;
- longitude;
- air temperature;
- apparent temperature;
- wind speed;
- wind gust;
- wind direction;
- rainfall;
- relative humidity;
- pressure.

This is different from a weather warning. An observation is a timestamped measurement from a station.

### 13.1 BOM observation mapping

| BOM observation field              | Canonical field                        |
| ---------------------------------- | -------------------------------------- |
| station ID + observation timestamp | `publicEventId`                        |
| constant `bom`                     | `publicEventSource`                    |
| constant `observation`             | `publicEventKind`                      |
| constant `weather-observation`     | `publicEventType`                      |
| station name                       | `title` / `location.locationName`      |
| `lon`, `lat`                       | `location.geometry` as GeoJSON Point   |
| observation timestamp              | `publishedAt`                          |
| `air_temp`                         | `measurements.temperatureC`            |
| `apparent_t`                       | `measurements.apparentTemperatureC`    |
| `wind_spd_kmh`                     | `measurements.windSpeedKmh`            |
| `gust_kmh`                         | `measurements.windGustKmh`             |
| `wind_dir`                         | `measurements.windDirection`           |
| `rain_trace`                       | `measurements.rainfallMm`              |
| `rel_hum`                          | `measurements.relativeHumidityPercent` |
| `press_msl`                        | `measurements.pressureHpa`             |
| entire observation record          | `rawSourceRecord`                      |

The station coordinates should be converted into a GeoJSON `Point`.

A deterministic event identifier can be built from the station identifier and observation timestamp.

### 13.2 Weather measurements

| Canonical field           | Type   | Required | Meaning                                 |
| ------------------------- | ------ | -------- | --------------------------------------- |
| `temperatureC`            | number | No       | Air temperature in degrees Celsius      |
| `apparentTemperatureC`    | number | No       | Apparent temperature in degrees Celsius |
| `windSpeedKmh`            | number | No       | Wind speed in kilometres per hour       |
| `windGustKmh`             | number | No       | Wind gust in kilometres per hour        |
| `windDirection`           | string | No       | Wind direction                          |
| `rainfallMm`              | number | No       | Rainfall in millimetres                 |
| `relativeHumidityPercent` | number | No       | Relative humidity percentage            |
| `pressureHpa`             | number | No       | Mean sea-level pressure in hPa          |

These fields are optional because an individual observation product may not contain every measurement.

The latest public-data assessment keeps these measurements in the internal `NormalisedEvent` model, but the current merged `PublicEvent` stream contract does not contain a `measurements` field. If BOM temperature, wind or other measurements are used by the correlator, the implementation needs a defined way to carry those values through the agreed integration path.

### 13.3 Geographic matching

BOM observations have station coordinates, so they can be compared geographically with the device location.

A sensible correlation approach is:

1. choose the nearest suitable observation station;
2. check the observation timestamp is recent enough for the incident;
3. use only the measurements that are actually present.

The distance calculation is derived data and should remain separate from the source observation.

## 14. Bureau of Meteorology warnings

BOM also publishes structured warning products.

The current assessment includes XML warning data with fields such as:

- warning identifier;
- issue time;
- expiry time;
- warning title;
- area description;
- hazard type;
- severity;
- urgency;
- certainty.

### 14.1 BOM warning mapping

| BOM warning field        | Canonical field         |
| ------------------------ | ----------------------- |
| warning identifier       | `publicEventId`         |
| constant `bom`           | `publicEventSource`     |
| constant `warning`       | `publicEventKind`       |
| hazard or warning type   | `publicEventType`       |
| warning title            | `title`                 |
| warning severity         | `severity`              |
| warning area description | `location.locationName` |
| issue time               | `publishedAt`           |
| expiry time              | `expiresAt`             |
| entire warning product   | `rawSourceRecord`       |

If a sampled warning product does not provide usable geometry, it should not be given invented coordinates or polygons.

A named warning area can still be retained as `locationName`.

VicEmergency remains the stronger source for direct affected-area polygon correlation where source geometry is available.

## 15. Evidence

Evidence is a normalised piece of information used to support a correlation result.

| Canonical field  | Type      | Required | Meaning                                           |
| ---------------- | --------- | -------- | ------------------------------------------------- |
| `evidenceSource` | string    | Yes      | Source that produced the evidence                 |
| `evidenceType`   | string    | Yes      | What the evidence represents                      |
| `evidenceEndsAt` | date-time | No       | End time where applicable                         |
| `distanceKm`     | number    | No       | Distance from the device to the evidence location |
| `severity`       | string    | No       | Source-supported severity                         |
| `temperatureC`   | number    | No       | Temperature evidence                              |
| `windSpeedKmh`   | number    | No       | Wind-speed evidence                               |

### 15.1 Mapping to the Results API

| Results API field | Canonical field  |
| ----------------- | ---------------- |
| `source`          | `evidenceSource` |
| `type`            | `evidenceType`   |
| `endsAt`          | `evidenceEndsAt` |
| `distanceKm`      | `distanceKm`     |
| `severity`        | `severity`       |
| `tempC`           | `temperatureC`   |
| `windKmh`         | `windSpeedKmh`   |

Every evidence item should identify at least its source and type.

Examples include:

- `TelstraOutageAPI`;
- `VicEmergency`;
- `BOM`;
- `DeviceFleetSimulator`.

BOM observations can contribute measured temperature and wind evidence. VicEmergency can contribute warning type, severity and affected-area geometry.

## 16. Correlation verdict

A verdict is the operator-facing result of combining the available evidence for a device.

| Canonical field      | Type                | Required                                                          | Meaning                                                    |
| -------------------- | ------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| `deviceId`           | string              | Yes                                                               | Device the verdict applies to                              |
| `msisdn`             | string              | Required for traceability; not necessarily a direct Verdict field | Network identifier for the device                          |
| `deviceStatus`       | enum                | Yes                                                               | Current device state                                       |
| `assignedTo`         | string              | No                                                                | Person or role associated with the pendant                 |
| `lastSeenAt`         | date-time           | Yes                                                               | Last device heartbeat                                      |
| `lastKnownLocation`  | `Location`          | Yes                                                               | Last known device location and resolved geographic context |
| `likelyCause`        | string              | Yes                                                               | Most likely explanation of the incident                    |
| `confidence`         | number 0-1          | Yes                                                               | Confidence in the likely-cause result                      |
| `evidence`           | array of `Evidence` | Yes                                                               | Information used to support the conclusion                 |
| `recommendedAction`  | enum/string         | Yes                                                               | Next action shown to the operator                          |
| `verdictGeneratedAt` | date-time           | Yes                                                               | Time the verdict was generated                             |

The Requirements Baseline requires likely cause, confidence, evidence and recommended action as part of the result.

The full MSISDN/device identifier → GPS → suburb/postcode chain must remain available for traceability even if a single response schema does not repeat every field.

### 16.1 Results API mapping

| Results API field           | Canonical field      |
| --------------------------- | -------------------- |
| `deviceId`                  | `deviceId`           |
| `assignedTo`                | `assignedTo`         |
| `status`                    | `deviceStatus`       |
| `lastSeenAt`                | `lastSeenAt`         |
| `lastKnownLocation`         | `lastKnownLocation`  |
| `verdict.likelyCause`       | `likelyCause`        |
| `verdict.confidence`        | `confidence`         |
| `verdict.evidence`          | `evidence`           |
| `verdict.recommendedAction` | `recommendedAction`  |
| `timestamp`                 | `verdictGeneratedAt` |

## 17. Recommended action

The current Team 15 action vocabulary is:

| Value                       | Meaning                                                                     |
| --------------------------- | --------------------------------------------------------------------------- |
| `MONITOR`                   | Continue observing the incident without immediate field action              |
| `DISPATCH_TECHNICIAN`       | Send a technician to investigate a likely device or local technical problem |
| `ESCALATE_TO_WELFARE_CHECK` | Escalate for a human welfare check                                          |
| `ALERT_SAFETY_COORDINATOR`  | Notify the responsible safety coordinator                                   |
| `WAIT_FOR_MAINTENANCE`      | Hold technical dispatch while a known maintenance window is active          |

The dashboard should present these as clear operator actions. The enum values are an internal contract; user-facing text can be more natural.

## 18. Map and overlay data

The dashboard needs map-ready data, but not every overlay field comes directly from an external API.

### 18.1 Outage overlay

The Team 15 Results API uses concepts such as:

- `outageId`;
- `type`;
- `status`;
- `affectedArea`;
- `causeHint`;
- `affectedDevices`.

The supplied Outage API does not define an outage identifier or polygon geometry.

If the prototype creates an outage polygon or outage ID for scenario and map purposes, that value should be marked as derived rather than presented as a field supplied by the external Outage contract.

### 18.2 Public-event overlay

Public-event overlays can use source geometry directly where it exists.

For VicEmergency, that can include source GeoJSON geometry.

For BOM observations, the station coordinates can be represented as a GeoJSON Point.

For BOM warnings without usable geometry, the warning-area name can still be retained, but the system should not invent map geometry.

## 19. Time handling

The source systems do not all use the same time representation.

Examples include:

- ISO 8601 date-time values;
- epoch values;
- human-readable Outage timestamps;
- compact BOM observation timestamps;
- XML warning issue and expiry times.

The internal rule is:

1. Preserve the original value where traceability matters.
2. Convert it to a standard date-time representation for internal comparison where possible.
3. Keep the source timezone or offset.
4. Do not assume a missing outage end time means the record is invalid. `end_timestamp = null` means the outage is ongoing.
5. Do not invent an expiry time for a public record that does not provide one.
6. Use `publishedAt` as the main public-data time field after normalisation.

For BOM observations, the observation timestamp maps to `publishedAt`.

For VicEmergency, the source creation time maps to `publishedAt`.

For BOM warnings, the issue time maps to `publishedAt`.

## 20. Null, optional and derived values

The model distinguishes three cases.

### Optional

The source may legitimately omit the value.

Examples:

- public-event severity where the source has none;
- public-event expiry;
- `assignedTo`;
- outage end time while the outage is ongoing;
- LOC reason code;
- individual weather measurements.

### Derived

The value is produced from another field or processing step.

Examples:

- GPS → suburb/state/postcode;
- Outage response array → `outageWindow`;
- station coordinates → GeoJSON Point;
- station ID + timestamp → deterministic public-event ID;
- point-to-station or point-to-event distance → `distanceKm`;
- project-generated outage polygon or outage ID.

### Unknown

The system does not have enough evidence to assign the value.

Unknown values should stay unknown. They should not be filled with guessed data simply to make the common model complete.

## 21. Evidence degradation

The Requirements Baseline says the system should still return a useful result if one public-data feed is unavailable, provided enough evidence remains.

The data model therefore cannot assume that every verdict contains every source.

A valid verdict may contain:

```text
device evidence + outage evidence
```

or:

```text
device evidence + VicEmergency evidence
```

or:

```text
device evidence + BOM observation evidence
```

or:

```text
device evidence + outage evidence + multiple public sources
```

The `evidence` array must show what was actually available.

A confidence score should reflect the evidence used by the correlator. Missing evidence should not be represented by made-up placeholder evidence.

## 22. Canonical vocabulary summary

| Concept                      | Canonical name       |
| ---------------------------- | -------------------- |
| Simulated pendant identifier | `deviceId`           |
| Mobile-network identifier    | `msisdn`             |
| LOC subscription identifier  | `subscriptionId`     |
| Device state                 | `deviceStatus`       |
| Last device heartbeat        | `lastSeenAt`         |
| GPS latitude                 | `latitude`           |
| GPS longitude                | `longitude`          |
| Resolved suburb              | `suburb`             |
| Resolved state               | `state`              |
| Resolved postcode            | `postcode`           |
| General source geometry      | `geometry`           |
| Outage start                 | `outageStartAt`      |
| Outage end                   | `outageEndAt`        |
| Outage cause                 | `rootCause`          |
| Outage planned flag          | `isPlanned`          |
| Public record identifier     | `publicEventId`      |
| Public source                | `publicEventSource`  |
| Public record kind           | `publicEventKind`    |
| Public record type           | `publicEventType`    |
| Main public timestamp        | `publishedAt`        |
| Weather values               | `measurements`       |
| Correlation cause            | `likelyCause`        |
| Correlation confidence       | `confidence`         |
| Supporting information       | `evidence`           |
| Operator action              | `recommendedAction`  |
| Verdict generation time      | `verdictGeneratedAt` |

## 23. Minimum data needed for the core SafeCall result

For the core Sprint 2 incident flow, the system should be able to produce or recover at least the following.

### Device context

- `deviceId`;
- `msisdn` or the relevant device/network identifier;
- `deviceStatus`;
- `lastSeenAt`;
- last-known latitude and longitude.

### Geographic context

- `suburb`;
- `state`;
- `postcode`.

### Outage context

- the applicable outage collection;
- outage timing;
- root cause;
- planned/unplanned status;
- affected technology.

### Public context

Depending on the source:

- event source;
- event kind;
- event type;
- useful geographic reference;
- `publishedAt`;
- source-supported severity;
- source geometry where available;
- weather measurements where available.

### Result

- `likelyCause`;
- `confidence`;
- `evidence`;
- `recommendedAction`;
- `verdictGeneratedAt`.

This supports the Requirements Baseline without forcing every public source into fields it does not actually provide.

## 24. Model checks for implementation and testing

The following checks can be used when service contracts and test fixtures are created:

1. A device record can be linked to an MSISDN without treating the two identifiers as the same field.
2. A silent device still retains its last-known GPS position and last-seen time.
3. GPS can be resolved into suburb, state and postcode before an Outage lookup.
4. Outage fields can be mapped without changing externally defined field names at the API boundary.
5. `end_timestamp = null` is accepted for an ongoing outage.
6. An LOC event can be joined back to a device through MSISDN without expecting LOC to provide location.
7. A VicEmergency feature retains source GeoJSON geometry instead of being reduced to a point-only model.
8. VicEmergency severity is only populated from a defensible source value.
9. A BOM observation can retain station location, observation time and available weather measurements.
10. A BOM warning without usable geometry is not given invented coordinates or polygons.
11. `publishedAt` is populated for each normalised public record.
12. Every evidence item identifies its source and type.
13. Every operator result contains likely cause, confidence, evidence and recommended action.
14. A useful result can still be represented when one optional evidence source is unavailable.
15. Project-derived fields such as outage overlays remain distinguishable from fields supplied by the external Outage contract.
16. BOM measurements used as correlation evidence can reach the correlator through a documented integration path rather than remaining only in the Public Data Adapter's internal model.

## 25. Items kept outside this document

This document defines shared meaning and mapping. It does not decide unresolved source-contract differences.

Items such as the exact Outage `state` enum where the v2 brief and supplied Swagger differ are recorded in:

`API-ALIGNMENT-GAPS.md`

Exact request headers, response codes, validation and supplied contract behaviour are recorded in:

`API-CONTRACT-REVIEW.md`
