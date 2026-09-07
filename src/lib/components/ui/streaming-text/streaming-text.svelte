<script lang="ts">
	import { untrack } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
		/** The full text to stream in, token by token. */
		text: string;
		/** Milliseconds between visual tokens. Non-positive values reveal immediately. */
		speed?: number;
		/** Show the blinking caret while streaming. */
		cursor?: boolean;
		/** Pause the reveal without discarding the text already shown. */
		paused?: boolean;
		onComplete?: () => void;
		class?: string;
		ref?: HTMLSpanElement | null;
	};

	let {
		text,
		speed = 60,
		cursor = true,
		paused = false,
		onComplete,
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();

	const words = $derived(text.split(/(\s+)/).filter(Boolean));
	const normalizedSpeed = $derived(
		Math.min(60_000, Math.max(1, Math.round(Number.isFinite(speed) ? speed : 60)))
	);
	let shown = $state(0);
	let notified = false;
	let previousText: string | undefined;
	let reducedMotion = $state(false);
	const done = $derived(shown >= words.length);

	$effect(() => {
		if (typeof window.matchMedia !== 'function') return;
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => (reducedMotion = media.matches);
		sync();
		media.addEventListener('change', sync);
		return () => media.removeEventListener('change', sync);
	});

	$effect(() => {
		if (text !== previousText) {
			previousText = text;
			shown = 0;
			notified = false;
		}
	});

	$effect(() => {
		const count = words.length;
		if (paused) return;
		if ((reducedMotion || speed <= 0) && shown !== count) {
			shown = count;
			return;
		}
		if (shown >= count) {
			if (!notified) {
				notified = true;
				untrack(() => onComplete?.());
			}
			return;
		}
		const timer = setTimeout(() => {
			shown += 1;
		}, normalizedSpeed);
		return () => clearTimeout(timer);
	});
</script>

<span bind:this={ref} class={cn('whitespace-pre-wrap', className)} {...rest}>
	<span class="sr-only">{text}</span>
	<span aria-hidden="true">
		{#each words.slice(0, shown) as word, i (i)}
			<span class="stream-word">{word}</span>
		{/each}
		{#if cursor && !done && !paused}
			<span class="stream-caret"></span>
		{/if}
	</span>
</span>

<style>
	.stream-word {
		animation: stream-in 240ms ease-out both;
	}

	.stream-caret {
		display: inline-block;
		width: 2px;
		height: 1em;
		margin-left: 1px;
		vertical-align: text-bottom;
		border-radius: 1px;
		background: currentColor;
		animation: stream-blink 1s steps(2, start) infinite;
	}

	@keyframes stream-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes stream-blink {
		50% {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.stream-word,
		.stream-caret {
			animation: none;
		}
	}
</style>
