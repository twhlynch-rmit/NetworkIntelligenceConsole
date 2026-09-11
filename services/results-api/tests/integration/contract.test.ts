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

describe('results-api OpenAPI contract', () => {
	let spec: OpenApiDocument;

	beforeAll(async () => {
		spec = await loadOpenApiSpec(getServiceSpecPath('results-api'));
	});

	it('validates GET /results-api/v0/health-check', async () => {
		const response = await request(createApp()).get('/results-api/v0/health-check');

		expect([200, 503]).toContain(response.status);
		validateAgainstSchema(spec, 'HealthCheckResponse', response.body);
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
		expect(response.body).toHaveProperty('verdicts');
		expect(response.body).toHaveProperty('total');
		expect(Array.isArray(response.body.verdicts)).toBe(true);

		for (const verdict of response.body.verdicts) {
			validateAgainstSchema(spec, 'Verdict', verdict);
		}

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
		validateAgainstSchema(spec, 'Verdict', response.body);
		validateOpenApiResponse(
			spec,
			'get',
			'/results-api/v0/verdicts/{deviceId}',
			response.status,
			response.body,
		);

		expect(response.body.deviceId).toBe('SC-P-4821');
		expect(response.body.verdict.likelyCause).toBeTruthy();
		expect(response.body.verdict.confidence).toBeGreaterThanOrEqual(0);
		expect(response.body.verdict.confidence).toBeLessThanOrEqual(1);
		expect(Array.isArray(response.body.verdict.evidence)).toBe(true);

		for (const item of response.body.verdict.evidence) {
			validateAgainstSchema(spec, 'EvidenceItem', item);
		}
	});

	it('returns 404 for unknown device', async () => {
		const response = await request(createApp()).get('/results-api/v0/verdicts/UNKNOWN');

		expect(response.status).toBe(404);
	});

	it('validates GET /results-api/v0/stats', async () => {
		const response = await request(createApp()).get('/results-api/v0/stats');

		expect(response.status).toBe(200);
		validateAgainstSchema(spec, 'FleetStats', response.body);
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
		expect(Array.isArray(response.body.outages)).toBe(true);
		expect(Array.isArray(response.body.publicEvents)).toBe(true);
		expect(response.body.fetchedAt).toBeTruthy();

		for (const outage of response.body.outages) {
			validateAgainstSchema(spec, 'OutageOverlay', outage);
		}

		for (const event of response.body.publicEvents) {
			validateAgainstSchema(spec, 'PublicEventOverlay', event);
		}

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
		expect(Array.isArray(response.body)).toBe(true);

		for (const overlay of response.body) {
			validateAgainstSchema(spec, 'OutageOverlay', overlay);
		}

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
		expect(Array.isArray(response.body)).toBe(true);

		for (const overlay of response.body) {
			validateAgainstSchema(spec, 'PublicEventOverlay', overlay);
		}

		validateOpenApiResponse(
			spec,
			'get',
			'/results-api/v0/overlays/public-events',
			response.status,
			response.body,
		);
	});
});
