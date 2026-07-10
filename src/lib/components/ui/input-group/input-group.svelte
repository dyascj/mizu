<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		class?: string;
		ref?: HTMLDivElement | null;
		children?: Snippet;
	};
	let { class: className, ref = $bindable(null), children, ...rest }: Props = $props();
</script>

<div
	bind:this={ref}
	class={cn(
		'flex items-center rounded-full bg-secondary transition-[border-color,box-shadow] focus-within:ring-2 focus-within:ring-ring/35',
		className
	)}
	{...rest}
>
	{@render children?.()}
</div>
