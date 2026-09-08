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
		'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
		className
	)}
	{...restProps}
>
	{#snippet children({ thumbItems })}
		<span
			data-orientation={restProps.orientation ?? 'horizontal'}
			class="bg-muted relative h-2 w-full grow overflow-hidden rounded-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2"
		>
			<SliderPrimitive.Range
				class="bg-primary absolute h-full data-[orientation=vertical]:h-auto data-[orientation=vertical]:w-full"
			/>
		</span>
		{#each thumbItems as { index } (index)}
			<SliderPrimitive.Thumb
				{index}
				aria-label={restProps['aria-label']
					? `${restProps['aria-label']}${thumbItems.length > 1 ? ` ${index + 1}` : ''}`
					: undefined}
				aria-labelledby={restProps['aria-labelledby']}
				class="focus-visible:ring-ring focus-visible:ring-offset-background border-input bg-control block size-5 shrink-0 rounded-full border shadow-sm transition-[scale] duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96] disabled:pointer-events-none"
			/>
		{/each}
	{/snippet}
</SliderPrimitive.Root>
