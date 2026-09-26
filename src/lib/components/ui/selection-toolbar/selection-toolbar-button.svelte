<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLButtonAttributes, 'children'> & {
		/**
		 * Accessible name. Required when the button shows only an icon; a
		 * visible label can stand in for it.
		 */
		label?: string;
		/** For toggles such as Bold: whether it is on for the current selection. */
		pressed?: boolean;
		/** The button element. */
		ref?: HTMLButtonElement | null;
		/** Classes for the button. */
		class?: string;
		/** An icon, optionally followed by a short label. */
		children: Snippet;
	};

	let {
		label,
		pressed,
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: Props = $props();
</script>

<button
	bind:this={ref}
	type="button"
	tabindex={-1}
	aria-label={label}
	aria-pressed={pressed}
	{...restProps}
	class={cn(
		'text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-ring aria-pressed:bg-primary-muted aria-pressed:text-primary inline-flex h-8 min-w-8 shrink-0 touch-manipulation items-center justify-center gap-1.5 rounded-full px-2 text-sm font-medium transition-[color,background-color,scale] duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-colors [&_svg]:size-4 [&_svg]:shrink-0',
		className
	)}
>
	{@render children()}
</button>
