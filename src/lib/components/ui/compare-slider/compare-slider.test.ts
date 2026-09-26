import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import CompareSlider from './compare-slider.svelte';

const before = createRawSnippet(() => ({ render: () => '<p>hey team, launch moved</p>' }));
const after = createRawSnippet(() => ({ render: () => '<p>Hi team, the launch moves</p>' }));

// Reduced motion jumps straight to each new position.
beforeEach(() => {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: query.includes('reduce'),
		addEventListener() {},
		removeEventListener() {}
	}));
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

const frame = (container: HTMLElement) =>
	container.querySelector('[data-slot="compare-slider"]') as HTMLElement;
const afterLayer = (container: HTMLElement) => frame(container).children[1] as HTMLElement;

describe('CompareSlider', () => {
	test('exposes a labelled slider with a spoken split', () => {
		render(CompareSlider, { before, after, label: 'Rewrite comparison' });
		const slider = screen.getByRole('slider', { name: 'Rewrite comparison' });
		expect(slider).toHaveAttribute('aria-valuenow', '50');
		expect(slider).toHaveAttribute('aria-valuetext', '50% Before, 50% After');
		expect(slider).toHaveAttribute('tabindex', '0');
	});

	test('arrow, page, Home, and End keys move the divider and report it', async () => {
		const onValueChange = vi.fn();
		const { container } = render(CompareSlider, { before, after, onValueChange });
		const slider = screen.getByRole('slider');

		await fireEvent.keyDown(slider, { key: 'ArrowRight' });
		expect(slider).toHaveAttribute('aria-valuenow', '55');
		expect(onValueChange).toHaveBeenLastCalledWith(55);
		expect(afterLayer(container).style.clipPath).toBe('inset(0 0 0 55%)');

		await fireEvent.keyDown(slider, { key: 'PageDown' });
		expect(slider).toHaveAttribute('aria-valuenow', '45');
		await fireEvent.keyDown(slider, { key: 'Home' });
		expect(slider).toHaveAttribute('aria-valuetext', '0% Before, 100% After');
		await fireEvent.keyDown(slider, { key: 'ArrowLeft' });
		expect(slider).toHaveAttribute('aria-valuenow', '0');
		await fireEvent.keyDown(slider, { key: 'End' });
		expect(slider).toHaveAttribute('aria-valuenow', '100');
	});

	test('a mouse press moves the divider there and focuses the handle', async () => {
		const { container } = render(CompareSlider, { before, after });
		const root = frame(container);
		vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({
			x: 0,
			y: 0,
			left: 0,
			top: 0,
			right: 400,
			bottom: 300,
			width: 400,
			height: 300,
			toJSON: () => ({})
		});

		await fireEvent.pointerDown(root, {
			button: 0,
			pointerId: 1,
			pointerType: 'mouse',
			clientX: 100
		});
		const slider = screen.getByRole('slider');
		expect(slider).toHaveAttribute('aria-valuenow', '25');
		expect(slider).toHaveFocus();
		expect(root).toHaveAttribute('data-dragging');

		await fireEvent.pointerMove(root, { pointerId: 1, pointerType: 'mouse', clientX: 300 });
		expect(slider).toHaveAttribute('aria-valuenow', '75');
		await fireEvent.pointerUp(root, { pointerId: 1, pointerType: 'mouse', clientX: 300 });
		expect(root).not.toHaveAttribute('data-dragging');
	});

	test('a touch waits to see whether it is a tap or a drag', async () => {
		const { container } = render(CompareSlider, { before, after });
		const root = frame(container);
		vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({
			x: 0,
			y: 0,
			left: 0,
			top: 0,
			right: 400,
			bottom: 300,
			width: 400,
			height: 300,
			toJSON: () => ({})
		});
		const slider = screen.getByRole('slider');

		await fireEvent.pointerDown(root, {
			button: 0,
			pointerId: 2,
			pointerType: 'touch',
			clientX: 100
		});
		expect(slider).toHaveAttribute('aria-valuenow', '50');
		await fireEvent.pointerMove(root, { pointerId: 2, pointerType: 'touch', clientX: 102 });
		expect(slider).toHaveAttribute('aria-valuenow', '50');
		await fireEvent.pointerUp(root, { pointerId: 2, pointerType: 'touch', clientX: 102 });
		expect(slider).toHaveAttribute('aria-valuenow', '26');
	});

	test('follows a value set from outside and hides the tags when asked', async () => {
		const { container, rerender } = render(CompareSlider, { before, after, value: 30 });
		expect(screen.getByText('Before')).toBeInTheDocument();
		await rerender({ before, after, value: 80, showLabels: false });
		expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '80');
		expect(afterLayer(container).style.clipPath).toBe('inset(0 0 0 80%)');
		expect(screen.queryByText('Before')).not.toBeInTheDocument();
	});

	test('pointer handlers passed by the caller run too, and can take over a press', async () => {
		const onpointerdown = vi.fn();
		const { container } = render(CompareSlider, { before, after, onpointerdown });
		const root = frame(container);
		vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({
			x: 0,
			y: 0,
			left: 0,
			top: 0,
			right: 400,
			bottom: 300,
			width: 400,
			height: 300,
			toJSON: () => ({})
		});
		await fireEvent.pointerDown(root, {
			button: 0,
			pointerId: 1,
			pointerType: 'mouse',
			clientX: 100
		});
		expect(onpointerdown).toHaveBeenCalledOnce();
		expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '25');
		await fireEvent.pointerUp(root, { pointerId: 1, pointerType: 'mouse', clientX: 100 });

		onpointerdown.mockImplementation((event: PointerEvent) => event.preventDefault());
		await fireEvent.pointerDown(root, {
			button: 0,
			pointerId: 2,
			pointerType: 'mouse',
			clientX: 300
		});
		expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '25');
	});

	test('speaks the side labels as given, so acronyms keep their case', () => {
		render(CompareSlider, { before, after, beforeLabel: 'SDR', afterLabel: 'HDR', value: 30 });
		expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '30% SDR, 70% HDR');
	});
});
