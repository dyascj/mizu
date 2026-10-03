<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLThAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLThAttributes & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<th
	class={cn(
		'text-muted-foreground h-10 px-3 text-start align-middle font-semibold [&:has([role=checkbox])]:pe-0',
		className
	)}
	{...rest}
>
	{@render children?.()}
</th>
