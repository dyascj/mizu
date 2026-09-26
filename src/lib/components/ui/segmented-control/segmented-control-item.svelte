<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { cn } from '$lib/utils.js';

	type Props = WithoutChildrenOrChild<RadioGroupPrimitive.ItemProps> & {
		/** The value this item selects. */
		value: string;
		/** Keeps this item from being selected or focused. */
		disabled?: boolean;
		/** The item element. */
		ref?: HTMLElement | null;
		/** Classes for the item. */
		class?: string;
		/** The label: text, an icon, or both. Give icon-only items an `aria-label`. */
		children: Snippet;
	};

	let {
		value,
		disabled = false,
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: Props = $props();

	/**
	 * Keeps the highlighted copy a plain copy of the label's markup. Rendering
	 * the snippet a second time would mount stateful children twice and repeat
	 * any ids; a clone stays inert and follows the label as it changes.
	 */
	const mirror: Attachment<HTMLElement> = (copy) => {
		const source = copy.previousElementSibling;
		if (!source) return;
		const sync = () => {
			const nodes = [...source.childNodes].map((node) => node.cloneNode(true));
			for (const node of nodes) {
				if (!(node instanceof Element)) continue;
				node.removeAttribute('id');
				for (const el of node.querySelectorAll('[id]')) el.removeAttribute('id');
			}
			copy.replaceChildren(...nodes);
		};
		sync();
		const observer = new MutationObserver(sync);
		observer.observe(source, {
			subtree: true,
			childList: true,
			characterData: true,
			attributes: true
		});
		return () => observer.disconnect();
	};
</script>

<RadioGroupPrimitive.Item
	bind:ref
	{value}
	{disabled}
	class={cn(
		'text-muted-foreground hover:text-foreground data-[state=checked]:text-foreground focus-visible:ring-ring relative inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-[color,scale] duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
		'group-data-[size=sm]/segmented:h-6 group-data-[size=sm]/segmented:px-2.5 group-data-[size=sm]/segmented:text-xs group-data-[size=sm]/segmented:[&_svg]:size-3.5',
		'group-data-[full-width]/segmented:flex-1',
		// The checked item carries its own fill until the sliding thumb takes over.
		// From then on every label rests muted, and the highlighted copy below
		// recolors whatever part of it the thumb covers.
		'data-[state=checked]:bg-card dark:data-[state=checked]:bg-control [[data-indicator]_&]:data-[state=checked]:text-muted-foreground data-[state=checked]:shadow-sm [[data-indicator]_&]:data-[state=checked]:bg-transparent [[data-indicator]_&]:data-[state=checked]:shadow-none',
		className
	)}
	{...restProps}
>
	<span data-slot="segmented-control-label" class="contents">{@render children()}</span>
	<!-- The same label in the selected color, clipped to the thumb's span over
	     this item, so each label turns exactly as the thumb's edge crosses it. -->
	<span
		aria-hidden="true"
		inert
		data-slot="segmented-control-highlight"
		class="text-foreground pointer-events-none absolute inset-0 hidden items-center justify-center [gap:inherit] [padding:inherit] [[data-indicator]_&]:flex"
		style="clip-path: inset(0 calc(100% - var(--edge-right, 0px) + var(--edge-x, 0px)) 0 calc(var(--edge-left, 0px) - var(--edge-x, 0px)));"
		{@attach mirror}
	></span>
</RadioGroupPrimitive.Item>
