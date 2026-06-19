<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLParagraphElement> & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<p class={cn('max-w-sm text-sm text-muted-foreground', className)} {...rest}>
	{@render children?.()}
</p>
