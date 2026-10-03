<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Check from '@lucide/svelte/icons/check';

	type Presence = Avatar.AvatarPresence;

	const presences: { value: Presence; label: string; hint?: string }[] = [
		{ value: 'online', label: 'Online' },
		{ value: 'away', label: 'Away' },
		{ value: 'busy', label: 'Busy', hint: 'Mutes agent notifications' },
		{ value: 'offline', label: 'Offline', hint: 'Appear offline' }
	];

	let status = $state<Presence>('online');
	const current = $derived(presences.find((presence) => presence.value === status)!);
</script>

<div class="flex flex-col items-center gap-8">
	<div class="flex items-center gap-3">
		<Avatar.Root>
			<Avatar.Image src="https://i.pravatar.cc/80?img=12" alt="River" />
			<Avatar.Fallback>RV</Avatar.Fallback>
		</Avatar.Root>
		<Avatar.Root status="away">
			<Avatar.Fallback>CL</Avatar.Fallback>
		</Avatar.Root>
		<Avatar.Root status="offline" class="size-8">
			<Avatar.Fallback class="text-xs">MZ</Avatar.Fallback>
		</Avatar.Root>
	</div>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			aria-label="Maya Ruiz, {current.label}. Change status"
			class="hover:bg-secondary data-[state=open]:bg-secondary focus-visible:ring-ring focus-visible:ring-offset-background flex items-center gap-3 rounded-2xl py-2 ps-2 pe-4 text-start transition-[background-color,scale] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]"
		>
			<Avatar.Root {status}>
				<Avatar.Fallback>MR</Avatar.Fallback>
			</Avatar.Root>
			<span class="min-w-0">
				<span class="block text-sm font-medium">Maya Ruiz</span>
				<span class="text-muted-foreground block text-sm">{current.label}</span>
			</span>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start" class="w-60">
			<DropdownMenu.RadioGroup bind:value={status} aria-label="Set status">
				{#each presences as presence (presence.value)}
					<DropdownMenu.RadioItem
						value={presence.value}
						class="gap-3 py-2 ps-3 [&>span:first-child]:hidden"
					>
						<Avatar.Status status={presence.value} class="size-4" />
						<span class="min-w-0 flex-1">
							<span class="block">{presence.label}</span>
							{#if presence.hint}
								<span class="text-muted-foreground block text-xs">{presence.hint}</span>
							{/if}
						</span>
						{#if presence.value === status}
							<Check class="size-4 shrink-0" aria-hidden="true" />
						{/if}
					</DropdownMenu.RadioItem>
				{/each}
			</DropdownMenu.RadioGroup>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
