import cors from 'cors';
import express from 'express';

export const SERVICE_NAME = 'fleet-simulator';

export function createApp() {
	const app = express();

	app.use(cors());
	app.use(express.json());

	const health = (_req: express.Request, res: express.Response) => {
		res.json({ status: 'ok', service: SERVICE_NAME });
	};

	app.get('/fleet-simulator/v0/health-check', health);
	app.get('/health-check', health);

	return app;
}
