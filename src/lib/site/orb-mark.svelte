<script lang="ts">
	import { cn } from '$lib/utils.js';
	let { class: className }: { class?: string } = $props();
</script>

<span
	class={cn('block size-8 shrink-0 rounded-full select-none', className)}
	style="background: var(--voice-orb-fallback)"
	aria-hidden="true"
></span>
