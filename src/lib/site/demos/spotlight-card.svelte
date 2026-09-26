<script lang="ts">
	import { SpotlightCard, SpotlightGroup } from '$lib/components/ui/spotlight-card';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Wrench from '@lucide/svelte/icons/wrench';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import History from '@lucide/svelte/icons/history';

	const features = [
		{
			title: 'Long context',
			text: 'Drop in a whole codebase or a year of tickets. It reads all of it.',
			icon: BookOpen
		},
		{
			title: 'Tool use',
			text: 'Calls your APIs mid-answer and shows every step it took.',
			icon: Wrench
		},
		{
			title: 'Private by default',
			text: 'Your chats never train a model unless you opt in.',
			icon: ShieldCheck
		},
		{
			title: 'Run history',
			text: 'Replay any agent run, down to each token and tool call.',
			icon: History
		}
	];
</script>

<SpotlightGroup class="w-full max-w-lg sm:grid-cols-2">
	{#each features as feature (feature.title)}
		<SpotlightCard>
			{#snippet icon()}
				<feature.icon />
			{/snippet}
			<h3 class="font-medium tracking-tight">{feature.title}</h3>
			<p class="text-muted-foreground mt-1 text-sm text-pretty">{feature.text}</p>
		</SpotlightCard>
	{/each}
</SpotlightGroup>
