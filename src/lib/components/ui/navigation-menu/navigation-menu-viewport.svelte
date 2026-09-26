<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive, type WithoutChild } from 'bits-ui';
	import type { Attachment } from 'svelte/attachments';
	import { prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<NavigationMenuPrimitive.ViewportProps> & { class?: string } = $props();

	/** Keeps the panel this far from the window's edges, matching its max width. */
	const EDGE = 16;

	/** The panel's offset from the menu's left edge, once it has been measured. */
	let x = $state<number | null>(null);
	/** Where the panel grows from: the point under the open trigger. */
	let origin = $state('50% 0');
	/** Slides between items; opening fresh appears in place. */
	let slide = $state(false);

	/**
	 * One panel serves every item. It sits under the open trigger, and moving
	 * to another item slides it across while bits-ui reshapes it to the new
	 * content, so size and position arrive together.
	 */
	const follow: Attachment<HTMLElement> = (wrapper) => {
		const root = wrapper.parentElement;
		if (!root || typeof MutationObserver === 'undefined') return;

		let wasOpen = false;
		let frame = 0;

		const place = () => {
			frame = 0;
			const trigger = root.querySelector<HTMLElement>(
				'[data-navigation-menu-trigger][data-state="open"]'
			);
			const width = parseFloat(
				ref?.style.getPropertyValue('--bits-navigation-menu-viewport-width') ?? ''
			);
			if (!trigger) {
				wasOpen = false;
				return;
			}
			// Open but not measured yet: nothing is placed, so the first placement
			// that follows must still land in place rather than slide.
			if (!width) return;
			const box = root.getBoundingClientRect();
			const rect = trigger.getBoundingClientRect();
			const center = rect.left + rect.width / 2 - box.left;
			const room = document.documentElement.clientWidth;
			const min = EDGE - box.left;
			const max = room - EDGE - width - box.left;
			const left = Math.max(min, Math.min(center - width / 2, max));
			slide = wasOpen && !prefersReducedMotion();
			x = Math.round(left);
			origin = `${Math.round(center - left)}px 0`;
			wasOpen = true;
		};
		const schedule = () => {
			frame ||= requestAnimationFrame(place);
		};

		// Triggers opening and closing, and bits-ui measuring the new content.
		// The wrapper's own style is ours, so its changes are ignored.
		const observer = new MutationObserver((records) => {
			if (records.some((record) => record.target !== wrapper)) schedule();
		});
		observer.observe(root, {
			subtree: true,
			attributes: true,
			attributeFilter: ['data-state', 'style']
		});
		window.addEventListener('resize', schedule);

		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			window.removeEventListener('resize', schedule);
		};
	};
</script>

<div
	{@attach follow}
	class={cn(
		'absolute top-full isolate z-50 flex justify-center',
		x === null ? 'left-1/2 -translate-x-1/2' : 'left-0',
		slide &&
			'transition-[translate] duration-(--duration-spring-snappy) ease-(--ease-spring-snappy)'
	)}
	style:translate={x === null ? undefined : `${x}px 0`}
>
	<NavigationMenuPrimitive.Viewport
		bind:ref
		style="transform-origin: {origin};"
		class={cn(
			'bg-popover text-popover-foreground relative mt-2 h-[var(--bits-navigation-menu-viewport-height)] w-[var(--bits-navigation-menu-viewport-width)] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl shadow-lg',
			// One spring drives size and position, with no bounce: an overshooting
			// panel would uncover empty space. The panel itself grows out of the
			// point under its trigger and leaves faster and smaller than it came.
			'[transition:width_var(--duration-spring-snappy)_var(--ease-spring-snappy),height_var(--duration-spring-snappy)_var(--ease-spring-snappy),scale_var(--duration-base)_var(--ease-out),opacity_var(--duration-base)_var(--ease-out)]',
			'data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0',
			'data-[state=closed]:scale-[0.98] data-[state=closed]:opacity-0 data-[state=closed]:duration-(--duration-fast) data-[state=closed]:ease-in',
			'mizu-nav-viewport',
			className
		)}
		{...restProps}
	/>
</div>

<style>
	/* Reduced motion keeps only the fade; the panel appears at its size and place. */
	@media (prefers-reduced-motion: reduce) {
		:global(.mizu-nav-viewport) {
			transition-property: opacity !important;
		}
	}
</style>
