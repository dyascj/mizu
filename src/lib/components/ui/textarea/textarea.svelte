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
		'bg-secondary text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/35 flex min-h-20 w-full rounded-xl px-3.5 py-2.5 text-sm transition-[box-shadow,border-color] duration-150 outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...rest}></textarea>
