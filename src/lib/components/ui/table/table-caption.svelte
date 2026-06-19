<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLElement> & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<caption class={cn('mt-3 text-sm text-muted-foreground', className)} {...rest}>
	{@render children?.()}
</caption>
