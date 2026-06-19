<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLDivElement> & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<div
	class={cn(
		'flex size-10 shrink-0 items-center justify-center rounded-lg glass-strong shadow-bevel text-muted-foreground [&>svg]:size-5',
		className
	)}
	{...rest}
>
	{@render children?.()}
</div>
