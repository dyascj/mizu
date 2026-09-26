<script lang="ts">
	import * as NavigationMenu from './index.js';
</script>

<NavigationMenu.Root>
	<NavigationMenu.List>
		<NavigationMenu.Item value="product">
			<NavigationMenu.Trigger>Product</NavigationMenu.Trigger>
			<NavigationMenu.Content>
				<NavigationMenu.Link href="#agents">Agents</NavigationMenu.Link>
			</NavigationMenu.Content>
		</NavigationMenu.Item>
		<NavigationMenu.Item value="developers">
			<NavigationMenu.Trigger>Developers</NavigationMenu.Trigger>
			<NavigationMenu.Content class="p-4">
				<NavigationMenu.Link href="#api">API reference</NavigationMenu.Link>
			</NavigationMenu.Content>
		</NavigationMenu.Item>
	</NavigationMenu.List>
</NavigationMenu.Root>
