<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		class?: string;
		ref?: HTMLDivElement | null;
		children?: Snippet;
	};
	let { class: className, ref = $bindable(null), children, ...rest }: Props = $props();
</script>

<div
	bind:this={ref}
	class={cn(
		'glass gloss relative flex items-center gap-3 rounded-xl border border-[color:var(--glass-border)] p-3 shadow-bevel transition-colors',
		className
	)}
	{...rest}
>
	{@render children?.()}
</div>
