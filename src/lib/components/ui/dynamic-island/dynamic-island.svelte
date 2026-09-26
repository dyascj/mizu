<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { SpringValue, springPresets } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { setDynamicIslandState, type IslandShape } from './context.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Name of the `DynamicIsland.Activity` on show. The island morphs to fit it. */
		activity: string;
		/**
		 * Freezes looping motion inside the island, such as a working spinner or
		 * voice bars, in place rather than snapping it back.
		 */
		paused?: boolean;
		/**
		 * Height in pixels kept for the island, so content below never moves as
		 * it grows. Defaults to the tallest activity shown so far.
		 */
		reserve?: number;
		/** The island element. */
		ref?: HTMLDivElement | null;
		/** Classes for the outer row that holds the island at its top center. */
		class?: string;
		/** `DynamicIsland.Activity` elements. */
		children: Snippet;
	};

	let {
		activity,
		paused = false,
		reserve,
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: Props = $props();

	/** The softer corner an expanded card settles on, so it reads as a card, not a capsule. */
	const CARD_RADIUS = 32;

	// Read only when the activity changes, so a plain record is enough.
	const labels: Record<string, () => string | undefined> = {};
	let tallest = $state(0);
	let announcement = $state('');
	let sized = $state(false);
	/** Mirrors `sized` without subscribing whoever paints. */
	let hasSize = false;
	let content: HTMLElement | null = null;
	let observer: ResizeObserver | undefined;
	let shape: IslandShape = 'pill';

	const paint = () => {
		if (!ref || !hasSize) return;
		const height = size.height.current;
		ref.style.width = `${size.width.current}px`;
		ref.style.height = `${height}px`;
		ref.style.borderRadius = `${Math.max(0, Math.min(size.radius.current, height / 2))}px`;
	};

	// The island is the playful exception: width and height ride the bouncy
	// spring so the overshoot reads, while the corner eases in without one.
	const size = {
		width: new SpringValue(0, { preset: springPresets.bouncy, onUpdate: paint }),
		height: new SpringValue(0, { preset: springPresets.bouncy, onUpdate: paint }),
		radius: new SpringValue(0, { preset: springPresets.smooth, onUpdate: paint })
	};

	function measure(node: HTMLElement) {
		const width = node.offsetWidth;
		const height = node.offsetHeight;
		if (!width || !height) return;
		const radius = shape === 'card' ? Math.min(CARD_RADIUS, height / 2) : height / 2;
		tallest = Math.max(tallest, height);
		if (!hasSize) {
			hasSize = true;
			sized = true;
			size.width.jump(width);
			size.height.jump(height);
			size.radius.jump(radius);
			return;
		}
		// Retargeting keeps each spring's velocity, so switching mid-morph bends
		// the motion instead of restarting it.
		size.width.set(width);
		size.height.set(height);
		size.radius.set(radius);
	}

	setDynamicIslandState({
		get activity() {
			return activity;
		},
		register(name, label) {
			labels[name] = label;
			return () => {
				if (labels[name] === label) delete labels[name];
			};
		},
		track(node, nodeShape) {
			content = node;
			shape = nodeShape;
			untrack(() => measure(node));
			if (typeof ResizeObserver !== 'undefined') {
				observer ??= new ResizeObserver(() => {
					if (content) measure(content);
				});
				observer.observe(node);
			}
			return () => {
				observer?.unobserve(node);
				if (content === node) content = null;
			};
		}
	});

	// The island element can bind after the first activity is measured.
	$effect(() => {
		if (ref) paint();
	});

	// Announced once per change rather than as the content updates, so a
	// screen reader is not read a ticking clock every second.
	let previous = untrack(() => activity);
	$effect(() => {
		const next = activity;
		if (next === previous) return;
		previous = next;
		announcement = labels[next]?.() ?? '';
	});

	$effect(() => () => {
		observer?.disconnect();
		size.width.stop();
		size.height.stop();
		size.radius.stop();
	});
</script>

<!-- Fixed to the tallest activity and anchored at the top, so the island grows
     down and out symmetrically and nothing below it moves. -->
<div
	{...restProps}
	class={cn('@container flex w-full justify-center', className)}
	style:height={(reserve ?? tallest) ? `${reserve ?? tallest}px` : undefined}
>
	<div
		bind:this={ref}
		data-paused={paused ? '' : undefined}
		class={cn(
			'dynamic-island bg-foreground text-background relative grid max-w-full shrink-0 content-start justify-center overflow-hidden',
			// Until measured, such as on the server, the island hugs its content.
			!sized && 'rounded-3xl'
		)}
	>
		{@render children()}
	</div>
	<span class="sr-only" aria-live="polite">{announcement}</span>
</div>

<style>
	.dynamic-island[data-paused] :global(*) {
		animation-play-state: paused;
	}
</style>
