<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLLIElement> & {
		class?: string;
		ref?: HTMLLIElement | null;
		children?: Snippet;
	};

	let { class: className, ref = $bindable(null), children, ...rest }: Props = $props();
</script>

<li
	bind:this={ref}
	data-slot="sidebar-menu-item"
	class={cn('group/menu-item relative', className)}
	{...rest}
>
	{@render children?.()}
</li>
