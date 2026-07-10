<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const badgeVariants = tv({
		base: 'relative inline-flex items-center gap-1 overflow-hidden rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
		variants: {
			variant: {
				primary: 'bg-primary text-primary-foreground shadow-xs',
				secondary: 'bg-secondary text-secondary-foreground',
				success: 'bg-success/15 text-[color:var(--success)]',
				warning: 'bg-warning/15 text-[color:var(--warning)]',
				destructive: 'bg-destructive/15 text-[color:var(--destructive)]',
				info: 'bg-info/15 text-[color:var(--info)]',
				outline: 'border border-border bg-transparent text-foreground'
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
