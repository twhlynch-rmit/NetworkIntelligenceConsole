import cors from 'cors';
import express from 'express';
import { createLogger, checkDependency } from '@nic/shared';
import { createClient } from 'redis';
import pg from 'pg';

export const SERVICE_NAME = 'correlator';

let redisClient: ReturnType<typeof createClient> | null = null;
let pgPool: pg.Pool | null = null;

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

async function getPostgresStatus() {
	const ok = await checkDependency(async () => {
		if (!pgPool) {
			pgPool = new pg.Pool({
				host: process.env.POSTGRES_HOST || 'localhost',
				port: Number(process.env.POSTGRES_PORT) || 5432,
				database: process.env.POSTGRES_DB || 'nic',
				user: process.env.POSTGRES_USER || 'nic_user',
				password: process.env.POSTGRES_PASSWORD || 'changeme',
				max: 1,
			});
			pgPool.on('error', () => {});
		}
		const client = await pgPool.connect();
		await client.query('SELECT 1');
		client.release();
	});
	if (!ok) {
		pgPool = null;
	}
	return ok;
}

export function createApp() {
	const app = express();
	const log = createLogger(SERVICE_NAME);

	app.use(cors());
	app.use(express.json());

	// Health check
	app.get('/correlator/v0/health-check', async (_req: express.Request, res: express.Response) => {
		const [redis, postgres] = await Promise.all([getRedisStatus(), getPostgresStatus()]);
		const statusCode = redis && postgres ? 200 : 503;
		if (statusCode === 503) log.warn('health check degraded', { redis, postgres });
		res.status(statusCode).json({ statusCode, service: SERVICE_NAME });
	});

	app.post('/correlator/v0/recompute/:deviceId', (req, res) => {
		log.info('recompute triggered', { deviceId: req.params.deviceId });
		res.status(202).json({ status: 'accepted', deviceId: req.params.deviceId });
	});

	return app;
}
