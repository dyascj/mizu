<script lang="ts">
	import type { TransitionConfig } from 'svelte/transition';
	import type { HTMLAttributes } from 'svelte/elements';
	import {
		duration as durations,
		easeIn,
		easeOut,
		prefersReducedMotion,
		springs
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { presenceLabels, type AvatarPresence } from './status.js';

	type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
		/**
		 * The presence to show. Each has its own shape as well as its own color,
		 * so it reads at a glance and without color vision: a dot, a moon, a stop
		 * sign, and a ring.
		 */
		status: AvatarPresence;
		/** Accessible name. Defaults to Online, Away, Busy, or Offline. */
		label?: string;
		/** The badge element. */
		ref?: HTMLSpanElement | null;
		/**
		 * Classes for the badge. It sits in a cutout ring painted with
		 * `--avatar-ring`, which defaults to the page background; set it to
		 * `var(--card)` inside a card.
		 */
		class?: string;
	};

	let { status, label, ref = $bindable(null), class: className, ...restProps }: Props = $props();

	/** The new shape spins in on a spring; the old one spins out the other way, faster. */
	function turnIn(_node: Element): TransitionConfig {
		if (prefersReducedMotion()) return { duration: durations.fast, css: (t) => `opacity: ${t}` };
		const { duration, easing } = springs.bouncy;
		// Opacity finishes on a plain curve so the spring's overshoot never
		// pushes it past fully opaque.
		const fade = durations.fast / duration;
		return {
			duration,
			css: (t) => {
				const s = easing(t);
				return `transform: rotate(${(1 - s) * 120}deg) scale(${0.3 + 0.7 * s}); opacity: ${easeOut(Math.min(1, t / fade))}`;
			}
		};
	}

	function turnOut(_node: Element): TransitionConfig {
		if (prefersReducedMotion()) return { duration: durations.fast, css: (t) => `opacity: ${t}` };
		return {
			duration: durations.fast,
			easing: easeIn,
			css: (t, u) => `transform: rotate(${-u * 120}deg) scale(${0.3 + 0.7 * t}); opacity: ${t}`
		};
	}
</script>

<span
	{...restProps}
	bind:this={ref}
	role="img"
	aria-label={label ?? presenceLabels[status]}
	data-slot="avatar-status"
	data-status={status}
	class={cn(
		'grid size-4.5 place-items-center overflow-hidden rounded-full bg-[var(--avatar-ring,var(--background))]',
		className
	)}
>
	{#key status}
		<svg
			viewBox="0 0 12 12"
			aria-hidden="true"
			class="col-start-1 row-start-1 size-2/3"
			in:turnIn
			out:turnOut
		>
			{#if status === 'online'}
				<circle cx="6" cy="6" r="5" class="fill-success" />
			{:else if status === 'away'}
				<path d="M6.6 1.05A5 5 0 1 0 10.95 5.4 4 4 0 0 1 6.6 1.05Z" class="fill-warning" />
			{:else if status === 'busy'}
				<circle cx="6" cy="6" r="5" class="fill-destructive" />
				<rect x="3" y="5.1" width="6" height="1.8" rx="0.9" class="fill-destructive-foreground" />
			{:else}
				<circle
					cx="6"
					cy="6"
					r="3.9"
					fill="none"
					stroke-width="2.2"
					class="stroke-muted-foreground"
				/>
			{/if}
		</svg>
	{/key}
</span>
