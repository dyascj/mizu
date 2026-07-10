<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import Droplets from '@lucide/svelte/icons/droplets';
	import Waves from '@lucide/svelte/icons/waves';
	import CloudRain from '@lucide/svelte/icons/cloud-rain';
	import Settings from '@lucide/svelte/icons/settings';
	import Search from '@lucide/svelte/icons/search';
</script>

<div class="w-full max-w-md">
	<Command.Root class="bg-popover shadow-lg">
		<Command.Input placeholder="Search sources..." />
		<Command.List>
			<Command.Empty>No results found.</Command.Empty>
			<Command.Group heading="Sources">
				<Command.Item>
					<Droplets class="size-4 text-muted-foreground" />
					<span>Spring water</span>
					<Command.Shortcut>⌘S</Command.Shortcut>
				</Command.Item>
				<Command.Item>
					<Waves class="size-4 text-muted-foreground" />
					<span>Ocean</span>
					<Command.Shortcut>⌘O</Command.Shortcut>
				</Command.Item>
				<Command.Item>
					<CloudRain class="size-4 text-muted-foreground" />
					<span>Rainfall</span>
					<Command.Shortcut>⌘R</Command.Shortcut>
				</Command.Item>
			</Command.Group>
			<Command.Separator />
			<Command.Group heading="Actions">
				<Command.Item>
					<Search class="size-4 text-muted-foreground" />
					<span>Find a source</span>
					<Command.Shortcut>⌘F</Command.Shortcut>
				</Command.Item>
				<Command.Item>
					<Settings class="size-4 text-muted-foreground" />
					<span>Filter settings</span>
					<Command.Shortcut>⌘,</Command.Shortcut>
				</Command.Item>
			</Command.Group>
		</Command.List>
	</Command.Root>
</div>
