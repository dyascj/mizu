<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { setSpotlightGroup } from './context.js';
	import { createLamp } from './light.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		/** The group element. */
		ref?: HTMLDivElement | null;
		/** Classes for the group. Lay the cards out here, such as `sm:grid-cols-2`. */
		class?: string;
		/** `SpotlightCard`s. They all share one light that follows the cursor. */
		children?: Snippet;
	};

	let {
		ref = $bindable(null),
		class: className,
		children,
		onpointermove,
		onpointerleave,
		...restProps
	}: Props = $props();

	// Plain, not reactive: the light writes straight to the cards' styles.
	let cards: HTMLElement[] = [];

	setSpotlightGroup({
		register(card) {
			cards.push(card);
			return () => (cards = cards.filter((other) => other !== card));
		}
	});

	// One listener for the whole group, so the light keeps shining on every
	// card while the cursor crosses the gaps between them.
	const lamp = createLamp(
		() => cards,
		() => ref
	);
	$effect(() => () => lamp.stop());
</script>

<div
	{...restProps}
	bind:this={ref}
	data-slot="spotlight-group"
	class={cn('group/spotlight grid gap-3', className)}
	onpointermove={(event) => {
		onpointermove?.(event);
		lamp.move(event);
	}}
	onpointerleave={(event) => {
		onpointerleave?.(event);
		lamp.leave();
	}}
>
	{@render children?.()}
</div>
