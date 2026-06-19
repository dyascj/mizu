<script lang="ts">
	import { Command as CommandPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import Command from './command.svelte';

	let {
		open = $bindable(false),
		value = $bindable(''),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<CommandPrimitive.RootProps> & {
		open?: boolean;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<Dialog.Root {open} onOpenChange={(o) => (open = o)}>
	<Dialog.Content class="max-w-xl overflow-hidden p-0">
		<Command bind:value class={className} {...restProps}>
			{@render children?.()}
		</Command>
	</Dialog.Content>
</Dialog.Root>
