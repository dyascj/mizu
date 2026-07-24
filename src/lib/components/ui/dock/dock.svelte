<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { setDockContext } from './context.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Peak scale under the cursor, clamped to the inclusive range 1 to 3. */
		magnification?: number;
		/** Influence radius in pixels, clamped to the inclusive range 1 to 1000. */
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
	const resolvedMagnification = $derived(
		Math.min(3, Math.max(1, Number.isFinite(magnification) ? magnification : 1.6))
	);
	const resolvedDistance = $derived(
		Math.min(1000, Math.max(1, Number.isFinite(distance) ? distance : 110))
	);

	setDockContext({
		get pointerX() {
			return pointerX;
		},
		get magnification() {
			return resolvedMagnification;
		},
		get distance() {
			return resolvedDistance;
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
