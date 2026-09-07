import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp, SERVICE_NAME } from '../../src/app';

describe('GET /correlator/v0/health-check', () => {
	it('responds with status code 200 and service name', async () => {
		const res = await request(createApp()).get('/correlator/v0/health-check');
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ statusCode: 200, service: SERVICE_NAME });
	});
});
