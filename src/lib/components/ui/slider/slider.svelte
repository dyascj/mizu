<script lang="ts">
	import { Slider as SliderPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		min = 0,
		max = 100,
		step = 1,
		class: className,
		...restProps
	}: WithoutChildrenOrChild<SliderPrimitive.RootProps> & { class?: string } = $props();
</script>

<!--
	`value` + `type` are forwarded together so bits-ui's discriminated union
	(single `number` vs multiple `number[]`) resolves correctly downstream.
-->
<SliderPrimitive.Root
	bind:ref
	bind:value={value as never}
	type={type as never}
	{min}
	{max}
	{step}
	class={cn(
		'relative flex w-full touch-none select-none items-center data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
		className
	)}
	{...restProps}
>
	{#snippet children({ thumbItems })}
		<span
			class="relative h-2 w-full grow overflow-hidden rounded-full bg-muted shadow-pressed data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2"
		>
			<SliderPrimitive.Range
				class="absolute h-full gradient-primary data-[orientation=vertical]:h-auto data-[orientation=vertical]:w-full"
			/>
		</span>
		{#each thumbItems as { index } (index)}
			<SliderPrimitive.Thumb
				{index}
				class="block size-5 shrink-0 rounded-full border border-mizu-200 bg-white shadow-bevel outline-none transition-[scale] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] disabled:pointer-events-none"
			/>
		{/each}
	{/snippet}
</SliderPrimitive.Root>
