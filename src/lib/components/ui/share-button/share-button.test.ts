import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import ShareButton from './share-button.svelte';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

function mockClipboard(clipboard: { writeText: (text: string) => Promise<void> } | undefined) {
	Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
}

const props = { url: 'https://chat.example.com/share/c-4821', title: 'Kyoto trip itinerary' };
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const liveRegion = (container: HTMLElement) =>
	container.querySelector('[aria-live="polite"]')?.textContent?.trim();

describe('ShareButton', () => {
	test('starts closed with the targets out of reach', () => {
		render(ShareButton, props);
		const trigger = screen.getByRole('button', { name: 'Share' });
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		const group = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
		expect(group).toHaveAttribute('role', 'group');
		expect(group?.inert).toBe(true);
	});

	test('opens in place, moves focus to the first target, and builds share links', async () => {
		render(ShareButton, props);
		const trigger = screen.getByRole('button', { name: 'Share' });
		trigger.focus();
		await fireEvent.click(trigger);
		await advance(0);

		const group = screen.getByRole('group', { name: 'Share Kyoto trip itinerary' });
		expect(group.inert).toBe(false);
		expect(trigger.inert).toBe(true);
		expect(screen.getByRole('button', { name: 'Copy link' })).toHaveFocus();

		const post = screen.getByRole('link', { name: 'Post on X' });
		expect(post.getAttribute('href')).toBe(
			'https://x.com/intent/post?text=Kyoto%20trip%20itinerary&url=https%3A%2F%2Fchat.example.com%2Fshare%2Fc-4821'
		);
		expect(post).toHaveAttribute('target', '_blank');
		expect(screen.getByRole('link', { name: 'Email' }).getAttribute('href')).toContain('mailto:?');
	});

	test('closes on Escape and returns focus to the trigger', async () => {
		render(ShareButton, { ...props, open: true });
		screen.getByRole('button', { name: 'Copy link' }).focus();
		await fireEvent.keyDown(document, { key: 'Escape' });
		await advance(0);
		const trigger = screen.getByRole('button', { name: 'Share' });
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(trigger).toHaveFocus();
	});

	test('closes from the close button and on a press outside', async () => {
		render(ShareButton, { ...props, open: true });
		await fireEvent.click(screen.getByRole('button', { name: 'Close' }));
		await advance(0);
		const trigger = screen.getByRole('button', { name: 'Share' });
		expect(trigger).toHaveAttribute('aria-expanded', 'false');

		await fireEvent.click(trigger);
		await advance(0);
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
		await fireEvent.pointerDown(document.body);
		await advance(0);
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	test('copies the link, grows a word, announces it, and settles back', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		mockClipboard({ writeText });
		const onCopy = vi.fn();
		const { container } = render(ShareButton, { ...props, open: true, onCopy, timeout: 1000 });

		await fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
		expect(writeText).toHaveBeenCalledWith(props.url);
		expect(onCopy).toHaveBeenCalledWith(props.url);
		expect(screen.getByRole('button', { name: 'Link copied' })).toBeInTheDocument();
		expect(liveRegion(container)).toBe('Link copied');

		await advance(1000);
		expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
		expect(liveRegion(container)).toBe('');
	});

	test('announces a refused copy', async () => {
		mockClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
		const { container } = render(ShareButton, { ...props, open: true });
		await fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
		expect(liveRegion(container)).toBe("Couldn't copy the link");
	});

	test('offers the system share sheet only where one exists', async () => {
		render(ShareButton, { ...props, open: true });
		expect(screen.queryByRole('button', { name: 'More ways to share' })).toBeNull();
	});

	test('uses the system share sheet when available', async () => {
		const share = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, 'share', { configurable: true, value: share });
		render(ShareButton, { ...props, open: true });
		await advance(0);
		await fireEvent.click(screen.getByRole('button', { name: 'More ways to share' }));
		expect(share).toHaveBeenCalledWith({ title: props.title, url: props.url });
		delete (navigator as Partial<Navigator>).share;
	});

	test('takes every name and message as a prop, for other languages', async () => {
		mockClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
		Object.defineProperty(navigator, 'share', {
			configurable: true,
			value: vi.fn().mockResolvedValue(undefined)
		});
		const { container } = render(ShareButton, {
			...props,
			open: true,
			label: 'Partager',
			groupLabel: 'Partager l’itinéraire',
			copyLabel: 'Copier le lien',
			copiedLabel: 'Lien copié',
			copiedText: 'Copié',
			postLabel: 'Publier sur X',
			emailLabel: 'E-mail',
			moreLabel: 'Autres options',
			closeLabel: 'Fermer'
		});
		await advance(0);
		expect(screen.getByRole('group', { name: 'Partager l’itinéraire' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Publier sur X' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'E-mail' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Autres options' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();

		const copy = screen.getByRole('button', { name: 'Copier le lien' });
		await fireEvent.click(copy);
		await advance(0);
		expect(copy).toHaveAccessibleName('Lien copié');
		expect(copy).toHaveTextContent('Copié');
		expect(liveRegion(container)).toBe('Lien copié');
		delete (navigator as Partial<Navigator>).share;
	});

	test('announces a refused copy in the given words', async () => {
		mockClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
		const { container } = render(ShareButton, {
			...props,
			open: true,
			failedLabel: 'Impossible de copier le lien'
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
		await advance(0);
		expect(liveRegion(container)).toBe('Impossible de copier le lien');
	});

	test('clears its timer when destroyed', async () => {
		mockClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
		const { unmount } = render(ShareButton, { ...props, open: true });
		await fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
		await vi.advanceTimersByTimeAsync(0);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
