<script lang="ts" module>
	type Letter = { id: number; ch: string; order: number };

	/**
	 * Longest common subsequence, so the most letters possible survive a swap
	 * while keeping their order ("fast" to "honest" keeps both s and t).
	 * Returns a map from each index in `next` to its partner in `prev`.
	 */
	function matchLetters(prev: string[], next: string[]) {
		const table = Array.from({ length: prev.length + 1 }, () =>
			new Array<number>(next.length + 1).fill(0)
		);
		for (let i = prev.length - 1; i >= 0; i--)
			for (let j = next.length - 1; j >= 0; j--)
				table[i][j] =
					prev[i] === next[j]
						? table[i + 1][j + 1] + 1
						: Math.max(table[i + 1][j], table[i][j + 1]);
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- a local result, never rendered
		const pairs = new Map<number, number>();
		let i = 0;
		let j = 0;
		while (i < prev.length && j < next.length) {
			if (prev[i] === next[j]) {
				pairs.set(j, i);
				i++;
				j++;
			} else if (table[i + 1][j] >= table[i][j + 1]) i++;
			else j++;
		}
		return pairs;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import {
		duration,
		easeIn,
		easeInOut,
		easeOut,
		springs,
		stagger
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
		/** Words to cycle through. Assistive technology reads the first one, or the last when `loop` is false. */
		words: string[];
		/** Milliseconds each word stays on screen. */
		interval?: number;
		/**
		 * Resolve from a soft blur, slide up into place, or morph letter by
		 * letter: letters two words share are kept and glide to their new place
		 * while the rest trade out.
		 */
		effect?: 'blur' | 'slide' | 'morph';
		/**
		 * Hold the current word. Rotation also pauses on hover, on focus, and in
		 * background tabs, and never starts for reduced motion. Offer a control
		 * bound to this prop when the rotation runs alongside other content,
		 * so readers can stop it (WCAG 2.2.2).
		 */
		paused?: boolean;
		/** Keep cycling. When false, rotation stops on the last word. */
		loop?: boolean;
		class?: string;
		ref?: HTMLSpanElement | null;
	};

	let {
		words,
		interval = 2400,
		effect: effectName = 'blur',
		paused = false,
		loop = true,
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();

	let index = $state(0);
	let hovered = $state(false);
	let focused = $state(false);
	let documentHidden = $state(false);
	let reducedMotion = $state(false);
	let width = $state<number>();
	let sizer = $state<HTMLSpanElement>();
	let layer = $state<HTMLSpanElement>();

	const word = $derived(words[index % Math.max(1, words.length)] ?? '');
	const running = $derived(
		words.length > 1 && !paused && !hovered && !focused && !documentHidden && !reducedMotion
	);

	$effect(() => {
		if (typeof window.matchMedia !== 'function') return;
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => {
			reducedMotion = media.matches;
			// Hold still on the word assistive technology reads.
			if (media.matches) index = loop ? 0 : Math.max(0, words.length - 1);
		};
		sync();
		media.addEventListener('change', sync);
		return () => media.removeEventListener('change', sync);
	});

	$effect(() => {
		const sync = () => (documentHidden = document.hidden);
		sync();
		document.addEventListener('visibilitychange', sync);
		return () => document.removeEventListener('visibilitychange', sync);
	});

	$effect(() => {
		if (!running || (!loop && index >= words.length - 1)) return;
		const next = (index + 1) % words.length;
		const timer = setTimeout(() => (index = next), Math.max(duration.deliberate, interval));
		return () => clearTimeout(timer);
	});

	// The sizer holds the current word in flow, so the wrapper keeps the text
	// baseline. Its measured width drives the wrapper. The old word leaves first,
	// then the width and the new word move together, so words never collide
	// with the text beside them.
	$effect(() => {
		if (!sizer || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(([entry]) => {
			width = entry.borderBoxSize[0].inlineSize;
		});
		observer.observe(sizer);
		return () => observer.disconnect();
	});

	const offset = $derived(effectName === 'slide' ? 0.6 : 0.2);
	const morph = $derived(effectName === 'morph');

	// Morph keeps letter identities across swaps: a letter the next word
	// shares with this one keeps its key, so it glides instead of trading out.
	let previous: Letter[] = [];
	let nextId = 0;
	const letters = $derived.by(() => {
		const chars = Array.from(word);
		const pairs = matchLetters(
			previous.map((letter) => letter.ch),
			chars
		);
		let order = 0;
		const next = chars.map((ch, j) => {
			const partner = pairs.get(j);
			return partner === undefined ? { id: nextId++, ch, order: order++ } : previous[partner];
		});
		previous = next;
		return next;
	});

	/**
	 * New letters wait a beat for the leaving ones to clear, then rise out of a
	 * blur in a small cascade in reading order.
	 */
	function letterIn(_node: Element, { order }: { order: number }): TransitionConfig {
		if (reducedMotion) return {};
		return {
			delay: duration.instant + order * (stagger / 2),
			duration: duration.slow,
			easing: easeOut,
			css: (t, u) => `opacity: ${t}; translate: 0 ${u * 0.4}em; filter: blur(${u * 0.2}em);`
		};
	}

	/**
	 * Leaving letters are copies pinned where the originals stood, so they
	 * float up and out from the right place while the kept letters glide. They
	 * are gone before the glide lands, so the eye follows the letters that stay.
	 */
	function letterOut(_node: Element): TransitionConfig {
		return {
			duration: duration.fast,
			easing: easeIn,
			css: (t) => `opacity: ${1 - t}; translate: 0 ${-t * 0.35}em; filter: blur(${t * 0.2}em);`
		};
	}

	type Ghost = Letter & { left: number };
	let ghosts = $state<Ghost[]>([]);
	let shown: Letter[] = [];

	// Runs before the swap reaches the page, while the leaving letters can
	// still be measured, mid-glide included.
	$effect.pre(() => {
		if (!morph) return;
		const next = letters;
		untrack(() => {
			const kept = new Set(next.map((letter) => letter.id));
			const leaving = shown.filter((letter) => !kept.has(letter.id));
			shown = next;
			if (!leaving.length || !sizer || !layer) return;
			const box = sizer.getBoundingClientRect();
			// Rects are after transforms; a scaled ancestor would double every offset.
			const scale = box.width / sizer.offsetWidth || 1;
			// Measured from the ghost layer itself, so the ghosts land where the
			// letters stood however the word is aligned or whichever way it reads.
			const origin = layer.getBoundingClientRect().left;
			ghosts = leaving.map((letter) => {
				const node = sizer?.querySelector(`[data-letter="${letter.id}"]`);
				const left = node ? (node.getBoundingClientRect().left - origin) / scale : 0;
				return { ...letter, left };
			});
		});
	});

	// Kept letters travel between two resting places, so they ease in and out,
	// and take long enough for the eye to follow them across the word.
	const glide = { duration: duration.deliberate, easing: easeInOut };

	/** Opacity follows ease-out so it never overshoots; position rides the spring. */
	function enter(_node: Element): TransitionConfig {
		if (reducedMotion) return {};
		const blur = effectName === 'blur';
		return {
			delay: duration.fast,
			duration: springs.smooth.duration,
			css: (t) => {
				const u = 1 - springs.smooth.easing(t);
				return `opacity: ${easeOut(t)}; translate: 0 ${u * offset}em;${blur ? ` filter: blur(${(1 - easeOut(t)) * 0.2}em);` : ''}`;
			}
		};
	}

	function exit(_node: Element): TransitionConfig {
		if (reducedMotion) return {};
		const blur = effectName === 'blur';
		return {
			duration: duration.fast,
			easing: easeIn,
			css: (t, u) =>
				`opacity: ${t}; translate: 0 ${-u * offset}em;${blur ? ` filter: blur(${u * 0.2}em);` : ''}`
		};
	}
</script>

<span
	bind:this={ref}
	class={cn(
		'relative inline-block whitespace-nowrap transition-[width]',
		morph
			? 'duration-(--duration-deliberate) ease-in-out'
			: 'delay-(--duration-fast) duration-(--duration-slow) ease-out',
		className
	)}
	style:width={width === undefined ? undefined : `${width}px`}
	onpointerenter={() => (hovered = true)}
	onpointerleave={() => (hovered = false)}
	onfocusin={() => (focused = true)}
	onfocusout={() => (focused = false)}
	{...rest}
>
	<span class="sr-only">{(loop ? words[0] : words.at(-1)) ?? ''}</span>
	{#if morph}
		<!-- In flow and measured, so the width eases while the kept letters glide
		     and the sentence around it slides instead of snapping. Leaving
		     letters are pinned where they stood while they fade. -->
		<span
			bind:this={sizer}
			class="relative inline-block text-start whitespace-pre"
			aria-hidden="true"
			data-word={word}
		>
			{#each letters as letter (letter.id)}
				<span
					class="inline-block"
					data-letter={letter.id}
					animate:flip={glide}
					in:letterIn={{ order: letter.order }}>{letter.ch}</span
				>
			{/each}
		</span>
		<span bind:this={layer} class="pointer-events-none absolute top-0 left-0" aria-hidden="true">
			{#each ghosts as ghost (ghost.id)}
				<span
					class="absolute top-0 inline-block"
					style:left="{ghost.left}px"
					in:letterOut
					onintroend={() => (ghosts = ghosts.filter((other) => other !== ghost))}>{ghost.ch}</span
				>
			{/each}
		</span>
	{:else}
		<span bind:this={sizer} class="invisible inline-block" aria-hidden="true">{word}</span>
		{#key index}
			<span class="absolute start-0 top-0" aria-hidden="true" in:enter out:exit>{word}</span>
		{/key}
	{/if}
</span>
