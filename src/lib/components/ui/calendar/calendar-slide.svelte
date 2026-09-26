<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { startOfMonth, toCalendarDate, type DateValue } from '@internationalized/date';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import { monthSlide } from './calendar-motion.js';

	type Props = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** The month on show. Changing it slides the new month in from the side you travelled toward. */
		month: DateValue;
		/** Classes for the clipping frame. */
		class?: string;
		/** The month's grid. */
		children: Snippet;
	};

	let { ref = $bindable(null), month, class: className, children, ...restProps }: Props = $props();

	let shown: number | undefined;
	/** 1 when the last change went forward in time, -1 when it went back. */
	let direction = 1;
	/** Counts month changes, so every visit to a month gets a key of its own. */
	let visit = 0;

	/**
	 * A key per visit to a month that also records which way the calendar
	 * moved. Paging back to a month whose grid is still fading out mounts a
	 * fresh grid instead of reviving the retired one, which has already left
	 * layout and lost its focusable days.
	 */
	function track(value: DateValue) {
		const time = startOfMonth(toCalendarDate(value)).toDate('UTC').getTime();
		if (shown !== undefined && time !== shown) {
			direction = time > shown ? 1 : -1;
			visit += 1;
		}
		shown = time;
		return visit;
	}

	const slide = (node: Element, _params: unknown, options: { direction: 'in' | 'out' | 'both' }) =>
		monthSlide(node, { direction }, options);
</script>

<!-- Clips the sliding months at the card edge. The 4px of padding buys back
     room for focus rings on the outer days. -->
<div
	{...restProps}
	bind:this={ref}
	data-slot="calendar-slide"
	class={cn('-m-1 overflow-hidden p-1', className)}
>
	<div class="relative flow-root">
		{#key track(month)}
			<div in:slide out:slide>
				{@render children()}
			</div>
		{/key}
	</div>
</div>
