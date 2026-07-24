import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';

import Waveform from './waveform.svelte';

describe('Waveform', () => {
	test.each([
		[-4, 1],
		[2.6, 3],
		[500, 64],
		[Number.NaN, 5]
	])('normalizes a bars value of %s to %s rendered bars', (bars, expected) => {
		render(Waveform, { bars });

		expect(screen.getByRole('img').querySelectorAll('span')).toHaveLength(expected);
	});
});
