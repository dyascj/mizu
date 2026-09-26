<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import Link from '@lucide/svelte/icons/link';
	import UserPlus from '@lucide/svelte/icons/user-plus';

	let linkOn = $state(true);
	const people = [
		{ initials: 'AC', name: 'Ava Chen', role: 'Can edit' },
		{ initials: 'BO', name: 'Ben Ortiz', role: 'Can view' }
	];
</script>

<Drawer.Root>
	<Drawer.Trigger>
		{#snippet child({ props })}
			<Button variant="secondary" {...props}>Share chat</Button>
		{/snippet}
	</Drawer.Trigger>
	<Drawer.Content>
		<div class="mx-auto flex w-full max-w-sm flex-col gap-5 px-4 pb-8">
			<Drawer.Header class="px-0">
				<Drawer.Title>Share “Kyoto trip itinerary”</Drawer.Title>
				<Drawer.Description>
					Drag down to close. A quick flick works too, and pulling up pushes back.
				</Drawer.Description>
			</Drawer.Header>
			<div class="bg-secondary flex items-center gap-3 rounded-2xl py-3 pr-3 pl-4">
				<Link class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
				<Label for="share-link" class="min-w-0 flex-1 text-sm font-medium">
					Anyone with the link can read
				</Label>
				<Switch id="share-link" bind:checked={linkOn} />
			</div>
			<Drawer.NestedRoot>
				<Drawer.Trigger>
					{#snippet child({ props })}
						<Button {...props}><UserPlus class="size-4" aria-hidden="true" />Invite people</Button>
					{/snippet}
				</Drawer.Trigger>
				<Drawer.Content>
					<div class="mx-auto flex w-full max-w-sm flex-col gap-5 px-4 pb-8">
						<Drawer.Header class="px-0">
							<Drawer.Title>Invite people</Drawer.Title>
							<Drawer.Description>They can pick up the chat and keep asking.</Drawer.Description>
						</Drawer.Header>
						<ul class="flex flex-col gap-1">
							{#each people as person (person.name)}
								<li class="flex items-center gap-3 py-1.5">
									<span
										aria-hidden="true"
										class="bg-secondary text-muted-foreground grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold"
									>
										{person.initials}
									</span>
									<span class="min-w-0 flex-1 truncate text-sm font-medium">{person.name}</span>
									<span class="text-muted-foreground text-sm">{person.role}</span>
								</li>
							{/each}
						</ul>
						<Drawer.Close>
							{#snippet child({ props })}
								<Button variant="secondary" {...props}>Done</Button>
							{/snippet}
						</Drawer.Close>
					</div>
				</Drawer.Content>
			</Drawer.NestedRoot>
			<Drawer.Close>
				{#snippet child({ props })}
					<Button variant="ghost" {...props}>Not now</Button>
				{/snippet}
			</Drawer.Close>
		</div>
	</Drawer.Content>
</Drawer.Root>
