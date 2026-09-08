<script lang="ts">
	import * as Menubar from '$lib/components/ui/menubar';

	let ripples = $state(true);
	let theme = $state('aqua');
</script>

<Menubar.Root>
	<Menubar.Menu>
		<Menubar.Trigger>File</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.Item>
				New file
				<Menubar.Shortcut>⌘N</Menubar.Shortcut>
			</Menubar.Item>
			<Menubar.Item>
				Open project
				<Menubar.Shortcut>⌘O</Menubar.Shortcut>
			</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Sub>
				<Menubar.SubTrigger>Export as</Menubar.SubTrigger>
				<Menubar.SubContent>
					<Menubar.Item>Image</Menubar.Item>
					<Menubar.Item>Video</Menubar.Item>
				</Menubar.SubContent>
			</Menubar.Sub>
		</Menubar.Content>
	</Menubar.Menu>
	<Menubar.Menu>
		<Menubar.Trigger>View</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.CheckboxItem bind:checked={ripples}>Show previews</Menubar.CheckboxItem>
			<Menubar.Separator />
			<Menubar.Label>Appearance</Menubar.Label>
			<Menubar.RadioGroup bind:value={theme}>
				<Menubar.RadioItem value="aqua">Light</Menubar.RadioItem>
				<Menubar.RadioItem value="frost">Dark</Menubar.RadioItem>
			</Menubar.RadioGroup>
		</Menubar.Content>
	</Menubar.Menu>
</Menubar.Root>
