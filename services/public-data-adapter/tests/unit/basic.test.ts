import { describe, expect, it } from 'vitest';
import { SERVICE_NAME } from '../../src';

describe('public-data-adapter', () => {
	it('has a service name', () => {
		expect(SERVICE_NAME).toBeTypeOf('string');
	});
});
