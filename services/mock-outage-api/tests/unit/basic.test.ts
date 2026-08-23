import { describe, expect, it } from 'vitest';
import { SERVICE_NAME } from '../../src/app';

describe('mock-outage-api', () => {
	it('has a service name', () => {
		expect(SERVICE_NAME).toBeTypeOf('string');
		expect(SERVICE_NAME.length).toBeGreaterThan(0);
	});
});
