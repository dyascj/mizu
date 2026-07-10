<script lang="ts">
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
		{ href: '/docs/theming', label: 'Themes' }
	];
</script>

<header class="sticky top-3 z-40 px-3 sm:px-5">
	<div
		class="glass mx-auto flex h-14 max-w-6xl items-center gap-4 rounded-full px-4 shadow-md sm:px-5"
	>
		<!-- Left: mobile menu + logo + nav -->
		<div class="flex items-center gap-2 sm:gap-6">
			<MobileNav />
			<a href="/" class="flex items-center" aria-label="{siteConfig.name} home">
				<MizuLogo />
			</a>
			<nav class="hidden items-center gap-5 md:flex">
				{#each navLinks as l (l.href)}
					<a
						href={l.href}
						class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
					>
						{l.label}
					</a>
				{/each}
			</nav>
		</div>

		<!-- Right: search + theme + repo -->
		<div class="ml-auto flex items-center gap-1.5">
			<button
				onclick={() => (search.open = true)}
				aria-label="Search"
				class="inline-flex items-center gap-2 rounded-full bg-secondary px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:w-48 sm:px-3.5"
			>
				<SearchIcon class="size-4 shrink-0" />
				<span class="hidden flex-1 text-left sm:inline">Search</span>
				<Kbd class="hidden sm:inline-flex">⌘K</Kbd>
			</button>
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
		</div>
	</div>
</header>

<CommandPalette />
