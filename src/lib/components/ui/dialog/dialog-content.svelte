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
			'bg-popover fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl p-6 shadow-xl transition-[opacity,transform] duration-200 data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100',
			className
		)}
		{...restProps}
	>
		<div class="flex flex-col gap-4">
			{@render children?.()}
		</div>
		{#if closeButton}
			<DialogPrimitive.Close
				class="text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background absolute top-4 right-4 inline-flex size-7 items-center justify-center rounded-full transition-[scale,background-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96] disabled:pointer-events-none"
			>
				<XIcon class="size-4" />
				<span class="sr-only">Close</span>
			</DialogPrimitive.Close>
		{/if}
	</DialogPrimitive.Content>
</DialogPrimitive.Portal>
