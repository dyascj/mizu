<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const badgeVariants = tv({
		base: 'relative inline-flex items-center gap-1 overflow-hidden rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
		variants: {
			variant: {
				primary: 'gradient-primary gloss border-transparent text-primary-foreground shadow-bevel',
				secondary: 'border-border bg-secondary text-secondary-foreground',
				success: 'border-transparent bg-success/15 text-[color:var(--success)]',
				warning: 'border-transparent bg-warning/15 text-[color:var(--warning)]',
				destructive: 'border-transparent bg-destructive/15 text-destructive',
				info: 'border-transparent bg-info/15 text-[color:var(--info)]',
				outline: 'border-border bg-transparent text-foreground'
			}
		},
		defaultVariants: { variant: 'primary' }
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLSpanElement> & {
		variant?: BadgeVariant;
		class?: string;
		children?: Snippet;
	};
	let { variant = 'primary', class: className, children, ...rest }: Props = $props();
</script>

<span class={cn(badgeVariants({ variant }), className)} {...rest}>
	<span class="relative z-10 inline-flex items-center gap-1">{@render children?.()}</span>
</span>
