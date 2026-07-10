<script lang="ts">
	import Menu from '@lucide/svelte/icons/menu';
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
		{ href: '/docs/build-a-chat', label: 'Build a chat' },
		{ href: '/docs/agents', label: 'UI for Agents' },
		{ href: '/docs/components', label: 'Components' },
		{ href: '/blocks', label: 'Blocks' }
	];
	const groups = componentsByCategory();

	const active = (href: string) => page.url.pathname === href;
	const linkClass = (isActive: boolean) =>
		cn(
			'rounded-md px-2 py-1.5 text-[0.8rem] leading-snug transition-colors',
			isActive
				? 'bg-primary-muted font-medium text-primary'
				: 'text-muted-foreground hover:text-foreground'
		);
</script>

<Sheet.Root {open} onOpenChange={(v) => (open = v)}>
	<Sheet.Trigger
		class={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'lg:hidden')}
		aria-label="Open navigation menu"
	>
		<Menu class="size-5" />
	</Sheet.Trigger>
	<Sheet.Content
		side="left"
		class="flex w-[19rem] max-w-[85vw] flex-col gap-0 overflow-y-auto [mask-image:linear-gradient(to_bottom,black_calc(100%-3rem),transparent_100%)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
	>
		<Sheet.Header class="pb-2">
			<Sheet.Title class="flex items-center">
				<MizuLogo />
			</Sheet.Title>
		</Sheet.Header>

		<nav class="flex flex-col gap-5 py-2 pb-10">
			<div class="flex flex-col gap-px">
				{#each main as l (l.href)}
					<a href={l.href} class={linkClass(active(l.href))}>{l.label}</a>
				{/each}
			</div>

			{#each groups as group (group.category)}
				<div class="flex flex-col gap-px">
					<p class="px-2 pb-1 text-xs font-medium text-muted-foreground/70">
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
