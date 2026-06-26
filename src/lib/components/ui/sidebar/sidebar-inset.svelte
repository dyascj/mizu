<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLElement> & {
		class?: string;
		ref?: HTMLElement | null;
		children?: Snippet;
	};

	let { class: className, ref = $bindable(null), children, ...rest }: Props = $props();
</script>

<main
	bind:this={ref}
	data-slot="sidebar-inset"
	class={cn('relative flex min-h-0 min-w-0 flex-1 flex-col bg-background', className)}
	{...rest}
>
	{@render children?.()}
</main>
