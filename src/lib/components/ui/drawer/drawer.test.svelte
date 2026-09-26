<script lang="ts">
	import * as Drawer from './index.js';
</script>

<Drawer.Root>
	<Drawer.Trigger>Share chat</Drawer.Trigger>
	<Drawer.Content>
		<Drawer.Title>Share</Drawer.Title>
		<Drawer.Description>Anyone with the link can read.</Drawer.Description>
		<Drawer.NestedRoot>
			<Drawer.Trigger>Invite people</Drawer.Trigger>
			<Drawer.Content>
				<Drawer.Title>Invite people</Drawer.Title>
				<Drawer.Description>They can keep asking.</Drawer.Description>
			</Drawer.Content>
		</Drawer.NestedRoot>
	</Drawer.Content>
</Drawer.Root>
