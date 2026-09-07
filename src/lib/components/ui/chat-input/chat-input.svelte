<script lang="ts">
	import type { Snippet } from 'svelte';
	import Paperclip from '@lucide/svelte/icons/paperclip';
	import Mic from '@lucide/svelte/icons/mic';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import { cn } from '$lib/utils.js';

	type Props = {
		value?: string;
		placeholder?: string;
		/** Accessible name for the message field. */
		label?: string;
		/** Attachment action. The button is hidden when omitted. */
		onAttach?: () => void;
		/** Voice action. The button is hidden when omitted. */
		onVoice?: () => void;
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
		label = 'Message',
		onAttach,
		onVoice,
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
		'bg-control focus-within:ring-ring flex w-full items-center gap-1 rounded-full p-1.5 pl-2 transition-[border-color,box-shadow] duration-200 focus-within:ring-2',
		className
	)}
>
	{#if leading}
		{@render leading()}
	{:else if onAttach}
		<button type="button" class={iconBtn} {disabled} onclick={onAttach} aria-label="Attach">
			<Paperclip class="size-4" />
		</button>
	{/if}

	<input
		bind:this={ref}
		bind:value
		aria-label={label}
		onkeydown={(event) => {
			if (event.isComposing && event.key === 'Enter') event.preventDefault();
		}}
		{placeholder}
		{disabled}
		class="text-foreground placeholder:text-muted-foreground h-9 min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none focus-visible:outline-none disabled:cursor-not-allowed"
	/>

	{#if trailing}
		{@render trailing()}
	{:else if onVoice}
		<button type="button" class={iconBtn} {disabled} onclick={onVoice} aria-label="Voice input">
			<Mic class="size-4" />
		</button>
	{/if}

	<button
		type="submit"
		disabled={disabled || !value.trim()}
		aria-label="Send"
		class="bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background inline-flex size-9 shrink-0 items-center justify-center rounded-full shadow-sm transition-[background-color,scale] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40"
	>
		<ArrowUp class="size-4" />
	</button>
</form>
