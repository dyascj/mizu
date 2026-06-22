<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Dialog as DialogPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import XIcon from '@lucide/svelte/icons/x';
	import DialogOverlay from './dialog-overlay.svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		closeButton = true,
		children,
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
		class?: string;
		portalProps?: DialogPrimitive.PortalProps;
		closeButton?: boolean;
		children: Snippet;
	} = $props();
</script>

<DialogPrimitive.Portal {...portalProps}>
	<DialogOverlay />
	<DialogPrimitive.Content
		bind:ref
		class={cn(
			'glass-strong gloss fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[color:var(--glass-border)] p-6 shadow-glass-lg transition-[opacity,transform] duration-150 data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100',
			className
		)}
		{...restProps}
	>
		<div class="relative z-10 flex flex-col gap-4">
			{@render children?.()}
		</div>
		{#if closeButton}
			<DialogPrimitive.Close
				class="absolute right-4 top-4 z-20 inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground outline-none transition-[scale,background-color] duration-150 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] disabled:pointer-events-none"
			>
				<XIcon class="size-4" />
				<span class="sr-only">Close</span>
			</DialogPrimitive.Close>
		{/if}
	</DialogPrimitive.Content>
</DialogPrimitive.Portal>
