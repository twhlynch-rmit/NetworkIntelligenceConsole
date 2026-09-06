# PUBLIC DATA FEED ASSESSMENT

## Objective

Assess candidate Australian public data feeds for the Network Intelligence Console and propose a common event shape for ingestion through the Public Data Adapter.

The assessment focuses on:

- VicEmergency warnings and incidents
- Bureau of Meteorology weather observations and warnings

## Candidate Feeds

### 1. VicEmergency GeoJSON Feed

**Purpose:**  
Provides current emergency warnings and incidents across Victoria, including fires, floods, storms, hazardous-material incidents and other emergency events.

**Access method:**

- Public HTTP feed
- GeoJSON

**Preferred prototype format:** GeoJSON

**Refresh behaviour:**  
The project brief identifies the VicEmergency GeoJSON feed as updating approximately every 60 seconds.

**Licence / access notes:**  
The project brief identifies the VicEmergency GeoJSON feed as Creative Commons Attribution 3.0 Australia (CC BY 3.0 AU). Appropriate attribution must be provided when using or displaying VicEmergency data.

**Suitability:**  
High. The feed provides emergency information together with affected-area geometry, allowing the Root Cause Correlator to test whether a device's last-known GPS position overlaps an active warning area.

### 2. Bureau of Meteorology Weather Observations and Warnings

**Purpose:**  
Provides measured weather observations and structured weather warnings that add environmental context to emergency and outage events.

Relevant measurements include:

- air temperature
- wind speed and direction
- wind gust
- rainfall
- humidity
- pressure

**Access methods:**

- Web data products
- JSON observation products
- Structured XML warning products
- FTP / data services where applicable

**Preferred prototype formats:** JSON weather observations and structured XML warning products.

For the prototype, the Ballarat weather observation product (`IDV60801`) was assessed because it provides station coordinates and the measurements required by the project's hero scenario.

**Refresh behaviour:**  
Observation products contain timestamped measurements that update periodically. The adapter should use the observation timestamp when determining freshness.

**Licence / access notes:**  
The sampled BOM response includes Bureau of Meteorology copyright and disclaimer information. The project brief identifies BOM public-feed use as non-commercial.

**Suitability:**  
High. The feed provides station location, temperature, wind and other measured weather data that can be correlated with a device's last-known location.

## VicEmergency Representative Payload

A sampled VicEmergency GeoJSON response has the following structure:

```json
{
	"type": "FeatureCollection",
	"features": [
		{
			"type": "Feature",
			"geometry": {
				"type": "GeometryCollection",
				"geometries": [
					{
						"type": "Point",
						"coordinates": [147.1975, -36.75125]
					},
					{
						"type": "Polygon",
						"coordinates": [["... affected-area coordinates ..."]]
					}
				]
			},
			"properties": {
				"feedType": "warning",
				"cap": {
					"category": "Met",
					"event": "Riverine Flood",
					"urgency": "Expected",
					"severity": "Minor",
					"certainty": "Unknown",
					"responseType": "Monitor"
				},
				"sourceOrg": "EMV",
				"sourceId": "43095",
				"id": "43095",
				"category1": "Advice",
				"category2": "Met",
				"status": "Minor",
				"name": "Advice",
				"action": "Threat Is Reduced",
				"location": "Kiewa River to Mongans bridge",
				"created": "2026-09-06T10:30:24+10:00",
				"updated": "2026-09-06T10:30:25+10:00",
				"text": "ADVICE - RIVERINE FLOOD - Threat Is Reduced..."
			}
		}
	]
}
```

The response is a GeoJSON `FeatureCollection` containing one or more `Feature` objects.

Features may include a `GeometryCollection` with both point and polygon geometry. The polygon is particularly useful because it allows the correlator to test whether a device is inside an affected warning area.

GeoJSON coordinates use longitude followed by latitude.

Fields under `properties.cap`, such as `event`, `severity`, `urgency` and `certainty`, provide structured warning metadata for normalisation.

## BOM Representative Payload

The selected BOM source is the Ballarat weather observations JSON product (`IDV60801`).

A sampled response has the following structure:

```json
{
	"observations": {
		"notice": [
			{
				"copyright": "Copyright Commonwealth of Australia 2026, Bureau of Meteorology."
			}
		],
		"header": [
			{
				"ID": "IDV60801",
				"main_ID": "IDV60800",
				"name": "Ballarat",
				"product_name": "Weather Observations",
				"state": "Victoria"
			}
		],
		"data": [
			{
				"wmo": 94852,
				"name": "Ballarat",
				"history_product": "IDV60801",
				"local_date_time_full": "20260906193000",
				"aifstime_utc": "20260906093000",
				"lat": -37.5,
				"lon": 143.8,
				"apparent_t": 8.6,
				"gust_kmh": 9,
				"air_temp": 10.4,
				"dewpt": 8.0,
				"press_msl": 1023.7,
				"rain_trace": "0.0",
				"rel_hum": 85,
				"wind_dir": "SW",
				"wind_spd_kmh": 7
			}
		]
	}
}
```

The response contains an `observations` object with `notice`, `header` and `data` sections.

The `header` identifies the observation product and location, while `data` contains timestamped station observations.

Each observation includes station coordinates and measured values such as temperature, wind speed, direction and gust.

## BOM Warning Representative Payload

BOM also publishes structured XML warning products. A sampled Victorian warning product (`IDV36810.xml`) contained a final flood warning for the Loddon River.

A shortened representative payload is:

```xml
<product>
  <amoc>
    <identifier>IDV36810</identifier>
    <issue-time-utc>2026-09-05T23:10:52Z</issue-time-utc>
    <expiry-time>2026-09-07T02:10:52Z</expiry-time>
    <status>O</status>
    <phase>FIN</phase>
  </amoc>

  <warning>
    <warning-info>
      <text type="warning_title">
        Final Flood Warning for the Loddon River
      </text>
    </warning-info>

    <area description="Loddon River" type="river-basin">
      <forecast-period>
        <element type="severity">Below Minor</element>
      </forecast-period>

      <hazard
        type="FLW"
        severity="BLWMIN"
        urgency="UNK"
        certainty="UNK">
      </hazard>
    </area>
  </warning>
</product>
```

## Proposed Normalised Event Shape

Different public feeds use different structures. The Public Data Adapter should convert source-specific records into a common model before publishing them to Redis Streams.

```ts
type NormalisedSource = 'vicEmergency' | 'bom';

type NormalisedKind = 'warning' | 'incident' | 'observation';

export interface NormalisedEvent {
	id: string;
	source: NormalisedSource;
	kind: NormalisedKind;

	type: string;
	title: string;
	description?: string;

	severity?: string;
	status?: 'active' | 'updated' | 'resolved' | 'unknown';

	location?: {
		name?: string;
		geometry?: GeoJSON.Geometry;
	};

	publishedAt: string;
	updatedAt?: string;
	expiresAt?: string;

	measurements?: {
		tempC?: number;
		apparentTempC?: number;
		windKmh?: number;
		windGustKmh?: number;
		windDirection?: string;
		rainfallMm?: number;
		relativeHumidityPct?: number;
		pressureHpa?: number;
	};

	sourceUrl?: string;
	raw?: unknown;
}
```

### Why these fields?

`id` provides a stable identifier for deduplication.

`source` identifies the upstream feed.

`kind` distinguishes warnings, incidents and observations, while `type` preserves the source-specific classification.

`location.geometry` uses GeoJSON so the same model can support BOM station points and VicEmergency polygons or geometry collections.

`publishedAt` provides a required timestamp for every normalised event. For VicEmergency it maps to the event creation time, BOM observations use the observation timestamp, and BOM warnings use the warning issue time.

`updatedAt` and `expiresAt` remain optional because they are only available for some event types.

`measurements` stores structured weather values. `raw` preserves the original source record for debugging and traceability.

## NormalisedEvent to PublicEvent Mapping

The `NormalisedEvent` TypeScript interface is the adapter layer's internal
shape. The `PublicEvent` schema in `public-data-adapter.yaml` is the contract
published to the `public-events` Redis Stream.

The adapter must transform `NormalisedEvent` into `PublicEvent` before publishing:

| NormalisedEvent field | PublicEvent field | Notes                                                        |
| --------------------- | ----------------- | ------------------------------------------------------------ |
| `id`                  | `eventId`         | Direct mapping                                               |
| `source`              | `source`          | Direct mapping                                               |
| `type`                | `eventType`       | Map CAP event type or `weather-observation`                  |
| `severity`            | `severity`        | Direct mapping                                               |
| `description`         | `description`     | Use `text` from VicEmergency or generate from measurements   |
| `location.name`       | -                 | Not in PublicEvent; available in `raw`                       |
| `location.geometry`   | `area`            | GeoJSON geometry (polygon or point)                          |
| `location`            | `location`        | Point or compute centroid from geometry                      |
| `publishedAt`         | `publishedAt`     | Direct mapping                                               |
| `measurements`        | -                 | Not in PublicEvent; available in `raw` for correlator access |
| `kind`                | -                 | Used internally; not in PublicEvent                          |
| `status`              | -                 | Used internally; not in PublicEvent                          |
| `raw`                 | -                 | Retained by adapter for debugging; not published to stream   |

Fields not mapped to `PublicEvent` (such as `measurements` and `status`) are
available in the adapter's internal processing and can be accessed by the
correlator if it reads from the adapter directly rather than the Redis Stream.

## Representative Field Mapping

| Normalised field       | VicEmergency GeoJSON                  | BOM Observations            | BOM Warnings                     |
| ---------------------- | ------------------------------------- | --------------------------- | -------------------------------- |
| `id`                   | `properties.id`                       | `wmo` + timestamp           | `amoc.identifier`                |
| `source`               | `vicEmergency`                        | `bom`                       | `bom`                            |
| `kind`                 | Mapped from `properties.feedType`     | `observation`               | `warning`                        |
| `type`                 | `properties.cap.event`                | `weather-observation`       | Mapped from hazard type          |
| `title`                | `properties.name` / event information | Generated from station name | `warning_title`                  |
| `severity`             | `properties.cap.severity`             | Not applicable              | Warning severity                 |
| `location.name`        | `properties.location`                 | Station name                | Warning area description         |
| `location.geometry`    | Source GeoJSON geometry               | Point from `lon`, `lat`     | Not available in sampled warning |
| `publishedAt`          | `properties.created`                  | `aifstime_utc`              | `amoc.issue-time-utc`            |
| `updatedAt`            | `properties.updated`                  | Not applicable              | Not applicable                   |
| `expiresAt`            | Source expiry where available         | Not applicable              | `amoc.expiry-time`               |
| `measurements.tempC`   | Not applicable                        | `air_temp`                  | Not applicable                   |
| `measurements.windKmh` | Not applicable                        | `wind_spd_kmh`              | Not applicable                   |
| `raw`                  | Entire `Feature`                      | Entire observation object   | Entire warning product           |

## VicEmergency Severity and Status Handling

VicEmergency warning features may expose structured CAP metadata such as:

- `properties.cap.severity`
- `properties.cap.urgency`
- `properties.cap.certainty`
- `properties.action`

Where an explicit severity is available, the adapter should use that source value rather than infer severity from unrelated fields.

For example:

```json
{
	"urgency": "Expected",
	"severity": "Minor",
	"certainty": "Unknown"
}
```

Known severity values may be normalised to lowercase application values, for example `Minor` to `minor`.

Status should be handled conservatively using explicit lifecycle information such as `properties.action`. If the source meaning is unclear, the adapter should use `unknown` rather than guess.

## Example VicEmergency Normalisation

A VicEmergency warning feature can be normalised conceptually as:

```ts
{
  id: '43095',
  source: 'vicEmergency',
  kind: 'warning',
  type: 'Riverine Flood',
  title: 'Advice',
  description: 'ADVICE - RIVERINE FLOOD - Threat Is Reduced...',
  severity: 'minor',

  location: {
    name: 'Kiewa River to Mongans bridge',
    geometry: originalFeature.geometry
  },

  publishedAt: '2026-09-06T10:30:24+10:00',

  raw: originalFeature
}
```

The original GeoJSON geometry is retained so downstream services can use the warning polygon for spatial correlation.

## BOM Observation Handling

BOM weather observations are measurements rather than warning events, so they do not normally require warning severity or lifecycle status.

The adapter should focus on:

- observation timestamp
- station location
- temperature
- wind speed, direction and gust
- rainfall
- humidity
- pressure

The observation timestamp should be used to determine whether the data is fresh enough to be relevant.

## Example BOM Normalisation

A BOM observation can be normalised conceptually as:

```ts
{
  id: 'bom:94852:20260906093000',
  source: 'bom',
  kind: 'observation',
  type: 'weather-observation',
  title: 'Weather observation - Ballarat',

  location: {
    name: 'Ballarat',
    geometry: {
      type: 'Point',
      coordinates: [143.8, -37.5]
    }
  },

  publishedAt: '2026-09-06T09:30:00Z',

  measurements: {
    tempC: 10.4,
    apparentTempC: 8.6,
    windKmh: 7,
    windGustKmh: 9,
    windDirection: 'SW',
    rainfallMm: 0,
    relativeHumidityPct: 85,
    pressureHpa: 1023.7
  },

  raw: originalObservation
}
```

The normalised ID is constructed from the station identifier and observation timestamp for deterministic deduplication.

The station coordinates are converted into a GeoJSON `Point`, while weather values are stored under `measurements`.

## Adapter Design

Each external source should be implemented behind the same adapter interface.

```ts
export interface PublicDataAdapter<T> {
	readonly source: string;
	fetch(): Promise<T[]>;
	normalise(record: T): NormalisedEvent;
}

// VicEmergency adapter
export class VicEmergencyAdapter implements PublicDataAdapter<GeoJSON.Feature> {
	readonly source = 'vicEmergency';

	async fetch(): Promise<GeoJSON.Feature[]> {
		// Fetch and validate the GeoJSON FeatureCollection.
		return [];
	}

	normalise(feature: GeoJSON.Feature): NormalisedEvent {
		// Preserve source geometry for spatial correlation.
		throw new Error('Not implemented');
	}
}

export interface BomObservation {
	wmo: number;
	name: string;
	aifstime_utc: string;
	lat: number;
	lon: number;
	air_temp?: number;
	apparent_t?: number;
	wind_spd_kmh?: number;
	gust_kmh?: number;
	wind_dir?: string;
	rain_trace?: string;
	rel_hum?: number;
	press_msl?: number;
}

// BOM adapter
export class BomObservationAdapter implements PublicDataAdapter<BomObservation> {
	readonly source = 'bom';

	async fetch(): Promise<BomObservation[]> {
		// Fetch configured BOM weather observation data.
		return [];
	}

	normalise(record: BomObservation): NormalisedEvent {
		// Convert station coordinates to a GeoJSON Point
		// and map weather measurements into the common schema.
		throw new Error('Not implemented');
	}
}

export interface BomWarningProduct {
	identifier: string;
	publishedAt: string;
	expiresAt?: string;
	title: string;
	severity?: string;
	area?: string;
}

export class BomWarningAdapter implements PublicDataAdapter<BomWarningProduct> {
	readonly source = 'bom';

	async fetch(): Promise<BomWarningProduct[]> {
		// Fetch configured BOM XML warning products.
		return [];
	}

	normalise(record: BomWarningProduct): NormalisedEvent {
		// Map BOM warning metadata into the common schema.
		throw new Error('Not implemented');
	}
}
```

The intended flow is:

```text
External Feed
    ↓
Source-specific Adapter
    ↓
Validation
    ↓
Normalisation
    ↓
NormalisedEvent
    ↓
Redis Streams
    ↓
Correlator / Dashboard
```

Downstream services should consume the normalised event shape rather than depend directly on source-specific fields.

## Spatial Correlation Approach

The two feeds provide different forms of spatial evidence.

For VicEmergency:

```text
Device GPS point
    +
VicEmergency warning polygon
    ↓
Point-in-polygon check
    ↓
Inside / outside affected area
```

For BOM:

```text
Device GPS point
    +
BOM station point
    ↓
Nearest suitable station
    +
Freshness check
    ↓
Weather evidence
```

For BOM observations, the correlator selects the nearest suitable weather station and checks that the observation is sufficiently recent.

BOM warnings provide additional warning context for named affected areas. Where a warning product does not provide usable geometry, it should not be used for direct point-in-polygon matching. VicEmergency remains the primary source for affected-area polygon correlation.

## Feed Failure and Fallback Behaviour

An unavailable public feed must not cause the adapter service or correlator to fail completely.

When a feed request fails:

1. Record the feed name, timestamp and error.
2. Retry using bounded exponential backoff.
3. Continue processing other configured feeds.
4. Do not generate guessed or synthetic events.
5. Preserve the last successful state where useful.
6. Mark retained data as stale.
7. Do not treat stale data as equally strong evidence as current data.
8. Resume normal ingestion when the feed recovers.

A provisional retry schedule is:

- 30 seconds
- 1 minute
- 2 minutes
- 5 minutes
- Maximum retry interval of 5 minutes

If VicEmergency is unavailable, the correlator should still be able to use device state, Telstra outage data and BOM observations.

If BOM is unavailable, the correlator should still be able to use device state, Telstra outage data and VicEmergency events.

A missing feed may reduce confidence, but should not prevent the correlator from producing a verdict using the remaining evidence.

## Provisional Recommendation

For the initial prototype:

1. Use **VicEmergency GeoJSON** as the primary emergency-event source because it provides structured warning information and affected-area geometry.
2. Use **BOM weather observations JSON** for measured weather conditions such as temperature and wind.
3. Use **BOM structured XML warning products** for additional weather-warning context.
4. Normalise all public-feed records into `NormalisedEvent`.
5. Preserve VicEmergency geometry for point-in-polygon correlation.
6. Associate BOM observations with devices using nearest-station and freshness checks.
7. Publish normalised events to Redis Streams.

## SOURCES

1. Vic Emergency live GeoJSON feed.
   https://emergency.vic.gov.au/public/events-geojson.json
2. BOM Ballarat weather observations.
   https://www.bom.gov.au/products/IDV60801/IDV60801.94852.shtml
3. Ballarat observation JSON product.
   https://www.bom.gov.au/fwo/IDV60801/IDV60801.94852.json
4. BOM weather data services documentation.
   https://www.bom.gov.au/catalogue/data-feeds.shtml
5. BOM warning products user guide
   https://www.bom.gov.au/catalogue/Bureau_of_Meteorology_warning_products_user_guide.pdf
6. BOM warning product: `IDV36810.xml`
   FTP host: `ftp.bom.gov.au`  
   Path: `/anon/gen/fwo/`
