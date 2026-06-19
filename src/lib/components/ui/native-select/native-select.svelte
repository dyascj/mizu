<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import { ChevronDown } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';

	type Props = HTMLSelectAttributes & {
		class?: string;
		ref?: HTMLSelectElement | null;
		value?: string | number | string[] | null;
		children?: Snippet;
	};
	let {
		class: className,
		ref = $bindable(null),
		value = $bindable(),
		children,
		...rest
	}: Props = $props();
</script>

<div class="relative w-full">
	<select
		bind:this={ref}
		bind:value
		class={cn(
			'h-10 w-full appearance-none rounded-xl border border-input bg-card/70 px-3.5 pr-9 text-sm shadow-pressed outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-50',
			className
		)}
		{...rest}
	>
		{@render children?.()}
	</select>
	<ChevronDown
		class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
	/>
</div>
