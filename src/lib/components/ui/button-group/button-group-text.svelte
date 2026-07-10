<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLSpanElement> & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<span
	class={cn(
		'inline-flex h-10 items-center dark:border dark:border-border bg-secondary px-3.5 text-sm font-medium text-secondary-foreground',
		className
	)}
	{...rest}
>
	{@render children?.()}
</span>
