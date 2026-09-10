import cors from 'cors';
import express from 'express';

export const SERVICE_NAME = 'mock-loc-api';

export function createApp() {
	const app = express();

	app.use(cors());
	app.use(express.json());

	// Health check
	app.get('/health-check', async (_req: express.Request, res: express.Response) => {
		res.json({ statusCode: 200, service: SERVICE_NAME });
	});

	return app;
}
