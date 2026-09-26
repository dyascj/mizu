<script lang="ts" module>
	const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
</script>

<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLAttributes } from 'svelte/elements';
	import { prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
		/** The text to reveal. Changing it replays the reveal. */
		text: string;
		/** Reveal one word at a time, or one character at a time. Words never break mid-word. */
		by?: 'word' | 'character';
		/** How each unit arrives, using the theme's blur-in, rise-in, or fade-in keyframes. */
		effect?: 'blur' | 'rise' | 'fade';
		/** Start on mount, or the first time the text scrolls into view. */
		trigger?: 'mount' | 'view';
		/** Milliseconds before the first unit starts. */
		delay?: number;
		/** Milliseconds between units. Defaults to the --stagger token for words and a third of it for characters. */
		stagger?: number;
		/** The element to render. */
		as?: 'span' | 'p' | 'h1' | 'h2' | 'h3';
		class?: string;
		ref?: HTMLElement | null;
	};

	let {
		text,
		by = 'word',
		effect = 'blur',
		trigger = 'mount',
		delay = 0,
		stagger,
		as = 'span',
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();

	// Whitespace stays plain text so lines wrap between words. Each word is a
	// nowrap group, so splitting by character never breaks inside a word.
	const tokens = $derived.by(() => {
		let index = 0;
		return text
			.split(/(\s+)/)
			.filter(Boolean)
			.map((part) => {
				if (/^\s+$/.test(part)) return { text: part, units: undefined };
				const pieces =
					by === 'character' ? Array.from(segmenter.segment(part), (s) => s.segment) : [part];
				return { text: part, units: pieces.map((piece) => ({ text: piece, index: index++ })) };
			});
	});

	const animation = $derived(
		{ blur: 'animate-blur-in', rise: 'animate-rise-in', fade: 'animate-fade-in' }[effect]
	);
	const step = $derived(
		stagger !== undefined
			? `${Math.max(0, stagger)}ms`
			: by === 'character'
				? 'calc(var(--stagger) / 3)'
				: 'var(--stagger)'
	);

	let seen = $state(false);
	let waiting = $state(false);
	const playing = $derived(trigger === 'mount' || seen);

	// Hide the units only once JavaScript knows it can reveal them again.
	const watchView: Attachment<HTMLElement> = (node) => {
		if (trigger !== 'view' || seen) return;
		if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;

		waiting = true;
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				observer.disconnect();
				waiting = false;
				seen = true;
			},
			{ threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
		);
		observer.observe(node);
		return () => {
			observer.disconnect();
			waiting = false;
		};
	};
</script>

<svelte:element
	this={as}
	bind:this={ref}
	{@attach watchView}
	class={cn('text-reveal', className)}
	style:--reveal-delay="{Math.max(0, delay)}ms"
	style:--reveal-step={step}
	{...rest}
>
	<span class="sr-only">{text}</span>
	<span aria-hidden="true">
		{#key text}
			{#each tokens as token, i (i)}{#if token.units}<span class="inline-block whitespace-nowrap"
						>{#each token.units as unit (unit.index)}<span
								class={cn('reveal-unit inline-block', playing && animation, waiting && 'opacity-0')}
								style:--index={unit.index}>{unit.text}</span
							>{/each}</span
					>{:else}{token.text}{/if}{/each}
		{/key}
	</span>
</svelte:element>

<style>
	.text-reveal {
		/* Scale the keyframe distances with the type, from body copy to hero lines. */
		--blur-distance: 0.25em;
		--rise-distance: 0.4em;
	}

	/* Unlayered, so it wins over the animation shorthand in the utility. */
	.reveal-unit {
		animation-delay: calc(var(--reveal-delay) + var(--index) * var(--reveal-step));
	}

	/* Without motion, nothing waits behind a delay. */
	@media (prefers-reduced-motion: reduce) {
		.reveal-unit {
			animation: none;
		}
	}
</style>
