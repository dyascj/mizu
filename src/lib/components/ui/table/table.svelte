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

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="relative w-full overflow-x-auto rounded-[inherit] focus-visible:outline-offset-2"
	role="region"
	aria-label={rest['aria-label'] ?? 'Table'}
	tabindex="0"
>
	<table bind:this={ref} class={cn('w-full text-sm', className)} {...rest}>
		{@render children?.()}
	</table>
</div>
