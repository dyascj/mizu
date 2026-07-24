<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLSpanElement> & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<span
	role="link"
	aria-disabled="true"
	aria-current="page"
	class={cn('text-foreground font-semibold', className)}
	{...rest}
>
	{@render children?.()}
</span>
