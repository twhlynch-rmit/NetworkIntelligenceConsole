import { describe, expect, it } from 'vitest';
import { SERVICE_NAME } from '../../src';

describe('correlator', () => {
	it('has a service name', () => {
		expect(SERVICE_NAME).toBeTypeOf('string');
	});
});
