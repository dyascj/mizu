<script lang="ts">
	import * as NavigationMenu from '$lib/components/ui/navigation-menu';
</script>

<NavigationMenu.Root>
	<NavigationMenu.List>
		<NavigationMenu.Item>
			<NavigationMenu.Trigger>Components</NavigationMenu.Trigger>
			<NavigationMenu.Content>
				<ul class="grid w-64 max-w-full gap-1">
					<li>
						<NavigationMenu.Link href="/docs/components/chat-input">
							<div class="font-medium">Chat components</div>
							<p class="text-muted-foreground">Build conversations with streaming and citations.</p>
						</NavigationMenu.Link>
					</li>
					<li>
						<NavigationMenu.Link href="/docs/components/input">
							<div class="font-medium">Form controls</div>
							<p class="text-muted-foreground">Inputs, selection, and validation.</p>
						</NavigationMenu.Link>
					</li>
				</ul>
			</NavigationMenu.Content>
		</NavigationMenu.Item>
		<NavigationMenu.Item>
			<NavigationMenu.Trigger>Guides</NavigationMenu.Trigger>
			<NavigationMenu.Content>
				<ul class="grid w-64 max-w-full gap-1">
					<li>
						<NavigationMenu.Link href="/docs/installation">
							<div class="font-medium">Installation</div>
							<p class="text-muted-foreground">Add your first component.</p>
						</NavigationMenu.Link>
					</li>
					<li>
						<NavigationMenu.Link href="/docs/theming">
							<div class="font-medium">Theming</div>
							<p class="text-muted-foreground">Set colors, type, and motion.</p>
						</NavigationMenu.Link>
					</li>
				</ul>
			</NavigationMenu.Content>
		</NavigationMenu.Item>
	</NavigationMenu.List>
</NavigationMenu.Root>
