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
	data-slot="sidebar-group-label"
	class={cn(
		'flex h-7 shrink-0 items-center px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-[opacity,margin] duration-200 ease-out',
		'group-data-[state=collapsed]/sidebar:pointer-events-none group-data-[state=collapsed]/sidebar:-mt-7 group-data-[state=collapsed]/sidebar:opacity-0',
		className
	)}
	{...rest}
>
	{@render children?.()}
</div>
