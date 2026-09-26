<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { AuraTile } from '$lib/components/ui/aura-tile';
	import HouseIcon from '@lucide/svelte/icons/house';
	import BotIcon from '@lucide/svelte/icons/bot';
	import LibraryIcon from '@lucide/svelte/icons/library';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let active = $state('home');

	const pages: Record<string, { title: string; stat: [string, string]; focus: [string, string] }> =
		{
			home: { title: 'Home', stat: ['Tasks done', '84%'], focus: ['Focus', '72'] },
			era: { title: 'Era, trip plan', stat: ['Steps run', '18'], focus: ['Tools used', '5'] },
			fjord: { title: 'Fjord, blog draft', stat: ['Drafts', '3'], focus: ['Words', '1.2k'] },
			super: { title: 'Super, inbox watch', stat: ['Emails read', '146'], focus: ['Flagged', '4'] },
			library: { title: 'Library', stat: ['Documents', '12'], focus: ['Indexed', '100%'] },
			settings: { title: 'Settings', stat: ['Members', '6'], focus: ['Plan', 'Team'] }
		};
	const page = $derived(pages[active]);
</script>

<Tooltip.Provider>
	<div
		class="bg-background h-96 w-full [transform:translateZ(0)] overflow-hidden rounded-2xl shadow-md"
	>
		<Sidebar.Provider class="h-full min-h-0">
			<Sidebar.Root collapsible="icon" class="h-full">
				<Sidebar.Header>
					<div class="flex items-center gap-2 overflow-hidden px-1 py-0.5">
						<AuraTile seed="Mizu" class="size-7 shrink-0 rounded-full" />
						<span
							class="text-sm font-semibold tracking-tight whitespace-nowrap transition-[opacity,filter] delay-(--duration-instant) duration-(--duration-base) ease-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:blur-[4px] group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-(--duration-instant) group-data-[collapsible=icon]:ease-in motion-reduce:blur-none"
						>
							Mizu
						</span>
					</div>
				</Sidebar.Header>

				<Sidebar.Content>
					<Sidebar.Group>
						<Sidebar.GroupLabel>Workspace</Sidebar.GroupLabel>
						<Sidebar.GroupContent>
							<Sidebar.Menu>
								<Sidebar.MenuItem>
									<Sidebar.MenuButton
										isActive={active === 'home'}
										onclick={() => (active = 'home')}
										tooltipContent="Home"
									>
										<HouseIcon />
										<span>Home</span>
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>

								<Sidebar.MenuItem>
									<Collapsible.Root open class="group/collapsible">
										<Collapsible.Trigger>
											{#snippet child({ props })}
												<Sidebar.MenuButton {...props} tooltipContent="Agents">
													<BotIcon />
													<span>Agents</span>
													<ChevronRightIcon
														class="ms-auto transition-[rotate] duration-(--duration-base) ease-out group-data-[state=open]/collapsible:rotate-90"
													/>
												</Sidebar.MenuButton>
											{/snippet}
										</Collapsible.Trigger>
										<!-- The rail has no room for sub-items: they fold away with the rail and
										     return when it opens. -->
										<div
											class="grid grid-rows-[1fr] transition-[grid-template-rows] duration-(--duration-spring-snappy) ease-(--ease-spring-snappy) group-data-[collapsible=icon]:grid-rows-[0fr] motion-reduce:transition-none"
										>
											<div class="min-h-0 overflow-hidden">
												<Collapsible.Content>
													<Sidebar.MenuSub>
														<Sidebar.MenuSubItem>
															<Sidebar.MenuSubButton
																isActive={active === 'era'}
																onclick={() => (active = 'era')}
															>
																<span>Era, trip plan</span>
															</Sidebar.MenuSubButton>
														</Sidebar.MenuSubItem>
														<Sidebar.MenuSubItem>
															<Sidebar.MenuSubButton
																isActive={active === 'fjord'}
																onclick={() => (active = 'fjord')}
															>
																<span>Fjord, blog draft</span>
															</Sidebar.MenuSubButton>
														</Sidebar.MenuSubItem>
														<Sidebar.MenuSubItem>
															<Sidebar.MenuSubButton
																isActive={active === 'super'}
																onclick={() => (active = 'super')}
															>
																<span>Super, inbox watch</span>
															</Sidebar.MenuSubButton>
														</Sidebar.MenuSubItem>
													</Sidebar.MenuSub>
												</Collapsible.Content>
											</div>
										</div>
									</Collapsible.Root>
								</Sidebar.MenuItem>

								<Sidebar.MenuItem>
									<Sidebar.MenuButton
										isActive={active === 'library'}
										onclick={() => (active = 'library')}
										tooltipContent="Library"
									>
										<LibraryIcon />
										<span>Library</span>
									</Sidebar.MenuButton>
									<Sidebar.MenuBadge>12</Sidebar.MenuBadge>
								</Sidebar.MenuItem>

								<Sidebar.MenuItem>
									<Sidebar.MenuButton
										isActive={active === 'settings'}
										onclick={() => (active = 'settings')}
										tooltipContent="Settings"
									>
										<SettingsIcon />
										<span>Settings</span>
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							</Sidebar.Menu>
						</Sidebar.GroupContent>
					</Sidebar.Group>
				</Sidebar.Content>

				<Sidebar.Footer>
					<div class="flex items-center gap-2 overflow-hidden px-1 py-0.5">
						<span
							class="bg-secondary text-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
						>
							A
						</span>
						<div
							class="min-w-0 transition-[opacity,filter] delay-(--duration-instant) duration-(--duration-base) ease-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:blur-[4px] group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-(--duration-instant) group-data-[collapsible=icon]:ease-in motion-reduce:blur-none"
						>
							<p class="text-foreground truncate text-xs font-medium">Ada Rivers</p>
							<p class="text-muted-foreground truncate text-[0.6875rem]">ada@mizu.dev</p>
						</div>
					</div>
				</Sidebar.Footer>

				<Sidebar.Rail />
			</Sidebar.Root>

			<Sidebar.Inset class="min-h-0">
				<header class="flex h-12 shrink-0 items-center gap-2 px-4">
					<Sidebar.Trigger />
					<h2 class="truncate text-sm font-semibold tracking-tight">{page.title}</h2>
				</header>
				<div class="flex-1 overflow-auto px-4 pb-4">
					<div class="grid grid-cols-2 gap-3">
						<div class="bg-secondary/60 rounded-xl p-3">
							<p class="text-muted-foreground text-xs">{page.stat[0]}</p>
							<p class="mt-1 text-2xl font-semibold tabular-nums">{page.stat[1]}</p>
						</div>
						<div class="bg-secondary/60 rounded-xl p-3">
							<p class="text-muted-foreground text-xs">{page.focus[0]}</p>
							<p class="mt-1 text-2xl font-semibold tabular-nums">{page.focus[1]}</p>
						</div>
					</div>
					<div class="mt-3 space-y-2">
						<div class="bg-muted h-3 w-3/4 rounded-full"></div>
						<div class="bg-muted h-3 w-1/2 rounded-full"></div>
					</div>
				</div>
			</Sidebar.Inset>
		</Sidebar.Provider>
	</div>
</Tooltip.Provider>
