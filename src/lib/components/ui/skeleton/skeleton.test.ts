import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import Skeleton from './skeleton.svelte';
import SkeletonSwap from './skeleton-swap.svelte';

// jsdom has no Web Animations API; Svelte transitions finish on the next microtask.
const nativeAnimate = Element.prototype.animate;
beforeEach(() => {
	Element.prototype.animate = function () {
		return {
			cancel() {},
			set onfinish(done: () => void) {
				queueMicrotask(done);
			}
		} as unknown as Animation;
	};
});
afterEach(() => {
	Element.prototype.animate = nativeAnimate;
});

const skeleton = createRawSnippet(() => ({ render: () => '<div class="bone"></div>' }));
const children = createRawSnippet(() => ({ render: () => '<p>Scout, research agent</p>' }));
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Skeleton', () => {
	test('shimmers by default and keeps the pulse and a still option', async () => {
		const { container, rerender } = render(Skeleton, { class: 'h-4 w-32' });
		const bone = container.firstElementChild as HTMLElement;
		expect(bone).toHaveClass('skeleton-shimmer', 'h-4', 'w-32');
		expect(bone).toHaveAttribute('data-animation', 'shimmer');

		await rerender({ animation: 'pulse' });
		expect(bone).toHaveClass('animate-pulse');
		expect(bone).not.toHaveClass('skeleton-shimmer');

		await rerender({ animation: 'none' });
		expect(bone).not.toHaveClass('animate-pulse');
	});
});

describe('SkeletonSwap', () => {
	test('hides the placeholder from assistive technology and marks the block busy', () => {
		const { container } = render(SkeletonSwap, { loading: true, skeleton, children });
		const wrapper = container.firstElementChild as HTMLElement;
		expect(wrapper).toHaveAttribute('aria-busy', 'true');
		expect(container.querySelector('.bone')?.closest('[aria-hidden="true"]')).not.toBeNull();
		expect(screen.queryByText('Scout, research agent')).not.toBeInTheDocument();
	});

	test('swaps in the content when loading ends and back on reload', async () => {
		const { container, rerender } = render(SkeletonSwap, { loading: true, skeleton, children });
		await rerender({ loading: false, skeleton, children });
		expect(screen.getByText('Scout, research agent')).toBeInTheDocument();
		expect(container.firstElementChild).toHaveAttribute('aria-busy', 'false');
		await settle();
		expect(container.querySelector('.bone')).toBeNull();

		await rerender({ loading: true, skeleton, children });
		await settle();
		expect(container.querySelector('.bone')).not.toBeNull();
		expect(screen.queryByText('Scout, research agent')).not.toBeInTheDocument();
	});
});
