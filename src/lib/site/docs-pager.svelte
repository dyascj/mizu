<script lang="ts">
	import { page } from '$app/state';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { buttonVariants } from '$lib/components/ui/button';
	import { pagerFor } from './docs-nav';

	const pager = $derived(pagerFor(page.url.pathname));
</script>

{#if pager.prev || pager.next}
	<nav class="mt-12 flex items-center justify-between gap-3 border-t border-border pt-6">
		{#if pager.prev}
			<a href={pager.prev.href} class={buttonVariants({ variant: 'outline', size: 'sm' })}>
				<ArrowLeft class="size-4" />
				{pager.prev.title}
			</a>
		{:else}
			<span></span>
		{/if}
		{#if pager.next}
			<a href={pager.next.href} class={buttonVariants({ variant: 'outline', size: 'sm' })}>
				{pager.next.title}
				<ArrowRight class="size-4" />
			</a>
		{/if}
	</nav>
{/if}
