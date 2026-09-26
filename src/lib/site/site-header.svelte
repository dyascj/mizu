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
		{ href: '/docs', label: 'Docs' },
		{ href: '/docs/components', label: 'Components' },
		{ href: '/blocks', label: 'Blocks' },
		{ href: '/docs/motion', label: 'Motion' }
	];

	let scrolled = $state(false);

	const current = (href: string) =>
		href === '/docs' ? page.url.pathname === href : page.url.pathname.startsWith(href);
</script>

<svelte:window onscroll={() => (scrolled = window.scrollY > 8)} />

<header
	data-scrolled={scrolled || undefined}
	class="sticky top-0 z-40 px-4 transition-[background-color,box-shadow,backdrop-filter] duration-(--duration-slow) ease-out data-[scrolled]:bg-[color-mix(in_oklab,var(--background)_78%,transparent)] data-[scrolled]:shadow-[0_1px_0_color-mix(in_oklab,var(--foreground)_6%,transparent)] data-[scrolled]:backdrop-blur-xl sm:px-6"
>
	<div class="relative mx-auto flex h-16 max-w-[1376px] items-center gap-3">
		<div class="flex items-center gap-1 sm:gap-5">
			<MobileNav />
			<a
				href="/"
				class="focus-visible:ring-ring flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-4"
				aria-label="{siteConfig.name} home"
			>
				<MizuLogo />
			</a>
			<nav aria-label="Main navigation" class="hidden items-center gap-1 lg:flex">
				{#each navLinks as link (link.href)}
					<a
						href={link.href}
						aria-current={current(link.href) ? 'page' : undefined}
						class="text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground hover:bg-secondary/70 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-(--duration-fast)"
					>
						{link.label}
					</a>
				{/each}
			</nav>
		</div>

		<button
			type="button"
			onclick={() => (search.open = true)}
			aria-label="Search documentation"
			class="bg-secondary text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute left-1/2 hidden h-10 w-[min(22rem,32vw)] -translate-x-1/2 items-center gap-2.5 rounded-full px-4 text-sm transition-[color,box-shadow] duration-(--duration-fast) outline-none focus-visible:ring-2 xl:flex"
		>
			<SearchIcon class="size-4 shrink-0" />
			<span class="flex-1 text-left">Search components</span>
			<Kbd>⌘K</Kbd>
		</button>

		<div class="ml-auto flex items-center gap-1">
			<Button
				variant="ghost"
				size="icon"
				class="xl:hidden"
				aria-label="Search documentation"
				onclick={() => (search.open = true)}
			>
				<SearchIcon class="size-5" />
			</Button>
			<Button
				href={siteConfig.repo}
				target="_blank"
				rel="noreferrer"
				variant="ghost"
				size="icon"
				aria-label="GitHub"
			>
				<svg viewBox="0 0 24 24" fill="currentColor" class="size-5" aria-hidden="true">
					<path
						d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 4.5 18 4.8 18 4.8c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"
					/>
				</svg>
			</Button>
			<ModeToggle />
			<Button href="/docs/installation" size="sm" class="ml-1 hidden sm:inline-flex"
				>Get started</Button
			>
		</div>
	</div>
</header>

<CommandPalette />
