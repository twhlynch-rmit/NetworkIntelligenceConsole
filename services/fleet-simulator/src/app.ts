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

const SCENARIO_NAMES = [
	'hero-scenario',
	'mass-outage',
	'battery-drain',
	'normal-ops',
	'clean',
] as const;

type ScenarioName = (typeof SCENARIO_NAMES)[number];

interface Device {
	deviceId: string;
	msisdn: string;
	status: 'ONLINE' | 'MOVING' | 'LOW_BATTERY' | 'SILENT' | 'OFFLINE';
	lastKnownLocation: {
		lat: number;
		lon: number;
		suburb: string;
		state: string;
		postcode: string;
		source: string;
	};
	battery: number;
	signal: number;
	lastSeenAt: string;
	assignedTo: string;
}

const DEVICES: Device[] = [
	{
		deviceId: 'SC-P-4821',
		msisdn: '61412345678',
		status: 'SILENT',
		lastKnownLocation: {
			lat: -37.5636,
			lon: 143.8509,
			suburb: 'Ballarat South',
			state: 'VIC',
			postcode: '3350',
			source: 'SafeCall device telemetry',
		},
		battery: 42,
		signal: -85,
		lastSeenAt: '2026-09-06T14:32:00+10:00',
		assignedTo: 'Nurse - Ballarat South',
	},
	{
		deviceId: 'SC-P-1204',
		msisdn: '61498765432',
		status: 'ONLINE',
		lastKnownLocation: {
			lat: -37.8136,
			lon: 144.9631,
			suburb: 'Melbourne',
			state: 'VIC',
			postcode: '3000',
			source: 'SafeCall device telemetry',
		},
		battery: 88,
		signal: -65,
		lastSeenAt: '2026-09-06T15:01:00+10:00',
		assignedTo: 'Paramedic - CBD',
	},
	{
		deviceId: 'SC-P-7739',
		msisdn: '61455512345',
		status: 'MOVING',
		lastKnownLocation: {
			lat: -37.7433,
			lon: 144.8295,
			suburb: 'Sunshine',
			state: 'VIC',
			postcode: '3020',
			source: 'SafeCall device telemetry',
		},
		battery: 67,
		signal: -72,
		lastSeenAt: '2026-09-06T14:58:00+10:00',
		assignedTo: 'Lone Worker - West',
	},
];

const SCENARIO_DESCRIPTIONS: Record<ScenarioName, string> = {
	'hero-scenario': 'Hero scenario - nurse pendant goes silent during bushfire',
	'mass-outage': 'Mass outage - multiple devices go silent in a region',
	'battery-drain': 'Battery drain - fleet battery levels declining',
	'normal-ops': 'Normal operations - all devices reporting normally',
	clean: 'Clean slate - no active scenarios',
};

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

	app.get('/fleet-simulator/v0/devices', (req, res) => {
		const status = req.query.status as string | undefined;
		const limit = Math.min(Number(req.query.limit) || 100, 1000);
		const offset = Number(req.query.offset) || 0;

		let filtered = [...DEVICES];
		if (status) {
			filtered = filtered.filter((d) => d.status === status);
		}

		const paginated = filtered.slice(offset, offset + limit);
		log.info('devices listed', {
			count: paginated.length,
			total: filtered.length,
			status,
			limit,
			offset,
		});
		res.json({ devices: paginated, total: filtered.length });
	});

	app.get('/fleet-simulator/v0/devices/:deviceId', (req, res) => {
		const device = DEVICES.find((d) => d.deviceId === req.params.deviceId);
		if (!device) {
			res.status(404).json({ error: 'Device not found' });
			return;
		}
		res.json(device);
	});

	app.post('/fleet-simulator/v0/devices/:deviceId/dropout', (req, res) => {
		const device = DEVICES.find((d) => d.deviceId === req.params.deviceId);
		if (!device) {
			res.status(404).json({ error: 'Device not found' });
			return;
		}
		log.info('dropout triggered', { deviceId: req.params.deviceId });
		res.status(202).json({ status: 'accepted', deviceId: req.params.deviceId });
	});

	app.get('/fleet-simulator/v0/scenarios', (_req, res) => {
		const list = SCENARIO_NAMES.map((name) => ({
			name,
			description: SCENARIO_DESCRIPTIONS[name],
		}));
		res.json(list);
	});

	app.post('/fleet-simulator/v0/scenarios/:name/run', (req, res) => {
		const name = req.params.name as ScenarioName;
		if (!SCENARIO_NAMES.includes(name)) {
			res.status(404).json({ error: `Scenario '${name}' not found` });
			return;
		}
		log.info('scenario run triggered', { name });
		res.status(202).json({ status: 'accepted', scenario: name });
	});

	return app;
}
