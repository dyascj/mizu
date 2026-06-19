<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<NavigationMenuPrimitive.IndicatorProps> & { class?: string } = $props();
</script>

<NavigationMenuPrimitive.Indicator
	bind:ref
	class={cn(
		'top-full z-[1] flex h-2 items-end justify-center overflow-hidden transition-[opacity,transform] duration-200 data-[state=hidden]:opacity-0 data-[state=visible]:opacity-100',
		className
	)}
	{...restProps}
>
	<div class="relative top-[60%] size-2 rotate-45 rounded-tl-sm border border-[color:var(--glass-border)] glass-strong shadow-glass"></div>
</NavigationMenuPrimitive.Indicator>
