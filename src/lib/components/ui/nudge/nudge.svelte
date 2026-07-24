<script lang="ts">
	import type { Snippet } from 'svelte';
	import X from '@lucide/svelte/icons/x';
	import { VoiceOrb } from '$lib/components/ui/voice-orb';
	import { cn } from '$lib/utils.js';

	type Props = {
		/** What the assistant noticed or suggests. */
		title: string;
		description?: string;
		/** Called when the user dismisses; omit to hide the close button. */
		onDismiss?: () => void;
		/** Replaces the default orb. */
		icon?: Snippet;
		/** Action row, usually one or two small buttons. */
		actions?: Snippet;
		class?: string;
	};

	let { title, description, onDismiss, icon, actions, class: className }: Props = $props();
</script>

<div
	role="status"
	class={cn('nudge-in bg-card relative w-full max-w-sm rounded-2xl p-4 shadow-lg', className)}
>
	<div class="flex items-start gap-3">
		{#if icon}
			{@render icon()}
		{:else}
			<VoiceOrb
				state="idle"
				size={28}
				role="presentation"
				aria-hidden="true"
				class="mt-0.5 shrink-0"
			/>
		{/if}
		<div class="min-w-0 flex-1">
			<p class="text-foreground text-sm font-medium">{title}</p>
			{#if description}
				<p class="text-muted-foreground mt-0.5 text-sm leading-relaxed">{description}</p>
			{/if}
			{#if actions}
				<div class="mt-3 flex flex-wrap items-center gap-2">
					{@render actions()}
				</div>
			{/if}
		</div>
		{#if onDismiss}
			<button
				type="button"
				onclick={onDismiss}
				aria-label="Dismiss"
				class="text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-ring inline-flex size-6 shrink-0 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2"
			>
				<X class="size-3.5" />
			</button>
		{/if}
	</div>
</div>

<style>
	:global(.nudge-in) {
		animation: nudge-in 320ms cubic-bezier(0.21, 1.02, 0.73, 1) both;
	}

	@keyframes nudge-in {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.nudge-in) {
			animation: none;
		}
	}
</style>
