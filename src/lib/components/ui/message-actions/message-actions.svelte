<script lang="ts">
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import ThumbsUp from '@lucide/svelte/icons/thumbs-up';
	import ThumbsDown from '@lucide/svelte/icons/thumbs-down';
	import { cn } from '$lib/utils.js';

	type Props = {
		/** The message text the copy button writes to the clipboard. */
		text?: string;
		onRegenerate?: () => void;
		onFeedback?: (feedback: 'up' | 'down') => void;
		class?: string;
	};

	let { text, onRegenerate, onFeedback, class: className }: Props = $props();

	let copied = $state(false);
	let feedback = $state<'up' | 'down' | null>(null);

	async function copy() {
		if (!text) return;
		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 1600);
	}

	function vote(dir: 'up' | 'down') {
		feedback = feedback === dir ? null : dir;
		if (feedback) onFeedback?.(feedback);
	}

	const btn =
		'inline-flex size-7 items-center justify-center rounded-full text-muted-foreground outline-none transition-[background-color,color,scale] hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.94]';
</script>

<div class={cn('flex items-center gap-0.5', className)}>
	{#if text !== undefined}
		<button type="button" class={btn} onclick={copy} aria-label="Copy message">
			{#if copied}
				<Check class="size-3.5 text-[color:var(--success)]" />
			{:else}
				<Copy class="size-3.5" />
			{/if}
		</button>
	{/if}
	{#if onRegenerate}
		<button type="button" class={btn} onclick={onRegenerate} aria-label="Regenerate response">
			<RotateCcw class="size-3.5" />
		</button>
	{/if}
	<button
		type="button"
		class={cn(btn, feedback === 'up' && 'text-primary')}
		onclick={() => vote('up')}
		aria-label="Good response"
		aria-pressed={feedback === 'up'}
	>
		<ThumbsUp class="size-3.5" />
	</button>
	<button
		type="button"
		class={cn(btn, feedback === 'down' && 'text-primary')}
		onclick={() => vote('down')}
		aria-label="Bad response"
		aria-pressed={feedback === 'down'}
	>
		<ThumbsDown class="size-3.5" />
	</button>
</div>
