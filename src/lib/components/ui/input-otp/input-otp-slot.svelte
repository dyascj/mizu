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
		'bg-control border-input text-foreground data-[active=true]:border-ring data-[active=true]:ring-ring relative flex h-11 w-9 min-w-0 items-center justify-center rounded-xl border text-lg transition-[border-color,box-shadow] duration-200 outline-none data-[active=true]:ring-2 sm:w-11',
		className
	)}
	{...restProps}
>
	{#if cell.char !== null && cell.char !== undefined}
		{cell.char}
	{/if}
	{#if cell.hasFakeCaret}
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
			<div class="bg-foreground h-5 w-px animate-pulse"></div>
		</div>
	{/if}
</PinInputPrimitive.Cell>
