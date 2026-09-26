<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	let { class: className, ...restProps }: HTMLAttributes<HTMLSpanElement> = $props();
</script>

<!-- A dense-content divider between groups of actions. -->
<span
	role="separator"
	aria-orientation="vertical"
	{...restProps}
	class={cn('bg-border mx-1 h-5 w-px shrink-0', className)}
></span>
