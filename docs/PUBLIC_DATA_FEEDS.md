# PUBLIC DATA FEED ASSESSMENT

## OBJECTIVE

Assess candidate Australian public data feeds for the Network Intelligence Console and propose a common event shape for ingestion through the Public Data Adapter.

The initial assessment focuses on:

- Victorian emergency incident data
- Bureau of Meteorology weather and warning data

## Candidate Feeds

### 1. VicEmergency / CFA Incident Feed

**Purpose:**  
Provides current emergency incidents and planned burns across Victoria.

**Access methods:**

- JSON
- XML
- RSS 2.0

**Developer endpoints:**

- Incident JSON
- Incident XML
- Incident RSS

**Preferred prototype format:** JSON

**Refresh behaviour:**  
CFA states that its RSS feeds update every minute.

**Licence / access notes:**  
CFA's public RSS feeds are intended for personal, non-commercial use. Access to Victorian emergency data for third-party developers is managed by Emergency Management Victoria, so production use should be confirmed with the team/client before relying on the feed.

**Suitability:**  
High. The feed directly represents emergency incidents and aligns closely with the event-correlation purpose of the Network Intelligence Console.

### 2. Bureau of Meteorology

**Purpose:**  
Provides weather observations, forecasts and warnings that can be used to add environmental context to emergency and outage events.

**Access methods:**

- Web data products
- Anonymous FTP
- RSS warning feeds
- XML
- JSON observation products

**Preferred prototype format:** RSS, using the Victoria state-based weather warnings feed.

**Refresh behaviour:**  
Refresh frequency depends on the product. Warning feeds are updated as warnings are issued, while observational products update periodically.

**Licence / access notes:**  
Many Bureau products are available through anonymous services, but the Bureau states that these products are not for commercial use and does not guarantee availability of the anonymous service. Registered services are available for users requiring service continuity.

**Suitability:**  
High as a contextual source. Weather warnings and observations may help explain or correlate outages and emergency incidents caused by environmental events.

## VicEmergency Representative Payload

A sampled VicEmergency JSON response has the following top-level structure:

```json
{
	"results": [
		{
			"incidentNo": 291190,
			"lastUpdateDateTime": "30/08/2026 09:05:00",
			"originDateTime": "30/08/2026 09:05:00",
			"incidentType": "GRASS",
			"incidentLocation": "CORINELLA",
			"incidentStatus": "Responding",
			"incidentSize": "SMALL",
			"name": "CORINELLA RD",
			"territory": "CFA",
			"resourceCount": 2,
			"latitude": -38.42628962598518,
			"longitude": 145.46301493469034,
			"eventCode": "622",
			"fireDistrict": "Central",
			"municipality": "Bass Coast",
			"category1": "Fire",
			"category2": "Bushfire",
			"feedType": "incident",
			"agency": "CFA",
			"originStatus": "RESPONDING",
			"lastUpdatedDt": 1788044700000
		}
	]
}
```

The response is an object containing a `results` array. The adapter would iterate over this array and normalise each incident into the common event format.

Fields such as `lastUpdatedDtStr`, `originDateTimeStr`, `catg1CssClass` and `incidentSizeFmt` appear to be presentation-oriented and should not be relied on as core normalised fields.

## BOM Representative Payload

The selected Bureau of Meteorology source is the Victoria state-based weather warnings RSS feed.

A sampled response has the following top-level structure:

```xml
<rss version="2.0">
  <channel>
    <title>Weather Warnings for Victoria. Issued by the Australian Bureau of Meteorology</title>
    <pubDate>Sun, 30 Aug 2026 00:01:05 GMT</pubDate>
    <lastBuildDate>Sun, 30 Aug 2026 00:01:05 GMT</lastBuildDate>
    <ttl>10</ttl>

    <item>
      <title>28/12:23 EST Minor Flood Warning for the Kiewa River</title>
      <link>http://reg.bom.gov.au/vic/warnings/flood/kiewariver.shtml</link>
      <pubDate>Fri, 28 Aug 2026 02:23:37 GMT</pubDate>
      <guid isPermaLink="false">http://reg.bom.gov.au/vic/warnings/flood/kiewariver.shtml</guid>
    </item>
  </channel>
</rss>
```

The response is an RSS 2.0 document containing a `channel` element with one or more `item` elements. The adapter would iterate over each `item` and normalise it into the common event format.

The feed-level `ttl` value is currently `10`, indicating a suggested refresh interval of 10 minutes for RSS clients.

Unlike the VicEmergency JSON feed, the BOM RSS warning item is relatively small and does not directly expose coordinates, a dedicated status field, a dedicated severity field, or an expiry timestamp.

## Proposed Normalised Event Shape

Different public feeds use different field names and structures. The Public Data Adapter should convert source-specific records into a common event model before publishing them to Redis Streams.

```ts
export interface NormalisedEvent {
	id: string;
	source: 'vicemergency' | 'bom';

	type: string;
	title: string;
	description?: string;

	severity?: 'info' | 'minor' | 'moderate' | 'severe' | 'extreme';
	status?: 'active' | 'updated' | 'resolved' | 'unknown';

	location?: {
		latitude?: number;
		longitude?: number;
		name?: string;
	};

	issuedAt?: string;
	updatedAt?: string;
	expiresAt?: string;

	sourceUrl?: string;

	raw?: unknown;
}
```

### Why these fields?

`id` provides a stable identifier that can be used for deduplication.

`source` identifies which upstream feed produced the event.

`type` gives downstream services a common classification for events such as bushfires, floods, severe weather and planned burns.

`severity` provides a common warning scale where a source exposes enough information to map it reliably.

`status` allows downstream services to distinguish active, updated and resolved events.

`location` provides a consistent geographic structure for correlation and PostGIS-backed processing.

`issuedAt`, `updatedAt` and `expiresAt` support event ordering, freshness checks and stale-data handling.

`raw` preserves the original source record so source-specific information is not lost during normalisation.

## Representative Field Mapping

| Normalised field     | VicEmergency / CFA                                           | BOM Victoria Warnings RSS                                                                         |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `id`                 | `incidentNo`                                                 | `guid`                                                                                            |
| `source`             | Constant: `vicemergency`                                     | Constant: `bom`                                                                                   |
| `type`               | `category2` or `incidentType`                                | Derived from `title`                                                                              |
| `title`              | Combination of `category2`, `incidentLocation` and/or `name` | `title`                                                                                           |
| `description`        | Derived from available incident fields                       | Not present in sampled RSS item                                                                   |
| `severity`           | Not directly exposed in sampled incident payload             | Derived only when `title` contains an explicit level such as `Minor`, `Moderate` or `Major`       |
| `status`             | `originStatus` / `incidentStatus`                            | `active` while the warning is present in the current feed; lifecycle handling remains provisional |
| `location.name`      | `incidentLocation`                                           | Derived from `title`, for example `Kiewa River`                                                   |
| `location.latitude`  | `latitude`                                                   | Not present in sampled RSS item                                                                   |
| `location.longitude` | `longitude`                                                  | Not present in sampled RSS item                                                                   |
| `issuedAt`           | `originDateTime`                                             | `pubDate`                                                                                         |
| `updatedAt`          | `lastUpdatedDt`                                              | `pubDate`                                                                                         |
| `expiresAt`          | Not present in sampled incident payload                      | Not present in sampled RSS item                                                                   |
| `sourceUrl`          | Not present in sampled incident payload                      | `link`                                                                                            |
| `raw`                | Entire incident object                                       | Entire RSS `item`                                                                                 |

### VicEmergency Status Normalisation

Representative status values observed in the incident feed include:

| Source value                   | Normalised value |
| ------------------------------ | ---------------- |
| `Responding` / `RESPONDING`    | `active`         |
| `Under Control` / `CONTROLLED` | `updated`        |
| `Safe` / `SAFE`                | `resolved`       |
| Other / unknown values         | `unknown`        |

`originStatus` is preferred for machine-level normalisation because the sampled response provides consistent uppercase values such as `RESPONDING`, `CONTROLLED` and `SAFE`. `incidentStatus` can still be retained in `raw` for display or source-specific use.

### VicEmergency Severity Handling

The sampled VicEmergency incident payload does not expose a direct warning severity field. Fields such as `incidentSize`, `category1`, `category2` and incident status should not automatically be treated as severity.

Severity should therefore remain undefined unless a reliable warning-level field is available from another VicEmergency product or can be mapped from an explicitly documented warning classification.

### Example VicEmergency Normalisation

A source incident such as:

```json
{
	"incidentNo": 291190,
	"incidentType": "GRASS",
	"incidentLocation": "CORINELLA",
	"incidentStatus": "Responding",
	"category1": "Fire",
	"category2": "Bushfire",
	"latitude": -38.42628962598518,
	"longitude": 145.46301493469034,
	"originStatus": "RESPONDING",
	"originDateTime": "30/08/2026 09:05:00",
	"lastUpdatedDt": 1788044700000
}
```

could be normalised conceptually as:

```ts
{
  id: '291190',
  source: 'vicemergency',
  type: 'Bushfire',
  title: 'Bushfire - Corinella',
  status: 'active',
  location: {
    latitude: -38.42628962598518,
    longitude: 145.46301493469034,
    name: 'CORINELLA'
  },
  issuedAt: '<ISO-8601 timestamp>',
  updatedAt: '<ISO-8601 timestamp>',
  raw: originalRecord
}
```

The exact timestamp conversion is an implementation detail. Where available, machine-readable timestamps such as `lastUpdatedDt` should be preferred over display-oriented date strings.

### BOM Severity Handling

The BOM RSS warning feed does not expose a dedicated severity field.

Where the warning `title` explicitly contains a recognised level such as `Minor`, `Moderate` or `Major`, the adapter may map that term into the common severity model.

For example:

| BOM title term | Normalised severity |
| -------------- | ------------------- |
| `Minor`        | `minor`             |
| `Moderate`     | `moderate`          |
| `Major`        | `severe`            |

If no explicit severity term is present, severity should remain undefined rather than being inferred from unrelated wording.

### BOM Status and Lifecycle Handling

The sampled RSS item does not contain a dedicated status field.

A warning that appears in the current feed can provisionally be treated as `active`. If a previously observed warning no longer appears in a later feed response, the adapter may treat that as a possible resolution signal, but this behaviour should remain provisional until the Bureau's feed lifecycle semantics are confirmed.

The adapter should avoid marking a warning as resolved solely from absence unless the team agrees that this behaviour is acceptable.

### Example BOM Normalisation

A source warning such as:

```xml
<item>
  <title>28/12:23 EST Minor Flood Warning for the Kiewa River</title>
  <link>http://reg.bom.gov.au/vic/warnings/flood/kiewariver.shtml</link>
  <pubDate>Fri, 28 Aug 2026 02:23:37 GMT</pubDate>
  <guid isPermaLink="false">http://reg.bom.gov.au/vic/warnings/flood/kiewariver.shtml</guid>
</item>
```

could be normalised conceptually as:

```ts
{
  id: 'http://reg.bom.gov.au/vic/warnings/flood/kiewariver.shtml',
  source: 'bom',
  type: 'Flood Warning',
  title: 'Minor Flood Warning for the Kiewa River',
  severity: 'minor',
  status: 'active',
  location: {
    name: 'Kiewa River'
  },
  issuedAt: '2026-08-28T02:23:37Z',
  updatedAt: '2026-08-28T02:23:37Z',
  sourceUrl: 'http://reg.bom.gov.au/vic/warnings/flood/kiewariver.shtml',
  raw: originalRecord
}
```

The warning type, severity and location are derived from the structured wording of the RSS `title`, while `guid`, `pubDate` and `link` can be mapped directly.

## Adapter Design

Each external source should be implemented behind the same adapter interface.

```ts
export interface PublicDataAdapter<T> {
	readonly source: string;
	fetch(): Promise<T[]>;
	normalise(record: T): NormalisedEvent;
}

// VicEmergency adapter
export class VicEmergencyAdapter implements PublicDataAdapter<VicEmergencyIncident> {
	readonly source = 'vicemergency';

	async fetch(): Promise<VicEmergencyIncident[]> {
		// Source-specific fetch logic
		return [];
	}

	normalise(record: VicEmergencyIncident): NormalisedEvent {
		// Source-specific mapping
		throw new Error('Not implemented');
	}
}

// BOM adapter
export class BomAdapter implements PublicDataAdapter<BomWarning> {
	readonly source = 'bom';

	async fetch(): Promise<BomWarning[]> {
		// Source-specific fetch logic
		return [];
	}

	normalise(record: BomWarning): NormalisedEvent {
		// Source-specific mapping
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
Normalisation
    ↓
NormalisedEvent
    ↓
Redis Streams
    ↓
Downstream services / Correlator
```

Downstream services should only need to understand the normalised event shape rather than the individual structure of every upstream feed.

## Feed Failure and Fallback Behaviour

An unavailable external feed must not cause the Public Data Adapter service to fail completely.

When a feed request fails:

1. Record the feed name, timestamp and error in application logs.
2. Retry the failed feed using bounded exponential backoff.
3. Continue processing other configured feeds.
4. Do not generate guessed or synthetic events.
5. Preserve the last successfully processed state where useful.
6. Mark previously retrieved information as stale if it is retained.
7. Automatically resume normal ingestion when the upstream source becomes available again.

A provisional retry schedule is:

- 30 seconds
- 1 minute
- 2 minutes
- 5 minutes
- Maximum retry interval of 5 minutes

## Provisional Recommendation

For the initial prototype:

1. Use the VicEmergency/CFA incident JSON feed as the primary emergency-event source.
2. Use Bureau of Meteorology warning data as a secondary contextual source.
3. Normalise both sources into the proposed `NormalisedEvent` shape.
4. Publish normalised events to Redis Streams for downstream processing.
5. Confirm production access and licensing requirements with the team/client before treating either external feed as a permanent dependency.

Both mappings above are based on representative live responses: the VicEmergency/CFA incident JSON feed and the BOM Victoria weather warnings RSS feed. Production access, licensing and lifecycle assumptions should still be confirmed with the team/client before implementation.
