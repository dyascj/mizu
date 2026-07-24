<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Command from '$lib/components/ui/command';
	import { componentsByCategory } from './catalog';
	import { gettingStartedRoutes } from './routes';
	import { search } from './search.svelte';

	const groups = componentsByCategory();

	function onWindowKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			search.open = !search.open;
		}
	}

	function go(href: string) {
		search.open = false;
		void goto(href);
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<Command.Dialog bind:open={search.open}>
	<Command.Input placeholder="Search components and docs" />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		<Command.Group heading="Getting Started">
			{#each gettingStartedRoutes as route (route.path)}
				<Command.Item value={route.title} onSelect={() => go(route.path)}>
					{route.title}
				</Command.Item>
			{/each}
		</Command.Group>
		{#each groups as group (group.category)}
			<Command.Group heading={group.category}>
				{#each group.items as c (c.slug)}
					<Command.Item value={c.name} onSelect={() => go(`/docs/components/${c.slug}`)}>
						{c.name}
					</Command.Item>
				{/each}
			</Command.Group>
		{/each}
	</Command.List>
</Command.Dialog>
