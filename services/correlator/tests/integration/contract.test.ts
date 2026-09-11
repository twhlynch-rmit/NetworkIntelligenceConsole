import path from 'node:path';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { loadOpenApiSpec, validateOpenApiResponse } from '@nic/contract-tests/openapi';

import { createApp } from '../../src/app';

type OpenApiDocument = Awaited<ReturnType<typeof loadOpenApiSpec>>;

describe('correlator OpenAPI contract', () => {
	let spec: OpenApiDocument;

	beforeAll(async () => {
		spec = await loadOpenApiSpec(
			path.resolve(process.cwd(), '../../docs/openapi/correlator.yaml'),
		);
	});

	it('validates GET /correlator/v0/health-check', async () => {
		const response = await request(createApp()).get('/correlator/v0/health-check');

		expect([200, 503]).toContain(response.status);

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
