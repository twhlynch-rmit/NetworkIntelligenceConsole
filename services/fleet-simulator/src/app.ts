import cors from 'cors';
import express from 'express';
import { createLogger, checkDependency } from '@nic/shared';
import { createClient } from 'redis';

export const SERVICE_NAME = 'fleet-simulator';

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

const stubDevice = {
	deviceId: 'SC-P-4821',
	msisdn: '61412345678',
	status: 'ONLINE',
	lastKnownLocation: {
		lat: -37.8136,
		lon: 144.9631,
		suburb: 'Melbourne',
		postcode: '3000',
		source: 'SafeCall device telemetry',
	},
	battery: 85,
	signal: -75,
	lastSeenAt: '2026-08-30T16:12:00+10:00',
	assignedTo: 'Nurse - Melbourne',
};

const stubScenarios = [
	{
		name: 'hero-scenario',
		description: 'Hero scenario - nurse pendant goes silent during bushfire',
	},
	{
		name: 'mass-outage',
		description: 'Simulates a large-scale connectivity outage',
	},
	{
		name: 'battery-drain',
		description: 'Simulates devices with rapidly draining batteries',
	},
	{
		name: 'normal-ops',
		description: 'Normal fleet operation',
	},
	{
		name: 'clean',
		description: 'Resets the simulator to a clean state',
	},
];

export function createApp() {
	const app = express();
	const log = createLogger(SERVICE_NAME);

	app.use(cors());
	app.use(express.json());

	// Health check
	app.get(
		'/fleet-simulator/v0/health-check',
		async (_req: express.Request, res: express.Response) => {
			const redis = await getRedisStatus();
			const statusCode = redis ? 200 : 503;
			if (statusCode === 503) log.warn('health check degraded', { redis });
			res.status(statusCode).json({ statusCode, service: SERVICE_NAME });
		},
	);

	app.get('/fleet-simulator/v0/devices', (_req, res) => {
		res.json({
			devices: [stubDevice],
			total: 1,
		});
	});

	app.get('/fleet-simulator/v0/devices/:deviceId', (req, res) => {
		res.json({
			...stubDevice,
			deviceId: req.params.deviceId,
		});
	});

	app.post('/fleet-simulator/v0/devices/:deviceId/dropout', (_req, res) => {
		res.status(202).end();
	});

	app.get('/fleet-simulator/v0/scenarios', (_req, res) => {
		res.json(stubScenarios);
	});

	app.post('/fleet-simulator/v0/scenarios/:name/run', (_req, res) => {
		res.status(202).end();
	});

	return app;
}
