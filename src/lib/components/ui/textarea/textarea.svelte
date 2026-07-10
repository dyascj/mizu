<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLTextareaAttributes & {
		class?: string;
		ref?: HTMLTextAreaElement | null;
		value?: string | null;
	};
	let { class: className, ref = $bindable(null), value = $bindable(), ...rest }: Props = $props();
</script>

<textarea
	bind:this={ref}
	bind:value
	class={cn(
		'flex min-h-20 w-full rounded-xl border border-input bg-card/70 px-3.5 py-2.5 text-sm text-foreground outline-none transition-[box-shadow,border-color] duration-150 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...rest}></textarea>
