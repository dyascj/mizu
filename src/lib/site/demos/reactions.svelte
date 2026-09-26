<script lang="ts">
	import { Reactions, type Reaction, type ReactionChoice } from '$lib/components/ui/reactions';

	const choices: ReactionChoice[] = [
		{ emoji: '👍', label: 'thumbs up' },
		{ emoji: '❤️', label: 'heart' },
		{ emoji: '😂', label: 'laughing' },
		{ emoji: '🎉', label: 'party popper' },
		{ emoji: '👀', label: 'eyes' },
		{ emoji: '🙏', label: 'thank you' }
	];

	let reactions = $state<Reaction[]>([
		{ emoji: '🎉', count: 5, mine: true },
		{ emoji: '👍', count: 12, mine: false },
		{ emoji: '👀', count: 2, mine: false }
	]);
</script>

<div class="bg-card flex w-full max-w-sm flex-col gap-3 rounded-3xl p-5 pb-16 shadow-sm">
	<div class="flex items-center gap-2.5">
		<span
			aria-hidden="true"
			class="bg-secondary grid size-8 place-items-center rounded-full text-xs font-semibold"
		>
			MR
		</span>
		<p class="text-sm font-medium">Maya Ruiz</p>
		<p class="text-muted-foreground text-xs">2m</p>
	</div>
	<p class="text-sm leading-relaxed">
		Shipped the new onboarding agent. It now asks two questions instead of nine, and trial setup
		takes under a minute.
	</p>
	<Reactions bind:reactions {choices} />
</div>
