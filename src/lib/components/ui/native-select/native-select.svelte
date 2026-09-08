<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
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
			'bg-control focus-visible:ring-ring h-10 w-full appearance-none rounded-full px-3.5 pr-9 text-base transition-[border-color,box-shadow] outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 sm:text-sm',
			className
		)}
		{...rest}
	>
		{@render children?.()}
	</select>
	<ChevronDown
		class="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
	/>
</div>
