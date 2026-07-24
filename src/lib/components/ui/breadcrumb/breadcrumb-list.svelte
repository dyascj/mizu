<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLOListElement> & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<ol
	class={cn('text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm', className)}
	{...rest}
>
	{@render children?.()}
</ol>
