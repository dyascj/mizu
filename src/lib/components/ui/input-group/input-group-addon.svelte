<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLDivElement> & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<div class={cn('flex items-center px-3 text-muted-foreground [&>svg]:size-4', className)} {...rest}>
	{@render children?.()}
</div>
