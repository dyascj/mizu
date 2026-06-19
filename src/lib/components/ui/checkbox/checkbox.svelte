<script lang="ts">
	import { Checkbox as CheckboxPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { Check, Minus } from '@lucide/svelte';
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
		'relative flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-md border border-input bg-card/70 shadow-pressed outline-none transition-[background-color,box-shadow] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:gradient-primary data-[state=checked]:gloss data-[state=checked]:border-transparent data-[state=checked]:text-primary-foreground data-[state=checked]:shadow-aqua data-[state=indeterminate]:gradient-primary data-[state=indeterminate]:gloss data-[state=indeterminate]:border-transparent data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:shadow-aqua',
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
