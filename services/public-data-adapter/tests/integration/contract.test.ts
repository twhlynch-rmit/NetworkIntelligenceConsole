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

describe('public-data-adapter OpenAPI contract', () => {
	let spec: OpenApiDocument;

	beforeAll(async () => {
		spec = await loadOpenApiSpec(getServiceSpecPath('public-data-adapter'));
	});

	it('validates GET /public-data-adapter/v0/health-check', async () => {
		const response = await request(createApp()).get('/public-data-adapter/v0/health-check');

		expect([200, 503]).toContain(response.status);
		validateAgainstSchema(spec, 'HealthCheckResponse', response.body);
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
		expect(Array.isArray(response.body)).toBe(true);
		expect(response.body.length).toBeGreaterThan(0);

		for (const source of response.body) {
			validateAgainstSchema(spec, 'Source', source);
		}

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
		expect(response.body).toHaveProperty('events');
		expect(response.body).toHaveProperty('fetchedAt');
		expect(Array.isArray(response.body.events)).toBe(true);

		for (const event of response.body.events) {
			validateAgainstSchema(spec, 'PublicEvent', event);
		}

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
		validateAgainstSchema(spec, 'HealthCheckResponse', response.body);
		validateOpenApiResponse(
			spec,
			'post',
			'/public-data-adapter/v0/sync',
			response.status,
			response.body,
		);
	});
});
