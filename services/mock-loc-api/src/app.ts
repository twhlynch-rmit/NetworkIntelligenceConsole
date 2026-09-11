import cors from 'cors';
import express from 'express';

export const SERVICE_NAME = 'mock-loc-api';

const STUB_SUBSCRIPTION_ID = 'a1691659-808b-48b4-bc59-69816a4b3cfd';

const stubSubscription = {
	subscriptionId: STUB_SUBSCRIPTION_ID,
	msisdn: '61412345678',
	notificationDestination: 'https://callback.test/',
};

export function createApp() {
	const app = express();

	app.use(cors());
	app.use(express.json());

	// Health check
	app.get('/health-check', async (_req: express.Request, res: express.Response) => {
		res.json({ statusCode: 200, service: SERVICE_NAME });
	});

	app.post('/loss-of-connectivity/v0/subscriptions', (req, res) => {
		const correlationId =
			req.header('correlation-id') ?? '550e8400-e29b-41d4-a716-446655440000';

		res.status(201).json({
			'correlation-id': correlationId,
			status: 201,
			timeStamp: Date.now(),
			message: 'successful',
			subscriptions: [
				{
					...stubSubscription,
					status: 201,
				},
			],
		});
	});

	app.get('/loss-of-connectivity/v0/subscriptions', (_req, res) => {
		res.status(200).json({
			subscriptions: [stubSubscription],
			limit: 100,
		});
	});

	app.get('/loss-of-connectivity/v0/subscriptions/:subscriptionId', (req, res) => {
		res.status(200).json({
			...stubSubscription,
			subscriptionId: req.params.subscriptionId,
		});
	});

	app.delete('/loss-of-connectivity/v0/subscriptions/:subscriptionId', (_req, res) => {
		res.status(204).end();
	});

	app.post('/loss-of-connectivity/v0/events', (_req, res) => {
		res.status(202).json({
			status: 202,
			timeStamp: Date.now(),
		});
	});

	return app;
}
