<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLUListElement> & {
		class?: string;
		ref?: HTMLUListElement | null;
		children?: Snippet;
	};

	let { class: className, ref = $bindable(null), children, ...rest }: Props = $props();
</script>

<ul
	bind:this={ref}
	data-slot="sidebar-menu"
	class={cn('flex w-full min-w-0 flex-col gap-1', className)}
	{...rest}
>
	{@render children?.()}
</ul>
