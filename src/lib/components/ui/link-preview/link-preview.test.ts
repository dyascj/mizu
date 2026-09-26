import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Harness from './link-preview.test.svelte';

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
	vi.restoreAllMocks();
});

const card = () => document.querySelector<HTMLElement>('[data-link-preview]');
const mouse = { pointerType: 'mouse', clientX: 150 };

describe('LinkPreview', () => {
	test('is a plain link that describes where it goes', () => {
		render(Harness);
		const link = screen.getByRole('link', { name: 'pgvector README' });
		expect(link).toHaveAttribute('href', 'https://github.com/pgvector/pgvector');
		expect(link).toHaveAccessibleDescription('pgvector/pgvector, github.com');
	});

	test('a hovering pointer brings the card, which leaves with it', async () => {
		vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024);
		render(Harness);
		const link = screen.getByRole('link', { name: 'pgvector README' });
		await fireEvent.pointerEnter(link, mouse);
		const shown = card();
		expect(shown).toHaveAttribute('aria-hidden', 'true');
		expect(shown).toHaveTextContent('pgvector/pgvector');
		expect(shown).toHaveTextContent('Vector similarity search for Postgres.');
		// Centered on the pointer, kept inside the viewport.
		expect(shown?.style.translate).toBe('30px 0');

		await fireEvent.pointerLeave(link, mouse);
		await waitFor(() => expect(card()).toBeNull());
	});

	test('plays its exit before it goes', async () => {
		const finishers: (() => void)[] = [];
		Element.prototype.animate = function () {
			return {
				cancel() {},
				set onfinish(done: () => void) {
					finishers.push(done);
				}
			} as unknown as Animation;
		};
		// Svelte runs a transition as a delay step, then the motion itself.
		const settle = async () => {
			for (let step = 0; step < 4; step++) {
				await Promise.resolve();
				finishers.splice(0).forEach((done) => done());
			}
		};
		render(Harness);
		const link = screen.getByRole('link', { name: 'pgvector README' });
		await fireEvent.pointerEnter(link, mouse);
		await settle();

		await fireEvent.pointerLeave(link, mouse);
		await Promise.resolve();
		// Still on screen while the exit plays.
		expect(card()).not.toBeNull();
		expect(finishers.length).toBeGreaterThan(0);
		await settle();
		await waitFor(() => expect(card()).toBeNull());
	});

	test('flips below the link when there is no room above', async () => {
		render(Harness);
		const link = screen.getByRole('link', { name: 'pgvector README' });
		vi.spyOn(link, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 40, 120, 20));
		await fireEvent.pointerEnter(link, mouse);
		expect(card()).toHaveAttribute('data-side', 'bottom');
		expect(card()?.style.top).toBe('70px');
	});

	test('keyboard focus shows it too, and Escape puts it away', async () => {
		render(Harness);
		const link = screen.getByRole('link', { name: 'pgvector README' });
		vi.spyOn(link, 'matches').mockImplementation((selector) => selector === ':focus-visible');
		link.focus();
		await waitFor(() => expect(card()).not.toBeNull());

		await fireEvent.keyDown(link, { key: 'Escape' });
		await waitFor(() => expect(card()).toBeNull());
	});

	test('touch shows it on press and holds it up after release', async () => {
		vi.useFakeTimers();
		render(Harness);
		const link = screen.getByRole('link', { name: 'pgvector README' });
		await fireEvent.pointerDown(link, { pointerType: 'touch' });
		expect(card()).not.toBeNull();
		await fireEvent.pointerUp(link, { pointerType: 'touch' });
		expect(card()).not.toBeNull();
		await vi.advanceTimersByTimeAsync(2000);
		vi.useRealTimers();
		await waitFor(() => expect(card()).toBeNull());
	});
});
