<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLTableSectionElement> & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<tfoot
	class={cn(
		'border-border bg-secondary/50 border-t font-semibold [&>tr]:last:border-b-0',
		className
	)}
	{...rest}
>
	{@render children?.()}
</tfoot>
