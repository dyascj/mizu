<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { duration, prefersReducedMotion, SpringValue, springs } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { setTabBarContext } from './context.js';

	type Props = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
		/** `floating` is a centered glass pill; `docked` spans the bottom edge. */
		variant?: 'floating' | 'docked';
		/** Pin the bar to the bottom of the viewport, clear of the home indicator. */
		fixed?: boolean;
		/**
		 * `visible` puts text under every icon. `hidden` drops it from view while it
		 * still names each item for assistive technology. `active` shows only the
		 * label of the current item, beside its icon: that item widens as its label fades
		 * in, its neighbors close up, and the highlight glides over with them.
		 */
		labels?: 'visible' | 'hidden' | 'active';
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
	/**
	 * The last item to claim the highlight, kept outside reactivity. When the
	 * selection moves to an earlier item, the new item claims it before the old
	 * one lets go, and a teardown can still read the old `target`, so the
	 * release is checked against this instead.
	 */
	let claimed: HTMLElement | null = null;
	let box = $state<Box | null>(null);
	// Off until the first position has painted, so the indicator appears in
	// place instead of sliding in from the corner.
	let animate = $state(false);

	// With `labels="active"` the items change width as the selection moves, so
	// the highlight cannot aim at a fixed box. It chases the active item's live
	// box on a spring for as long as the row is still reflowing.
	const morphing = $derived(labels === 'active');

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
			claimed = element;
			target = element;
			return () => {
				if (claimed !== element) return;
				claimed = null;
				target = null;
			};
		}
	});

	// Layout offsets ignore transforms, so a pressed (scaled) item never skews
	// the measurement the way getBoundingClientRect would.
	function read(): Box | null {
		if (!track || !target) return null;
		let x = 0;
		let y = 0;
		let node: HTMLElement | null = target;
		while (node && node !== track) {
			x += node.offsetLeft;
			y += node.offsetTop;
			node = node.offsetParent as HTMLElement | null;
		}
		return { x, y, width: target.offsetWidth, height: target.offsetHeight };
	}

	function measure() {
		box = read();
	}

	// Each edge of the highlight on its own velocity-preserving spring.
	const left = new SpringValue(0);
	const right = new SpringValue(0);
	let chaseFrame = 0;
	let reflowUntil = 0;

	function jump() {
		cancelAnimationFrame(chaseFrame);
		chaseFrame = 0;
		const next = read();
		if (next) {
			left.jump(next.x);
			right.jump(next.x + next.width);
		}
		box = next;
	}

	function chase(now: number) {
		const next = read();
		if (!next) {
			box = null;
			chaseFrame = 0;
			return;
		}
		// Retargeting keeps each spring's velocity, so the edges bend toward
		// the live box instead of restarting.
		const nextRight = next.x + next.width;
		if (left.target !== next.x) left.set(next.x);
		if (right.target !== nextRight) right.set(nextRight);
		box = { x: left.current, y: next.y, width: right.current - left.current, height: next.height };
		// Keeps following until the widths have finished their own spring.
		const settled = !left.moving && !right.moving;
		chaseFrame = settled && now > reflowUntil ? 0 : requestAnimationFrame(chase);
	}

	function startChase() {
		reflowUntil = performance.now() + springs.smooth.duration + duration.fast;
		if (!chaseFrame) chaseFrame = requestAnimationFrame(chase);
	}

	// A new active item slides the indicator.
	$effect(() => {
		void target;
		if (!untrack(() => morphing)) {
			measure();
			return;
		}
		untrack(() => {
			if (box === null || !target || prefersReducedMotion()) jump();
			else startChase();
		});
	});

	// First paint and resizes jump straight to the new position, then motion
	// resumes two frames later, once the browser has committed it. Items
	// resize with the track, so observing the track alone is enough.
	$effect(() => {
		if (!track) return;
		const reflowing = morphing;
		let frame = 0;
		const snap = () => {
			// Mid-reflow the track resizes because its items are still moving;
			// keep chasing rather than snapping.
			if (reflowing) {
				if (chaseFrame || performance.now() < reflowUntil) startChase();
				else jump();
				return;
			}
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

	$effect(() => () => {
		cancelAnimationFrame(chaseFrame);
		left.stop();
		right.stop();
	});
</script>

<nav
	bind:this={ref}
	aria-label={label}
	data-variant={variant}
	data-labels={labels}
	class={cn(
		variant === 'floating'
			? 'pointer-events-none flex justify-center'
			: 'glass w-full pt-1.5 shadow-md dark:shadow-[0_-1px_0_var(--glass-border)]',
		// Device insets only apply at the screen edge; embedded bars keep a fixed margin.
		fixed ? 'px-safe pb-safe fixed inset-x-0 bottom-0 z-40' : 'px-3 pb-3',
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
					animate &&
						!morphing &&
						'ease-spring transition-[translate,width,height] duration-(--duration-spring)'
				)}
				style="translate: {box.x}px {box.y}px; width: {box.width}px; height: {box.height}px;"
			></span>
		{/if}
		<ul
			class={cn(
				'relative flex',
				variant === 'floating' ? 'gap-0.5' : 'justify-around',
				variant === 'floating' && morphing && 'gap-1'
			)}
		>
			{@render children?.()}
		</ul>
	</div>
</nav>
