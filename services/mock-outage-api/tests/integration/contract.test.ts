import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import {
	loadOpenApiSpec,
	validateAgainstSchema,
	validateOpenApiResponse,
	getServiceSpecPath,
} from '@nic/contract-tests/openapi';

import { createApp } from '../../src/app';

import type { OpenApiDocument } from '@nic/contract-tests/openapi';

describe('mock-outage-api OpenAPI contract', () => {
	let spec: OpenApiDocument;

	beforeAll(async () => {
		spec = await loadOpenApiSpec(getServiceSpecPath('mock-outage-api'));
	});

	it('validates GET /outage/v0/health-check', async () => {
		const response = await request(createApp()).get('/outage/v0/health-check');

		expect(response.status).toBe(200);
		validateAgainstSchema(spec, 'HealthCheckResponse', response.body);
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
			.query({ suburb: 'Melbourne', state: 'VIC', postcode: '3000' });

		expect(response.status).toBe(200);
		validateAgainstSchema(spec, 'OutageStatusResponse', response.body);
		validateOpenApiResponse(spec, 'get', '/outage/v0/status', response.status, response.body);

		expect(response.body['correlation-id']).toBe('test-correlation-id');
		expect(response.body.past).toEqual([]);
		expect(Array.isArray(response.body.current)).toBe(true);
		expect(response.body.near_future).toEqual([]);
		expect(response.body.far_future).toEqual([]);
	});

	it('responds with 400 and ErrorEnvelope when query params are missing', async () => {
		const response = await request(createApp())
			.get('/outage/v0/status')
			.set('Correlation-Id', 'test-id');

		expect(response.status).toBe(400);
		validateAgainstSchema(spec, 'ErrorEnvelope', response.body);
	});

	it('responds with 400 for invalid state enum value', async () => {
		const response = await request(createApp())
			.get('/outage/v0/status')
			.query({ suburb: 'Melbourne', state: 'INVALID', postcode: '3000' })
			.set('Correlation-Id', 'test-id');

		expect(response.status).toBe(400);
		validateAgainstSchema(spec, 'ErrorEnvelope', response.body);
	});

	it('validates GET /outage/v0/scenarios', async () => {
		const response = await request(createApp()).get('/outage/v0/scenarios');

		expect(response.status).toBe(200);
		expect(Array.isArray(response.body)).toBe(true);
		expect(response.body.length).toBeGreaterThan(0);

		for (const scenario of response.body) {
			validateAgainstSchema(spec, 'Scenario', scenario);
		}

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
		validateAgainstSchema(spec, 'Scenario', response.body);
		validateOpenApiResponse(
			spec,
			'post',
			'/outage/v0/scenarios/{name}/activate',
			response.status,
			response.body,
		);
	});
});
