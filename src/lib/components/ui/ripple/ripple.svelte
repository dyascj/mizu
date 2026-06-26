<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { ripple as rippleAction, type RippleOptions } from './ripple.svelte.js';

	type Props = HTMLAttributes<HTMLDivElement> &
		RippleOptions & {
			class?: string;
			ref?: HTMLDivElement | null;
			children?: Snippet;
		};

	let {
		color,
		duration,
		disabled = false,
		class: className,
		ref = $bindable(null),
		children,
		...rest
	}: Props = $props();
</script>

<div
	bind:this={ref}
	class={cn('relative overflow-hidden', className)}
	use:rippleAction={{ color, duration, disabled }}
	{...rest}
>
	{@render children?.()}
</div>
