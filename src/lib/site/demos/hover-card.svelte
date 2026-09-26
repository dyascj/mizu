<script lang="ts">
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { FollowButton } from '$lib/components/ui/follow-button';

	type Person = {
		id: string;
		name: string;
		handle: string;
		initials: string;
		bio: string;
		prompts: number;
		followers: number;
	};

	const people: Record<string, Person> = {
		ava: {
			id: 'ava',
			name: 'Ava Chen',
			handle: '@ava',
			initials: 'AC',
			bio: 'Builds eval harnesses. Believes every prompt deserves a regression test.',
			prompts: 48,
			followers: 1284
		},
		ben: {
			id: 'ben',
			name: 'Ben Ortiz',
			handle: '@ben',
			initials: 'BO',
			bio: 'Tunes retrieval. Currently teaching the support agent to cite its sources.',
			prompts: 31,
			followers: 902
		},
		cara: {
			id: 'cara',
			name: 'Cara Nwosu',
			handle: '@cara',
			initials: 'CN',
			bio: 'Docs and developer experience. If it needs a paragraph, it needs a better API.',
			prompts: 67,
			followers: 2731
		}
	};

	let following = $state<Record<string, boolean>>({});
</script>

{#snippet mention(person: Person)}
	<HoverCard.GroupTrigger label="{person.name}, {person.handle}">
		{person.handle}
		{#snippet card()}
			<span class="flex items-start justify-between gap-3">
				<span
					aria-hidden="true"
					class="bg-secondary text-muted-foreground grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold"
				>
					{person.initials}
				</span>
				<FollowButton
					name={person.name}
					bind:following={
						() => following[person.id] ?? false, (value) => (following[person.id] = value)
					}
				/>
			</span>
			<span class="mt-3 block font-semibold tracking-tight">{person.name}</span>
			<span class="text-muted-foreground block">{person.handle}</span>
			<span class="mt-2 block text-pretty">{person.bio}</span>
			<span class="text-muted-foreground mt-3 flex gap-4">
				<span
					><span class="text-foreground font-semibold tabular-nums">{person.prompts}</span> prompts</span
				>
				<span>
					<span class="text-foreground font-semibold tabular-nums">
						{(person.followers + (following[person.id] ? 1 : 0)).toLocaleString('en-US')}
					</span>
					followers
				</span>
			</span>
		{/snippet}
	</HoverCard.GroupTrigger>
{/snippet}

<HoverCard.Group>
	<p class="w-full max-w-md text-[15px] leading-7 text-pretty">
		Last week {@render mention(people.ava)} shipped the eval harness, {@render mention(people.ben)}
		retuned the retrieval agent, and {@render mention(people.cara)} is already writing the prompt guide.
		<span class="text-muted-foreground">Hover a name to meet them.</span>
	</p>
</HoverCard.Group>
