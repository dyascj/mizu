<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const toggleVariants = tv({
		base: 'relative inline-flex shrink-0 select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-xl font-semibold text-foreground outline-none transition-[scale,background-color,box-shadow] duration-150 ease-out hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[state=on]:gradient-surface data-[state=on]:gloss data-[state=on]:shadow-bevel data-[state=on]:text-foreground',
		variants: {
			variant: {
				default: 'bg-transparent',
				outline: 'border border-input bg-transparent'
			},
			size: {
				sm: 'h-8 px-2.5 text-sm',
				md: 'h-10 px-3 text-sm',
				lg: 'h-12 px-4 text-base'
			}
		},
		defaultVariants: { variant: 'default', size: 'md' }
	});

	export type ToggleVariant = VariantProps<typeof toggleVariants>['variant'];
	export type ToggleSize = VariantProps<typeof toggleVariants>['size'];
</script>

<script lang="ts">
	import { Toggle as TogglePrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		pressed = $bindable(false),
		variant = 'default',
		size = 'md',
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<TogglePrimitive.RootProps> & {
		variant?: ToggleVariant;
		size?: ToggleSize;
		class?: string;
		children?: Snippet;
	} = $props();
</script>

<TogglePrimitive.Root
	bind:ref
	bind:pressed
	class={cn(toggleVariants({ variant, size }), className)}
	{...restProps}
>
	<span class="relative z-10 inline-flex items-center gap-2">{@render children?.()}</span>
</TogglePrimitive.Root>
