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
	data-slot="sidebar-content"
	class={cn('flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden p-2', className)}
	{...rest}
>
	{@render children?.()}
</div>
