import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import TextScramble from './text-scramble.svelte';
import ButtonFixture from './button-fixture.test.svelte';

function stubReducedMotion(reduce: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: reduce && query.includes('reduce'),
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

beforeEach(() => {
	stubReducedMotion(false);
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const visual = (container: HTMLElement) => container.querySelector('[aria-hidden="true"]');
const cursor = (container: HTMLElement) => container.querySelector('.scramble-cursor');

describe('TextScramble', () => {
	test('reads the text once and keeps the decoding away from assistive technology', () => {
		const { container } = render(TextScramble, { text: 'Agents' });
		expect(screen.getByText('Agents', { selector: '.sr-only' })).toBeInTheDocument();
		expect(visual(container)?.textContent).toBe('Agents');
	});

	test('decodes left to right behind a block cursor when hovered, then settles', async () => {
		const { container } = render(TextScramble, { text: 'Runs' });
		const root = container.firstElementChild as HTMLElement;

		await fireEvent.pointerEnter(root);
		await advance(32);
		expect(cursor(container)).not.toBeNull();
		// Same number of cells the whole way through: settled, cursor, noise.
		const live = cursor(container)?.parentElement as HTMLElement;
		expect(live.textContent?.length).toBe(3);

		await advance(1000);
		expect(cursor(container)).toBeNull();
		expect(visual(container)?.textContent).toBe('Runs');
		expect(vi.getTimerCount()).toBe(0);
	});

	test('listens on the nearest interactive ancestor, for pointer and keyboard focus', async () => {
		const { container } = render(ButtonFixture);
		const button = screen.getByRole('button', { name: /Usage/ });

		await fireEvent.pointerEnter(button);
		await advance(32);
		expect(cursor(container)).not.toBeNull();
		await advance(1000);

		button.focus();
		await advance(32);
		expect(cursor(container)).not.toBeNull();
	});

	test('decodes on mount and again when the text changes', async () => {
		const { container, rerender } = render(TextScramble, { text: 'Thinking', trigger: 'mount' });
		await advance(32);
		expect(cursor(container)).not.toBeNull();
		await advance(1000);
		expect(cursor(container)).toBeNull();

		await rerender({ text: 'Answered' });
		await advance(32);
		expect(cursor(container)).not.toBeNull();
		await advance(1000);
		expect(visual(container)?.textContent).toBe('Answered');
		expect(container.querySelector('.sr-only')).toHaveTextContent('Answered');
	});

	test('holds still for reduced motion', async () => {
		stubReducedMotion(true);
		const { container } = render(TextScramble, { text: 'Models', trigger: 'mount' });
		await fireEvent.pointerEnter(container.firstElementChild as HTMLElement);
		await advance(32);
		expect(cursor(container)).toBeNull();
		expect(visual(container)?.textContent).toBe('Models');
	});

	test('stops its frame loop when destroyed mid-decode', async () => {
		const { unmount } = render(TextScramble, { text: 'Settings', trigger: 'mount' });
		await advance(32);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
