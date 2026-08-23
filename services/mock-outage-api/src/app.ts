import cors from 'cors';
import express from 'express';

export const SERVICE_NAME = 'mock-outage-api';

export function createApp() {
	const app = express();

	app.use(cors());
	app.use(express.json());

	const health = (_req: express.Request, res: express.Response) => {
		res.json({ status: 'ok', service: SERVICE_NAME });
	};

	app.get('/api/v1/health', health);
	app.get('/health', health);

	return app;
}
