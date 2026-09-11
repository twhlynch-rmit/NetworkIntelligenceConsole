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

describe('correlator OpenAPI contract', () => {
	let spec: OpenApiDocument;

	beforeAll(async () => {
		spec = await loadOpenApiSpec(getServiceSpecPath('correlator'));
	});

	it('validates GET /correlator/v0/health-check', async () => {
		const response = await request(createApp()).get('/correlator/v0/health-check');

		expect([200, 503]).toContain(response.status);
		validateAgainstSchema(spec, 'HealthCheckResponse', response.body);
		validateOpenApiResponse(
			spec,
			'get',
			'/correlator/v0/health-check',
			response.status,
			response.body,
		);
	});

	it('validates POST /correlator/v0/recompute/{deviceId}', async () => {
		const response = await request(createApp()).post('/correlator/v0/recompute/SC-P-4821');

		expect(response.status).toBe(202);

		validateOpenApiResponse(
			spec,
			'post',
			'/correlator/v0/recompute/{deviceId}',
			response.status,
			response.body,
		);
	});
});
