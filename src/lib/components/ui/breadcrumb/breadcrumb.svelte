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

<nav bind:this={ref} aria-label="breadcrumb" class={cn(className)} {...rest}>
	{@render children?.()}
</nav>
