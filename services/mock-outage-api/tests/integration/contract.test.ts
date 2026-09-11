import path from 'node:path';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { loadOpenApiSpec, validateOpenApiResponse } from '@nic/contract-tests/openapi';

import { createApp } from '../../src/app';

type OpenApiDocument = Awaited<ReturnType<typeof loadOpenApiSpec>>;

describe('mock-outage-api OpenAPI contract', () => {
	let spec: OpenApiDocument;

	beforeAll(async () => {
		spec = await loadOpenApiSpec(
			path.resolve(process.cwd(), '../../docs/openapi/mock-outage-api.yaml'),
		);
	});

	it('validates GET /outage/v0/health-check', async () => {
		const response = await request(createApp()).get('/outage/v0/health-check');

		expect(response.status).toBe(200);

		validateOpenApiResponse(
			spec,
			'get',
			'/outage/v0/health-check',
			response.status,
			response.body,
		);
	});

	it('validates GET /outage/v0/status', async () => {
		const response = await request(createApp())
			.get('/outage/v0/status')
			.set('Correlation-Id', 'test-correlation-id')
			.query({
				suburb: 'Melbourne',
				state: 'VIC',
				postcode: '3000',
			});

		expect(response.status).toBe(200);

		validateOpenApiResponse(spec, 'get', '/outage/v0/status', response.status, response.body);
	});

	it('validates GET /outage/v0/scenarios', async () => {
		const response = await request(createApp()).get('/outage/v0/scenarios');

		expect(response.status).toBe(200);

		validateOpenApiResponse(
			spec,
			'get',
			'/outage/v0/scenarios',
			response.status,
			response.body,
		);
	});

	it('validates POST /outage/v0/scenarios/{name}/activate', async () => {
		const response = await request(createApp()).post(
			'/outage/v0/scenarios/metro-outage/activate',
		);

		expect(response.status).toBe(200);

		validateOpenApiResponse(
			spec,
			'post',
			'/outage/v0/scenarios/{name}/activate',
			response.status,
			response.body,
		);
	});
});
