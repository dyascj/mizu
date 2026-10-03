<script lang="ts">
	import { page } from '$app/state';
	import SearchIcon from '@lucide/svelte/icons/search';
	import MobileNav from './mobile-nav.svelte';
	import MizuLogo from './mizu-logo.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Kbd } from '$lib/components/ui/kbd';
	import ModeToggle from './mode-toggle.svelte';
	import CommandPalette from './command-palette.svelte';
	import { search } from './search.svelte';
	import { siteConfig } from './config';

	const navLinks = [
		{ href: '/docs/components', label: 'Components' },
		{ href: '/blocks', label: 'Blocks' },
		{ href: '/docs', label: 'Docs' },
		{ href: '/docs/motion', label: 'Motion' }
	];

	// Docs owns everything under /docs except the sections with their own tab.
	const current = (href: string) => {
		const path = page.url.pathname;
		if (href !== '/docs') return path.startsWith(href);
		return (
			path.startsWith('/docs') &&
			!navLinks.some((l) => l.href !== '/docs' && path.startsWith(l.href))
		);
	};
</script>

<header
	class="border-border sticky top-0 z-40 border-b bg-[color-mix(in_oklab,var(--background)_96%,transparent)] backdrop-blur-xl"
>
	<div class="flex h-16 items-center gap-2 px-4 sm:px-6">
		<MobileNav />
		<a
			href="/"
			class="focus-visible:ring-ring flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-4"
			aria-label="{siteConfig.name} home"
		>
			<MizuLogo />
		</a>
		<nav aria-label="Main navigation" class="ml-6 hidden items-center gap-6 lg:flex">
			{#each navLinks as link (link.href)}
				<a
					href={link.href}
					aria-current={current(link.href) ? 'page' : undefined}
					class="text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground after:bg-foreground relative flex h-8 items-center text-sm font-medium transition-colors duration-(--duration-fast) after:absolute after:inset-x-0 after:-bottom-[17px] after:h-0.5 after:opacity-0 after:transition-opacity after:content-[''] aria-[current=page]:after:opacity-100"
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<div class="ml-auto flex items-center gap-2">
			<button
				type="button"
				onclick={() => (search.open = true)}
				aria-label="Search pages and components"
				aria-keyshortcuts="Meta+K Control+K"
				class="border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 focus-visible:ring-ring flex h-9 items-center gap-2 rounded-xl border px-2.5 text-sm transition-colors outline-none focus-visible:ring-2 sm:px-3"
			>
				<SearchIcon class="size-4 shrink-0" />
				<span class="hidden sm:inline">Search</span>
				<Kbd class="ml-3 hidden sm:inline-flex">⌘K</Kbd>
			</button>
			<div class="border-border divide-border flex h-9 items-center divide-x rounded-xl border">
				<a
					href={siteConfig.repo}
					target="_blank"
					rel="noreferrer"
					aria-label="GitHub"
					class="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex h-full items-center px-2.5 outline-none focus-visible:ring-2"
				>
					<svg viewBox="0 0 24 24" fill="currentColor" class="size-4" aria-hidden="true">
						<path
							d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 4.5 18 4.8 18 4.8c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"
						/>
					</svg>
				</a>
				<ModeToggle
					class="text-muted-foreground hover:text-foreground h-full w-auto rounded-none px-2.5 hover:bg-transparent"
				/>
			</div>
			<Button href="/docs/installation" size="sm" class="ml-1 hidden md:inline-flex"
				>Get started</Button
			>
		</div>
	</div>
</header>

<CommandPalette />
