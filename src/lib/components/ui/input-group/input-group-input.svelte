<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLInputAttributes & {
		class?: string;
		ref?: HTMLInputElement | null;
		value?: string | number | null;
	};
	let { class: className, ref = $bindable(null), value = $bindable(), ...rest }: Props = $props();
</script>

<input
	bind:this={ref}
	bind:value
	class={cn(
		'placeholder:text-muted-foreground h-10 min-w-0 flex-1 bg-transparent px-3.5 text-sm outline-none disabled:pointer-events-none disabled:opacity-50',
		className
	)}
	{...rest}
/>
