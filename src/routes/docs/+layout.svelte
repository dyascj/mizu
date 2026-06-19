<script lang="ts">
	import { page } from '$app/state';
	import { componentsByCategory } from '$lib/site/catalog';
	import { cn } from '$lib/utils.js';

	let { children } = $props();

	const gettingStarted = [
		{ href: '/docs', label: 'Introduction' },
		{ href: '/docs/installation', label: 'Installation' },
		{ href: '/docs/theming', label: 'Theming' }
	];
	const groups = componentsByCategory();

	function isActive(href: string) {
		return page.url.pathname === href;
	}
</script>

<div class="mx-auto flex w-full max-w-6xl gap-10 px-5 py-10 sm:px-6">
	<aside class="hidden w-56 shrink-0 lg:block">
		<nav class="sticky top-24 flex max-h-[calc(100dvh-7rem)] flex-col gap-6 overflow-y-auto pb-10">
			<div class="flex flex-col gap-1">
				<p class="px-3 pb-1 text-xs font-bold tracking-wide text-muted-foreground uppercase">
					Getting Started
				</p>
				{#each gettingStarted as link}
					<a
						href={link.href}
						class={cn(
							'rounded-lg px-3 py-1.5 text-sm transition-colors',
							isActive(link.href)
								? 'bg-accent font-semibold text-accent-foreground'
								: 'text-muted-foreground hover:bg-secondary hover:text-foreground'
						)}
					>
						{link.label}
					</a>
				{/each}
			</div>

			{#each groups as group}
				<div class="flex flex-col gap-1">
					<p class="px-3 pb-1 text-xs font-bold tracking-wide text-muted-foreground uppercase">
						{group.category}
					</p>
					{#each group.items as item}
						{@const href = `/docs/components/${item.slug}`}
						<a
							{href}
							class={cn(
								'rounded-lg px-3 py-1.5 text-sm transition-colors',
								isActive(href)
									? 'bg-accent font-semibold text-accent-foreground'
									: 'text-muted-foreground hover:bg-secondary hover:text-foreground'
							)}
						>
							{item.name}
						</a>
					{/each}
				</div>
			{/each}
		</nav>
	</aside>

	<main class="min-w-0 flex-1 pb-16">
		{@render children()}
	</main>
</div>
