import cors from 'cors';
import express from 'express';

export const SERVICE_NAME = 'mock-outage-api';

const stubOutage = {
	state: 'VIC',
	suburb: 'MELBOURNE',
	postcode: '3000',
	start_timestamp: '2026-09-11 18:00:00 Australia/Melbourne',
	end_timestamp: null,
	root_cause: 'Telstra Network (Hardware/Software/Config)',
	duration: 3600,
	description: 'Mobile services are temporarily unavailable.',
	is_planned: false,
	technology: '4G',
};

const stubScenarios = [
	{
		name: 'regional-maintenance',
		active: false,
		outageId: 'OUTAGE-001',
	},
	{
		name: 'metro-outage',
		active: false,
		outageId: 'OUTAGE-002',
	},
	{
		name: 'major-event',
		active: false,
		outageId: 'OUTAGE-003',
	},
	{
		name: 'storm-correlated',
		active: false,
		outageId: 'OUTAGE-004',
	},
	{
		name: 'clean',
		active: false,
	},
];

export function createApp() {
	const app = express();

	app.use(cors());
	app.use(express.json());

	// Health check
	app.get('/outage/v0/health-check', async (_req: express.Request, res: express.Response) => {
		res.json({ statusCode: 200, service: SERVICE_NAME });
	});

	app.get('/outage/v0/status', (req, res) => {
		const correlationId = req.header('Correlation-Id') ?? 'stub-correlation-id';

		res.json({
			'correlation-id': correlationId,
			status: 200,
			timestamp: Date.now(),
			past: [],
			near_future: [],
			far_future: [],
			current: [stubOutage],
		});
	});

	app.get('/outage/v0/scenarios', (_req, res) => {
		res.json(stubScenarios);
	});

	app.post('/outage/v0/scenarios/:name/activate', (req, res) => {
		res.json({
			name: req.params.name,
			active: true,
			outageId: 'OUTAGE-STUB',
		});
	});

	return app;
}
