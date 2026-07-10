<script lang="ts">
	import { cn } from '$lib/utils.js';
	import OrbMark from './orb-mark.svelte';

	let { class: className, wordmark = true }: { class?: string; wordmark?: boolean } = $props();
</script>

<!-- The Mizu lockup: glow orb + wordmark. -->
<span class={cn('inline-flex select-none items-center gap-2', className)}>
	<OrbMark class="size-7" />
	{#if wordmark}
		<span class="text-lg font-semibold tracking-tight text-foreground">Mizu</span>
	{/if}
</span>
