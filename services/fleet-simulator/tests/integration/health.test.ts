import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp, SERVICE_NAME } from '../../src/app';

describe('GET /fleet-simulator/v0/health-check', () => {
	it('responds with status code and service name', async () => {
		const res = await request(createApp()).get('/fleet-simulator/v0/health-check');
		expect([200, 503]).toContain(res.status);
		expect(res.body).toEqual({ statusCode: res.status, service: SERVICE_NAME });
	});
});
