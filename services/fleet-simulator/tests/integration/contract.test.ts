import path from 'node:path';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { loadOpenApiSpec, validateOpenApiResponse } from '@nic/contract-tests/openapi';

import { createApp } from '../../src/app';

type OpenApiDocument = Awaited<ReturnType<typeof loadOpenApiSpec>>;

describe('fleet-simulator OpenAPI contract', () => {
	let spec: OpenApiDocument;

	beforeAll(async () => {
		spec = await loadOpenApiSpec(
			path.resolve(process.cwd(), '../../docs/openapi/fleet-simulator.yaml'),
		);
	});

	it('validates GET /fleet-simulator/v0/health-check', async () => {
		const response = await request(createApp()).get('/fleet-simulator/v0/health-check');

		expect([200, 503]).toContain(response.status);

		validateOpenApiResponse(
			spec,
			'get',
			'/fleet-simulator/v0/health-check',
			response.status,
			response.body,
		);
	});

	it('validates GET /fleet-simulator/v0/devices', async () => {
		const response = await request(createApp()).get('/fleet-simulator/v0/devices');

		expect(response.status).toBe(200);

		validateOpenApiResponse(
			spec,
			'get',
			'/fleet-simulator/v0/devices',
			response.status,
			response.body,
		);
	});

	it('validates GET /fleet-simulator/v0/devices/{deviceId}', async () => {
		const response = await request(createApp()).get('/fleet-simulator/v0/devices/SC-P-4821');

		expect(response.status).toBe(200);

		validateOpenApiResponse(
			spec,
			'get',
			'/fleet-simulator/v0/devices/{deviceId}',
			response.status,
			response.body,
		);
	});

	it('validates POST /fleet-simulator/v0/devices/{deviceId}/dropout', async () => {
		const response = await request(createApp()).post(
			'/fleet-simulator/v0/devices/SC-P-4821/dropout',
		);

		expect(response.status).toBe(202);

		validateOpenApiResponse(
			spec,
			'post',
			'/fleet-simulator/v0/devices/{deviceId}/dropout',
			response.status,
			response.body,
		);
	});

	it('validates GET /fleet-simulator/v0/scenarios', async () => {
		const response = await request(createApp()).get('/fleet-simulator/v0/scenarios');

		expect(response.status).toBe(200);

		validateOpenApiResponse(
			spec,
			'get',
			'/fleet-simulator/v0/scenarios',
			response.status,
			response.body,
		);
	});

	it('validates POST /fleet-simulator/v0/scenarios/{name}/run', async () => {
		const response = await request(createApp()).post(
			'/fleet-simulator/v0/scenarios/hero-scenario/run',
		);

		expect(response.status).toBe(202);

		validateOpenApiResponse(
			spec,
			'post',
			'/fleet-simulator/v0/scenarios/{name}/run',
			response.status,
			response.body,
		);
	});
});
