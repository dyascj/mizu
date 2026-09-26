<script lang="ts">
	import * as Sidebar from './index.js';

	let { active = 'home' }: { active?: string } = $props();
	const items = [
		{ id: 'home', label: 'Home' },
		{ id: 'agents', label: 'Agents' },
		{ id: 'runs', label: 'Runs' }
	];
</script>

<Sidebar.Provider>
	<Sidebar.Root collapsible="icon">
		<Sidebar.Content>
			<Sidebar.Group>
				<Sidebar.GroupLabel>Workspace</Sidebar.GroupLabel>
				<Sidebar.Menu>
					{#each items as item (item.id)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton isActive={active === item.id} onclick={() => (active = item.id)}>
								<span>{item.label}</span>
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.Group>
		</Sidebar.Content>
	</Sidebar.Root>
	<Sidebar.Inset>
		<Sidebar.Trigger />
	</Sidebar.Inset>
</Sidebar.Provider>
