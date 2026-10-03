<script lang="ts" module>
	export type GreetingPeriod = 'morning' | 'afternoon' | 'evening' | 'night';

	/** Words for each part of the day, plus the neutral one shown before the clock is known. */
	export type GreetingWords = Record<GreetingPeriod | 'fallback', string>;

	const defaultWords: GreetingWords = {
		morning: 'Good morning',
		afternoon: 'Good afternoon',
		evening: 'Good evening',
		// "Good night" is a farewell, not a greeting.
		night: 'Up late',
		fallback: 'Hello'
	};

	/** The part of the day an hour (0 to 23) falls in. */
	export function periodOf(hour: number): GreetingPeriod {
		if (hour >= 5 && hour < 12) return 'morning';
		if (hour >= 12 && hour < 17) return 'afternoon';
		if (hour >= 17 && hour < 22) return 'evening';
		return 'night';
	}

	// Days since a known new moon, folded into one 29.53 day cycle: 0 is new,
	// 0.5 is full. Accurate to within a day, plenty for a glyph.
	const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
	const SYNODIC = 29.530588853 * 86_400_000;

	/** Phase of the moon at a timestamp, from 0 (new) through 0.5 (full) back to 1. */
	export function moonPhase(at: number): number {
		return ((((at - NEW_MOON) % SYNODIC) + SYNODIC) % SYNODIC) / SYNODIC;
	}
</script>

<script lang="ts">
	import { tick, untrack } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		duration as durations,
		easeIn,
		easeInOut,
		easeOut,
		prefersReducedMotion
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
		/** Who the assistant is greeting. Omit for a greeting without a name. */
		name?: string;
		/**
		 * Pins the greeting to a moment instead of the reader's clock. Leave unset
		 * in most apps: the server cannot know the reader's hour, so the first
		 * render says "Hello" and the local greeting rises in once the page runs.
		 */
		date?: Date;
		/** Replace any of the words, for another language or voice. */
		words?: Partial<GreetingWords>;
		/** The element the greeting renders as. Use a heading on an empty chat. */
		as?: 'p' | 'h1' | 'h2' | 'h3';
		class?: string;
		ref?: HTMLElement | null;
	};

	let {
		name,
		date,
		words,
		as = 'p',
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();

	// Minute-resolution local time, unknown until the component runs in a
	// browser, so the server and the hydrating client render the same markup.
	let minute = $state<number | null>(null);

	$effect(() => {
		if (date) return;
		let timer: ReturnType<typeof setTimeout>;
		const update = () => {
			minute = Math.floor(Date.now() / 60_000);
			// Wake just after the next minute turns, never on a drifting interval.
			timer = setTimeout(update, 60_000 - (Date.now() % 60_000) + 20);
		};
		update();
		return () => clearTimeout(timer);
	});

	const at = $derived(date ? date.getTime() : minute === null ? null : minute * 60_000);
	const clock = $derived.by(() => {
		if (at === null || !Number.isFinite(at)) return null;
		const now = new Date(at);
		return { hour: now.getHours() + now.getMinutes() / 60, whole: now.getHours() };
	});

	const vocabulary = $derived({ ...defaultWords, ...words });
	const word = $derived(clock ? vocabulary[periodOf(clock.whole)] : vocabulary.fallback);
	const sunUp = $derived(clock !== null && clock.hour >= 6 && clock.hour < 19);
	const glyph = $derived(clock === null ? null : sunUp ? 'sun' : 'moon');

	const round = (n: number) => Math.round(n * 100) / 100;

	// Height of the sun over a 6:00 to 18:00 day: rays are stubs at dawn and
	// dusk and longest at noon.
	const rays = $derived.by(() => {
		const height = clock ? Math.max(0, Math.sin(((clock.hour - 6) / 12) * Math.PI)) : 0;
		const inner = 7.5;
		const outer = inner + 1.2 + height * 2.6;
		return Array.from({ length: 8 }, (_, i) => {
			const a = (i / 8) * Math.PI * 2;
			return {
				x1: round(12 + Math.cos(a) * inner),
				y1: round(12 + Math.sin(a) * inner),
				x2: round(12 + Math.cos(a) * outer),
				y2: round(12 + Math.sin(a) * outer)
			};
		});
	});

	// The lit part of the moon: the outer limb on the lit side, then back up a
	// half-ellipse terminator whose width follows the phase.
	const moon = $derived.by(() => {
		const phase = at === null ? 0.5 : moonPhase(at);
		const r = 7;
		const rx = round(Math.abs(Math.cos(phase * Math.PI * 2)) * r);
		const waxing = phase < 0.5;
		const crescent = phase < 0.25 || phase > 0.75;
		const outerSweep = waxing ? 1 : 0;
		const innerSweep = waxing === crescent ? 0 : 1;
		return `M12 ${12 - r}A${r} ${r} 0 0 ${outerSweep} 12 ${12 + r}A${rx} ${r} 0 0 ${innerSweep} 12 ${12 - r}Z`;
	});

	/**
	 * Rises along an arc: x travels on a symmetric curve while y and the tilt
	 * ease out, so the body lifts fast and levels off like a sunrise. Opacity
	 * finishes early on its own shorter clock.
	 */
	function rise(_node: Element): TransitionConfig {
		if (prefersReducedMotion()) return { duration: durations.base, css: (t) => `opacity: ${t}` };
		const fade = durations.base / durations.deliberate;
		return {
			duration: durations.deliberate,
			css: (t) => {
				// Distances in em, so the arc scales with the type it sits beside.
				const x = (1 - easeInOut(t)) * -0.5;
				const y = (1 - easeOut(t)) * 0.5;
				const turn = (1 - easeOut(t)) * -30;
				return `opacity: ${easeOut(Math.min(1, t / fade))}; translate: ${x}em ${y}em; rotate: ${turn}deg`;
			}
		};
	}

	/** Sets on the far side of the arc, quicker than it rose. */
	function set(_node: Element): TransitionConfig {
		if (prefersReducedMotion()) return { duration: durations.fast, css: (t) => `opacity: ${t}` };
		return {
			duration: durations.base,
			easing: easeIn,
			css: (t, u) => `opacity: ${t}; translate: ${u * 0.4}em ${u * 0.4}em`
		};
	}

	/** The new word resolves from a soft blur as it lifts into place. */
	function wordIn(_node: Element): TransitionConfig {
		const lift = prefersReducedMotion() ? 0 : 6;
		return {
			duration: durations.base,
			easing: easeOut,
			css: (t, u) => `opacity: ${t}; filter: blur(${u * 4}px); translate: 0 ${u * lift}px`
		};
	}

	/**
	 * The old word leaves softer than the new one arrives, lifted out of the
	 * flow so the new word takes its place at once.
	 */
	function wordOut(node: Element): TransitionConfig {
		const element = node as HTMLElement;
		element.style.position = 'absolute';
		element.style.insetInlineStart = '0';
		element.style.top = '0';
		const lift = prefersReducedMotion() ? 0 : -4;
		return {
			duration: durations.fast,
			easing: easeOut,
			css: (t, u) => `opacity: ${t}; filter: blur(${u * 4}px); translate: 0 ${u * lift}px`
		};
	}

	// The name slides over as the word changes width instead of jumping:
	// measure it before the swap, then play the difference back on a spring.
	let nameElement = $state<HTMLSpanElement | null>(null);
	let previousLeft: number | null = null;

	$effect.pre(() => {
		void word;
		untrack(() => {
			previousLeft = nameElement?.getBoundingClientRect().left ?? null;
		});
		tick().then(() => {
			const element = untrack(() => nameElement);
			if (!element || previousLeft === null) return;
			const delta = previousLeft - element.getBoundingClientRect().left;
			previousLeft = null;
			if (!delta || prefersReducedMotion()) return;
			element.style.transition = 'none';
			element.style.translate = `${delta}px 0`;
			void element.offsetWidth;
			element.style.transition =
				'translate var(--duration-spring-snappy) var(--ease-spring-snappy)';
			element.style.translate = '0 0';
		});
	});

	const spoken = $derived(name ? `${word}, ${name}` : word);
</script>

<svelte:element
	this={as}
	bind:this={ref}
	class={cn(
		'text-foreground relative flex items-center gap-[0.55em] text-lg font-medium tracking-tight',
		className
	)}
	data-period={clock ? periodOf(clock.whole) : undefined}
	{...rest}
>
	<span class="sr-only">{spoken}</span>
	<!-- The slot is reserved from the first render, so the glyph arriving never nudges the text. -->
	<span aria-hidden="true" class="relative size-[1.1em] shrink-0">
		<!-- A keyed list of zero or one, so the glyph's own arrival and departure play. -->
		{#each glyph ? [glyph] : [] as current (current)}
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.75"
				stroke-linecap="round"
				class="absolute inset-0 size-full overflow-visible"
				data-glyph={current}
				in:rise
				out:set
			>
				{#if current === 'sun'}
					<circle cx="12" cy="12" r="4.25" />
					{#each rays as ray, i (i)}
						<line {...ray} />
					{/each}
				{:else}
					<circle cx="12" cy="12" r="7" opacity="0.3" />
					<path d={moon} fill="currentColor" stroke="none" />
				{/if}
			</svg>
		{/each}
	</span>
	<span aria-hidden="true" class="relative inline-flex min-w-0 whitespace-nowrap">
		{#key word}
			<span class="inline-block" in:wordIn out:wordOut>{word}</span>
		{/key}
		{#if name}
			<span bind:this={nameElement} class="inline-block truncate">, {name}</span>
		{/if}
	</span>
</svelte:element>
