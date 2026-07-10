<script lang="ts">
	import List from 'phosphor-svelte/lib/List';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import * as Sheet from '$lib/components/ui/sheet';
	import { buttonVariants } from '$lib/components/ui/button';
	import { componentsByCategory } from './catalog';
	import MizuLogo from './mizu-logo.svelte';
	import { cn } from '$lib/utils.js';

	let open = $state(false);

	// Close the drawer whenever a navigation finishes (i.e. a link was tapped).
	afterNavigate(() => (open = false));

	const main = [
		{ href: '/docs', label: 'Introduction' },
		{ href: '/docs/installation', label: 'Installation' },
		{ href: '/docs/theming', label: 'Theming' },
		{ href: '/docs/components', label: 'Components' }
	];
	const groups = componentsByCategory();

	const active = (href: string) => page.url.pathname === href;
	const linkClass = (isActive: boolean) =>
		cn(
			'rounded-lg px-3 py-2 text-sm transition-colors',
			isActive
				? 'bg-accent font-semibold text-accent-foreground'
				: 'text-muted-foreground hover:bg-secondary hover:text-foreground'
		);
</script>

<Sheet.Root {open} onOpenChange={(v) => (open = v)}>
	<Sheet.Trigger
		class={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'lg:hidden')}
		aria-label="Open navigation menu"
	>
		<List class="size-5" />
	</Sheet.Trigger>
	<Sheet.Content side="left" class="flex w-[19rem] max-w-[85vw] flex-col gap-0 overflow-y-auto">
		<Sheet.Header class="pb-2">
			<Sheet.Title class="flex items-center gap-2">
				<MizuLogo class="h-6 w-auto" /> Mizu
			</Sheet.Title>
		</Sheet.Header>

		<nav class="flex flex-col gap-6 py-2">
			<div class="flex flex-col gap-0.5">
				{#each main as l (l.href)}
					<a href={l.href} class={linkClass(active(l.href))}>{l.label}</a>
				{/each}
			</div>

			{#each groups as group (group.category)}
				<div class="flex flex-col gap-0.5">
					<p class="px-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						{group.category}
					</p>
					{#each group.items as item (item.slug)}
						{@const href = `/docs/components/${item.slug}`}
						<a {href} class={linkClass(active(href))}>{item.name}</a>
					{/each}
				</div>
			{/each}
		</nav>
	</Sheet.Content>
</Sheet.Root>
