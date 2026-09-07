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
		'bg-control text-foreground placeholder:text-muted-foreground focus-visible:ring-ring aria-invalid:ring-destructive flex min-h-20 w-full rounded-2xl px-3.5 py-2.5 text-sm transition-[box-shadow,border-color] duration-200 outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2',
		!rest.placeholder && !value && 'ring-input ring-1',
		className
	)}
	{...rest}></textarea>
