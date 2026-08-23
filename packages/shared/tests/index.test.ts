import { describe, expect, it } from 'vitest';
import { ApiResult } from '../src';

describe('shared types', () => {
	it('exposes the API result helpers', () => {
		const ok: ApiResult<number> = { data: 42 };
		expect(ok.data).toBe(42);
	});
});
