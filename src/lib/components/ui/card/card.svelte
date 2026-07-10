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
		'flex flex-col rounded-2xl dark:border dark:border-border bg-card text-card-foreground shadow-md',
		className
	)}
	{...rest}
>
	{@render children?.()}
</div>
