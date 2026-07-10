<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import HouseIcon from '@lucide/svelte/icons/house';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import WavesIcon from '@lucide/svelte/icons/waves';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import { AuraTile } from '$lib/components/ui/aura-tile';

	const items = [
		{ title: 'Overview', icon: HouseIcon, active: true },
		{ title: 'Reservoirs', icon: FolderIcon, active: false },
		{ title: 'Schedule', icon: CalendarIcon, active: false },
		{ title: 'Currents', icon: WavesIcon, active: false },
		{ title: 'Settings', icon: SettingsIcon, active: false }
	];
</script>

<Tooltip.Provider>
	<div class="h-80 w-full overflow-hidden rounded-2xl bg-background shadow-md">
		<Sidebar.Provider class="h-full">
			<Sidebar.Root>
				<Sidebar.Header>
					<div class="flex items-center gap-2 px-1.5 py-1">
						<AuraTile seed="Mizu" class="size-8 shrink-0 rounded-full" />
						<span
							class="text-base font-semibold leading-none tracking-tight text-foreground transition-[opacity] duration-200 group-data-[state=collapsed]/sidebar:pointer-events-none group-data-[state=collapsed]/sidebar:opacity-0"
						>
							Mizu
						</span>
					</div>
				</Sidebar.Header>

				<Sidebar.Content>
					<Sidebar.Group>
						<Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
						<Sidebar.Menu>
							{#each items as item (item.title)}
								<Sidebar.MenuItem>
									<Sidebar.MenuButton href="##" isActive={item.active} tooltip={item.title}>
										<item.icon />
										<span>{item.title}</span>
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							{/each}
						</Sidebar.Menu>
					</Sidebar.Group>
				</Sidebar.Content>

				<Sidebar.Footer>
					<div class="flex items-center gap-2 rounded-xl px-1.5 py-1">
						<span
							class="flex size-8 shrink-0 items-center justify-center rounded-full bg-mizu-100 text-sm font-semibold text-mizu-700"
						>
							A
						</span>
						<div
							class="min-w-0 transition-[opacity] duration-200 group-data-[state=collapsed]/sidebar:pointer-events-none group-data-[state=collapsed]/sidebar:opacity-0"
						>
							<p class="truncate text-sm font-medium text-foreground">Ada Rivers</p>
							<p class="truncate text-xs text-muted-foreground">ada@mizu.dev</p>
						</div>
					</div>
				</Sidebar.Footer>

				<Sidebar.Rail />
			</Sidebar.Root>

			<Sidebar.Inset>
				<header class="flex h-14 shrink-0 items-center gap-3 px-4">
					<Sidebar.Trigger />
					<h2 class="text-base font-semibold tracking-tight text-foreground">Overview</h2>
				</header>

				<div class="flex-1 overflow-auto p-4">
					<div class="grid grid-cols-2 gap-3">
						<div
							class="rounded-xl bg-secondary/60 p-3"
						>
							<p class="text-xs text-muted-foreground">Flow rate</p>
							<p class="mt-1 text-2xl font-semibold tabular-nums text-foreground">
								42 L/s
							</p>
						</div>
						<div
							class="rounded-xl bg-secondary/60 p-3"
						>
							<p class="text-xs text-muted-foreground">Clarity</p>
							<p class="mt-1 text-2xl font-semibold tabular-nums text-foreground">98%</p>
						</div>
					</div>
					<div class="mt-3 space-y-2">
						<div class="h-3 w-3/4 rounded-full bg-muted"></div>
						<div class="h-3 w-1/2 rounded-full bg-muted"></div>
						<div class="h-3 w-2/3 rounded-full bg-muted"></div>
					</div>
				</div>
			</Sidebar.Inset>
		</Sidebar.Provider>
	</div>
</Tooltip.Provider>
