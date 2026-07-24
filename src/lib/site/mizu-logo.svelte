<script lang="ts">
	import { cn } from '$lib/utils.js';
	import OrbMark from './orb-mark.svelte';

	let { class: className, wordmark = true }: { class?: string; wordmark?: boolean } = $props();
</script>

<!-- The Mizu lockup: glow orb + wordmark. -->
<span class={cn('inline-flex items-center gap-2 select-none', className)}>
	<OrbMark class="size-7" />
	{#if wordmark}
		<span class="text-foreground text-lg font-semibold tracking-tight">Mizu</span>
	{/if}
</span>
