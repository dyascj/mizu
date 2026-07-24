<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLSpanElement> & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<span
	class={cn(
		'bg-secondary text-secondary-foreground inline-flex h-10 items-center px-3.5 text-sm font-medium',
		className
	)}
	{...rest}
>
	{@render children?.()}
</span>
