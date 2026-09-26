<script lang="ts" module>
	const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789#%&*+=/<>';

	/** A random glyph in the same case as the character it stands in for. */
	function noise(original: string) {
		const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
		return original === original.toUpperCase() ? glyph.toUpperCase() : glyph;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLAttributes } from 'svelte/elements';
	import { duration, prefersReducedMotion, stagger } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
		/** The text to decode. Changing it decodes the new text in. */
		text: string;
		/**
		 * `hover` decodes when the pointer enters or focus lands on the nearest
		 * link, button, or focusable ancestor (or the text itself). `mount`
		 * decodes once on first render. Call `scramble()` on the component to
		 * replay it from code.
		 */
		trigger?: 'hover' | 'mount';
		/** The text element. */
		ref?: HTMLSpanElement | null;
		/** Classes for the text. Pair with `font-mono` so the word never jitters sideways. */
		class?: string;
	};

	let {
		text,
		trigger = 'hover',
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	/** A head start before the first character settles, so the noise registers. */
	const LEAD = duration.fast;
	/** Each character settles this long after the one before it. */
	const STEP = (stagger * 3) / 4;
	/** Fresh noise about 25 times a second. Every frame reads as flicker, not decoding. */
	const TICK = (stagger * 2) / 3;

	let resting = $state<HTMLSpanElement>();
	let live = $state<HTMLSpanElement>();
	let frame = 0;

	function finish() {
		cancelAnimationFrame(frame);
		frame = 0;
		// The live span is never rendered into by Svelte; it belongs to the decoder.
		// eslint-disable-next-line svelte/no-dom-manipulating
		live?.replaceChildren();
		if (live) live.hidden = true;
		if (resting) resting.hidden = false;
	}

	/**
	 * Decodes the text in: settled letters behind a block cursor, a faint
	 * churn of noise ahead of it. Does nothing for reduced motion.
	 */
	export function scramble() {
		if (!resting || !live || prefersReducedMotion()) return;
		cancelAnimationFrame(frame);

		const chars = Array.from(text);
		const current = chars.map(noise);
		// Three nodes built once and rewritten in place, so a frame is at most
		// two text writes and never touches the rendered text.
		const done = document.createTextNode('');
		const cursor = document.createElement('span');
		cursor.className = 'scramble-cursor';
		const ahead = document.createElement('span');
		ahead.className = 'scramble-ahead';
		// eslint-disable-next-line svelte/no-dom-manipulating -- the decoder owns this span
		live.replaceChildren(done, cursor, ahead);
		live.hidden = false;
		resting.hidden = true;

		let start: number | undefined;
		let lastTick = -Infinity;
		let lastHead = -1;
		const step = (now: number) => {
			start ??= now;
			const elapsed = now - start;
			const refresh = now - lastTick >= TICK;
			if (refresh) lastTick = now;

			// Characters settle strictly left to right, so everything before the
			// first unsettled one is final.
			let head = chars.length;
			for (let i = 0; i < chars.length; i++) {
				if (chars[i] !== ' ' && elapsed < LEAD + i * STEP) {
					head = i;
					break;
				}
			}
			if (head === chars.length) {
				finish();
				return;
			}
			if (refresh) chars.forEach((char, i) => (current[i] = noise(char)));
			if (refresh || head !== lastHead) {
				lastHead = head;
				done.data = chars.slice(0, head).join('');
				// The cursor covers the character it is decoding, so the word keeps
				// its width the whole way through.
				ahead.textContent = chars
					.map((char, i) => (char === ' ' ? ' ' : current[i]))
					.slice(head + 1)
					.join('');
			}
			frame = requestAnimationFrame(step);
		};
		frame = requestAnimationFrame(step);
	}

	// Hover listens on the nearest interactive ancestor, so a whole menu row
	// decodes its label, not only the letters under the pointer.
	const listen: Attachment<HTMLElement> = (node) => {
		if (trigger !== 'hover') return;
		const target =
			node.closest<HTMLElement>(
				'a, button, summary, [role="button"], [role="link"], [role="menuitem"], [role="tab"], [role="option"], [tabindex]'
			) ?? node;
		const onfocus = (event: FocusEvent) => {
			if (event.target === target) scramble();
		};
		target.addEventListener('pointerenter', scramble);
		target.addEventListener('focusin', onfocus);
		return () => {
			target.removeEventListener('pointerenter', scramble);
			target.removeEventListener('focusin', onfocus);
		};
	};

	let mounted = false;
	onMount(() => {
		mounted = true;
		if (trigger === 'mount') scramble();
		return finish;
	});

	// A new text decodes in, whatever the trigger.
	$effect.pre(() => {
		void text;
		if (mounted) queueMicrotask(scramble);
	});
</script>

<span {...restProps} bind:this={ref} {@attach listen} class={cn('whitespace-pre', className)}>
	<span class="sr-only">{text}</span>
	<span aria-hidden="true" class="scramble"
		><span bind:this={resting}>{text}</span><span bind:this={live} hidden></span></span
	>
</span>

<style>
	/* One character cell wide, cap height on the baseline, so it sits exactly
	   where the letter it covers will land. */
	.scramble :global(.scramble-cursor) {
		display: inline-block;
		width: 1ch;
		height: 0.72em;
		background-color: currentColor;
		vertical-align: baseline;
	}

	/* Noise is quieter than the settled text, so the eye reads the decoded
	   part as the word and the rest as signal still coming in. */
	.scramble :global(.scramble-ahead) {
		opacity: 0.35;
	}
</style>
