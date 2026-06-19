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
	role="group"
	class={cn(
		'inline-flex items-center [&>*]:rounded-none [&>*:first-child]:rounded-l-xl [&>*:last-child]:rounded-r-xl [&>*:not(:first-child)]:-ml-px',
		className
	)}
	{...rest}
>
	{@render children?.()}
</div>
