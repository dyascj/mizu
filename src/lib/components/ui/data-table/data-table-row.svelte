<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import { duration, easeIn, prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLTableRowElement> & {
		/** Marks the row as selected, with a quiet tint. */
		selected?: boolean;
		/**
		 * Called when the row itself is clicked, outside any button, link, or
		 * input inside it. Pass `row.toggleSelected` to select by clicking.
		 */
		onSelect?: () => void;
		/** Classes for the row. */
		class?: string;
		/** The row's cells. */
		children?: Snippet;
	};

	let {
		selected = false,
		onSelect,
		class: className,
		children,
		onclick,
		...restProps
	}: Props = $props();

	const interactive = 'a, button, input, label, select, textarea, [role="checkbox"]';

	/** A removed row fades before the rows below close the gap. */
	function leave(_node: Element): TransitionConfig {
		if (prefersReducedMotion()) return { duration: 0 };
		return { duration: duration.fast, easing: easeIn, css: (t) => `opacity: ${t}` };
	}
</script>

<tr
	{...restProps}
	data-state={selected ? 'selected' : undefined}
	class={cn(
		'hover:bg-secondary/50 data-[state=selected]:bg-primary-subtle transition-colors duration-(--duration-fast) ease-out',
		// The divider is painted by the cells rather than a collapsed border, so
		// it travels with the row when the row glides to a new place.
		'[&>td]:bg-[linear-gradient(var(--border),var(--border))] [&>td]:bg-size-[100%_1px] [&>td]:bg-bottom [&>td]:bg-no-repeat last:[&>td]:bg-none',
		onSelect && 'cursor-default',
		className
	)}
	onclick={(event) => {
		onclick?.(event);
		// Controls inside the row handle their own clicks.
		if (!onSelect || (event.target as Element).closest(interactive)) return;
		onSelect();
	}}
	out:leave
>
	{@render children?.()}
</tr>
