<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const buttonVariants = tv({
		base: 'inline-flex max-w-full shrink-0 select-none items-center justify-center gap-2 whitespace-normal text-center font-medium [overflow-wrap:anywhere] outline-none transition-[background-color,color,box-shadow,scale] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
		variants: {
			variant: {
				primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover',
				secondary: 'bg-secondary text-secondary-foreground hover:bg-muted',
				destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:opacity-90',
				success: 'bg-success text-success-foreground shadow-sm hover:opacity-90',
				outline: 'border border-input bg-card text-foreground shadow-xs hover:bg-secondary',
				ghost: 'bg-transparent text-foreground hover:bg-secondary',
				ai: 'aurora text-foreground shadow-sm transition-[filter] hover:brightness-[1.03] dark:text-foreground',
				link: 'bg-transparent text-primary underline-offset-4 hover:underline'
			},
			size: {
				sm: 'min-h-8 rounded-full px-4 py-1.5 text-sm',
				md: 'min-h-10 rounded-full px-5 py-2.5 text-sm',
				lg: 'min-h-12 rounded-full px-6 py-3 text-base',
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
		disabled?: boolean;
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
		disabled = false,
		...rest
	}: Props = $props();
</script>

{#if href}
	<a
		{...rest}
		bind:this={ref}
		href={disabled ? undefined : href}
		onclick={disabled ? undefined : rest.onclick}
		role={disabled ? 'link' : rest.role}
		aria-disabled={disabled || undefined}
		tabindex={disabled ? -1 : rest.tabindex}
		class={cn(
			buttonVariants({ variant, size }),
			disabled && 'pointer-events-none opacity-50',
			className
		)}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		type="button"
		{disabled}
		bind:this={ref}
		class={cn(buttonVariants({ variant, size }), className)}
		{...rest}
	>
		{@render children?.()}
	</button>
{/if}
