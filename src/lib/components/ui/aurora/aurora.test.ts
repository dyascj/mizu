import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';

import Aurora from './aurora.svelte';

describe('Aurora', () => {
	test('falls back to the default palette and speed for empty or invalid values', () => {
		const { container } = render(Aurora, { colors: [], speed: -1 });
		const root = container.firstElementChild as HTMLElement;
		const blobs = [...container.querySelectorAll<HTMLElement>('.mizu-aurora-blob')];

		expect(root.style.getPropertyValue('--aurora-speed')).toBe('18s');
		expect(blobs).toHaveLength(4);
		expect(blobs.every((blob) => !blob.style.cssText.includes('undefined'))).toBe(true);
		expect(blobs[0].style.getPropertyValue('--aurora-color')).toBe('#ffd9e8');
	});
});
