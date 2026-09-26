<script lang="ts">
	import { cn } from '$lib/utils.js';
	import MizuMark from './mizu-mark.svelte';
	import MizuWordmark from './mizu-wordmark.svelte';

	let { class: className, wordmark = true }: { class?: string; wordmark?: boolean } = $props();
</script>

<!-- The Mizu lockup. The wave drifts while the lockup is hovered. -->
<span class={cn('group text-foreground inline-flex items-center gap-2 select-none', className)}>
	<MizuMark class="size-7" />
	{#if wordmark}
		<MizuWordmark class="h-[1.125rem]" />
		<span class="sr-only">Mizu</span>
	{/if}
</span>
