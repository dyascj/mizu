<script lang="ts">
	import Eye from '@lucide/svelte/icons/eye';
	import { untrack } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import {
		blurIn,
		duration,
		easeIn,
		easeOut,
		prefersReducedMotion
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
		/** How many are watching or listening. Leave it out to show the status alone. */
		viewers?: number;
		/** The stream dropped: the dot turns hollow and blinks, and the count steps back. */
		reconnecting?: boolean;
		/** The status while live. */
		label?: string;
		/** The status while reconnecting. */
		reconnectingLabel?: string;
		/** Formats the count. Defaults to grouping thousands with commas. */
		format?: (viewers: number) => string;
		/** What screen readers hear for the count, given the formatted number. */
		viewersLabel?: (formatted: string) => string;
		/** The dot's color while live. */
		tone?: 'destructive' | 'success';
		/**
		 * Holds the dot still. The breath and the sonar ring loop for as long as
		 * the stream is live, so pause them when the indicator sits beside
		 * content someone is reading for a long time.
		 */
		paused?: boolean;
		/** The pill element. */
		ref?: HTMLSpanElement | null;
		class?: string;
	};

	let {
		viewers,
		reconnecting = false,
		label = 'Live',
		reconnectingLabel = 'Reconnecting',
		format = group,
		viewersLabel = (formatted) => `about ${formatted} watching`,
		tone = 'destructive',
		paused = false,
		ref = $bindable(null),
		class: className,
		...rest
	}: Props = $props();

	/** Locale independent, so the server and the browser print the same thing. */
	function group(n: number) {
		return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	}

	const status = $derived(reconnecting ? reconnectingLabel : label);
	const formatted = $derived(viewers === undefined ? '' : format(Math.max(0, viewers)));
	// Keyed by place from the right, so only the digits that change roll.
	const characters = $derived(
		Array.from(formatted).map((char, i, all) => ({ char, place: all.length - i }))
	);

	// Which way the count last moved: rising digits roll up, falling ones down.
	let previous: number | undefined;
	const direction = $derived.by(() => {
		const next = viewers ?? 0;
		const sign = previous === undefined || next >= previous ? 1 : -1;
		previous = next;
		return sign;
	});

	// Announces the connection changing, never the ticking count.
	let lastReconnecting = untrack(() => reconnecting);
	let announcement = $state('');
	$effect(() => {
		if (reconnecting === lastReconnecting) return;
		lastReconnecting = reconnecting;
		announcement = reconnecting
			? `Connection lost. ${reconnectingLabel}`
			: `Back ${label.toLowerCase()}`;
	});

	// Slower than a click's roll: nobody caused this change, so it drifts past
	// rather than snapping.
	function rollIn(_node: Element) {
		const d = direction;
		if (prefersReducedMotion())
			return { duration: duration.fast, css: (t: number) => `opacity: ${t}` };
		return {
			duration: duration.slow,
			easing: easeOut,
			css: (t: number, u: number) => `opacity: ${t}; translate: 0 ${u * d * 100}%`
		};
	}
	function rollOut(_node: Element) {
		const d = direction;
		if (prefersReducedMotion())
			return { duration: duration.fast, css: (t: number) => `opacity: ${t}` };
		return {
			duration: duration.base,
			easing: easeIn,
			css: (t: number, u: number) => `opacity: ${t}; translate: 0 ${u * d * -100}%`
		};
	}
	function blurOut(_node: Element) {
		if (prefersReducedMotion())
			return { duration: duration.fast, css: (t: number) => `opacity: ${t}` };
		return {
			duration: duration.fast,
			easing: easeIn,
			css: (t: number, u: number) => `opacity: ${t}; filter: blur(${u * 4}px)`
		};
	}

	const tones = {
		destructive: 'bg-destructive',
		success: 'bg-success'
	};
	const rings = {
		destructive: 'border-destructive',
		success: 'border-success'
	};
</script>

<span
	bind:this={ref}
	data-state={reconnecting ? 'reconnecting' : 'live'}
	data-direction={direction > 0 ? 'up' : 'down'}
	class={cn(
		'bg-card text-foreground relative inline-flex h-7 items-center gap-2 rounded-full ps-2.5 pe-3 text-xs font-medium whitespace-nowrap shadow-sm select-none',
		className
	)}
	{...rest}
>
	<!-- The accessible text never includes a ticking number as it changes, so
	     screen readers hear the state, not a stream of digits. -->
	<span class="sr-only">
		{reconnecting
			? reconnectingLabel
			: viewers === undefined
				? label
				: `${label}, ${viewersLabel(formatted)}`}
	</span>

	<span aria-hidden="true" class="relative grid size-2 shrink-0 place-items-center">
		{#if !reconnecting && !paused}
			<!-- Sonar: one soft ring at a time, only while actually live. -->
			<span class={cn('live-sonar absolute inset-0 rounded-full', tones[tone])}></span>
		{/if}
		<span
			class={cn(
				'relative size-2 rounded-full border-[1.5px] transition-[background-color,border-color] duration-(--duration-base) ease-out',
				reconnecting
					? 'live-blink border-muted-foreground bg-transparent'
					: cn('live-breathe', tones[tone], rings[tone]),
				paused && 'live-paused'
			)}
		></span>
	</span>

	<span aria-hidden="true" class="grid">
		{#key status}
			<span
				class="col-start-1 row-start-1"
				in:blurIn={{ duration: duration.base, blur: 4, y: 0 }}
				out:blurOut
			>
				{status}
			</span>
		{/key}
	</span>

	{#if viewers !== undefined}
		<span aria-hidden="true" class="bg-border h-3 w-px"></span>
		<span
			aria-hidden="true"
			class={cn(
				'text-muted-foreground flex items-center gap-1 tabular-nums transition-opacity duration-(--duration-base) ease-out',
				// A frozen count is stale, so it steps back while reconnecting.
				reconnecting && 'opacity-50'
			)}
		>
			<Eye class="size-3.5" />
			<span class="flex">
				{#each characters as { char, place } (place)}
					<span class="inline-grid overflow-hidden">
						{#key char}
							<span class="col-start-1 row-start-1" in:rollIn out:rollOut>{char}</span>
						{/key}
					</span>
				{/each}
			</span>
		</span>
	{/if}
</span>
<span class="sr-only" aria-live="polite">{announcement}</span>

<style>
	/* Slow on purpose: a live dot should breathe, not flash. The reconnect
	   blink is quicker, so it reads as trying. */
	.live-breathe {
		animation: live-breathe calc(var(--duration-ambient) * 1.2) var(--ease-in-out) infinite;
	}
	.live-sonar {
		animation: live-sonar calc(var(--duration-ambient) * 1.2) var(--ease-out) infinite;
	}
	.live-blink {
		animation: live-blink calc(var(--duration-ambient) / 2) var(--ease-in-out) infinite;
	}
	.live-paused {
		animation: none;
	}

	@keyframes live-breathe {
		50% {
			opacity: 0.7;
			scale: 0.88;
		}
	}
	@keyframes live-sonar {
		0% {
			opacity: 0.45;
			scale: 1;
		}
		70%,
		100% {
			opacity: 0;
			scale: 2.6;
		}
	}
	@keyframes live-blink {
		50% {
			opacity: 0.25;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.live-breathe,
		.live-blink {
			animation: none;
		}
		.live-sonar {
			display: none;
		}
	}
</style>
