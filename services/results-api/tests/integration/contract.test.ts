import path from 'node:path';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { loadOpenApiSpec, validateOpenApiResponse } from '@nic/contract-tests/openapi';

import { createApp } from '../../src/app';

type OpenApiDocument = Awaited<ReturnType<typeof loadOpenApiSpec>>;

describe('results-api OpenAPI contract', () => {
	let spec: OpenApiDocument;

	beforeAll(async () => {
		spec = await loadOpenApiSpec(
			path.resolve(process.cwd(), '../../docs/openapi/results-api.yaml'),
		);
	});

	it('validates GET /results-api/v0/health-check', async () => {
		const response = await request(createApp()).get('/results-api/v0/health-check');

		expect([200, 503]).toContain(response.status);

		validateOpenApiResponse(
			spec,
			'get',
			'/results-api/v0/health-check',
			response.status,
			response.body,
		);
	});

	it('validates GET /results-api/v0/verdicts', async () => {
		const response = await request(createApp()).get('/results-api/v0/verdicts');

		expect(response.status).toBe(200);

		validateOpenApiResponse(
			spec,
			'get',
			'/results-api/v0/verdicts',
			response.status,
			response.body,
		);
	});

	it('validates GET /results-api/v0/verdicts/{deviceId}', async () => {
		const response = await request(createApp()).get('/results-api/v0/verdicts/SC-P-4821');

		expect(response.status).toBe(200);

		validateOpenApiResponse(
			spec,
			'get',
			'/results-api/v0/verdicts/{deviceId}',
			response.status,
			response.body,
		);
	});

	it('validates GET /results-api/v0/stats', async () => {
		const response = await request(createApp()).get('/results-api/v0/stats');

		expect(response.status).toBe(200);

		validateOpenApiResponse(
			spec,
			'get',
			'/results-api/v0/stats',
			response.status,
			response.body,
		);
	});

	it('validates GET /results-api/v0/overlays', async () => {
		const response = await request(createApp()).get('/results-api/v0/overlays');

		expect(response.status).toBe(200);

		validateOpenApiResponse(
			spec,
			'get',
			'/results-api/v0/overlays',
			response.status,
			response.body,
		);
	});

	it('validates GET /results-api/v0/overlays/outages', async () => {
		const response = await request(createApp()).get('/results-api/v0/overlays/outages');

		expect(response.status).toBe(200);

		validateOpenApiResponse(
			spec,
			'get',
			'/results-api/v0/overlays/outages',
			response.status,
			response.body,
		);
	});

	it('validates GET /results-api/v0/overlays/public-events', async () => {
		const response = await request(createApp()).get('/results-api/v0/overlays/public-events');

		expect(response.status).toBe(200);

		validateOpenApiResponse(
			spec,
			'get',
			'/results-api/v0/overlays/public-events',
			response.status,
			response.body,
		);
	});
});
