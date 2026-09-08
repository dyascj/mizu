<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { AuraTile } from '$lib/components/ui/aura-tile';
	import { ChatInput } from '$lib/components/ui/chat-input';
	import { Thinking } from '$lib/components/ui/thinking';
	import HouseIcon from '@lucide/svelte/icons/house';
	import BotIcon from '@lucide/svelte/icons/bot';
	import LibraryIcon from '@lucide/svelte/icons/library';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import PlusIcon from '@lucide/svelte/icons/plus';

	let chats = $state(['Trip to Tokyo', 'Blog outline', 'Dinner ideas', 'Week planning']);
	let active = $state('Trip to Tokyo');
	let value = $state('');
	let submitted = $state('');
</script>

<Tooltip.Provider>
	<div
		class="bg-background h-[30rem] w-full [transform:translateZ(0)] overflow-hidden rounded-3xl shadow-md"
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
						<Sidebar.GroupContent>
							<Sidebar.Menu>
								<Sidebar.MenuItem>
									<Sidebar.MenuButton tooltipContent="Home" onclick={() => (active = 'Home')}>
										<HouseIcon />
										<span>Home</span>
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
								<Sidebar.MenuItem>
									<Sidebar.MenuButton tooltipContent="Agents" onclick={() => (active = 'Agents')}>
										<BotIcon />
										<span>Agents</span>
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
								<Sidebar.MenuItem>
									<Sidebar.MenuButton tooltipContent="Library" onclick={() => (active = 'Library')}>
										<LibraryIcon />
										<span>Library</span>
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							</Sidebar.Menu>
						</Sidebar.GroupContent>
					</Sidebar.Group>

					<Sidebar.Group>
						<Sidebar.GroupLabel>Chats</Sidebar.GroupLabel>
						<Sidebar.GroupAction
							title="New chat"
							onclick={() => {
								const title = `New chat ${chats.length + 1}`;
								chats = [...chats, title];
								active = title;
								submitted = '';
							}}
						>
							<PlusIcon />
						</Sidebar.GroupAction>
						<Sidebar.GroupContent>
							<Sidebar.Menu>
								{#each chats as chat (chat)}
									<Sidebar.MenuItem>
										<Sidebar.MenuButton
											isActive={active === chat}
											tooltipContent={chat}
											onclick={() => (active = chat)}
										>
											<span>{chat}</span>
										</Sidebar.MenuButton>
									</Sidebar.MenuItem>
								{/each}
							</Sidebar.Menu>
						</Sidebar.GroupContent>
					</Sidebar.Group>
				</Sidebar.Content>

				<Sidebar.Footer>
					<Sidebar.Menu>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton tooltipContent="Settings" onclick={() => (active = 'Settings')}>
								<SettingsIcon />
								<span>Settings</span>
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					</Sidebar.Menu>
				</Sidebar.Footer>

				<Sidebar.Rail />
			</Sidebar.Root>

			<Sidebar.Inset class="min-h-0">
				<header class="flex h-12 shrink-0 items-center gap-2 px-4">
					<Sidebar.Trigger />
					<h2 class="text-sm font-semibold tracking-tight">{active}</h2>
				</header>
				<div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-5">
					<div
						class="bg-primary text-primary-foreground ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm"
					>
						{submitted || 'Four nights in October. Keep it slow.'}
					</div>
					<div
						class="bg-secondary mr-auto w-fit max-w-[85%] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm leading-relaxed"
					>
						{submitted
							? 'Message received in this local preview.'
							: 'I suggest two neighborhoods and a free afternoon between activities.'}
					</div>
					<Thinking variant="dots" label="Typing" class="pl-3" />
					<ChatInput
						bind:value
						placeholder="Message Era..."
						onSubmit={(message) => (submitted = message)}
					/>
				</div>
			</Sidebar.Inset>
		</Sidebar.Provider>
	</div>
</Tooltip.Provider>
