<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { page } from '$app/state';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import LayoutTemplate from '@lucide/svelte/icons/layout-template';
	import SearchIcon from '@lucide/svelte/icons/search';
	import Shapes from '@lucide/svelte/icons/shapes';
	import { Kbd } from '$lib/components/ui/kbd';
	import { blockCategories } from './blocks';
	import { components, componentsByCategory } from './catalog';
	import { siteConfig } from './config';
	import { gettingStartedRoutes } from './routes';
	import { cn } from '$lib/utils.js';

	/** `close` renders beside the filter field (the mobile sheet's close button). */
	let { close }: { close?: Snippet } = $props();

	type Link = { href: string; title: string };
	type Group = { label: string; links: Link[] };
	type Section = { label: string; icon: Component; count?: number; groups: Group[] };

	const blockHref = (c: string) => `/blocks?category=${c.toLowerCase().replaceAll(' ', '-')}`;

	const sections: Section[] = [
		{
			label: 'Docs',
			icon: BookOpen,
			groups: [
				{ label: '', links: gettingStartedRoutes.map((r) => ({ href: r.path, title: r.title })) }
			]
		},
		{
			label: 'Components',
			icon: Shapes,
			count: components.length,
			groups: [
				{ label: '', links: [{ href: '/docs/components', title: 'Overview' }] },
				...componentsByCategory().map((g) => ({
					label: g.category,
					links: g.items.map((c) => ({ href: `/docs/components/${c.slug}`, title: c.name }))
				}))
			]
		},
		{
			label: 'Blocks',
			icon: LayoutTemplate,
			groups: [{ label: '', links: blockCategories.map((c) => ({ href: blockHref(c), title: c })) }]
		}
	];

	let query = $state('');
	const collapsed = new SvelteSet<string>();
	const toggle = (key: string) => (collapsed.has(key) ? collapsed.delete(key) : collapsed.add(key));
	const filtering = $derived(query.trim().length > 0);
	const open = (key: string) => filtering || !collapsed.has(key);

	const visible = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return sections;
		return sections
			.map((s) => ({
				...s,
				groups: s.groups
					.map((g) => ({
						...g,
						links: g.links.filter(
							(l) => l.title.toLowerCase().includes(q) || g.label.toLowerCase().includes(q)
						)
					}))
					.filter((g) => g.links.length)
			}))
			.filter((s) => s.groups.length);
	});
	const matches = $derived(
		visible.reduce((n, s) => n + s.groups.reduce((m, g) => m + g.links.length, 0), 0)
	);

	function isActive(href: string) {
		const [path, search] = href.split('?');
		if (page.url.pathname !== path) return false;
		if (path !== '/blocks') return true;
		const category = page.url.searchParams.get('category');
		return search === `category=${category}` || (!category && href === blockHref('Featured'));
	}

	// Bring the current page's link into view when the list first renders.
	function revealActive(node: HTMLElement) {
		node.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'center' });
	}
</script>

<div class="flex h-full min-h-0 flex-col">
	<div class="flex items-center gap-2 px-5 pt-5 pb-3">
		<label
			class="border-border bg-secondary/50 text-muted-foreground focus-within:border-border-strong focus-within:text-foreground flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border px-3 transition-colors"
		>
			<SearchIcon class="size-4 shrink-0" aria-hidden="true" />
			<input
				bind:value={query}
				type="search"
				placeholder="Search"
				aria-label="Filter components, blocks and docs"
				class="text-foreground placeholder:text-muted-foreground h-full min-w-0 flex-1 bg-transparent text-sm outline-none [&::-webkit-search-cancel-button]:hidden"
			/>
			<Kbd class="hidden lg:inline-flex">⌘K</Kbd>
		</label>
		{@render close?.()}
	</div>
	<span role="status" class="sr-only">{filtering ? `${matches} results` : ''}</span>

	<nav
		aria-label="Documentation"
		{@attach revealActive}
		class="min-h-0 flex-1 [scrollbar-width:thin] overflow-y-auto [overscroll-behavior:contain] [mask-image:linear-gradient(to_bottom,black_calc(100%-2rem),transparent)] px-5 pb-6"
	>
		{#each visible as section (section.label)}
			{@const Icon = section.icon}
			<section class="mt-3 first:mt-1">
				<button
					type="button"
					aria-expanded={open(section.label)}
					onclick={() => toggle(section.label)}
					class="text-foreground hover:bg-secondary/70 focus-visible:ring-ring flex h-8 w-full items-center gap-2.5 rounded-lg px-1.5 text-sm font-medium outline-none focus-visible:ring-2"
				>
					<Icon class="text-muted-foreground size-4" aria-hidden="true" />
					<span class="flex-1 text-left">{section.label}</span>
					{#if section.count}<span class="text-muted-foreground text-xs tabular-nums"
							>{section.count}</span
						>{/if}
					<ChevronDown
						class={cn(
							'text-muted-foreground size-3.5 transition-transform duration-(--duration-fast)',
							!open(section.label) && '-rotate-90'
						)}
						aria-hidden="true"
					/>
				</button>

				{#if open(section.label)}
					{#each section.groups as group (group.label)}
						{@const key = `${section.label}/${group.label}`}
						{#if group.label}
							<button
								type="button"
								aria-expanded={open(key)}
								onclick={() => toggle(key)}
								class="text-foreground hover:bg-secondary/70 focus-visible:ring-ring mt-1.5 flex h-7 w-full items-center gap-2 rounded-lg px-1.5 text-[0.8125rem] font-medium outline-none focus-visible:ring-2"
							>
								<ChevronRight
									class={cn(
										'text-muted-foreground size-3.5 transition-transform duration-(--duration-fast)',
										open(key) && 'rotate-90'
									)}
									aria-hidden="true"
								/>
								{group.label}
								<span
									class="bg-secondary text-muted-foreground rounded-md px-1.5 text-[0.6875rem] leading-4 tabular-nums"
									>{group.links.length}</span
								>
							</button>
						{/if}
						{#if !group.label || open(key)}
							<ul class="border-border ml-3.5 flex flex-col border-l py-0.5 pl-1.5">
								{#each group.links as link (link.href)}
									{@const active = isActive(link.href)}
									<li>
										<a
											href={link.href}
											aria-current={active ? 'page' : undefined}
											class={cn(
												'focus-visible:ring-ring relative flex h-[1.875rem] items-center rounded-lg px-2 text-[0.8125rem] outline-none focus-visible:ring-2',
												"before:bg-foreground before:absolute before:top-1/2 before:-left-[7px] before:h-4 before:w-px before:-translate-y-1/2 before:opacity-0 before:content-['']",
												active
													? 'bg-secondary text-foreground font-medium before:opacity-100'
													: 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
											)}
										>
											<span class="truncate">{link.title}</span>
										</a>
									</li>
								{/each}
							</ul>
						{/if}
					{/each}
				{/if}
			</section>
		{:else}
			<p class="text-muted-foreground px-1.5 py-6 text-sm">No matches for “{query.trim()}”.</p>
		{/each}
	</nav>

	<div class="px-5 pt-2 pb-5">
		<a
			href={`${siteConfig.repo}/blob/main/CHANGELOG.md`}
			target="_blank"
			rel="noreferrer"
			class="border-border bg-background hover:bg-secondary/50 focus-visible:ring-ring flex h-10 items-center gap-2.5 rounded-xl border px-3 text-[0.8125rem] font-medium shadow-xs transition-colors outline-none focus-visible:ring-2"
		>
			<span class="size-1.5 rounded-full bg-[color:var(--success)]" aria-hidden="true"></span>
			<span class="flex-1">What’s new</span>
			<span class="text-muted-foreground font-normal tabular-nums"
				>v{siteConfig.registryVersion}</span
			>
			<ChevronRight class="text-muted-foreground size-3.5" aria-hidden="true" />
		</a>
	</div>
</div>
