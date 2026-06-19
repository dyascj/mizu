<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLDivElement> & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<div
	class={cn('col-start-2 text-sm text-muted-foreground [&_p]:leading-relaxed', className)}
	{...rest}
>
	{@render children?.()}
</div>
