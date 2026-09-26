<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { setTabBarContext } from './context.js';

	type Props = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
		/** `floating` is a centered glass pill; `docked` spans the bottom edge. */
		variant?: 'floating' | 'docked';
		/** Pin the bar to the bottom of the viewport, clear of the home indicator. */
		fixed?: boolean;
		/** Hide the text under each icon. Hidden labels still name the items for assistive technology. */
		labels?: 'visible' | 'hidden';
		/** Accessible name for the navigation landmark. */
		label?: string;
		class?: string;
		ref?: HTMLElement | null;
		children?: Snippet;
	};

	let {
		variant = 'floating',
		fixed = false,
		labels = 'visible',
		label = 'Main',
		class: className,
		ref = $bindable(null),
		children,
		...rest
	}: Props = $props();

	type Box = { x: number; y: number; width: number; height: number };

	let track = $state<HTMLDivElement | null>(null);
	let target = $state<HTMLElement | null>(null);
	let box = $state<Box | null>(null);
	// Off until the first position has painted, so the indicator appears in
	// place instead of sliding in from the corner.
	let animate = $state(false);

	setTabBarContext({
		get variant() {
			return variant;
		},
		get labels() {
			return labels;
		},
		get measured() {
			return box !== null;
		},
		activate(element) {
			target = element;
			return () => {
				if (target === element) target = null;
			};
		}
	});

	// Layout offsets ignore transforms, so a pressed (scaled) item never skews
	// the measurement the way getBoundingClientRect would.
	function measure() {
		if (!track || !target) {
			box = null;
			return;
		}
		let x = 0;
		let y = 0;
		let node: HTMLElement | null = target;
		while (node && node !== track) {
			x += node.offsetLeft;
			y += node.offsetTop;
			node = node.offsetParent as HTMLElement | null;
		}
		box = { x, y, width: target.offsetWidth, height: target.offsetHeight };
	}

	// A new active item slides the indicator.
	$effect(() => {
		void target;
		measure();
	});

	// First paint and resizes jump straight to the new position, then motion
	// resumes two frames later, once the browser has committed it. Items
	// resize with the track, so observing the track alone is enough.
	$effect(() => {
		if (!track) return;
		let frame = 0;
		const snap = () => {
			animate = false;
			measure();
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				frame = requestAnimationFrame(() => (animate = !prefersReducedMotion()));
			});
		};
		untrack(snap);
		const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(snap);
		observer?.observe(track);
		return () => {
			observer?.disconnect();
			cancelAnimationFrame(frame);
		};
	});
</script>

<nav
	bind:this={ref}
	aria-label={label}
	data-variant={variant}
	class={cn(
		variant === 'floating'
			? 'px-safe pb-safe pointer-events-none flex justify-center'
			: 'glass px-safe pb-safe w-full pt-1.5 shadow-md dark:shadow-[0_-1px_0_var(--glass-border)]',
		fixed && 'fixed inset-x-0 bottom-0 z-40',
		className
	)}
	{...rest}
>
	<div
		bind:this={track}
		class={cn(
			'relative',
			variant === 'floating'
				? 'glass pointer-events-auto max-w-full rounded-full border p-1 shadow-lg'
				: 'mx-auto max-w-lg'
		)}
	>
		{#if box}
			<span
				aria-hidden="true"
				data-slot="indicator"
				class={cn(
					'bg-primary-muted pointer-events-none absolute top-0 left-0 rounded-full shadow-xs',
					animate && 'ease-spring transition-[translate,width,height] duration-(--duration-spring)'
				)}
				style="translate: {box.x}px {box.y}px; width: {box.width}px; height: {box.height}px;"
			></span>
		{/if}
		<ul class={cn('relative flex', variant === 'floating' ? 'gap-0.5' : 'justify-around')}>
			{@render children?.()}
		</ul>
	</div>
</nav>
