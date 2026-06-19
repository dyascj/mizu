<script lang="ts">
	import * as NavigationMenu from '$lib/components/ui/navigation-menu';
</script>

<NavigationMenu.Root>
	<NavigationMenu.List>
		<NavigationMenu.Item>
			<NavigationMenu.Trigger>Sources</NavigationMenu.Trigger>
			<NavigationMenu.Content>
				<ul class="grid w-64 gap-1">
					<li>
						<NavigationMenu.Link href="##">
							<div class="font-medium">Springs</div>
							<p class="text-muted-foreground">Naturally filtered through stone.</p>
						</NavigationMenu.Link>
					</li>
					<li>
						<NavigationMenu.Link href="##">
							<div class="font-medium">Glaciers</div>
							<p class="text-muted-foreground">Ancient ice, slowly melting clear.</p>
						</NavigationMenu.Link>
					</li>
				</ul>
			</NavigationMenu.Content>
		</NavigationMenu.Item>
		<NavigationMenu.Item>
			<NavigationMenu.Trigger>Care</NavigationMenu.Trigger>
			<NavigationMenu.Content>
				<ul class="grid w-64 gap-1">
					<li>
						<NavigationMenu.Link href="##">
							<div class="font-medium">Filtration</div>
							<p class="text-muted-foreground">Keep every drop crystal clear.</p>
						</NavigationMenu.Link>
					</li>
					<li>
						<NavigationMenu.Link href="##">
							<div class="font-medium">Storage</div>
							<p class="text-muted-foreground">Cool, dark, and still.</p>
						</NavigationMenu.Link>
					</li>
				</ul>
			</NavigationMenu.Content>
		</NavigationMenu.Item>
	</NavigationMenu.List>
</NavigationMenu.Root>
