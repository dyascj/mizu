<script lang="ts">
	import * as Menubar from './index.js';
</script>

<Menubar.Root>
	<Menubar.Menu>
		<Menubar.Trigger>File</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.Item>New file</Menubar.Item>
			<Menubar.Sub>
				<Menubar.SubTrigger>Export as</Menubar.SubTrigger>
				<Menubar.SubContent>
					<Menubar.Item>Image</Menubar.Item>
				</Menubar.SubContent>
			</Menubar.Sub>
		</Menubar.Content>
	</Menubar.Menu>
</Menubar.Root>
