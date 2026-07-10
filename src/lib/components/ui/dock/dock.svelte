<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { setDockContext } from './context.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Peak scale of the item directly under the cursor. */
		magnification?: number;
		/** Influence radius in px the magnify falls off across. */
		distance?: number;
		class?: string;
		ref?: HTMLDivElement | null;
		children?: Snippet;
	};

	let {
		magnification = 1.6,
		distance = 110,
		class: className,
		ref = $bindable(null),
		children,
		...rest
	}: Props = $props();

	// The live pointer X (viewport px) while over the dock; null when the
	// cursor leaves so every item eases back to rest.
	let pointerX = $state<number | null>(null);

	setDockContext({
		get pointerX() {
			return pointerX;
		},
		get magnification() {
			return magnification;
		},
		get distance() {
			return distance;
		}
	});

	function onpointermove(event: PointerEvent) {
		// Coarse pointers (touch) shouldn't trigger the lens; only fine ones hover.
		if (event.pointerType === 'touch') return;
		pointerX = event.clientX;
	}

	function onpointerleave() {
		pointerX = null;
	}
</script>

<div
	bind:this={ref}
	{onpointermove}
	{onpointerleave}
	class={cn('bg-popover flex items-end gap-2 rounded-2xl px-3 pt-2 pb-2.5 shadow-xl', className)}
	{...rest}
>
	<div class="relative z-10 flex items-end gap-2">
		{@render children?.()}
	</div>
</div>
