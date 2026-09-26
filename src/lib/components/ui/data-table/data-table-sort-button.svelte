<script lang="ts" module>
	/** The slice of a TanStack column the sort button needs. */
	export type SortableColumn = {
		getIsSorted: () => false | 'asc' | 'desc';
		getCanSort?: () => boolean;
		getToggleSortingHandler: () => undefined | ((event: unknown) => void);
	};
</script>

<script lang="ts">
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLButtonAttributes, 'children'> & {
		/** The TanStack column this header sorts, from `header.column`. */
		column: SortableColumn;
		/**
		 * Which edge the label sits on. `end` suits right-aligned numbers: the
		 * arrow moves to the outside so the label stays over its values.
		 */
		align?: 'start' | 'end';
		/** The button element. */
		ref?: HTMLButtonElement | null;
		/** Classes for the button. */
		class?: string;
		/** The column's label. */
		children: Snippet;
	};

	let {
		column,
		align = 'start',
		ref = $bindable(null),
		class: className,
		children,
		onclick,
		...restProps
	}: Props = $props();

	const sorted = $derived(column.getIsSorted());
	const sort = $derived(sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none');

	// aria-sort belongs on the header cell, so the button keeps it current there.
	$effect(() => {
		const cell = ref?.closest('th');
		cell?.setAttribute('aria-sort', sort);
		return () => cell?.removeAttribute('aria-sort');
	});
</script>

<button
	{...restProps}
	bind:this={ref}
	type="button"
	disabled={column.getCanSort?.() === false}
	data-sorted={sorted || undefined}
	class={cn(
		'text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-ring data-sorted:text-foreground -mx-2.5 inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-sm font-medium whitespace-nowrap transition-[scale,color,background-color] duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 active:scale-[0.96] disabled:pointer-events-none motion-reduce:transition-[color,background-color]',
		align === 'end' && 'flex-row-reverse',
		className
	)}
	onclick={(event) => {
		onclick?.(event);
		if (!event.defaultPrevented) column.getToggleSortingHandler()?.(event);
	}}
>
	{@render children()}
	<!-- Points down for descending, the way the values run, and fades out when unsorted. -->
	<ArrowUp
		aria-hidden="true"
		class={cn(
			'size-3.5 shrink-0 transition-[rotate,opacity] duration-(--duration-base) ease-out motion-reduce:transition-opacity',
			!sorted && 'opacity-0',
			sorted === 'desc' ? 'rotate-180' : 'rotate-0'
		)}
	/>
</button>
