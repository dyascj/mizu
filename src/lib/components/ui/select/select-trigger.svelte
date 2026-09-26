<script lang="ts">
	import { Select as SelectPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import { getSelectContext } from './context.js';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<SelectPrimitive.TriggerProps> & {
		class?: string;
		children: Snippet;
	} = $props();
	const context = getSelectContext();

	$effect(() => {
		if (context) context.trigger = ref;
	});

	/** How far a held press must travel before its release picks an option. */
	const DRAG_SLOP = 8;

	// Item-aligned lists open with the current choice right under the pointer.
	// Remember the press, so letting go without moving just leaves the list
	// open, while press, drag, and release still picks like a native menu.
	function rememberPress(event: PointerEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		restProps.onpointerdown?.(event);
		if (!context || event.pointerType === 'touch' || event.button !== 0) return;
		const press = { x: event.clientX, y: event.clientY, moved: false };
		context.press = press;
		const move = (moveEvent: PointerEvent) => {
			if (Math.hypot(moveEvent.clientX - press.x, moveEvent.clientY - press.y) > DRAG_SLOP) {
				press.moved = true;
			}
		};
		// Window listeners run after the item's own, so the item still sees the press.
		const release = () => {
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerup', release);
			window.removeEventListener('pointercancel', release);
			if (context.press === press) context.press = null;
		};
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', release);
		window.addEventListener('pointercancel', release);
	}
</script>

<SelectPrimitive.Trigger
	bind:ref
	role="combobox"
	aria-controls={context?.open ? context.contentId : undefined}
	{...restProps}
	onpointerdown={rememberPress}
	class={cn(
		'bg-control focus-visible:ring-ring data-[placeholder]:text-muted-foreground flex h-10 w-full items-center justify-between gap-2 rounded-full px-3.5 py-2 text-left text-base transition-[box-shadow,border-color,scale] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-[box-shadow,border-color] sm:text-sm [&>span]:truncate',
		className
	)}
>
	{@render children?.()}
	<ChevronsUpDown class="size-4 shrink-0 opacity-60" />
</SelectPrimitive.Trigger>
