<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLLabelAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLLabelAttributes & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<label
	class={cn(
		'text-foreground flex items-center gap-2 text-sm font-semibold select-none peer-disabled:opacity-50 has-[+:disabled]:opacity-50',
		className
	)}
	{...rest}
>
	{@render children?.()}
</label>
