<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const alertVariants = tv({
		base: 'relative grid w-full grid-cols-[0_1fr] items-start gap-x-3 gap-y-1 rounded-xl border px-4 py-3.5 text-sm shadow-xs has-[>svg]:grid-cols-[1.25rem_1fr] [&>svg]:size-5 [&>svg]:translate-y-0.5 [&>svg]:text-[color:var(--alert)] border-[color:color-mix(in_oklab,var(--alert)_32%,transparent)] bg-[image:linear-gradient(180deg,color-mix(in_oklab,var(--alert)_17%,var(--card))_0%,color-mix(in_oklab,var(--alert)_9%,var(--card))_100%)] text-[color:color-mix(in_oklab,var(--alert)_62%,var(--foreground))]',
		variants: {
			variant: {
				info: '[--alert:var(--info)]',
				success: '[--alert:var(--success)]',
				warning: '[--alert:var(--warning)]',
				destructive: '[--alert:var(--destructive)]'
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
