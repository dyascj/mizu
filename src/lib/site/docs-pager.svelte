<script lang="ts">
	import { page } from '$app/state';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { pagerFor } from './docs-nav';
	const pager = $derived(pagerFor(page.url.pathname));
</script>

{#if pager.prev || pager.next}
	<nav aria-label="Previous and next pages" class="mt-16 grid grid-cols-2 gap-3">
		{#if pager.prev}
			<a
				href={pager.prev.href}
				class="group bg-secondary/60 hover:bg-secondary flex min-w-0 flex-col gap-2 rounded-2xl p-4 transition-colors"
			>
				<span class="text-muted-foreground flex items-center gap-2 text-xs"
					><ArrowLeft class="size-3.5" /> Previous</span
				>
				<span class="text-sm font-medium break-words">{pager.prev.title}</span>
			</a>
		{:else}<span></span>{/if}
		{#if pager.next}
			<a
				href={pager.next.href}
				class="group bg-secondary/60 hover:bg-secondary flex min-w-0 flex-col items-end gap-2 rounded-2xl p-4 text-right transition-colors"
			>
				<span class="text-muted-foreground flex items-center gap-2 text-xs"
					>Next <ArrowRight class="size-3.5" /></span
				>
				<span class="text-sm font-medium break-words">{pager.next.title}</span>
			</a>
		{/if}
	</nav>
{/if}
