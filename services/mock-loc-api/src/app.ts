import cors from 'cors';
import express from 'express';

export const SERVICE_NAME = 'mock-loc-api';

export function createApp() {
	const app = express();

	app.use(cors());
	app.use(express.json());

	app.get('/health', (_req, res) => {
		res.json({ status: 'ok', service: SERVICE_NAME });
	});

	return app;
}
