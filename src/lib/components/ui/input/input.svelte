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
		'bg-control text-foreground placeholder:text-muted-foreground focus-visible:ring-ring aria-invalid:ring-destructive flex h-10 w-full rounded-full px-4 py-2 text-base transition-[box-shadow,border-color] duration-200 outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 sm:text-sm',
		!rest.placeholder && (value == null || value === '') && 'ring-input ring-1',
		className
	)}
	{...rest}
/>
