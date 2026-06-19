<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLOListElement> & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<ol class={cn('flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground', className)} {...rest}>
	{@render children?.()}
</ol>
