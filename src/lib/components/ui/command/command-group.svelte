<script lang="ts">
	import { Command as CommandPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		heading,
		children,
		...restProps
	}: WithoutChildrenOrChild<CommandPrimitive.GroupProps> & {
		class?: string;
		heading?: string;
		children: Snippet;
	} = $props();
</script>

<CommandPrimitive.Group bind:ref class={cn('overflow-hidden', className)} {...restProps}>
	{#if heading}
		<CommandPrimitive.GroupHeading class="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
			{heading}
		</CommandPrimitive.GroupHeading>
	{/if}
	<CommandPrimitive.GroupItems>
		{@render children?.()}
	</CommandPrimitive.GroupItems>
</CommandPrimitive.Group>
