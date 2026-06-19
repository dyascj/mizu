<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const alertVariants = tv({
		base: 'relative grid w-full grid-cols-[0_1fr] items-start gap-x-3 gap-y-1 overflow-hidden rounded-xl border px-4 py-3.5 text-sm shadow-bevel glass-strong has-[>svg]:grid-cols-[1.25rem_1fr] [&>svg]:size-5 [&>svg]:translate-y-0.5',
		variants: {
			variant: {
				info: 'border-info/30 text-foreground [&>svg]:text-[color:var(--info)]',
				success: 'border-success/40 text-foreground [&>svg]:text-[color:var(--success)]',
				warning: 'border-warning/40 text-foreground [&>svg]:text-[color:var(--warning)]',
				destructive: 'border-destructive/40 text-destructive [&>svg]:text-destructive'
			}
		},
		defaultVariants: { variant: 'info' }
	});

	export type AlertVariant = VariantProps<typeof alertVariants>['variant'];
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		variant?: AlertVariant;
		class?: string;
		children?: Snippet;
	};
	let { variant = 'info', class: className, children, ...rest }: Props = $props();
</script>

<div role="alert" class={cn(alertVariants({ variant }), className)} {...rest}>
	{@render children?.()}
</div>
