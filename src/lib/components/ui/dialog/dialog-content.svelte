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
			'bg-popover fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl p-6 shadow-xl outline-none',
			// Modals scale from the center: they belong to the viewport, not to the
			// button that opened them. Scale rides the spring, opacity a plain curve.
			'[transition:opacity_var(--duration-base)_var(--ease-out),scale_var(--duration-spring)_var(--ease-spring)]',
			'data-starting-style:scale-[0.96] data-starting-style:opacity-0',
			// Leaving is softer and quicker: a smaller shrink, gone before it holds
			// up the next interaction, and clicks already pass through.
			'data-ending-style:pointer-events-none data-ending-style:scale-[0.98] data-ending-style:[transition:opacity_var(--duration-fast)_var(--ease-in),scale_var(--duration-fast)_var(--ease-in)] data-[state=closed]:opacity-0',
			// A dialog opened on top of this one pushes it a small step back, so the
			// new one reads as in front. It returns when the one on top closes.
			'data-nested-open:scale-[0.97]',
			className
		)}
		{...restProps}
	>
		<div class="flex flex-col gap-4">
			{@render children?.()}
		</div>
		{#if closeButton}
			<DialogPrimitive.Close
				class="text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background absolute top-4 right-4 inline-flex size-7 items-center justify-center rounded-full transition-[scale,background-color] duration-(--duration-base) outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96] disabled:pointer-events-none"
			>
				<XIcon class="size-4" />
				<span class="sr-only">Close</span>
			</DialogPrimitive.Close>
		{/if}
	</DialogPrimitive.Content>
</DialogPrimitive.Portal>
