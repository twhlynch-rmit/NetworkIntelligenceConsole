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

	return app;
}
