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
		'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center',
		className
	)}
	{...rest}
>
	{@render children?.()}
</div>
