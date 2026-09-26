<script lang="ts" module>
	import type { Component } from 'svelte';

	export type OrbitLogo = {
		/** Names the mark. Shown under it while pointed at or focused. */
		name: string;
		/** The mark, such as a lucide icon or your own SVG component. It inherits the text color. */
		icon: Component<{ class?: string }>;
		/** Makes the mark a link. Without it the mark is a button that calls `onSelect`. */
		href?: string;
	};

	export type OrbitRing = {
		/** The marks on this ring, spaced evenly. */
		logos: OrbitLogo[];
		/** Width across, as a share of the stage's width, from 0 to 1. */
		radius: number;
		/** Seconds per lap. Negative turns the other way. */
		lap: number;
	};
</script>

<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { fade } from 'svelte/transition';
	import { duration, easeIn, rise } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The rings, innermost first. */
		rings: OrbitRing[];
		/** What the marks circle, such as a heading or a stat. */
		children?: Snippet;
		/**
		 * Brake to a stop and hold still. Like Marquee, the orbit loops by default
		 * as a documented exception for marketing surfaces, not a sign of AI
		 * activity. Offer a control bound to this prop so readers can stop the
		 * motion (WCAG 2.2.2).
		 */
		paused?: boolean;
		/** Called when a mark without an `href` is clicked. */
		onSelect?: (logo: OrbitLogo) => void;
		/** The stage element. */
		ref?: HTMLDivElement | null;
		/**
		 * Classes for the stage. Size it here; it defaults to a 16 by 10 shape. A
		 * taller shape, such as `aspect-square` on small screens, tips the rings toward you.
		 */
		class?: string;
	};

	let {
		rings,
		children,
		paused = false,
		onSelect,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	/**
	 * How far the rings are tipped away from you: on a 16 by 10 stage the
	 * vertical radius is this share of the horizontal one, so each circle reads
	 * as a tilted plane. Tipped enough that the rings pass above and below the
	 * heading, not through it. A taller stage tips them toward you, which gives
	 * a narrow screen room to spread the marks out.
	 */
	const TILT = 0.42;
	const TILT_ASPECT = 10 / 16;
	/** An orbit brakes to a stop rather than freezing, and picks back up as smoothly. */
	const BRAKE = 4;
	/** The mark's hit area, kept inside the stage at the widest point of a ring. */
	const ITEM = 44;
	/**
	 * Below this stage width the marks shrink with it, down to `MIN_FIT`, so a
	 * narrow orbit does not crowd. At the back of the ring that still leaves a
	 * 24px target.
	 */
	const FULL_WIDTH = 560;
	const MIN_FIT = 0.8;

	const flat = $derived(
		rings.flatMap((ring, r) => ring.logos.map((logo, i) => ({ logo, r, i, n: ring.logos.length })))
	);

	let active = $state<string | null>(null);
	let hovering = $state(false);
	let focused = $state(false);
	/** Wakes the loop from outside the effect. */
	let wake: (() => void) | null = null;
	/** Repaints a still frame, for changes while the loop sleeps. */
	let repaint: (() => void) | null = null;

	$effect(() => {
		const stage = ref;
		const items = flat;
		const orbits = rings;
		if (!stage || items.length === 0) return;
		// Everything below runs once per layout; the pointer and `paused` only
		// steer the loop, so reading them here must not restart the orbit.
		return untrack(() => orbit(stage, items, orbits));
	});

	function orbit(stage: HTMLDivElement, items: typeof flat, orbits: OrbitRing[]) {
		const reduce =
			typeof window.matchMedia === 'function' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const nodes = Array.from(stage.querySelectorAll<HTMLElement>('[data-orbit-item]'));
		const turns = orbits.map(() => 0);
		let speed = 1;
		let frame = 0;
		let visible = true;
		let last = 0;

		const place = () => {
			const w = stage.offsetWidth;
			const h = stage.offsetHeight;
			const fit = Math.min(1, Math.max(MIN_FIT, w / FULL_WIDTH));
			const tilt = w > 0 ? Math.min(1, (TILT * h) / w / TILT_ASPECT) : TILT;
			items.forEach(({ r, i, n, logo }, k) => {
				const el = nodes[k];
				if (!el) return;
				const angle = turns[r] + (i / n) * Math.PI * 2;
				const rx = (orbits[r].radius * Math.max(0, w - ITEM)) / 2;
				const x = Math.cos(angle) * rx;
				const y = Math.sin(angle) * rx * tilt;
				// -1 at the back of the ring, 1 at the front.
				const depth = Math.sin(angle);
				const near = (depth + 1) / 2;
				const on = active === logo.name;
				el.style.transform = `translate(${(w / 2 + x).toFixed(1)}px, ${(h / 2 + y).toFixed(1)}px) translate(-50%, -50%) scale(${((0.7 + near * 0.35) * fit).toFixed(3)})`;
				// The one you point at comes forward at full strength, even from the far side.
				el.style.opacity = on ? '1' : (0.28 + near * 0.72).toFixed(3);
				// The front half passes over the text, the back half behind it.
				el.style.zIndex = on ? '4' : depth > 0 ? '3' : '1';
			});
		};

		const still = () => paused || hovering || focused;

		const step = (now: number) => {
			const dt = Math.min((now - last) / 1000, 1 / 30);
			last = now;
			const target = still() ? 0 : 1;
			speed += (target - speed) * (1 - Math.exp(-BRAKE * dt));
			// Braked all the way: hold the frame and sleep until something wakes it.
			if (target === 0 && speed < 0.002) speed = 0;
			orbits.forEach((ring, r) => {
				turns[r] += ((Math.PI * 2) / ring.lap) * dt * speed;
			});
			place();
			frame = visible && speed > 0 ? requestAnimationFrame(step) : 0;
		};

		const start = () => {
			if (frame || !visible || reduce || (still() && speed === 0)) return;
			last = performance.now();
			frame = requestAnimationFrame(step);
		};

		// A paused orbit starts still rather than braking from full speed.
		if (paused) speed = 0;
		place();
		wake = start;
		repaint = () => {
			if (!frame) place();
		};

		if (typeof ResizeObserver === 'undefined') return () => (wake = repaint = null);
		const ro = new ResizeObserver(place);
		ro.observe(stage);
		// Sleeps offscreen, so a long page never pays for it.
		const io = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
			start();
		});
		io.observe(stage);
		start();
		return () => {
			cancelAnimationFrame(frame);
			ro.disconnect();
			io.disconnect();
			wake = repaint = null;
		};
	}

	// Anything that changes the target speed wakes the loop to brake or resume.
	$effect(() => {
		void [paused, hovering, focused];
		wake?.();
	});

	$effect(() => {
		void active;
		repaint?.();
	});

	const markClass =
		'focus-visible:ring-ring relative grid size-11 touch-manipulation place-items-center rounded-full outline-none focus-visible:ring-2';
</script>

<div
	{...restProps}
	bind:this={ref}
	class={cn('relative isolate aspect-[16/10] w-full', className)}
	onpointerenter={(event) => {
		if (event.pointerType !== 'touch') hovering = true;
	}}
	onpointerleave={() => {
		hovering = false;
		active = null;
	}}
>
	<!-- Sits between the back and front of the orbit. It spans the stage only to
	     center its content, so the pointer passes through to the marks behind it
	     everywhere but the content itself. -->
	<div
		class="pointer-events-none absolute inset-0 z-[2] grid place-items-center px-[18%] text-center *:pointer-events-auto"
	>
		{@render children?.()}
	</div>

	<ul class="contents">
		{#each flat as { logo }, k (k)}
			{@const on = active === logo.name}
			{@const Icon = logo.icon}
			<li data-orbit-item class="absolute top-0 left-0 will-change-transform">
				<!-- Always a link or a button, which the checker cannot see through svelte:element. -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<svelte:element
					this={logo.href ? 'a' : 'button'}
					type={logo.href ? undefined : 'button'}
					href={logo.href}
					aria-label={logo.name}
					class={cn(markClass, on ? 'text-foreground' : 'text-muted-foreground')}
					onclick={() => {
						if (!logo.href) onSelect?.(logo);
					}}
					onpointerenter={(event: PointerEvent) => {
						if (event.pointerType !== 'touch') active = logo.name;
					}}
					onpointerleave={() => (active = null)}
					onfocus={() => {
						focused = true;
						active = logo.name;
					}}
					onblur={() => {
						focused = false;
						active = null;
					}}
				>
					<Icon
						class={cn(
							'size-7 transition-[color,scale] duration-(--duration-base) ease-out',
							on && 'scale-[1.12]'
						)}
					/>
					{#if on}
						<!-- The name surfaces under the mark you point at. -->
						<span
							aria-hidden="true"
							class="pointer-events-none absolute top-full left-1/2 mt-1 -translate-x-1/2"
						>
							<span
								in:rise={{ y: -4, duration: duration.fast }}
								out:fade={{ duration: duration.instant, easing: easeIn }}
								class="bg-popover text-popover-foreground block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap shadow-md"
							>
								{logo.name}
							</span>
						</span>
					{/if}
				</svelte:element>
			</li>
		{/each}
	</ul>
</div>
