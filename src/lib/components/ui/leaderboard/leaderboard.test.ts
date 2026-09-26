import { render, screen, within } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Leaderboard from './leaderboard.svelte';

// jsdom has no Web Animations API; Svelte transitions finish on the next microtask.
const nativeAnimate = Element.prototype.animate;
function fakeAnimate() {
	return {
		cancel() {},
		set onfinish(done: () => void) {
			queueMicrotask(done);
		}
	} as unknown as Animation;
}

beforeEach(() => {
	Element.prototype.animate = fakeAnimate;
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: false,
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	vi.unstubAllGlobals();
});

const items = [
	{ id: 'b', name: 'Nimbus Large', score: 1262 },
	{ id: 'a', name: 'Aster 4 Pro', score: 1284 },
	{ id: 'c', name: 'Kestrel 2', score: 1262, avatar: '/kestrel.png' }
];

const names = () =>
	screen
		.getAllByRole('listitem')
		.map((item) => item.textContent?.replace(/\s+/g, ' ').trim() ?? '');

describe('Leaderboard', () => {
	test('ranks by score, then by name, and reads each row as place, name, and score', () => {
		render(Leaderboard, { items, label: 'Arena', locale: 'en-US' });
		const list = screen.getByRole('list', { name: 'Arena' });
		const rows = within(list).getAllByRole('listitem');
		expect(rows).toHaveLength(3);
		expect(names()[0]).toContain('1st, Aster 4 Pro, 1,284 points');
		expect(names()[1]).toContain('2nd, Kestrel 2, 1,262 points');
		expect(names()[2]).toContain('3rd, Nimbus Large, 1,262 points');
	});

	test('moves rows in the DOM when scores change, so reading order follows rank', async () => {
		const { rerender } = render(Leaderboard, { items, locale: 'en-US' });
		await rerender({
			items: items.map((item) => (item.id === 'b' ? { ...item, score: 1300 } : item)),
			moves: { b: 2, a: -1, c: -1 }
		});
		expect(names()[0]).toContain('1st, Nimbus Large, 1,300 points');
		expect(names()[1]).toContain('2nd, Aster 4 Pro');
	});

	test('shows movement cues for the entries that moved', async () => {
		const { container, rerender } = render(Leaderboard, { items, locale: 'en-US' });
		const cue = (row: number) =>
			container.querySelectorAll('li')[row].querySelector('.justify-end') as HTMLElement;
		expect(cue(0)).toHaveClass('opacity-0');

		await rerender({ items, moves: { a: 2 } });
		expect(cue(0)).not.toHaveClass('opacity-0');
		expect(cue(0)).toHaveTextContent('2');

		// Clearing the cue fades it out but keeps the figure while it leaves.
		await rerender({ items, moves: {} });
		expect(cue(0)).toHaveClass('opacity-0');
		expect(cue(0)).toHaveTextContent('2');
	});

	test('uses the avatar image when given and initials otherwise', () => {
		const { container } = render(Leaderboard, { items, locale: 'en-US' });
		expect(container.querySelector('img')).toHaveAttribute('src', '/kestrel.png');
		expect(container.querySelector('img')).toHaveAttribute('alt', '');
		expect(names()[0]).toContain('A4');
	});

	test('can speak a different unit', () => {
		render(Leaderboard, { items, unit: 'Elo', locale: 'en-US' });
		expect(names()[0]).toContain('1,284 Elo');
	});

	test('uses English ordinals only for English, and a plain rank otherwise', () => {
		const { unmount } = render(Leaderboard, { items, locale: 'en-GB' });
		expect(names()[1]).toContain('2nd, Kestrel 2');
		unmount();
		render(Leaderboard, { items, unit: 'Punkte', locale: 'de-DE' });
		expect(names()[0]).toContain('1, Aster 4 Pro, 1.284 Punkte');
		expect(names()[0]).not.toContain('1st');
	});
});
