<script lang="ts">
	import { page } from '$app/state';
	import { componentsByCategory } from '$lib/site/catalog';
	import TableOfContents from '$lib/site/table-of-contents.svelte';
	import DocsPager from '$lib/site/docs-pager.svelte';
	import { cn } from '$lib/utils.js';

	let { children } = $props();

	const gettingStarted = [
		{ href: '/docs', label: 'Introduction' },
		{ href: '/docs/installation', label: 'Installation' },
		{ href: '/docs/theming', label: 'Theming' },
		{ href: '/docs/usage', label: 'Usage' },
		{ href: '/docs/build-a-chat', label: 'Build a chat' },
		{ href: '/docs/agents', label: 'UI for Agents' }
	];
	const groups = componentsByCategory();

	function isActive(href: string) {
		return page.url.pathname === href;
	}
	const linkClass = (active: boolean) =>
		cn(
			'rounded-md px-2 py-1 text-[0.8rem] leading-snug transition-colors',
			active
				? 'bg-primary-muted font-medium text-primary'
				: 'text-muted-foreground hover:text-foreground'
		);
</script>

<div class="mx-auto flex w-full max-w-6xl gap-8 px-5 py-10 sm:px-6">
	<aside
		class="sticky top-24 hidden h-[calc(100dvh-8.5rem)] w-52 shrink-0 overflow-y-auto py-6 lg:block [overscroll-behavior:contain] [scrollbar-width:none] [mask-image:linear-gradient(to_bottom,transparent_0,black_1.5rem,black_calc(100%-3rem),transparent_100%)] [&::-webkit-scrollbar]:hidden"
	>
		<nav class="flex flex-col gap-5">
			<div class="flex flex-col gap-px">
				<p class="px-2 pb-1 text-xs font-medium text-muted-foreground/70">Getting Started</p>
				{#each gettingStarted as link (link.href)}
					<a href={link.href} class={linkClass(isActive(link.href))}>{link.label}</a>
				{/each}
			</div>

			<div class="flex flex-col gap-px">
				<p class="px-2 pb-1 text-xs font-medium text-muted-foreground/70">Components</p>
				<a href="/docs/components" class={linkClass(isActive('/docs/components'))}>Overview</a>
			</div>

			{#each groups as group (group.category)}
				<div class="flex flex-col gap-px">
					<p class="px-2 pb-1 text-xs font-medium text-muted-foreground/70">
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

	<main class="min-w-0 flex-1 pb-16">
		<div id="doc-content">
			{@render children()}
		</div>
		<DocsPager />
	</main>

	<aside class="hidden w-56 shrink-0 xl:block">
		<TableOfContents />
	</aside>
</div>
