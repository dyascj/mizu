<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Command from '$lib/components/ui/command';
	import { componentsByCategory } from './catalog';
	import { gettingStartedRoutes } from './routes';
	import { search } from './search.svelte';

	const groups = componentsByCategory();

	function go(href: string) {
		search.open = false;
		void goto(href);
	}
</script>

<Command.Dialog bind:open={search.open} shortcut="k">
	<Command.Input placeholder="Search components and docs" />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		<Command.Group heading="Getting started">
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
