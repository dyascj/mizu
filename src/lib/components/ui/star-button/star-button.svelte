<script lang="ts">
	import { untrack } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { duration, prefersReducedMotion } from '$lib/components/ui/motion';
	import { NumberTicker } from '$lib/components/ui/number-ticker';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLButtonAttributes, 'children' | 'onclick' | 'value'> & {
		/**
		 * Whether the reader has starred it. Bindable. The spin and sparks play
		 * when it becomes true after a press of this button, even if the parent
		 * applies it later; a star that arrives any other way, such as with
		 * loaded data, stays quiet.
		 */
		starred?: boolean;
		/** The total shown in the count, including the reader's own star. Omit to hide the count. */
		count?: number;
		/** Called with the new state each time the button toggles. */
		onStarredChange?: (starred: boolean) => void;
		/** The label before starring, and the button's accessible name. */
		label?: string;
		/** The label once starred. */
		starredLabel?: string;
		/** BCP 47 locale for the count. */
		locale?: string;
		/** Intl.NumberFormat options for the count, such as compact notation. */
		format?: Intl.NumberFormatOptions;
		/** Blocks toggling. */
		disabled?: boolean;
		/** The button element. */
		ref?: HTMLButtonElement | null;
		/** Classes for the button. */
		class?: string;
	};

	let {
		starred = $bindable(false),
		count,
		onStarredChange,
		label = 'Star',
		starredLabel = 'Starred',
		locale,
		format,
		disabled = false,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const star =
		'M12 3.2l2.63 5.33 5.88.86-4.26 4.15 1 5.86L12 16.63l-5.25 2.77 1-5.86-4.25-4.15 5.88-.86Z';
	/** Eight sparks, offset half a step so none hides behind a point of the star. */
	const sparks = Array.from({ length: 8 }, (_, i) => i * 45 + 22.5);

	let glyph = $state<HTMLSpanElement | null>(null);
	let restWidth = $state(0);
	let starredWidth = $state(0);
	let burst = $state(0);
	let spin: Animation | undefined;
	let pop: Animation | undefined;

	/** A motion token as a Web Animations easing string. */
	const token = (node: Element, name: string) =>
		getComputedStyle(node).getPropertyValue(name).trim() || 'ease-out';

	// The celebration waits for the prop to rise after the reader asked for it
	// here, so a parent that applies the star later, once its request lands,
	// still celebrates, and one that refuses never does. A star that simply
	// arrives with loaded data was never asked for, so it stays quiet.
	let was = untrack(() => starred);
	let asked = false;
	$effect(() => {
		const now = starred;
		const rising = now && !was;
		was = now;
		if (!rising) return;
		// Unstarring stays quiet: a spin already running finishes on its own.
		if (asked) untrack(celebrate);
		asked = false;
	});

	function celebrate() {
		if (!glyph?.animate || prefersReducedMotion()) return;
		burst += 1;
		spin?.cancel();
		pop?.cancel();
		// One full turn that lands softly, and a kick that swells and settles.
		spin = glyph.animate(
			{ rotate: ['0deg', '360deg'] },
			{ duration: duration.deliberate, easing: token(glyph, '--ease-out') }
		);
		pop = glyph.animate(
			[
				{ scale: 1, easing: token(glyph, '--ease-out') },
				{ scale: 1.18, offset: 0.24, easing: token(glyph, '--ease-spring-bouncy') },
				{ scale: 1 }
			],
			{ duration: duration.slow }
		);
	}

	$effect(() => () => {
		spin?.cancel();
		pop?.cancel();
	});

	function onclick() {
		if (disabled) return;
		asked = !starred;
		starred = !starred;
		onStarredChange?.(starred);
	}

	const labelClass = (visible: boolean) =>
		cn(
			'absolute start-0 top-0 whitespace-nowrap transition-[opacity,filter] ease-out',
			visible
				? 'opacity-100 blur-none duration-(--duration-base)'
				: 'opacity-0 blur-[3px] duration-(--duration-instant) motion-reduce:blur-none'
		);
</script>

<button
	{...restProps}
	bind:this={ref}
	type="button"
	aria-pressed={starred}
	{disabled}
	data-state={starred ? 'on' : 'off'}
	class={cn(
		'group/star focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-9 shrink-0 touch-manipulation items-center gap-2 rounded-full ps-3 pe-1.5 text-sm font-medium outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
		'transition-[background-color,color,scale] duration-(--duration-fast) ease-out active:scale-[0.96] motion-reduce:transition-[background-color,color]',
		count === undefined && 'pe-3.5',
		starred
			? 'bg-primary-muted text-primary'
			: 'bg-secondary text-secondary-foreground hover:bg-control',
		className
	)}
	{onclick}
>
	<span class="relative grid size-4 place-items-center">
		<span aria-hidden="true" class="pointer-events-none absolute inset-0">
			{#key burst}
				{#if burst > 0}
					{#each sparks as angle (angle)}
						<!-- The wrapper holds the angle; the spark only travels along its own axis. -->
						<span class="absolute inset-0" style:rotate="{angle}deg">
							<span class="star-spark bg-primary absolute top-1/2 left-1/2 rounded-full"></span>
						</span>
					{/each}
				{/if}
			{/key}
		</span>
		<span bind:this={glyph} aria-hidden="true" class="relative block size-4">
			<svg
				viewBox="0 0 24 24"
				class={cn(
					'size-4 transition-[fill-opacity,color] ease-out',
					starred
						? 'delay-(--duration-instant) duration-(--duration-base) [fill-opacity:1]'
						: 'text-muted-foreground group-hover/star:text-foreground duration-(--duration-fast) [fill-opacity:0]'
				)}
				fill="currentColor"
				stroke="currentColor"
				stroke-width="1.75"
				stroke-linejoin="round"
			>
				<path d={star} />
			</svg>
		</span>
	</span>
	<span class="sr-only">{label}</span>
	<!-- Glides to the word's own width, so "Star" never sits beside a gap kept for
	     "Starred". Width rather than scale, so the letters never stretch. -->
	<span
		aria-hidden="true"
		class="relative h-5 overflow-hidden leading-5 transition-[width] duration-(--duration-base) ease-out motion-reduce:transition-none"
		style:width={restWidth && starredWidth ? `${starred ? starredWidth : restWidth}px` : undefined}
	>
		<!-- Sizes the cell in server HTML, before anything is measured. -->
		<span class="invisible block whitespace-nowrap">{starred ? starredLabel : label}</span>
		<span class={labelClass(!starred)}>{label}</span>
		<span class={labelClass(starred)}>{starredLabel}</span>
		<span bind:offsetWidth={restWidth} class="invisible absolute start-0 top-0 whitespace-nowrap">
			{label}
		</span>
		<span
			bind:offsetWidth={starredWidth}
			class="invisible absolute start-0 top-0 whitespace-nowrap"
		>
			{starredLabel}
		</span>
	</span>
	{#if count !== undefined}
		<span
			class={cn(
				'grid h-6 place-items-center rounded-full px-2 text-xs transition-colors duration-(--duration-fast) ease-out',
				starred ? 'bg-primary/10' : 'bg-card text-muted-foreground shadow-xs'
			)}
		>
			<NumberTicker value={count} {locale} {format} />
		</span>
	{/if}
</button>

<style>
	/* Leaves from just outside the star's points and shrinks as it goes, so it
	   reads as a spark thrown off rather than a line sliding. It waits for the
	   spin to get going, so the star seems to throw it. */
	.star-spark {
		width: 1.5px;
		height: 5px;
		margin-left: -0.75px;
		transform-origin: bottom;
		opacity: 0;
		animation: star-spark var(--duration-slow) var(--ease-out) var(--stagger) both;
	}

	@keyframes star-spark {
		from {
			translate: 0 -12px;
			scale: 1 1;
			opacity: 1;
		}
		40% {
			opacity: 1;
		}
		to {
			translate: 0 -17px;
			scale: 1 0.2;
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.star-spark {
			display: none;
		}
	}
</style>
