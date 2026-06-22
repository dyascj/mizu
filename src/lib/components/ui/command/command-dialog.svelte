<script lang="ts">
	import { Command as CommandPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import Command from './command.svelte';

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
	<Dialog.Content class="max-w-xl overflow-hidden p-0">
		<Dialog.Header class="sr-only">
			<Dialog.Title>{title}</Dialog.Title>
			<Dialog.Description>{description}</Dialog.Description>
		</Dialog.Header>
		<Command bind:value class={className} {...restProps}>
			{@render children?.()}
		</Command>
	</Dialog.Content>
</Dialog.Root>
