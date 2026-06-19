<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLTableElement> & {
		class?: string;
		ref?: HTMLTableElement | null;
		children?: Snippet;
	};
	let { class: className, ref = $bindable(null), children, ...rest }: Props = $props();
</script>

<div class="relative w-full overflow-x-auto">
	<table bind:this={ref} class={cn('w-full text-sm', className)} {...rest}>
		{@render children?.()}
	</table>
</div>
