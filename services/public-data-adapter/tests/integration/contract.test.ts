import path from 'node:path';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { loadOpenApiSpec, validateOpenApiResponse } from '@nic/contract-tests/openapi';

import { createApp } from '../../src/app';

type OpenApiDocument = Awaited<ReturnType<typeof loadOpenApiSpec>>;

describe('public-data-adapter OpenAPI contract', () => {
	let spec: OpenApiDocument;

	beforeAll(async () => {
		spec = await loadOpenApiSpec(
			path.resolve(process.cwd(), '../../docs/openapi/public-data-adapter.yaml'),
		);
	});

	it('validates GET /public-data-adapter/v0/health-check', async () => {
		const response = await request(createApp()).get('/public-data-adapter/v0/health-check');

		expect([200, 503]).toContain(response.status);

		validateOpenApiResponse(
			spec,
			'get',
			'/public-data-adapter/v0/health-check',
			response.status,
			response.body,
		);
	});

	it('validates GET /public-data-adapter/v0/sources', async () => {
		const response = await request(createApp()).get('/public-data-adapter/v0/sources');

		expect(response.status).toBe(200);

		validateOpenApiResponse(
			spec,
			'get',
			'/public-data-adapter/v0/sources',
			response.status,
			response.body,
		);
	});

	it('validates GET /public-data-adapter/v0/events', async () => {
		const response = await request(createApp()).get('/public-data-adapter/v0/events');

		expect(response.status).toBe(200);

		validateOpenApiResponse(
			spec,
			'get',
			'/public-data-adapter/v0/events',
			response.status,
			response.body,
		);
	});

	it('validates POST /public-data-adapter/v0/sync', async () => {
		const response = await request(createApp()).post('/public-data-adapter/v0/sync');

		expect(response.status).toBe(202);

		validateOpenApiResponse(
			spec,
			'post',
			'/public-data-adapter/v0/sync',
			response.status,
			response.body,
		);
	});
});
