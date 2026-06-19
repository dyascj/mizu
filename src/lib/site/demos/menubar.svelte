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
				New pool
				<Menubar.Shortcut>⌘N</Menubar.Shortcut>
			</Menubar.Item>
			<Menubar.Item>
				Open stream
				<Menubar.Shortcut>⌘O</Menubar.Shortcut>
			</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Sub>
				<Menubar.SubTrigger>Export as</Menubar.SubTrigger>
				<Menubar.SubContent>
					<Menubar.Item>Still water</Menubar.Item>
					<Menubar.Item>Time-lapse</Menubar.Item>
				</Menubar.SubContent>
			</Menubar.Sub>
		</Menubar.Content>
	</Menubar.Menu>
	<Menubar.Menu>
		<Menubar.Trigger>View</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.CheckboxItem bind:checked={ripples}>Show ripples</Menubar.CheckboxItem>
			<Menubar.Separator />
			<Menubar.Label>Theme</Menubar.Label>
			<Menubar.RadioGroup bind:value={theme}>
				<Menubar.RadioItem value="aqua">Aqua</Menubar.RadioItem>
				<Menubar.RadioItem value="frost">Frost</Menubar.RadioItem>
			</Menubar.RadioGroup>
		</Menubar.Content>
	</Menubar.Menu>
</Menubar.Root>
