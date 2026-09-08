<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLElement> & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<kbd
	class={cn(
		'bg-muted text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-xs px-1.5 font-mono text-xs font-medium shadow-xs',
		className
	)}
	{...rest}
>
	{@render children?.()}
</kbd>
