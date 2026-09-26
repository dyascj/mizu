<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChild<NavigationMenuPrimitive.ContentProps> & {
		/**
		 * Classes for the box that wraps your content. It carries the panel's
		 * padding and is the element the viewport measures, so a padding or
		 * width here replaces the default and `[&>*]` selectors reach your markup.
		 */
		class?: string;
	} = $props();
</script>

<!-- Moving between items, the old content slides out one way and the new one
     slides in from the other, each through a soft blur, while the panel
     reshapes around them. Pinned to its own width, the text never reflows
     mid-morph. -->
<NavigationMenuPrimitive.Content
	bind:ref
	class="mizu-nav-content bg-popover text-popover-foreground absolute top-0 left-0 w-max max-w-[calc(100vw-2rem)] rounded-xl"
	{...restProps}
>
	<!-- The panel sizes itself to this element, so the padding, and any class
	     passed in, live here to be counted. -->
	<div class={cn('rounded-[inherit] p-2 [&>*]:max-w-full', className)}>
		{@render children?.()}
	</div>
</NavigationMenuPrimitive.Content>

<style>
	:global(.mizu-nav-content[data-motion='from-end']) {
		animation: mizu-nav-from-end var(--duration-base) var(--ease-out) both;
	}
	:global(.mizu-nav-content[data-motion='from-start']) {
		animation: mizu-nav-from-start var(--duration-base) var(--ease-out) both;
	}
	:global(.mizu-nav-content[data-motion='to-start']) {
		animation: mizu-nav-to-start var(--duration-fast) var(--ease-in) both;
	}
	:global(.mizu-nav-content[data-motion='to-end']) {
		animation: mizu-nav-to-end var(--duration-fast) var(--ease-in) both;
	}

	@keyframes -global-mizu-nav-from-end {
		from {
			opacity: 0;
			filter: blur(4px);
			translate: 3rem 0;
		}
	}
	@keyframes -global-mizu-nav-from-start {
		from {
			opacity: 0;
			filter: blur(4px);
			translate: -3rem 0;
		}
	}
	@keyframes -global-mizu-nav-to-start {
		to {
			opacity: 0;
			filter: blur(4px);
			translate: -3rem 0;
		}
	}
	@keyframes -global-mizu-nav-to-end {
		to {
			opacity: 0;
			filter: blur(4px);
			translate: 3rem 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.mizu-nav-content[data-motion^='from']) {
			animation: mizu-nav-fade-in var(--duration-fast) var(--ease-out) both;
		}
		:global(.mizu-nav-content[data-motion^='to']) {
			animation: mizu-nav-fade-out var(--duration-instant) var(--ease-in) both;
		}
	}

	@keyframes -global-mizu-nav-fade-in {
		from {
			opacity: 0;
		}
	}
	@keyframes -global-mizu-nav-fade-out {
		to {
			opacity: 0;
		}
	}
</style>
