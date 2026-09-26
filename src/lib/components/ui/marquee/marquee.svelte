<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { duration, easeInOut, easeOut } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The content to scroll. It renders twice; the copy is hidden from assistive technology and focus. */
		children: Snippet;
		/** The direction the content travels. */
		direction?: 'left' | 'right' | 'up' | 'down';
		/** Travel speed in pixels per second, so long and short content move at the same pace. */
		speed?: number;
		/** Any CSS length between items and between the two copies. */
		gap?: string;
		/**
		 * Brake to a gentle stop while the pointer rests on it, and ease back up
		 * to speed when it leaves. Focus inside always stops it at once.
		 */
		pauseOnHover?: boolean;
		/** Hold still. Offer a control bound to this prop so readers can stop the motion (WCAG 2.2.2). */
		paused?: boolean;
		/** Feather the leading and trailing edges. */
		fade?: boolean;
		/**
		 * Let the content sit back except in a soft reading window at the
		 * center, where items brighten as they drift through. Braking on hover
		 * leaves one resting in the lens. Use one lens per stack of rows.
		 */
		lens?: boolean;
		class?: string;
		ref?: HTMLDivElement | null;
	};

	let {
		children,
		direction = 'left',
		speed = 40,
		gap = '1rem',
		pauseOnHover = true,
		paused = false,
		fade = true,
		lens = false,
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();

	const vertical = $derived(direction === 'up' || direction === 'down');
	let content = $state<HTMLDivElement>();
	let distance = $state(0);
	let reducedMotion = $state(false);

	$effect(() => {
		if (typeof window.matchMedia !== 'function') return;
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => (reducedMotion = media.matches);
		sync();
		media.addEventListener('change', sync);
		return () => media.removeEventListener('change', sync);
	});

	// One loop travels the length of one copy plus the gap that follows it.
	$effect(() => {
		const node = content;
		const axis = vertical;
		if (!node || reducedMotion || typeof ResizeObserver === 'undefined') return;
		const measure = () => {
			const style = getComputedStyle(node);
			const rect = node.getBoundingClientRect();
			distance = axis
				? rect.height + parseFloat(style.rowGap || '0')
				: rect.width + parseFloat(style.columnGap || '0');
		};
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		return () => observer.disconnect();
	});

	// animation-play-state can only snap, so the hover brake eases the
	// playback rate of the running loops by hand instead. Starting from the
	// current rate means re-entering mid-resume brakes from wherever it got to.
	let rate = 1;
	let frame = 0;

	/** The scrolling loops only, never a transition on the content inside. */
	function loops(): Animation[] {
		if (!ref) return [];
		return Array.from(ref.querySelectorAll<HTMLElement>('.marquee-copy')).flatMap((copy) =>
			typeof copy.getAnimations === 'function' ? copy.getAnimations() : []
		);
	}

	function rampTo(target: number) {
		if (typeof requestAnimationFrame === 'undefined') return;
		cancelAnimationFrame(frame);
		const from = rate;
		// Braking answers the pointer, so it bites quickly and coasts to rest.
		// Picking back up is ambient, so it builds slowly, like momentum, and
		// never lurches away from the cursor. A partial ramp takes its share.
		const total = (target === 0 ? duration.slow : duration.deliberate) * Math.abs(target - from);
		const ease = target === 0 ? easeOut : easeInOut;
		let start: number | undefined;
		const tick = (now: number) => {
			start ??= now;
			const t = total > 0 ? Math.min(1, (now - start) / total) : 1;
			rate = from + (target - from) * ease(t);
			for (const loop of loops()) loop.playbackRate = rate;
			frame = t < 1 ? requestAnimationFrame(tick) : 0;
		};
		frame = requestAnimationFrame(tick);
	}

	$effect(() => () => cancelAnimationFrame(frame));

	const showLens = $derived(lens && !reducedMotion);

	// The lens copies start with the row, but one added later joins in step.
	$effect(() => {
		if (!showLens || !loop) return;
		const [lead, ...others] = loops();
		for (const other of others) {
			other.currentTime = lead.currentTime;
			other.playbackRate = rate;
		}
	});

	const copyClass = $derived(
		cn('marquee-copy flex shrink-0', vertical ? 'min-h-full flex-col' : 'min-w-full')
	);
	const loop = $derived(
		distance > 0 && speed > 0 ? `${(distance / speed).toFixed(2)}s` : undefined
	);
</script>

<!-- Focusable only when reduced motion turns it into a scrollable row. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={ref}
	class={cn('marquee relative flex', vertical ? 'flex-col' : 'flex-row', className)}
	data-direction={direction}
	data-fade={(fade && !reducedMotion) || undefined}
	data-running={(loop && !reducedMotion) || undefined}
	data-paused={paused || undefined}
	data-pause-on-hover={pauseOnHover || undefined}
	data-reduced-motion={reducedMotion || undefined}
	data-lens={showLens || undefined}
	tabindex={reducedMotion ? 0 : undefined}
	style:--marquee-gap={gap}
	style:--marquee-duration={loop}
	{...rest}
	onpointerenter={(event) => {
		// After the spread, so a consumer's own handler runs as well rather than replacing the brake.
		rest.onpointerenter?.(event);
		if (pauseOnHover && event.pointerType !== 'touch') rampTo(0);
	}}
	onpointerleave={(event) => {
		rest.onpointerleave?.(event);
		if (event.pointerType !== 'touch') rampTo(1);
	}}
>
	<div bind:this={content} class={copyClass}>
		{@render children()}
	</div>
	{#if !reducedMotion}
		<div class={copyClass} aria-hidden="true" inert>
			{@render children()}
		</div>
	{/if}
	{#if showLens}
		<!-- The row again at full strength, seen only through a soft window in
		     the middle, running the same loop in step with the row below. -->
		<div
			class={cn('marquee-lens pointer-events-none absolute inset-0 flex', vertical && 'flex-col')}
			aria-hidden="true"
			inert
		>
			<div class={copyClass}>{@render children()}</div>
			<div class={copyClass}>{@render children()}</div>
		</div>
	{/if}
</div>

<style>
	.marquee {
		gap: var(--marquee-gap);
		overflow: hidden;
	}

	.marquee-copy {
		gap: var(--marquee-gap);
		justify-content: space-around;
	}

	.marquee[data-fade][data-direction='left'],
	.marquee[data-fade][data-direction='right'] {
		mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent);
	}

	.marquee[data-fade][data-direction='up'],
	.marquee[data-fade][data-direction='down'] {
		mask-image: linear-gradient(to bottom, transparent, black 12%, black 88%, transparent);
	}

	/* The loop is linear by design: constant speed reads as calm, easing reads as stutter. */
	.marquee[data-running] .marquee-copy {
		animation: marquee-x var(--marquee-duration) linear infinite;
	}

	.marquee[data-running][data-direction='up'] .marquee-copy,
	.marquee[data-running][data-direction='down'] .marquee-copy {
		animation-name: marquee-y;
	}

	.marquee[data-direction='right'] .marquee-copy,
	.marquee[data-direction='down'] .marquee-copy {
		animation-direction: reverse;
	}

	.marquee[data-paused] .marquee-copy,
	.marquee:focus-within .marquee-copy {
		animation-play-state: paused;
	}

	/* Outside the lens the row sits back, so the lit copy is the only thing at
	   full strength. The lens shares the row's padding, so the copies line up. */
	.marquee[data-lens] > .marquee-copy {
		opacity: 0.4;
	}

	.marquee-lens {
		gap: var(--marquee-gap);
		padding: inherit;
		overflow: hidden;
		mask-image: linear-gradient(to right, transparent 28%, black 40%, black 60%, transparent 72%);
	}

	.marquee[data-direction='up'] .marquee-lens,
	.marquee[data-direction='down'] .marquee-lens {
		mask-image: linear-gradient(to bottom, transparent 28%, black 40%, black 60%, transparent 72%);
	}

	/* Without motion, the content becomes an ordinary scrollable row or column
	   that keyboard users can focus and scroll. */
	.marquee[data-reduced-motion] {
		overflow: auto;
	}

	@keyframes marquee-x {
		to {
			translate: calc(-100% - var(--marquee-gap)) 0;
		}
	}

	@keyframes marquee-y {
		to {
			translate: 0 calc(-100% - var(--marquee-gap));
		}
	}
</style>
