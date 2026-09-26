<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { getSpotlightGroup } from './context.js';
	import { createLamp } from './light.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		/**
		 * An icon above the content. The cursor is the lamp, so the icon casts a
		 * soft shadow away from it that shortens as the light moves off.
		 */
		icon?: Snippet;
		/** The card element. */
		ref?: HTMLDivElement | null;
		/** Classes for the card. */
		class?: string;
		/** The card's content, usually a title and a line of text. */
		children?: Snippet;
	};

	let {
		icon,
		ref = $bindable(null),
		class: className,
		children,
		onpointermove,
		onpointerleave,
		...restProps
	}: Props = $props();

	const group = getSpotlightGroup();

	// Inside a SpotlightGroup the group lights every card at once. On its own,
	// the card follows the cursor itself.
	$effect(() => {
		if (!ref) return;
		if (group) return group.register(ref);
	});

	const lamp = createLamp(
		() => (ref ? [ref] : []),
		() => ref
	);
	$effect(() => () => lamp.stop());

	// Fades rather than snaps, so leaving the cards doesn't flash dark.
	const layer =
		'pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 transition-opacity duration-(--duration-slow) ease-out group-data-[lit]/spotlight:opacity-100';
</script>

<div
	{...restProps}
	bind:this={ref}
	data-slot="spotlight-card"
	class={cn(
		'group/spotlight bg-card text-card-foreground relative isolate overflow-hidden rounded-2xl p-5 shadow-sm',
		// A faint wash that spills across the gaps, a firmer lit edge, and a
		// shadow color for the icon. The wash is dark in light mode and pale in
		// dark mode; the shadow is dark in both, like a desk lamp on paper.
		'[--spotlight-edge:color-mix(in_oklab,var(--foreground)_28%,transparent)] [--spotlight-glow:color-mix(in_oklab,var(--foreground)_4%,transparent)] [--spotlight-shadow:color-mix(in_oklab,var(--foreground)_22%,transparent)]',
		'dark:[--spotlight-edge:color-mix(in_oklab,var(--foreground)_40%,transparent)] dark:[--spotlight-glow:color-mix(in_oklab,var(--foreground)_7%,transparent)] dark:[--spotlight-shadow:color-mix(in_oklab,var(--background)_90%,transparent)]',
		className
	)}
	onpointermove={(event) => {
		onpointermove?.(event);
		if (!group) lamp.move(event);
	}}
	onpointerleave={(event) => {
		onpointerleave?.(event);
		if (!group) lamp.leave();
	}}
>
	<div
		aria-hidden="true"
		class={layer}
		style="background: radial-gradient(260px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), var(--spotlight-glow), transparent 70%)"
	></div>
	<!-- Paints only the 1px padding ring, so the light reads as a lit edge
	     that appears only where the cursor is near. -->
	<div
		aria-hidden="true"
		class={cn(
			layer,
			'p-px [mask:linear-gradient(black_0_0)_content-box_exclude,linear-gradient(black_0_0)]'
		)}
		style="background: radial-gradient(180px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), var(--spotlight-edge), transparent 70%)"
	></div>
	{#if icon}
		<!-- While lit the shadow tracks the cursor with no lag (it is the light);
		     when the light leaves it eases back under the icon. Reduced motion
		     leaves the light off entirely, like every other pointer effect. -->
		<span
			data-spotlight-icon
			class="text-muted-foreground mb-6 block w-fit [filter:drop-shadow(var(--spotlight-shadow-x,0px)_var(--spotlight-shadow-y,0px)_2px_var(--spotlight-shadow))] transition-[filter] duration-(--duration-slow) ease-out group-data-[lit]/spotlight:transition-none motion-reduce:[filter:none] [&_svg]:size-5"
		>
			{@render icon()}
		</span>
	{/if}
	{@render children?.()}
</div>
