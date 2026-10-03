<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { tick, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** How many rows are selected. The bar rises while it is above zero. */
		count: number;
		/** Words for the count. */
		countLabel?: (count: number) => string;
		/**
		 * Clears the selection. Adds a clear button to the bar, and Escape
		 * anywhere inside the bar's container calls it too.
		 */
		onClear?: () => void;
		/** Accessible name for the toolbar. */
		label?: string;
		/** The bar element. */
		ref?: HTMLDivElement | null;
		/** Classes for the bar. */
		class?: string;
		/** The actions, usually `DataTableBulkAction`s. */
		children?: Snippet;
	};

	let {
		count,
		countLabel = (n) => `${n} selected`,
		onClear,
		label = 'Bulk actions',
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: Props = $props();

	const open = $derived(count > 0);
	/** Holds the last count while the bar slides away, so it never reads zero. */
	let shown = $state(0);
	$effect.pre(() => {
		if (count > 0) shown = count;
	});

	// The control focused before focus entered the bar, so closing the bar
	// can hand focus back instead of dropping it on the page.
	let returnTo: HTMLElement | null = null;

	const focusable =
		'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

	/** Moves focus out of the closing bar: back where it came from, or to the first control around it. */
	function restoreFocus() {
		const bar = ref;
		const container = bar?.parentElement;
		if (!bar || !container) return;
		const candidates = [returnTo, ...container.querySelectorAll<HTMLElement>(focusable)];
		const target = candidates.find(
			(el) => el?.isConnected && !bar.contains(el) && !el.closest('[inert]')
		);
		target?.focus({ preventScroll: true });
	}

	// The bar turns inert as it closes, which would drop focus held inside it,
	// such as on the action that just emptied the selection.
	$effect.pre(() => {
		if (open || !ref?.contains(document.activeElement)) return;
		void tick().then(restoreFocus);
	});

	$effect(() => {
		const container = ref?.parentElement;
		if (!open || !onClear || !container) return;
		const onkeydown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape' || event.defaultPrevented) return;
			event.preventDefault();
			onClear();
		};
		container.addEventListener('keydown', onkeydown);
		return () => container.removeEventListener('keydown', onkeydown);
	});
</script>

<!-- Parked just past its container's bottom edge and clipped by it, so it
     rises out of the table. Place it inside a `relative overflow-hidden` box. -->
<div
	{...restProps}
	bind:this={ref}
	role="toolbar"
	aria-label={label}
	inert={!open}
	data-state={open ? 'open' : 'closed'}
	onfocusin={(event) => {
		restProps.onfocusin?.(event);
		const from = event.relatedTarget as HTMLElement | null;
		if (from && !ref?.contains(from)) returnTo = from;
	}}
	class={cn(
		'bg-primary text-primary-foreground absolute inset-x-0 bottom-3 z-10 mx-auto flex h-11 w-fit max-w-[calc(100%-1.5rem)] items-center gap-0.5 rounded-full py-1 ps-4 pe-1 text-sm shadow-lg',
		'transition-[translate,opacity] motion-reduce:transition-opacity',
		open
			? 'translate-y-0 opacity-100 duration-(--duration-base) ease-out'
			: 'translate-y-[calc(100%+0.75rem)] opacity-0 duration-(--duration-fast) ease-in motion-reduce:translate-y-0',
		className
	)}
>
	<span class="pe-2 whitespace-nowrap tabular-nums">{countLabel(shown)}</span>
	<span aria-hidden="true" class="bg-primary-foreground/20 me-1 h-4 w-px shrink-0"></span>
	{@render children?.()}
	{#if onClear}
		<button
			type="button"
			aria-label="Clear selection"
			class="hover:bg-primary-foreground/15 focus-visible:ring-primary-foreground/70 inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-[scale,background-color] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 focus-visible:ring-inset active:scale-[0.96] motion-reduce:transition-[background-color]"
			onclick={onClear}
		>
			<XIcon class="size-4" />
		</button>
	{/if}
</div>
<span class="sr-only" aria-live="polite">{open ? countLabel(count) : ''}</span>
