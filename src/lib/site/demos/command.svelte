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
		<Command.Input placeholder="Search projects..." />
		<Command.List>
			<Command.Empty>No results found.</Command.Empty>
			<Command.Group heading="Sources">
				<Command.Item>
					<Droplets class="text-muted-foreground size-4" />
					<span>Design system</span>
					<Command.Shortcut>⌘S</Command.Shortcut>
				</Command.Item>
				<Command.Item>
					<Waves class="text-muted-foreground size-4" />
					<span>Product launch</span>
					<Command.Shortcut>⌘O</Command.Shortcut>
				</Command.Item>
				<Command.Item>
					<CloudRain class="text-muted-foreground size-4" />
					<span>Research</span>
					<Command.Shortcut>⌘R</Command.Shortcut>
				</Command.Item>
			</Command.Group>
			<Command.Separator />
			<Command.Group heading="Actions">
				<Command.Item>
					<Search class="text-muted-foreground size-4" />
					<span>Find a project</span>
					<Command.Shortcut>⌘F</Command.Shortcut>
				</Command.Item>
				<Command.Item>
					<Settings class="text-muted-foreground size-4" />
					<span>Project settings</span>
					<Command.Shortcut>⌘,</Command.Shortcut>
				</Command.Item>
			</Command.Group>
		</Command.List>
	</Command.Root>
</div>
