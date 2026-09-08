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

<div class="border-border flex items-center gap-2 border-b px-3">
	<Search class="text-muted-foreground size-4 shrink-0" />
	<CommandPrimitive.Input
		bind:ref
		bind:value
		class={cn(
			'text-foreground placeholder:text-muted-foreground dark:placeholder:text-foreground/60 h-11 w-full bg-transparent text-base outline-none sm:text-sm',
			className
		)}
		{...restProps}
	/>
</div>
