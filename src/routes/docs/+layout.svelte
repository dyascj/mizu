<script lang="ts">
	import DocsSidebar from '$lib/site/docs-sidebar.svelte';
	import TableOfContents from '$lib/site/table-of-contents.svelte';
	import DocsPager from '$lib/site/docs-pager.svelte';

	let { children } = $props();
</script>

<div class="flex w-full">
	<aside
		class="border-border sticky top-16 hidden h-[calc(100dvh-4rem)] w-[15.5rem] shrink-0 border-r lg:block"
	>
		<DocsSidebar />
	</aside>

	<div class="flex min-w-0 flex-1 justify-center gap-14 px-5 py-10 sm:px-8 lg:px-14 lg:py-12">
		<main id="main-content" class="w-full max-w-3xl min-w-0 pb-16" tabindex="-1">
			<div id="doc-content">
				{@render children()}
			</div>
			<DocsPager />
		</main>

		<aside class="hidden w-48 shrink-0 xl:block">
			<TableOfContents />
		</aside>
	</div>
</div>
