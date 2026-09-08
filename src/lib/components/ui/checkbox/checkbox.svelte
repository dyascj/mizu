<script lang="ts">
	import { Checkbox as CheckboxPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import Check from '@lucide/svelte/icons/check';
	import Minus from '@lucide/svelte/icons/minus';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> & { class?: string } = $props();
</script>

<CheckboxPrimitive.Root
	bind:ref
	bind:checked
	bind:indeterminate
	class={cn(
		'bg-control border-input focus-visible:ring-ring focus-visible:ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground relative flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-xs border transition-[background-color,box-shadow] duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-transparent data-[state=checked]:shadow-sm data-[state=indeterminate]:border-transparent data-[state=indeterminate]:shadow-sm',
		className
	)}
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<span class="relative z-10 flex items-center justify-center">
			{#if indeterminate}
				<Minus class="size-3.5" strokeWidth={3} />
			{:else if checked}
				<Check class="size-3.5" strokeWidth={3} />
			{/if}
		</span>
	{/snippet}
</CheckboxPrimitive.Root>
