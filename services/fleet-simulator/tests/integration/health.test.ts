import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp, SERVICE_NAME } from '../../src/app';

describe('GET /fleet-simulator/v0/health-check', () => {
	it('responds with ok status and service name', async () => {
		const res = await request(createApp()).get('/fleet-simulator/v0/health-check');
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ status: 'ok', service: SERVICE_NAME });
	});
});
