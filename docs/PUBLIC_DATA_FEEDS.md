# PUBLIC DATA FEED ASSESSMENT

## OBJECTIVE

Assess candidate Australian public data feeds for the Network Intelligence Console and propose a common event shape for the ingestion through the public data adapter.

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

**Refresh behaviour:**  
CFA states that its RSS feeds update every minute.

**Licence / access notes:**  
CFA's public RSS feeds are intended for personal, non-commercial use.
Access to Victorian emergency data for third-party developers is managed by
Emergency Management Victoria, so production use should be confirmed with the
team/client before relying on the feed.

**Suitability:**  
High. The feed directly represents emergency incidents and aligns closely with
the event-correlation purpose of the Network Intelligence Console.

### 2. Bureau of Meteorology

**Purpose:**  
Provides weather observations, forecasts and warnings that can be used to add
environmental context to emergency and outage events.

**Access methods:**

- Web data products
- Anonymous FTP
- RSS warning feeds
- XML
- JSON observation products

**Refresh behaviour:**  
Refresh frequency depends on the product. Warning feeds are updated as warnings
are issued, while observational products update periodically.

**Licence / access notes:**  
Many Bureau products are available through anonymous services, but the Bureau
states that these products are not for commercial use and does not guarantee
availability of the anonymous service. Registered services are available for
users requiring service continuity.

**Suitability:**  
High as a contextual source. Weather warnings and observations may help explain
or correlate outages and emergency incidents caused by environmental events.

## Proposed Normalised Event Shape

Different public feeds use different field names and structures. The Public
Data Adapter should convert source-specific records into a common event model
before publishing them to Redis Streams.

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

`id` gives us deduplication.

`source` tells downstream services who produced the event.

`type` lets us distinguish things like:

```text
bushfire
flood-warning
severe-weather
planned-burn
```

severity` provides a common warning scale for downstream services.

`status` allows consumers to distinguish active, updated and resolved events.

`location` provides a consistent geographic structure for correlation and
PostGIS-backed processing.

`issuedAt`, `updatedAt` and `expiresAt` support freshness, ordering and stale
data detection.

`raw` preserves the original source record so source-specific information is
not lost during normalisation.

## Representative Field Mapping

| Normalised field     | VicEmergency / CFA                 | BOM                                  |
| -------------------- | ---------------------------------- | ------------------------------------ |
| `id`                 | Incident identifier                | Product / warning identifier         |
| `source`             | `vicemergency`                     | `bom`                                |
| `type`               | Incident type                      | Warning or observation type          |
| `title`              | Incident title / category          | Warning headline                     |
| `description`        | Incident description               | Warning description                  |
| `severity`           | Warning level where available      | Derived only where clearly supported |
| `status`             | Incident status                    | Warning status where available       |
| `location.name`      | Locality / location                | Warning area or station              |
| `location.latitude`  | Incident latitude where available  | Coordinates where available          |
| `location.longitude` | Incident longitude where available | Coordinates where available          |
| `issuedAt`           | Incident creation / issue time     | Product issue time                   |
| `updatedAt`          | Last update time                   | Product update time                  |
| `expiresAt`          | If provided                        | Warning expiry where provided        |
| `sourceUrl`          | Original incident URL              | BOM product URL                      |
| `raw`                | Original source record             | Original source record               |

## Adapter Design

Each external source should be implemented behind the same adapter interface.

```ts
export interface PublicDataAdapter<T> {
	fetch(): Promise<T[]>;
	normalise(record: T): NormalisedEvent;
}

//VicEmergency Adapter
export class VicEmergencyAdapter implements PublicDataAdapter<VicEmergencyIncident> {
	async fetch(): Promise<VicEmergencyIncident[]> {
		// Source-specific fetch logic
		return [];
	}

	normalise(record: VicEmergencyIncident): NormalisedEvent {
		// Source-specific mapping
		throw new Error('Not implemented');
	}
}
// Preferred prototype format: JSON

//BOM Adapter
export class BomAdapter implements PublicDataAdapter<BomWarning> {
	async fetch(): Promise<BomWarning[]> {
		return [];
	}

	normalise(record: BomWarning): NormalisedEvent {
		throw new Error('Not implemented');
	}
}
//Preferred prototype format: RSS or JSON, depending on the selected BOM product
```

## Feed Failure and Fallback Behaviour

An unavailable external feed must not cause the Public Data Adapter service to
fail completely.

When a feed request fails:

1. Record the feed name, timestamp and error in application logs.
2. Retry the failed feed using bounded exponential backoff.
3. Continue processing other configured feeds.
4. Do not generate guessed or synthetic events.
5. Preserve the last successfully processed state where useful.
6. Mark previously retrieved information as stale if it is retained.
7. Automatically resume normal ingestion when the upstream source becomes
   available again.

A provisional retry schedule is:

- 30 seconds
- 1 minute
- 2 minutes
- 5 minutes
- maximum retry interval of 5 minutes

## Provisional Recommendation

For the initial prototype:

1. Use the VicEmergency/CFA incident JSON feed as the primary emergency-event
   source.
2. Use Bureau of Meteorology warning data as a secondary contextual source.
3. Normalise both sources into the proposed `NormalisedEvent` shape.
4. Publish normalised events to Redis Streams for downstream processing.
5. Confirm production access and licensing requirements with the team/client
   before treating either external feed as a permanent dependency.
