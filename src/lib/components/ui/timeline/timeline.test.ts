import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import Fixture from './timeline.test.svelte';

afterEach(() => vi.unstubAllGlobals());

const item = (title: string) => screen.getByText(title).closest('li')!;

describe('Timeline', () => {
	test('renders an ordered list of events with rails between them', () => {
		render(Fixture, { titles: ['Deployed', 'Reviewed'] });
		const list = screen.getByRole('list', { name: 'Activity' });
		expect(list.tagName).toBe('OL');
		expect(screen.getAllByRole('listitem')).toHaveLength(2);
		// The last item has no rail below it.
		expect(item('Deployed').querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
		expect(item('Reviewed').querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
	});

	test('items present on first render hold still', () => {
		render(Fixture, { titles: ['Deployed', 'Reviewed'] });
		expect(item('Deployed')).not.toHaveClass('timeline-enter');
	});

	test('an item added later opens in, then settles back to plain layout', async () => {
		const { rerender } = render(Fixture, { titles: ['Deployed'] });
		await rerender({ titles: ['Commented', 'Deployed'] });
		const added = item('Commented');
		expect(added).toHaveClass('timeline-enter');
		expect(added.querySelector('.timeline-reveal')).not.toBeNull();
		expect(item('Deployed')).not.toHaveClass('timeline-enter');

		await fireEvent.animationEnd(added);
		expect(added).not.toHaveClass('timeline-enter');
		expect(added.querySelector('.timeline-reveal')).toBeNull();
	});

	test('nothing animates when animated is off or motion is reduced', async () => {
		const { rerender } = render(Fixture, { titles: ['Deployed'], animated: false });
		await rerender({ titles: ['Commented', 'Deployed'], animated: false });
		expect(item('Commented')).not.toHaveClass('timeline-enter');

		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		await rerender({ titles: ['Merged', 'Commented', 'Deployed'], animated: true });
		expect(item('Merged')).not.toHaveClass('timeline-enter');
	});
});
