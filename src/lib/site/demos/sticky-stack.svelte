<script lang="ts">
	import { StickyStack } from '$lib/components/ui/sticky-stack';

	const steps = [
		{
			title: 'Ask in plain words',
			description: 'Describe the outcome you want. The agent works out the steps.'
		},
		{
			title: 'It reads the workspace',
			description: 'Docs, threads, and tickets you can see become its context, and nothing else.'
		},
		{
			title: 'Plans before it acts',
			description: 'You see every step it intends to take before a single one runs.'
		},
		{
			title: 'Changes land as drafts',
			description: 'Edits arrive as suggestions you accept, tweak, or throw away.'
		},
		{
			title: 'Every run leaves a trail',
			description: 'Sources, tool calls, and costs stay attached to the result.'
		}
	];
</script>

<StickyStack items={steps} label="How the agent works">
	{#snippet heading()}
		<h2 class="text-xl font-semibold tracking-tight">How the agent works</h2>
		<p class="text-muted-foreground text-sm">Scroll to stack them up.</p>
	{/snippet}
</StickyStack>
