<script lang="ts">
	import type { Snippet } from 'svelte';
	import Paperclip from '@lucide/svelte/icons/paperclip';
	import Mic from '@lucide/svelte/icons/mic';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import { cn } from '$lib/utils.js';

	type Props = {
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		/** Called with the trimmed message when the user submits. */
		onSubmit?: (message: string) => void;
		/** Replaces the leading attach button. */
		leading?: Snippet;
		/** Replaces the trailing mic button (the send button always renders). */
		trailing?: Snippet;
		class?: string;
		ref?: HTMLInputElement | null;
	};

	let {
		value = $bindable(''),
		placeholder = 'Type a message...',
		disabled = false,
		onSubmit,
		leading,
		trailing,
		class: className,
		ref = $bindable(null)
	}: Props = $props();

	function submit(e: SubmitEvent) {
		e.preventDefault();
		const message = value.trim();
		if (!message || disabled) return;
		onSubmit?.(message);
		value = '';
	}

	const iconBtn =
		'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';
</script>

<form
	onsubmit={submit}
	class={cn(
		'flex w-full items-center gap-1 rounded-full bg-card p-1.5 pl-2 shadow-lg dark:border dark:border-border',
		className
	)}
>
	{#if leading}
		{@render leading()}
	{:else}
		<button type="button" class={iconBtn} {disabled} aria-label="Attach">
			<Paperclip class="size-4" />
		</button>
	{/if}

	<input
		bind:this={ref}
		bind:value
		{placeholder}
		{disabled}
		class="h-9 min-w-0 flex-1 bg-transparent px-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
	/>

	{#if trailing}
		{@render trailing()}
	{:else}
		<button type="button" class={iconBtn} {disabled} aria-label="Voice input">
			<Mic class="size-4" />
		</button>
	{/if}

	<button
		type="submit"
		disabled={disabled || !value.trim()}
		aria-label="Send"
		class="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm outline-none transition-[background-color,scale] hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40"
	>
		<ArrowUp class="size-4" />
	</button>
</form>
