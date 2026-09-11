import cors from 'cors';
import express from 'express';
import { createLogger, checkDependency } from '@nic/shared';
import { createClient } from 'redis';

export const SERVICE_NAME = 'results-api';

let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisStatus() {
	const ok = await checkDependency(async () => {
		if (!redisClient) {
			redisClient = createClient({
				url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
			});
			redisClient.on('error', () => {});
			await redisClient.connect();
		}
		await redisClient.ping();
	});
	if (!ok) {
		try {
			redisClient?.destroy();
		} catch {
			/* ignore */
		}
		redisClient = null;
	}
	return ok;
}

const stubVerdict = {
	deviceId: 'SC-P-4821',
	assignedTo: 'Nurse - Ballarat South',
	status: 'SILENT',
	lastSeenAt: '2026-08-30T16:12:00+10:00',
	lastKnownLocation: {
		lat: -37.5622,
		lon: 143.8503,
		suburb: 'Ballarat',
		postcode: '3350',
		source: 'SafeCall device telemetry',
	},
	verdict: {
		likelyCause: 'Network outage overlapping active bushfire warning',
		confidence: 0.91,
		evidence: [
			{
				source: 'TelstraOutageAPI',
				type: 'network-outage',
				distanceKm: 0.8,
				severity: 'active',
			},
		],
		recommendedAction: 'ESCALATE_TO_WELFARE_CHECK',
	},
	timestamp: '2026-08-30T16:12:30+10:00',
};

const stubStats = {
	totalDevices: 1000,
	statusCounts: {
		ONLINE: 850,
		MOVING: 100,
		LOW_BATTERY: 30,
		SILENT: 15,
		OFFLINE: 5,
	},
	actionCounts: {
		MONITOR: 850,
		DISPATCH_TECHNICIAN: 50,
		ESCALATE_TO_WELFARE_CHECK: 15,
	},
};

const stubOutage = {
	outageId: 'OUT-2026-001',
	type: 'planned-maintenance',
	status: 'active',
	affectedArea: {
		type: 'Polygon',
		coordinates: [
			[
				[143.84, -37.56],
				[143.86, -37.56],
				[143.86, -37.55],
				[143.84, -37.55],
				[143.84, -37.56],
			],
		],
	},
	causeHint: 'Hardware upgrade',
	affectedDevices: 45,
};

const stubPublicEvent = {
	eventId: 'VE2026-001',
	source: 'vicEmergency',
	eventType: 'bushfire',
	location: {
		lat: -37.5622,
		lon: 143.8503,
		suburb: 'Ballarat',
		postcode: '3350',
	},
	area: {
		type: 'Polygon',
		coordinates: [
			[
				[143.82, -37.58],
				[143.88, -37.58],
				[143.88, -37.53],
				[143.82, -37.53],
				[143.82, -37.58],
			],
		],
	},
	description: 'Bushfire warning for Ballarat region',
	severity: 'watch-and-act',
	publishedAt: '2026-08-30T14:00:00+10:00',
};

export function createApp() {
	const app = express();
	const log = createLogger(SERVICE_NAME);

	app.use(cors());
	app.use(express.json());

	// Health check
	app.get(
		'/results-api/v0/health-check',
		async (_req: express.Request, res: express.Response) => {
			const redis = await getRedisStatus();
			const statusCode = redis ? 200 : 503;
			if (statusCode === 503) log.warn('health check degraded', { redis });
			res.status(statusCode).json({ statusCode, service: SERVICE_NAME });
		},
	);

	app.get('/results-api/v0/verdicts', (_req, res) => {
		res.json({
			verdicts: [stubVerdict],
			total: 1,
		});
	});

	app.get('/results-api/v0/verdicts/:deviceId', (req, res) => {
		res.json({
			...stubVerdict,
			deviceId: req.params.deviceId,
		});
	});

	app.get('/results-api/v0/stats', (_req, res) => {
		res.json(stubStats);
	});

	app.get('/results-api/v0/overlays', (_req, res) => {
		res.json({
			outages: [stubOutage],
			publicEvents: [stubPublicEvent],
			fetchedAt: new Date().toISOString(),
		});
	});

	app.get('/results-api/v0/overlays/outages', (_req, res) => {
		res.json([stubOutage]);
	});

	app.get('/results-api/v0/overlays/public-events', (_req, res) => {
		res.json([stubPublicEvent]);
	});

	return app;
}
