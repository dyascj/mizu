<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLHeadingElement> & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<h3 class={cn('font-display text-lg leading-none font-bold tracking-tight', className)} {...rest}>
	{@render children?.()}
</h3>
