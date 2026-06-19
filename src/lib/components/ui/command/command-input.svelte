<script lang="ts">
	import { Command as CommandPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import Search from '@lucide/svelte/icons/search';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<CommandPrimitive.InputProps> & {
		class?: string;
	} = $props();
</script>

<div class="flex items-center gap-2 border-b border-border px-3">
	<Search class="size-4 shrink-0 text-muted-foreground" />
	<CommandPrimitive.Input
		bind:ref
		bind:value
		class={cn(
			'h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground',
			className
		)}
		{...restProps}
	/>
</div>
