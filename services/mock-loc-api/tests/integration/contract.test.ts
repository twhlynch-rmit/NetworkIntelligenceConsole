import path from 'node:path';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { loadOpenApiSpec, validateOpenApiResponse } from '@nic/contract-tests/openapi';

import { createApp } from '../../src/app';

type OpenApiDocument = Awaited<ReturnType<typeof loadOpenApiSpec>>;

describe('mock-loc-api OpenAPI contract', () => {
	let spec: OpenApiDocument;

	beforeAll(async () => {
		spec = await loadOpenApiSpec(
			path.resolve(process.cwd(), '../../docs/openapi/mock-loc-api.yaml'),
		);
	});

	it('validates GET /health-check', async () => {
		const response = await request(createApp()).get('/health-check');

		expect(response.status).toBe(200);

		validateOpenApiResponse(spec, 'get', '/health-check', response.status, response.body);
	});

	it('validates POST /loss-of-connectivity/v0/subscriptions', async () => {
		const response = await request(createApp())
			.post('/loss-of-connectivity/v0/subscriptions')
			.set('correlation-id', '550e8400-e29b-41d4-a716-446655440000')
			.send({
				monitoringType: 'LOSS_OF_CONNECTIVITY',
				subscriptions: [
					{
						msisdn: ['61412345678'],
						notificationDestination: 'https://callback.test/',
					},
				],
			});

		expect(response.status).toBe(201);

		validateOpenApiResponse(
			spec,
			'post',
			'/loss-of-connectivity/v0/subscriptions',
			response.status,
			response.body,
		);
	});

	it('validates GET /loss-of-connectivity/v0/subscriptions', async () => {
		const response = await request(createApp())
			.get('/loss-of-connectivity/v0/subscriptions')
			.set('correlation-id', '550e8400-e29b-41d4-a716-446655440000');

		expect(response.status).toBe(200);

		validateOpenApiResponse(
			spec,
			'get',
			'/loss-of-connectivity/v0/subscriptions',
			response.status,
			response.body,
		);
	});

	it('validates GET /loss-of-connectivity/v0/subscriptions/{subscriptionId}', async () => {
		const response = await request(createApp())
			.get('/loss-of-connectivity/v0/subscriptions/a1691659-808b-48b4-bc59-69816a4b3cfd')
			.set('correlation-id', '550e8400-e29b-41d4-a716-446655440000');

		expect(response.status).toBe(200);

		validateOpenApiResponse(
			spec,
			'get',
			'/loss-of-connectivity/v0/subscriptions/{subscriptionId}',
			response.status,
			response.body,
		);
	});

	it('validates DELETE /loss-of-connectivity/v0/subscriptions/{subscriptionId}', async () => {
		const response = await request(createApp())
			.delete('/loss-of-connectivity/v0/subscriptions/a1691659-808b-48b4-bc59-69816a4b3cfd')
			.set('correlation-id', '550e8400-e29b-41d4-a716-446655440000');

		expect(response.status).toBe(204);

		validateOpenApiResponse(
			spec,
			'delete',
			'/loss-of-connectivity/v0/subscriptions/{subscriptionId}',
			response.status,
			response.body,
		);
	});

	it('validates POST /loss-of-connectivity/v0/events', async () => {
		const response = await request(createApp())
			.post('/loss-of-connectivity/v0/events')
			.send({
				subscriptionId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
				monitoringEventReports: [
					{
						monitoringType: 'LOSS_OF_CONNECTIVITY',
						msisdn: '61412345678',
						lossOfConnectReason: 0,
						eventTime: '2028-01-31T00:15:00+08:00',
					},
				],
			});

		expect(response.status).toBe(202);

		validateOpenApiResponse(
			spec,
			'post',
			'/loss-of-connectivity/v0/events',
			response.status,
			response.body,
		);
	});
});
