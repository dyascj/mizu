<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
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
		/** Hold still while the pointer rests on it. Focus inside always pauses it. */
		pauseOnHover?: boolean;
		/** Hold still. Offer a control bound to this prop so readers can stop the motion (WCAG 2.2.2). */
		paused?: boolean;
		/** Feather the leading and trailing edges. */
		fade?: boolean;
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

	const copyClass = $derived(
		cn('marquee-copy flex shrink-0', vertical ? 'min-h-full flex-col' : 'min-w-full')
	);
	const loop = $derived(
		distance > 0 && speed > 0 ? `${(distance / speed).toFixed(2)}s` : undefined
	);
</script>

<div
	bind:this={ref}
	class={cn('marquee flex', vertical ? 'flex-col' : 'flex-row', className)}
	data-direction={direction}
	data-fade={(fade && !reducedMotion) || undefined}
	data-running={(loop && !reducedMotion) || undefined}
	data-paused={paused || undefined}
	data-pause-on-hover={pauseOnHover || undefined}
	data-reduced-motion={reducedMotion || undefined}
	style:--marquee-gap={gap}
	style:--marquee-duration={loop}
	{...rest}
>
	<div bind:this={content} class={copyClass}>
		{@render children()}
	</div>
	{#if !reducedMotion}
		<div class={copyClass} aria-hidden="true" inert>
			{@render children()}
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
	.marquee[data-pause-on-hover]:hover .marquee-copy,
	.marquee:focus-within .marquee-copy {
		animation-play-state: paused;
	}

	/* Without motion, the content becomes an ordinary scrollable row or column. */
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
