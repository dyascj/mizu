<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAnchorAttributes & {
		class?: string;
		ref?: HTMLAnchorElement | null;
		children?: Snippet;
	};
	let { class: className, ref = $bindable(null), children, ...rest }: Props = $props();
</script>

<a bind:this={ref} class={cn('transition-colors hover:text-foreground', className)} {...rest}>
	{@render children?.()}
</a>
