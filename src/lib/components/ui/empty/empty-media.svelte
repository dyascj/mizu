<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLDivElement> & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<div
	class={cn(
		'bg-popover text-muted-foreground flex size-12 items-center justify-center rounded-2xl shadow-xs [&>svg]:size-6',
		className
	)}
	{...rest}
>
	{@render children?.()}
</div>
