<script lang="ts">
	import { cn } from '$lib/utils.js';

	let { class: className }: { class?: string } = $props();
</script>

<!-- The Mizu water-orb brand mark. Decorative; the accompanying "Mizu" wordmark
     carries the accessible name. -->
<img
	src="/brand/mizu-icon.png"
	alt=""
	aria-hidden="true"
	draggable="false"
	class={cn('h-8 w-auto select-none', className)}
/>
