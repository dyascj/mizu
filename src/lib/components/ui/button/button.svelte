<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const buttonVariants = tv({
		base: 'relative inline-flex shrink-0 select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap font-semibold outline-none transition-[scale,box-shadow,filter] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50',
		variants: {
			variant: {
				primary:
					'gradient-primary gloss text-primary-foreground shadow-aqua hover:gradient-primary-hover hover:shadow-aqua-lg',
				secondary:
					'gradient-surface gloss border border-border text-foreground shadow-bevel hover:gradient-surface-hover',
				destructive: 'gradient-destructive gloss text-white shadow-bevel hover:brightness-[1.06]',
				success: 'gradient-success gloss text-white shadow-bevel hover:brightness-[1.06]',
				outline: 'border border-input bg-transparent text-foreground hover:bg-secondary',
				ghost: 'bg-transparent text-foreground hover:bg-secondary',
				link: 'bg-transparent text-primary underline-offset-4 hover:underline'
			},
			size: {
				sm: 'h-8 rounded-lg px-3 text-sm',
				md: 'h-10 rounded-xl px-5 text-sm',
				lg: 'h-12 rounded-xl px-6 text-base',
				icon: 'size-10 rounded-xl'
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
		<span class="relative z-10 inline-flex items-center gap-2">{@render children?.()}</span>
	</a>
{:else}
	<button bind:this={ref} class={cn(buttonVariants({ variant, size }), className)} {...rest}>
		<span class="relative z-10 inline-flex items-center gap-2">{@render children?.()}</span>
	</button>
{/if}
