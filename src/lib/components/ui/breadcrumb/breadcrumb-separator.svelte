<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { ChevronRight } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLLIElement> & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<li
	role="presentation"
	aria-hidden="true"
	class={cn('[&>svg]:size-3.5', className)}
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		<ChevronRight />
	{/if}
</li>
