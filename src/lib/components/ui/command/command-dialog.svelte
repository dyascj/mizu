<script lang="ts">
	import { Command as CommandPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import XIcon from '@lucide/svelte/icons/x';
	import * as Dialog from '$lib/components/ui/dialog';
	import Command from './command.svelte';
	import { cn } from '$lib/utils.js';

	let {
		open = $bindable(false),
		value = $bindable(''),
		title = 'Command menu',
		description = 'Search for a command to run.',
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<CommandPrimitive.RootProps> & {
		open?: boolean;
		title?: string;
		description?: string;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<Dialog.Root {open} onOpenChange={(o) => (open = o)}>
	<Dialog.Content class="max-w-xl overflow-hidden p-0" closeButton={false}>
		<Dialog.Header class="sr-only">
			<Dialog.Title>{title}</Dialog.Title>
			<Dialog.Description>{description}</Dialog.Description>
		</Dialog.Header>
		<Command bind:value class={cn('rounded-none', className)} {...restProps}>
			{@render children?.()}
		</Command>
		<!-- Close lives in the search row so it lines up with the input text -->
		<Dialog.Close
			class="absolute right-3 top-2 z-20 inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground outline-none transition-[scale,background-color] duration-150 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96]"
		>
			<XIcon class="size-4" />
			<span class="sr-only">Close</span>
		</Dialog.Close>
	</Dialog.Content>
</Dialog.Root>
