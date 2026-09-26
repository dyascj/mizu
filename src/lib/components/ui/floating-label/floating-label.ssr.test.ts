// @vitest-environment node
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';

import FloatingLabel from './floating-label.svelte';

describe('FloatingLabel server render', () => {
	test('shows an error from outside before the browser takes over', () => {
		const { body } = render(FloatingLabel, {
			props: { label: 'Username', error: 'That name is taken.' }
		});
		const row = body.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '';
		expect(row).toContain('That name is taken.');
		expect(body).toMatch(/aria-invalid="true"/);
	});
});
