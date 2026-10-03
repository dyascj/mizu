<script lang="ts" module>
	/**
	 * Deterministic and smooth from key to key: a slow wave carries a rhythm
	 * through the word and a small hash roughens it, so delays vary the way a
	 * hand does instead of jumping between extremes.
	 */
	function jitter(word: number, char: number) {
		const wave = Math.sin(char * 1.9 + word * 2.7) * 0.5 + 0.5;
		const n = Math.sin(char * 12.9898 + word * 78.233) * 43758.5453;
		return wave * 0.7 + (n - Math.floor(n)) * 0.3;
	}
</script>

<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { duration, prefersReducedMotion, stagger } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
		/** Words to type in turn after the prefix. Each can be a short phrase. */
		words: string[];
		/** Text that stays put before the typed word, such as "Ask me to". */
		prefix?: string;
		/** Milliseconds the finished word stays before it is selected and rewritten. */
		hold?: number;
		/**
		 * Finish the current word and hold it. Offer a control bound to this prop
		 * when the typing runs alongside other content, so readers can stop it
		 * (WCAG 2.2.2).
		 */
		paused?: boolean;
		/**
		 * What assistive technology reads, once, instead of every keystroke.
		 * Defaults to the prefix followed by every word as an "or" list.
		 */
		label?: string;
		/** The root element. */
		ref?: HTMLSpanElement | null;
		/** Classes for the root. */
		class?: string;
	};

	let {
		words,
		prefix = '',
		hold = duration.ambient,
		paused = false,
		label,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	/** Typing pace: a key about every 60 to 120ms, someone who knows the word. */
	const KEY = stagger;
	/** The beat a word sits selected before the first key replaces it. */
	const SELECTED = duration.deliberate;

	let index = $state(0);
	let length = $state(untrack(() => Array.from(words[0] ?? '').length));
	/** Letters from this index on were struck by a key and ink in; server-rendered ones do not. */
	let inkFrom = $state(Infinity);
	let typing = $state(false);
	let selecting = $state(false);
	let reduced = $state(false);

	const word = $derived(words[index % Math.max(1, words.length)] ?? '');
	const letters = $derived(Array.from(word).slice(0, length));
	const longest = $derived(words.reduce((a, b) => (b.length > a.length ? b : a), ''));
	const spoken = $derived(
		label ??
			[prefix, new Intl.ListFormat('en', { type: 'disjunction' }).format(words)]
				.filter(Boolean)
				.join(' ')
	);

	// A new list starts over on its first word, finished, as the server
	// rendered it. Keyed by content, so an equal list passed again is no change.
	const listKey = $derived(words.join('\n'));
	$effect.pre(() => {
		void listKey;
		untrack(() => {
			index = 0;
			length = Array.from(words[0] ?? '').length;
			inkFrom = Infinity;
			selecting = false;
		});
	});

	// Read after mount, so the server and the first client render agree.
	onMount(() => {
		reduced = prefersReducedMotion();
	});

	$effect(() => {
		const list = words;
		if (paused || list.length === 0) {
			// Whatever was mid-flight lands as a finished word.
			untrack(() => {
				length = Array.from(word).length;
				typing = false;
				selecting = false;
			});
			return;
		}

		let timer: ReturnType<typeof setTimeout> | undefined;

		// Reduced motion swaps whole words on a slow beat instead of typing.
		if (reduced) {
			if (list.length < 2) return;
			const swap = () => {
				index = (index + 1) % list.length;
				timer = setTimeout(swap, hold + duration.deliberate);
			};
			timer = setTimeout(swap, hold + duration.deliberate);
			return () => clearTimeout(timer);
		}

		const type = () => {
			const chars = Array.from(list[index % list.length] ?? '');
			if (length < chars.length) length++;
			typing = length < chars.length;
			timer = typing
				? setTimeout(type, KEY + jitter(index, length) * KEY)
				: setTimeout(select, hold);
		};

		// Rewrites the way people do: select the word, then type over it. The
		// first key replaces the whole selection at once.
		const select = () => {
			if (list.length < 2) return;
			selecting = true;
			timer = setTimeout(() => {
				index = (index + 1) % list.length;
				length = 0;
				inkFrom = 0;
				selecting = false;
				type();
			}, SELECTED);
		};

		untrack(() => {
			const unfinished = length < Array.from(list[index % list.length] ?? '').length;
			timer = unfinished ? setTimeout(type, KEY) : setTimeout(select, hold);
		});
		return () => clearTimeout(timer);
	});
</script>

{#snippet caret()}<span class="typewriter-caret"></span>{/snippet}

<span
	{...restProps}
	bind:this={ref}
	class={cn('inline-grid whitespace-pre-wrap', className)}
	data-typing={typing}
	data-selecting={selecting}
	data-paused={paused || undefined}
>
	<span class="sr-only">{spoken}</span>
	<!-- Reserves the widest state, so the line is laid out once and the prefix
	     never moves as the word grows toward the end of the line. -->
	<span aria-hidden="true" class="invisible col-start-1 row-start-1"
		>{prefix ? `${prefix} ` : ''}{longest}{@render caret()}</span
	>
	<span aria-hidden="true" class="col-start-1 row-start-1 text-start"
		>{prefix ? `${prefix} ` : ''}{#if reduced}<span class="inline-grid"
				>{#each words as option, i (i)}<span
						class={cn(
							'col-start-1 row-start-1 transition-opacity duration-(--duration-deliberate) ease-in-out',
							i !== index && 'opacity-0'
						)}>{option}</span
					>{/each}</span
			>{:else}<span class="relative inline-block"
				><span class="typewriter-selection"></span><span class="relative"
					>{#each letters as letter, i (i)}<span class={i >= inkFrom ? 'typewriter-ink' : undefined}
							>{letter}</span
						>{/each}</span
				></span
			>{@render caret()}{/if}</span
	>
</span>

<style>
	/* A long, steady blink with short fades, like a text field's caret. It
	   goes solid while keys move, disappears while a selection is up, and
	   holds still when paused. */
	.typewriter-caret {
		display: inline-block;
		width: 2px;
		height: 1.1em;
		margin-inline-start: 0.125rem;
		vertical-align: -0.18em;
		border-radius: 9999px;
		background-color: currentColor;
		animation: typewriter-blink calc(var(--duration-deliberate) * 2) linear infinite;
	}

	.invisible .typewriter-caret,
	[data-typing='true'] .typewriter-caret,
	[data-paused] .typewriter-caret {
		animation: none;
	}

	[data-selecting='true'] .typewriter-caret {
		visibility: hidden;
	}

	/* A text selection: the ink stays and a tint sits behind it, slightly
	   taller than the glyphs like the line box a browser paints. It sweeps in
	   from the word's end, and vanishes the instant a key replaces it. */
	.typewriter-selection {
		position: absolute;
		inset: -0.06em -1px;
		border-radius: 0.1875rem;
		/* Tinted from the text itself, so it reads on any surface and in either theme. */
		background-color: color-mix(in srgb, currentColor 22%, transparent);
		scale: 0 1;
		transform-origin: right;
	}

	.typewriter-selection:dir(rtl) {
		transform-origin: left;
	}

	[data-selecting='true'] .typewriter-selection {
		scale: 1 1;
		transition: scale var(--duration-base) var(--ease-out);
	}

	/* Each new letter inks in, so a keystroke reads as struck, not popped in. */
	.typewriter-ink {
		animation: typewriter-ink var(--duration-fast) var(--ease-out);
	}

	@keyframes typewriter-blink {
		0%,
		45% {
			opacity: 1;
		}
		55%,
		95% {
			opacity: 0;
		}
	}

	@keyframes typewriter-ink {
		from {
			opacity: 0;
			filter: blur(2px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		[data-selecting='true'] .typewriter-selection {
			transition: none;
		}
		.typewriter-ink {
			animation: none;
		}
	}
</style>
