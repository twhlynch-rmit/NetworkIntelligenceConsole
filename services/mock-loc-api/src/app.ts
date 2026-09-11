import cors from 'cors';
import express from 'express';
import { createLogger } from '@nic/shared';

export const SERVICE_NAME = 'mock-loc-api';

interface Subscription {
	subscriptionId: string;
	msisdn: string;
	notificationDestination: string;
}

const SEED_SUBSCRIPTION_ID = 'a1691659-808b-48b4-bc59-69816a4b3cfd';

const subscriptions = new Map<string, Subscription>();

subscriptions.set(SEED_SUBSCRIPTION_ID, {
	subscriptionId: SEED_SUBSCRIPTION_ID,
	msisdn: '61412345678',
	notificationDestination: 'https://callback.test/',
});

export function createApp() {
	const app = express();
	const log = createLogger(SERVICE_NAME);

	app.use(cors());
	app.use(express.json());

	// Health check
	app.get('/health-check', async (_req: express.Request, res: express.Response) => {
		res.json({ statusCode: 200, service: SERVICE_NAME });
	});

	// POST /loss-of-connectivity/v0/subscriptions
	app.post(
		'/loss-of-connectivity/v0/subscriptions',
		(req: express.Request, res: express.Response) => {
			const body = req.body as {
				monitoringType?: string;
				subscriptions?: Array<{ msisdn?: string[]; notificationDestination?: string }>;
			};
			const correlationId = req.headers['correlation-id'] as string | undefined;

			if (!body?.monitoringType || !body?.subscriptions?.length) {
				res.status(400).json({
					code: 400,
					'message-content': 'Bad request',
				});
				return;
			}

			const results: Subscription[] = [];
			for (const sub of body.subscriptions) {
				if (sub.msisdn && sub.notificationDestination) {
					for (const msisdn of sub.msisdn) {
						const id = crypto.randomUUID();
						const entry: Subscription = {
							subscriptionId: id,
							msisdn,
							notificationDestination: sub.notificationDestination,
						};
						subscriptions.set(id, entry);
						results.push(entry);
					}
				}
			}

			log.info('subscriptions created', { count: results.length, correlationId });

			res.status(201).json({
				'correlation-id': correlationId || crypto.randomUUID(),
				status: 201,
				timeStamp: Date.now(),
				message: 'successful',
				subscriptions: results.map((s) => ({
					subscriptionId: s.subscriptionId,
					msisdn: s.msisdn,
					status: 201,
					notificationDestination: s.notificationDestination,
				})),
			});
		},
	);

	// GET /loss-of-connectivity/v0/subscriptions
	app.get(
		'/loss-of-connectivity/v0/subscriptions',
		(req: express.Request, res: express.Response) => {
			const limit = Number(req.query.limit) || 100;
			const list = Array.from(subscriptions.values()).slice(0, limit);
			res.json({
				subscriptions: list.map((s) => ({
					subscriptionId: s.subscriptionId,
					msisdn: s.msisdn,
					notificationDestination: s.notificationDestination,
				})),
				limit,
			});
		},
	);

	// GET /loss-of-connectivity/v0/subscriptions/:subscriptionId
	app.get(
		'/loss-of-connectivity/v0/subscriptions/:subscriptionId',
		(req: express.Request, res: express.Response) => {
			const subscriptionId = String(req.params.subscriptionId);
			const sub = subscriptions.get(subscriptionId);
			if (!sub) {
				res.status(404).json({ code: 404, 'message-content': 'Subscription not found' });
				return;
			}
			res.json({
				subscriptionId: sub.subscriptionId,
				msisdn: sub.msisdn,
				notificationDestination: sub.notificationDestination,
			});
		},
	);

	// DELETE /loss-of-connectivity/v0/subscriptions/:subscriptionId
	app.delete(
		'/loss-of-connectivity/v0/subscriptions/:subscriptionId',
		(req: express.Request, res: express.Response) => {
			const subscriptionId = String(req.params.subscriptionId);
			if (!subscriptions.has(subscriptionId)) {
				res.status(404).json({ code: 404, 'message-content': 'Subscription not found' });
				return;
			}
			subscriptions.delete(subscriptionId);
			log.info('subscription deleted', { subscriptionId });
			res.status(204).send();
		},
	);

	// POST /loss-of-connectivity/v0/events
	app.post('/loss-of-connectivity/v0/events', (req: express.Request, res: express.Response) => {
		log.info('loc event received', { body: req.body });
		res.status(202).json({
			status: 202,
			timeStamp: Date.now(),
		});
	});

	return app;
}
