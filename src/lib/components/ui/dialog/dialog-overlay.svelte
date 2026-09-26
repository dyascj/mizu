<script lang="ts">
	import { Dialog as DialogPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<DialogPrimitive.OverlayProps> & { class?: string } = $props();
</script>

<DialogPrimitive.Overlay
	bind:ref
	class={cn(
		// Open needs no opacity of its own: a `data-[state=open]` rule is emitted
		// after the starting style and would win, skipping the fade in.
		'fixed inset-0 z-50 bg-black/45 backdrop-blur-sm transition-[opacity] duration-(--duration-base) ease-out data-ending-style:duration-(--duration-fast) data-ending-style:ease-in data-starting-style:opacity-0 data-[state=closed]:opacity-0',
		// A nested dialog's scrim stacks on this one, which is what dims the
		// dialog behind. Lighter, so two layers never turn the page black.
		'data-nested:bg-black/25 data-nested:backdrop-blur-none',
		className
	)}
	{...restProps}
/>
