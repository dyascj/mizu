<script lang="ts">
	import { PinInput as PinInputPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		cell,
		class: className,
		...restProps
	}: WithoutChildrenOrChild<PinInputPrimitive.CellProps> & { class?: string } = $props();
</script>

<PinInputPrimitive.Cell
	bind:ref
	{cell}
	class={cn(
		'relative flex size-11 items-center justify-center rounded-xl border border-input bg-card text-lg text-foreground outline-none transition-[border-color,box-shadow] duration-150 data-[active=true]:border-ring data-[active=true]:ring-2 data-[active=true]:ring-ring/35',
		className
	)}
	{...restProps}
>
	{#if cell.char !== null && cell.char !== undefined}
		{cell.char}
	{/if}
	{#if cell.hasFakeCaret}
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
			<div class="h-5 w-px animate-pulse bg-foreground"></div>
		</div>
	{/if}
</PinInputPrimitive.Cell>
