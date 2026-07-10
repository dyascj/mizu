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
</script>

<Tooltip.Provider>
	<div
		class="h-96 w-full overflow-hidden rounded-2xl bg-background shadow-md [transform:translateZ(0)]"
	>
		<Sidebar.Provider class="h-full min-h-0">
			<Sidebar.Root collapsible="icon" class="h-full">
				<Sidebar.Header>
					<div class="flex items-center gap-2 px-1 py-0.5">
						<AuraTile seed="Mizu" class="size-7 shrink-0 rounded-full" />
						<span class="text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
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
									<Sidebar.MenuButton isActive tooltipContent="Home">
										<HouseIcon />
										<span>Home</span>
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>

								<Collapsible.Root open class="group/collapsible">
									<Sidebar.MenuItem>
										<Collapsible.Trigger>
											{#snippet child({ props })}
												<Sidebar.MenuButton {...props} tooltipContent="Agents">
													<BotIcon />
													<span>Agents</span>
													<ChevronRightIcon
														class="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
													/>
												</Sidebar.MenuButton>
											{/snippet}
										</Collapsible.Trigger>
										<Collapsible.Content>
											<Sidebar.MenuSub>
												<Sidebar.MenuSubItem>
													<Sidebar.MenuSubButton isActive>
														<span>Era, trip plan</span>
													</Sidebar.MenuSubButton>
												</Sidebar.MenuSubItem>
												<Sidebar.MenuSubItem>
													<Sidebar.MenuSubButton>
														<span>Fjord, blog draft</span>
													</Sidebar.MenuSubButton>
												</Sidebar.MenuSubItem>
												<Sidebar.MenuSubItem>
													<Sidebar.MenuSubButton>
														<span>Super, inbox watch</span>
													</Sidebar.MenuSubButton>
												</Sidebar.MenuSubItem>
											</Sidebar.MenuSub>
										</Collapsible.Content>
									</Sidebar.MenuItem>
								</Collapsible.Root>

								<Sidebar.MenuItem>
									<Sidebar.MenuButton tooltipContent="Library">
										<LibraryIcon />
										<span>Library</span>
									</Sidebar.MenuButton>
									<Sidebar.MenuBadge>12</Sidebar.MenuBadge>
								</Sidebar.MenuItem>

								<Sidebar.MenuItem>
									<Sidebar.MenuButton tooltipContent="Settings">
										<SettingsIcon />
										<span>Settings</span>
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							</Sidebar.Menu>
						</Sidebar.GroupContent>
					</Sidebar.Group>
				</Sidebar.Content>

				<Sidebar.Footer>
					<div class="flex items-center gap-2 px-1 py-0.5">
						<span
							class="flex size-7 shrink-0 items-center justify-center rounded-full bg-mizu-100 text-xs font-semibold text-mizu-700"
						>
							A
						</span>
						<div class="min-w-0 group-data-[collapsible=icon]:hidden">
							<p class="truncate text-xs font-medium text-foreground">Ada Rivers</p>
							<p class="truncate text-[0.6875rem] text-muted-foreground">ada@mizu.dev</p>
						</div>
					</div>
				</Sidebar.Footer>

				<Sidebar.Rail />
			</Sidebar.Root>

			<Sidebar.Inset class="min-h-0">
				<header class="flex h-12 shrink-0 items-center gap-2 px-4">
					<Sidebar.Trigger />
					<h2 class="text-sm font-semibold tracking-tight">Home</h2>
				</header>
				<div class="flex-1 overflow-auto px-4 pb-4">
					<div class="grid grid-cols-2 gap-3">
						<div class="rounded-xl bg-secondary/60 p-3">
							<p class="text-xs text-muted-foreground">Tasks done</p>
							<p class="mt-1 text-2xl font-semibold tabular-nums">84%</p>
						</div>
						<div class="rounded-xl bg-secondary/60 p-3">
							<p class="text-xs text-muted-foreground">Focus</p>
							<p class="mt-1 text-2xl font-semibold tabular-nums">72</p>
						</div>
					</div>
					<div class="mt-3 space-y-2">
						<div class="h-3 w-3/4 rounded-full bg-muted"></div>
						<div class="h-3 w-1/2 rounded-full bg-muted"></div>
					</div>
				</div>
			</Sidebar.Inset>
		</Sidebar.Provider>
	</div>
</Tooltip.Provider>
