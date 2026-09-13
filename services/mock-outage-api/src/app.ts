import cors from 'cors';
import express from 'express';
import { createLogger } from '@nic/shared';

export const SERVICE_NAME = 'mock-outage-api';

const VALID_STATES = ['QLD', 'NSW', 'ACT', 'VIC', 'TAS', 'SA', 'WA', 'NT', 'NAT'] as const;

const SCENARIO_NAMES = [
	'regional-maintenance',
	'metro-outage',
	'major-event',
	'storm-correlated',
	'clean',
] as const;

type ScenarioName = (typeof SCENARIO_NAMES)[number];

const scenarios: Record<ScenarioName, { active: boolean; outageId?: string }> = {
	'regional-maintenance': { active: false },
	'metro-outage': { active: false },
	'major-event': { active: false },
	'storm-correlated': { active: false },
	clean: { active: false },
};

export function createApp() {
	const app = express();
	const log = createLogger(SERVICE_NAME);

	app.use(cors());
	app.use(express.json());

	// Health check
	app.get('/outage/v0/health-check', async (_req: express.Request, res: express.Response) => {
		res.json({ statusCode: 200, service: SERVICE_NAME });
	});

	// GET /outage/v0/status
	app.get('/outage/v0/status', (req, res) => {
		const suburb = req.query.suburb as string | undefined;
		const state = req.query.state as string | undefined;
		const postcode = req.query.postcode as string | undefined;
		const correlationId = req.headers['correlation-id'] as string | undefined;

		const errors: Array<{
			code: string;
			issue: string;
			fieldName?: string;
			location?: string;
			suggested_action: string;
		}> = [];

		if (!suburb) {
			errors.push({
				code: 'FIELD_MISSING',
				issue: 'suburb',
				fieldName: 'suburb',
				location: 'query',
				suggested_action: 'Please provide the suburb.',
			});
		}
		if (!state) {
			errors.push({
				code: 'FIELD_MISSING',
				issue: 'state',
				fieldName: 'state',
				location: 'query',
				suggested_action: 'Please provide the state.',
			});
		} else if (!VALID_STATES.includes(state as (typeof VALID_STATES)[number])) {
			errors.push({
				code: 'FIELD_INVALID',
				issue: `state must be one of: ${VALID_STATES.join(', ')}`,
				fieldName: 'state',
				location: 'query',
				suggested_action: 'Please provide a valid state abbreviation.',
			});
		}
		if (!postcode) {
			errors.push({
				code: 'FIELD_MISSING',
				issue: 'postcode',
				fieldName: 'postcode',
				location: 'query',
				suggested_action: 'Please provide the postcode.',
			});
		}
		if (!correlationId) {
			errors.push({
				code: 'FIELD_MISSING',
				issue: 'correlation-id',
				fieldName: 'correlation-id',
				location: 'header',
				suggested_action: 'Please provide the correlation-id.',
			});
		}

		if (errors.length > 0) {
			log.warn('outage status validation failed', { errors });
			res.status(400).json({ errors });
			return;
		}

		log.info('outage status queried', { suburb, state, postcode, correlationId });

		res.json({
			'correlation-id': correlationId,
			status: 200,
			timestamp: Date.now(),
			past: [],
			near_future: [],
			far_future: [],
			current: [],
		});
	});

	// GET /outage/v0/scenarios
	app.get('/outage/v0/scenarios', (_req, res) => {
		const list = SCENARIO_NAMES.map((name) => ({
			name,
			active: scenarios[name].active,
			outageId: scenarios[name].outageId,
		}));
		res.json(list);
	});

	// POST /outage/v0/scenarios/:name/activate
	app.post(
		'/outage/v0/scenarios/:name/activate',
		(req: express.Request, res: express.Response) => {
			const name = req.params.name as ScenarioName;
			if (!SCENARIO_NAMES.includes(name)) {
				res.status(404).json({
					errors: [
						{
							code: 'NOT_FOUND',
							issue: `Scenario '${name}' not found`,
							suggested_action: 'Use a valid scenario name.',
						},
					],
				});
				return;
			}
			scenarios[name].active = !scenarios[name].active;
			log.info('scenario toggled', { name, active: scenarios[name].active });
			res.json({
				name,
				active: scenarios[name].active,
				outageId: scenarios[name].outageId,
			});
		},
	);

	return app;
}
