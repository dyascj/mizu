<script lang="ts">
	import { DatePicker as DatePickerPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import DatePickerTrigger from './date-picker-trigger.svelte';
	import { getPickerDirection } from './date-picker.svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<DatePickerPrimitive.InputProps> & { class?: string } = $props();

	// The calendar reads its direction from the field when it opens.
	const direction = getPickerDirection();
	$effect(() => {
		if (direction) direction.field = ref;
	});

	/**
	 * Right to left, the segments run from the right, but bits-ui always reads
	 * ArrowLeft as the previous segment. A mirrored key is swapped for its twin
	 * before the segment sees it, so the arrow moves the way it points.
	 */
	const swapped = new WeakSet<Event>();
	function mirrorArrows(event: KeyboardEvent) {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		const segment = event.target as HTMLElement;
		if (swapped.has(event) || segment.getAttribute?.('role') !== 'spinbutton') return;
		if (getComputedStyle(segment).direction !== 'rtl') return;
		event.preventDefault();
		event.stopPropagation();
		const twin = new KeyboardEvent('keydown', {
			key: event.key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft',
			bubbles: true,
			cancelable: true
		});
		swapped.add(twin);
		segment.dispatchEvent(twin);
	}
</script>

<DatePickerPrimitive.Input
	bind:ref
	class={cn(
		'bg-control text-foreground focus-within:ring-ring data-[invalid]:border-destructive data-[invalid]:ring-destructive flex h-10 w-full items-center rounded-full ps-3.5 pe-1.5 text-base transition-[box-shadow,border-color] duration-(--duration-base) outline-none select-none focus-within:ring-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 sm:text-sm',
		className
	)}
	onkeydowncapture={mirrorArrows}
	{...restProps}
>
	{#snippet children({ segments })}
		<div class="flex flex-1 items-center tabular-nums">
			{#each segments as { part, value }, i (i)}
				{#if part === 'literal'}
					<DatePickerPrimitive.Segment {part} class="text-muted-foreground px-px">
						{value}
					</DatePickerPrimitive.Segment>
				{:else}
					<DatePickerPrimitive.Segment
						{part}
						class="hover:bg-accent focus:bg-accent focus:text-accent-foreground aria-[valuetext=Empty]:text-muted-foreground rounded-md px-1 py-0.5 transition-colors duration-(--duration-fast) outline-none"
					>
						{value}
					</DatePickerPrimitive.Segment>
				{/if}
			{/each}
		</div>
		<DatePickerTrigger />
	{/snippet}
</DatePickerPrimitive.Input>
