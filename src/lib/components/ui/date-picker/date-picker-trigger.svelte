<script lang="ts">
	import { DatePicker as DatePickerPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<DatePickerPrimitive.TriggerProps> & { class?: string } = $props();
</script>

<DatePickerPrimitive.Trigger
	bind:ref
	class={cn(
		'inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-[background-color,color,scale] duration-150 ease-out hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50',
		className
	)}
	{...restProps}
>
	<CalendarIcon class="size-4" />
	<span class="sr-only">Open calendar</span>
</DatePickerPrimitive.Trigger>
