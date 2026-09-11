import cors from 'cors';
import express from 'express';
import { createLogger, checkDependency } from '@nic/shared';
import { createClient } from 'redis';

export const SERVICE_NAME = 'public-data-adapter';

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

const stubSources = [
	{
		id: 'vicEmergency',
		name: 'VicEmergency GeoJSON',
		licence: 'CC BY 3.0 AU',
		refreshSeconds: 60,
	},
	{
		id: 'bom',
		name: 'Bureau of Meteorology',
		refreshSeconds: 300,
	},
];

const stubEvents = [
	{
		eventId: 'VE2026-001',
		source: 'vicEmergency',
		eventType: 'bushfire',
		severity: 'watch-and-act',
		description: 'Bushfire warning for Ballarat region',
		location: {
			lat: -37.55,
			lon: 143.85,
			suburb: 'Ballarat',
			state: 'VIC',
			postcode: '3350',
		},
		publishedAt: '2026-09-06T12:00:00+10:00',
	},
	{
		eventId: 'BOM-94852-20260906093000',
		source: 'bom',
		eventType: 'weather-observation',
		severity: undefined,
		description: 'Weather observation - Ballarat',
		location: {
			lat: -37.5,
			lon: 143.8,
			suburb: 'Ballarat',
			state: 'VIC',
			postcode: '3350',
		},
		publishedAt: '2026-09-06T09:30:00+10:00',
	},
];

export function createApp() {
	const app = express();
	const log = createLogger(SERVICE_NAME);

	app.use(cors());
	app.use(express.json());

	// Health check
	app.get(
		'/public-data-adapter/v0/health-check',
		async (_req: express.Request, res: express.Response) => {
			const redis = await getRedisStatus();
			const statusCode = redis ? 200 : 503;
			if (statusCode === 503) log.warn('health check degraded', { redis });
			res.status(statusCode).json({ statusCode, service: SERVICE_NAME });
		},
	);

	app.get('/public-data-adapter/v0/sources', (_req, res) => {
		res.status(200).json(stubSources);
	});

	app.get('/public-data-adapter/v0/events', (_req, res) => {
		res.status(200).json({
			events: stubEvents,
			fetchedAt: new Date().toISOString(),
		});
	});

	app.post('/public-data-adapter/v0/sync', (_req, res) => {
		res.status(202).json({
			statusCode: 202,
			service: SERVICE_NAME,
		});
	});

	return app;
}
