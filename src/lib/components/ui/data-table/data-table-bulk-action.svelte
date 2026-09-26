<script lang="ts">
	import type { LucideProps } from '@lucide/svelte';
	import Check from '@lucide/svelte/icons/check';
	import type { Component, Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { duration } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = HTMLButtonAttributes & {
		/** A lucide icon shown before the label. */
		icon?: Component<LucideProps>;
		/**
		 * Words announced once the action has run, such as "Exported". With it,
		 * the icon also turns into a check for a moment after each click.
		 */
		doneLabel?: string;
		/** The button element. */
		ref?: HTMLButtonElement | null;
		/** Classes for the button. */
		class?: string;
		/** The label. */
		children?: Snippet;
	};

	let {
		icon: Icon,
		doneLabel,
		ref = $bindable(null),
		class: className,
		children,
		onclick,
		...restProps
	}: Props = $props();

	let done = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => () => clearTimeout(timer));

	// Arrivals spring in; departures fall away faster on a plain curve.
	const shownIcon =
		'scale-100 opacity-100 blur-none [transition:scale_var(--duration-spring)_var(--ease-spring),opacity_var(--duration-fast)_var(--ease-out),filter_var(--duration-fast)_var(--ease-out)]';
	const hiddenIcon =
		'scale-25 opacity-0 blur-[4px] transition-[scale,opacity,filter] duration-(--duration-fast) ease-in motion-reduce:scale-100 motion-reduce:blur-none';
</script>

<button
	{...restProps}
	bind:this={ref}
	type="button"
	class={cn(
		'hover:bg-primary-foreground/15 focus-visible:ring-primary-foreground/70 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 font-medium whitespace-nowrap transition-[scale,background-color] duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-inset active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-[background-color] [&_svg]:size-4',
		className
	)}
	onclick={(event) => {
		onclick?.(event);
		if (!doneLabel) return;
		done = true;
		clearTimeout(timer);
		// Long enough to register, short enough to run it again soon.
		timer = setTimeout(() => (done = false), duration.ambient);
	}}
>
	{#if Icon}
		<span aria-hidden="true" class="grid size-4 [&>*]:col-start-1 [&>*]:row-start-1">
			<Icon class={done ? hiddenIcon : shownIcon} />
			{#if doneLabel}
				<Check class={done ? shownIcon : hiddenIcon} />
			{/if}
		</span>
	{/if}
	{@render children?.()}
</button>
{#if doneLabel}
	<span class="sr-only" aria-live="polite">{done ? doneLabel : ''}</span>
{/if}
