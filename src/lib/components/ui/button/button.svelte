<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const buttonVariants = tv({
		base: 'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap font-medium outline-none transition-[background-color,color,box-shadow,scale] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
		variants: {
			variant: {
				primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover',
				secondary: 'bg-secondary text-secondary-foreground hover:bg-muted',
				destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:opacity-90',
				success: 'bg-success text-success-foreground shadow-sm hover:opacity-90',
				outline: 'border border-input bg-card text-foreground shadow-xs hover:bg-secondary',
				ghost: 'bg-transparent text-foreground hover:bg-secondary',
				link: 'bg-transparent text-primary underline-offset-4 hover:underline'
			},
			size: {
				sm: 'h-8 rounded-full px-4 text-sm',
				md: 'h-10 rounded-full px-5 text-sm',
				lg: 'h-12 rounded-full px-6 text-base',
				icon: 'size-10 rounded-full'
			}
		},
		defaultVariants: { variant: 'primary', size: 'md' }
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = {
		variant?: ButtonVariant;
		size?: ButtonSize;
		class?: string;
		href?: string;
		ref?: HTMLElement | null;
		children?: Snippet;
	} & HTMLButtonAttributes &
		HTMLAnchorAttributes;

	let {
		variant = 'primary',
		size = 'md',
		class: className,
		href = undefined,
		ref = $bindable(null),
		children,
		...rest
	}: Props = $props();
</script>

{#if href}
	<a bind:this={ref} {href} class={cn(buttonVariants({ variant, size }), className)} {...rest}>
		{@render children?.()}
	</a>
{:else}
	<button bind:this={ref} class={cn(buttonVariants({ variant, size }), className)} {...rest}>
		{@render children?.()}
	</button>
{/if}
