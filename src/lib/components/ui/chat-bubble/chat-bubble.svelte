<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const chatBubbleVariants = tv({
		base: 'w-fit max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words',
		variants: {
			role: {
				user: 'ml-auto rounded-br-md bg-primary text-primary-foreground',
				assistant: 'mr-auto rounded-bl-md bg-secondary text-foreground'
			}
		},
		defaultVariants: { role: 'assistant' }
	});

	export type ChatBubbleRole = VariantProps<typeof chatBubbleVariants>['role'];
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		role?: ChatBubbleRole;
		/** Rise-and-fade entrance as the message arrives. */
		animate?: boolean;
		class?: string;
		ref?: HTMLDivElement | null;
		children?: Snippet;
	};

	let {
		role = 'assistant',
		animate = true,
		class: className,
		ref = $bindable(null),
		children,
		...rest
	}: Props = $props();
</script>

<div
	bind:this={ref}
	class={cn(chatBubbleVariants({ role }), animate && 'bubble-in', className)}
	{...rest}
>
	{@render children?.()}
</div>

<style>
	:global(.bubble-in) {
		animation: bubble-in 220ms ease-out both;
	}

	@keyframes bubble-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.bubble-in) {
			animation: none;
		}
	}
</style>
