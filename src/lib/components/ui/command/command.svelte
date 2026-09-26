<script lang="ts">
	import { Command as CommandPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';
	import { setCommandContext } from './context.js';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<CommandPrimitive.RootProps> & {
		class?: string;
		children: Snippet;
	} = $props();

	let search = $state('');
	setCommandContext({
		get search() {
			return search;
		},
		set search(text) {
			search = text;
		}
	});
</script>

<CommandPrimitive.Root
	bind:ref
	bind:value
	class={cn(
		'text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-xl bg-transparent',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</CommandPrimitive.Root>
