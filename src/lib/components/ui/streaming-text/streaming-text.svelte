<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
		/** The full text to stream in, token by token. */
		text: string;
		/** Milliseconds between words. */
		speed?: number;
		/** Show the blinking caret while streaming. */
		cursor?: boolean;
		onComplete?: () => void;
		class?: string;
		ref?: HTMLSpanElement | null;
	};

	let {
		text,
		speed = 60,
		cursor = true,
		onComplete,
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();

	const words = $derived(text.split(/(\s+)/).filter(Boolean));
	let shown = $state(0);
	const done = $derived(shown >= words.length);

	$effect(() => {
		// restart whenever the text changes
		void text;
		shown = 0;
		const timer = setInterval(() => {
			shown += 1;
			if (shown >= words.length) {
				clearInterval(timer);
				onComplete?.();
			}
		}, speed);
		return () => clearInterval(timer);
	});
</script>

<span bind:this={ref} class={cn('whitespace-pre-wrap', className)} {...rest}>
	{#each words.slice(0, shown) as word, i (i)}
		<span class="stream-word">{word}</span>
	{/each}
	{#if cursor && !done}
		<span class="stream-caret" aria-hidden="true"></span>
	{/if}
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
		.stream-word {
			animation: none;
		}
	}
</style>
