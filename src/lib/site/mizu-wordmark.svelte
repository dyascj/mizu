<script lang="ts">
	import { cn } from '$lib/utils.js';

	let { class: className }: { class?: string } = $props();
</script>

<!-- Custom geometric wordmark drawn from rounded strokes on a 20 unit
     x-height. The dot of the i echoes the mark's vessel. -->
<svg
	viewBox="-2.4 -1.2 77.5 33.6"
	class={cn('h-5 w-auto shrink-0', className)}
	fill="none"
	stroke="currentColor"
	stroke-width="4.4"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<path
		d="M2 30V11M2 17.5C2 13 4.8 10 8.5 10s5.7 3 5.7 7.5V30m0-12.5c0-4.5 2.8-7.5 6.5-7.5s5.7 3 5.7 7.5V30"
	/>
	<path d="M34 11v19" />
	<path d="M41.5 10.5H53L41.5 29.5H53" />
	<path d="M60.5 11v11.5c0 4.5 2.8 7.5 6.5 7.5s5.7-3 5.7-7.5M72.7 11v19" />
	<circle cx="34" cy="3.6" r="2.8" fill="currentColor" stroke="none" />
</svg>
