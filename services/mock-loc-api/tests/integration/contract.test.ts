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

describe('mock-loc-api OpenAPI contract', () => {
	let spec: OpenApiDocument;

	beforeAll(async () => {
		spec = await loadOpenApiSpec(getServiceSpecPath('mock-loc-api'));
	});

	it('validates GET /health-check', async () => {
		const response = await request(createApp()).get('/health-check');

		expect(response.status).toBe(200);
		validateAgainstSchema(spec, 'HealthCheckResponse', response.body);
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
		validateAgainstSchema(spec, 'SubscriptionsResponse', response.body);
		validateOpenApiResponse(
			spec,
			'post',
			'/loss-of-connectivity/v0/subscriptions',
			response.status,
			response.body,
		);

		expect(response.body.subscriptions.length).toBe(1);
		validateAgainstSchema(spec, 'SubscriptionResult', response.body.subscriptions[0]);
	});

	it('responds with 201 when correlation-id header is missing', async () => {
		const response = await request(createApp())
			.post('/loss-of-connectivity/v0/subscriptions')
			.send({
				monitoringType: 'LOSS_OF_CONNECTIVITY',
				subscriptions: [
					{
						msisdn: ['61498765432'],
						notificationDestination: 'https://callback.test/',
					},
				],
			});

		expect(response.status).toBe(201);
		validateAgainstSchema(spec, 'SubscriptionsResponse', response.body);
	});

	it('returns 400 and ErrorResponse for invalid request body', async () => {
		const response = await request(createApp())
			.post('/loss-of-connectivity/v0/subscriptions')
			.send({});

		expect(response.status).toBe(400);
		validateAgainstSchema(spec, 'ErrorResponse', response.body);
	});

	it('validates GET /loss-of-connectivity/v0/subscriptions', async () => {
		const response = await request(createApp())
			.get('/loss-of-connectivity/v0/subscriptions')
			.set('correlation-id', '550e8400-e29b-41d4-a716-446655440000');

		expect(response.status).toBe(200);
		validateAgainstSchema(spec, 'GetSubscriptionsResponse', response.body);
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
		validateAgainstSchema(spec, 'GetSubscriptionResponse', response.body);
		validateOpenApiResponse(
			spec,
			'get',
			'/loss-of-connectivity/v0/subscriptions/{subscriptionId}',
			response.status,
			response.body,
		);
	});

	it('returns 404 and ErrorResponse for unknown subscription', async () => {
		const response = await request(createApp())
			.get('/loss-of-connectivity/v0/subscriptions/00000000-0000-0000-0000-000000000000')
			.set('correlation-id', '550e8400-e29b-41d4-a716-446655440000');

		expect(response.status).toBe(404);
		validateAgainstSchema(spec, 'ErrorResponse', response.body);
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

	it('returns 404 and ErrorResponse for unknown subscription on delete', async () => {
		const response = await request(createApp())
			.delete('/loss-of-connectivity/v0/subscriptions/00000000-0000-0000-0000-000000000000')
			.set('correlation-id', '550e8400-e29b-41d4-a716-446655440000');

		expect(response.status).toBe(404);
		validateAgainstSchema(spec, 'ErrorResponse', response.body);
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
		validateAgainstSchema(spec, 'EventAcceptedResponse', response.body);
		validateOpenApiResponse(
			spec,
			'post',
			'/loss-of-connectivity/v0/events',
			response.status,
			response.body,
		);
	});
});
