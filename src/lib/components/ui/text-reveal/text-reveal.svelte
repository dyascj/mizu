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
		/**
		 * Start on mount, or the first time the text scrolls into view. `scroll`
		 * ties the reveal to the scroll position instead: units light up one by
		 * one as the text passes a reading line 40% down its scroll container,
		 * and dim again when scrolled back. It needs scroll-driven animations;
		 * elsewhere, and for reduced motion, the text is simply readable.
		 */
		trigger?: 'mount' | 'view' | 'scroll';
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

	const scrub = $derived(trigger === 'scroll');
	/** How many units in all, so each can take its share of the scroll. */
	const count = $derived(
		tokens.reduce((sum, token) => sum + (token.units ? token.units.length : 0), 0)
	);

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

	/**
	 * Each unit lights up over this share of the reveal, so several are always
	 * mid-fade and the edge between read and unread text stays soft.
	 */
	const WINDOW = 0.14;
	/** Where the reading line sits, as a share of the scroll container's height. */
	const READING_LINE = 0.4;

	/** The same box a view timeline follows: the nearest ancestor that scrolls. */
	function scrollerOf(node: HTMLElement): HTMLElement {
		for (let el = node.parentElement; el; el = el.parentElement) {
			if (el === document.body || el === document.documentElement) break;
			if (/(auto|scroll|hidden|overlay)/.test(getComputedStyle(el).overflowY)) return el;
		}
		return document.documentElement;
	}

	// The browser scrubs the units on a view timeline, off the main thread.
	// Script only measures where the reveal starts and how far it runs, so it
	// always finishes within the scroll the container actually has.
	const measureScrub: Attachment<HTMLElement> = (node) => {
		if (!scrub || prefersReducedMotion()) return;
		if (typeof CSS === 'undefined' || !CSS.supports('animation-timeline', 'view()')) return;
		if (typeof ResizeObserver === 'undefined') return;

		const scroller = scrollerOf(node);
		const root = scroller === document.documentElement;
		const measure = () => {
			const viewport = scroller.clientHeight;
			const box = node.getBoundingClientRect();
			const top = root ? 0 : scroller.getBoundingClientRect().top;
			// Where the text's top sits in the scrolled content.
			const offset = box.top - top + scroller.scrollTop;
			const most = scroller.scrollHeight - scroller.clientHeight;
			// Positions along the view timeline, in pixels scrolled since the
			// text's top edge entered at the bottom of the container.
			const reachable = most - (offset - viewport);
			const span = Math.max(box.height, viewport / 4);
			const end = Math.min((1 - READING_LINE) * viewport + span, reachable);
			node.style.setProperty('--reveal-start', `${end - span}px`);
			node.style.setProperty('--reveal-span', `${span}px`);
			node.dataset.scrub = '';
		};
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		observer.observe(scroller);
		measure();
		return () => {
			observer.disconnect();
			delete node.dataset.scrub;
			node.style.removeProperty('--reveal-start');
			node.style.removeProperty('--reveal-span');
		};
	};

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
	{@attach measureScrub}
	class={cn('text-reveal', scrub && as === 'span' && 'block', className)}
	data-effect={effect}
	style:--reveal-delay="{Math.max(0, delay)}ms"
	style:--reveal-step={step}
	{...rest}
>
	<span class="sr-only">{text}</span>
	<span aria-hidden="true">
		{#key text}
			{#each tokens as token, i (i)}{#if token.units}<span class="inline-block whitespace-nowrap"
						>{#each token.units as unit (unit.index)}{#if scrub}<span
									class="scrub-unit inline-block"
									style:--from={(unit.index / Math.max(count - 1, 1)) * (1 - WINDOW)}
									style:--to={(unit.index / Math.max(count - 1, 1)) * (1 - WINDOW) + WINDOW}
									>{unit.text}</span
								>{:else}<span
									class={cn(
										'reveal-unit inline-block',
										playing && animation,
										waiting && 'opacity-0'
									)}
									style:--index={unit.index}>{unit.text}</span
								>{/if}{/each}</span
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

	/* Scroll mode dims units only where the timeline can run them back to full
	   strength, and only with motion allowed. Everywhere else the text is
	   simply readable. Linear, because the scroll position is already the clock. */
	@supports (animation-timeline: view()) {
		@media (prefers-reduced-motion: no-preference) {
			.text-reveal[data-scrub] {
				view-timeline: --text-reveal block;
			}

			.text-reveal[data-scrub] .scrub-unit {
				animation: text-reveal-scrub linear both;
				animation-timeline: --text-reveal;
				animation-range: cover calc(var(--reveal-start) + var(--from) * var(--reveal-span)) cover
					calc(var(--reveal-start) + var(--to) * var(--reveal-span));
			}
		}
	}

	.text-reveal[data-effect='blur'] {
		--scrub-blur: 0.08em;
	}

	.text-reveal[data-effect='rise'] {
		--scrub-rise: 0.2em;
	}

	@keyframes text-reveal-scrub {
		from {
			color: var(--muted-foreground);
			opacity: 0.5;
			filter: blur(var(--scrub-blur, 0));
			translate: 0 var(--scrub-rise, 0);
		}
	}

	/* Without motion, nothing waits behind a delay. */
	@media (prefers-reduced-motion: reduce) {
		.reveal-unit {
			animation: none;
		}
	}
</style>
