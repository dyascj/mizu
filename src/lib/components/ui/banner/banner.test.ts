import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import Harness from './banner.test.svelte';

const region = () => screen.getByRole('region', { name: 'Announcement' });
const bar = () => document.querySelector<HTMLElement>('section')!;
// jsdom has no `inert` property, so Svelte writes the value as an attribute instead.
const inert = (el: HTMLElement) =>
	el.inert === true || ![null, 'false'].includes(el.getAttribute('inert'));

describe('Banner', () => {
	test('names its region and shows the message, link, and a decorative icon', () => {
		render(Harness);
		expect(region()).toHaveTextContent('Voice mode is now on for every assistant.');
		expect(screen.getByRole('link', { name: 'Try it' })).toHaveAttribute('href', '#voice');
		expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
	});

	test('dismissing closes it, reports it, and takes it out of reach', async () => {
		const onDismiss = vi.fn();
		render(Harness, { onDismiss });
		await fireEvent.click(screen.getByRole('button', { name: 'Dismiss announcement' }));

		expect(onDismiss).toHaveBeenCalledOnce();
		expect(inert(bar())).toBe(true);
		expect(bar().parentElement?.parentElement).toHaveAttribute('data-state', 'closed');
		expect(bar().parentElement?.parentElement?.style.gridTemplateRows).toBe('0fr');
	});

	describe('focus after dismissing', () => {
		const dismissWithKeyboard = async () => {
			const close = screen.getByRole('button', { name: 'Dismiss announcement' });
			close.focus();
			await fireEvent.click(close);
			await act(() => Promise.resolve());
		};

		test('moves to the first focusable element after the bar', async () => {
			render(Harness);
			await dismissWithKeyboard();
			expect(screen.getByRole('button', { name: 'Toggle' })).toHaveFocus();
		});

		test('falls back to the nearest one before the bar', async () => {
			render(Harness, { after: false });
			await dismissWithKeyboard();
			expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
		});

		test('goes where returnFocus points, as a selector or an element', async () => {
			const { unmount } = render(Harness, { returnFocus: '#elsewhere' });
			await dismissWithKeyboard();
			expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
			unmount();

			const target = document.createElement('button');
			target.textContent = 'Outside';
			document.body.append(target);
			render(Harness, { returnFocus: target });
			await dismissWithKeyboard();
			expect(target).toHaveFocus();
			target.remove();
		});

		test('lets go to the page only when nothing else can take it', async () => {
			render(Harness, { after: false, dismissible: true });
			for (const button of screen.getAllByRole('button').filter((b) => !b.closest('section'))) {
				button.setAttribute('disabled', '');
			}
			await dismissWithKeyboard();
			expect(document.activeElement).toBe(document.body);
		});

		test('respects focus that onDismiss already moved', async () => {
			render(Harness, {
				onDismiss: () => document.getElementById('elsewhere')?.focus()
			});
			await dismissWithKeyboard();
			expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
		});

		test('leaves focus alone when the pointer dismissed without focusing', async () => {
			render(Harness);
			await fireEvent.click(screen.getByRole('button', { name: 'Dismiss announcement' }));
			await act(() => Promise.resolve());
			expect(document.activeElement).toBe(document.body);
		});
	});

	describe('under reduced motion', () => {
		afterEach(() => vi.unstubAllGlobals());

		test('snaps without the choreographed delays', async () => {
			vi.stubGlobal('matchMedia', (query: string) => ({
				matches: query.includes('reduce'),
				media: query,
				addEventListener() {},
				removeEventListener() {}
			}));
			render(Harness);
			await fireEvent.click(screen.getByRole('button', { name: 'Dismiss announcement' }));
			expect(bar().style.transition).toBe('none');
			expect(bar().parentElement?.parentElement?.style.transition).toBe('none');
		});
	});

	test('can hide the dismiss button', () => {
		render(Harness, { dismissible: false });
		expect(screen.queryByRole('button', { name: 'Dismiss announcement' })).not.toBeInTheDocument();
	});

	test('slides down from above the first time, then returns by fading in place', async () => {
		render(Harness, { open: false });
		expect(bar().style.translate).toBe('0 -100%');

		const toggle = screen.getByRole('button', { name: 'Toggle' });
		await fireEvent.click(toggle);
		expect(bar().style.translate).toBe('0 0');
		expect(inert(bar())).toBe(false);

		await fireEvent.click(toggle);
		// Once dismissed, it folds away where it is instead of retreating upward.
		expect(bar().style.translate).toBe('0 0');
		expect(bar().style.opacity).toBe('0');
	});
});
