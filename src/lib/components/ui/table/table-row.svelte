<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLTableRowElement> & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<tr
	class={cn(
		'border-border hover:bg-secondary/50 data-[state=selected]:bg-accent border-b transition-colors',
		className
	)}
	{...rest}
>
	{@render children?.()}
</tr>
