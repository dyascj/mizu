<script lang="ts">
	import { page } from '$app/state';
	import { componentsByCategory } from '$lib/site/catalog';
	import { gettingStartedRoutes } from '$lib/site/routes';
	import TableOfContents from '$lib/site/table-of-contents.svelte';
	import DocsPager from '$lib/site/docs-pager.svelte';
	import { cn } from '$lib/utils.js';

	let { children } = $props();

	const groups = componentsByCategory();

	function isActive(href: string) {
		return page.url.pathname === href;
	}
	const linkClass = (active: boolean) =>
		cn(
			'rounded-lg px-3 py-1.5 text-sm leading-snug transition-colors',
			active
				? 'bg-primary-muted font-medium text-primary'
				: 'text-muted-foreground hover:text-foreground'
		);
</script>

<div class="mx-auto flex w-full max-w-[1440px] gap-10 px-5 py-10 sm:px-8 lg:py-12">
	<aside
		class="sticky top-24 hidden h-[calc(100dvh-8.5rem)] w-52 shrink-0 [scrollbar-width:none] overflow-y-auto [overscroll-behavior:contain] [mask-image:linear-gradient(to_bottom,transparent_0,black_1.5rem,black_calc(100%-3rem),transparent_100%)] py-6 lg:block [&::-webkit-scrollbar]:hidden"
	>
		<nav aria-label="Documentation" class="flex flex-col gap-5">
			<div class="flex flex-col gap-px">
				<p class="text-muted-foreground px-2 pb-1 text-xs font-medium">Getting started</p>
				{#each gettingStartedRoutes as route (route.path)}
					<a href={route.path} class={linkClass(isActive(route.path))}>{route.title}</a>
				{/each}
			</div>

			<div class="flex flex-col gap-px">
				<p class="text-muted-foreground px-2 pb-1 text-xs font-medium">Components</p>
				<a href="/docs/components" class={linkClass(isActive('/docs/components'))}>Overview</a>
			</div>

			{#each groups as group (group.category)}
				<div class="flex flex-col gap-px">
					<p class="text-muted-foreground px-2 pb-1 text-xs font-medium">
						{group.category}
					</p>
					{#each group.items as item (item.slug)}
						{@const href = `/docs/components/${item.slug}`}
						<a {href} class={linkClass(isActive(href))}>{item.name}</a>
					{/each}
				</div>
			{/each}
		</nav>
	</aside>

	<main id="main-content" class="min-w-0 flex-1 pb-16" tabindex="-1">
		<div id="doc-content">
			{@render children()}
		</div>
		<DocsPager />
	</main>

	<aside class="hidden w-44 shrink-0 xl:block">
		<TableOfContents />
	</aside>
</div>
