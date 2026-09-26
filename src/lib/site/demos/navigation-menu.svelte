<script lang="ts">
	import * as NavigationMenu from '$lib/components/ui/navigation-menu';

	const sections = [
		{
			label: 'Product',
			wide: true,
			links: [
				{
					title: 'Assistant',
					description: 'Chat, write, and plan with one model',
					href: '#assistant'
				},
				{ title: 'Agents', description: 'Hand off tasks that run on their own', href: '#agents' },
				{ title: 'Voice', description: 'Talk it through, hands free', href: '#voice' },
				{ title: 'Memory', description: 'Context that carries between chats', href: '#memory' }
			]
		},
		{
			label: 'Developers',
			wide: false,
			links: [
				{ title: 'API reference', description: 'Every endpoint and parameter', href: '#api' },
				{ title: 'Prompt library', description: 'Starters you can fork', href: '#prompts' },
				{ title: 'Usage and limits', description: 'Tokens, rates, and billing', href: '#usage' }
			]
		},
		{
			label: 'Company',
			wide: false,
			links: [
				{ title: 'Research', description: 'Papers and model cards', href: '#research' },
				{ title: 'Changelog', description: 'What shipped this week', href: '#changelog' }
			]
		}
	];
</script>

<!-- The panel floats over this reserved space, so opening, morphing, and
     closing never change the preview's height. -->
<div class="flex h-96 w-full items-start justify-center sm:h-80">
	<NavigationMenu.Root>
		<NavigationMenu.List class="gap-0.5">
			{#each sections as section (section.label)}
				<NavigationMenu.Item>
					<NavigationMenu.Trigger class="px-2.5 sm:px-3">{section.label}</NavigationMenu.Trigger>
					<NavigationMenu.Content>
						<ul
							class={[
								'grid gap-0.5',
								section.wide ? 'w-[min(28rem,calc(100vw-3rem))] sm:grid-cols-2' : 'w-64 max-w-full'
							]}
						>
							{#each section.links as link (link.title)}
								<li class="min-w-0">
									<NavigationMenu.Link href={link.href} onclick={(event) => event.preventDefault()}>
										<div class="font-medium">{link.title}</div>
										<p class="text-muted-foreground">{link.description}</p>
									</NavigationMenu.Link>
								</li>
							{/each}
						</ul>
					</NavigationMenu.Content>
				</NavigationMenu.Item>
			{/each}
		</NavigationMenu.List>
	</NavigationMenu.Root>
</div>
