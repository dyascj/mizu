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
	data-slot="sidebar-group"
	class={cn('relative flex w-full min-w-0 flex-col gap-1 p-1', className)}
	{...rest}
>
	{@render children?.()}
</div>
