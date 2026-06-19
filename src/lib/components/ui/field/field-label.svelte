<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLLabelAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLLabelAttributes & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<label class={cn('text-sm font-semibold', className)} {...rest}>
	{@render children?.()}
</label>
