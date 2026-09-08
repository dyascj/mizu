<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { CircularGauge } from '$lib/components/ui/circular-gauge';
	import { Nudge } from '$lib/components/ui/nudge';
	import { Plan, type PlanStep } from '$lib/components/ui/plan';
	import { Progress } from '$lib/components/ui/progress';
	import { ToolCall } from '$lib/components/ui/tool-call';
	import { VoiceOrb } from '$lib/components/ui/voice-orb';

	let agents = $state([
		{ name: 'Era', task: 'Planning your trip', state: 'thinking' as const },
		{ name: 'Fjord', task: 'Drafting the blog post', state: 'idle' as const },
		{ name: 'Super', task: 'Watching the inbox', state: 'idle' as const }
	]);

	const steps: PlanStep[] = [
		{ label: 'Understanding the brief', state: 'done' },
		{ label: 'Comparing 14 flights', detail: 'Nonstop first', state: 'done' },
		{ label: 'Holding the best two fares', state: 'active' },
		{ label: 'Drafting the itinerary', state: 'pending' }
	];

	let nudgeVisible = $state(true);
	let reminder = $state(false);
</script>

<div class="mx-auto grid w-full max-w-4xl gap-4 lg:grid-cols-3">
	<!-- roster -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Your agents</Card.Title>
			<Card.Description>{agents.length} agents in your workspace.</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			{#each agents as agent (agent.name)}
				<div class="flex items-center gap-3">
					<VoiceOrb state={agent.state} size={32} />
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-semibold">{agent.name}</p>
						<p class="text-muted-foreground truncate text-xs">{agent.task}</p>
					</div>
				</div>
			{/each}
		</Card.Content>
		<Card.Footer>
			<Button
				variant="secondary"
				size="sm"
				class="w-full"
				onclick={() => {
					agents = [
						...agents,
						{ name: `Agent ${agents.length + 1}`, task: 'Ready for a task', state: 'idle' }
					];
				}}>New agent</Button
			>
		</Card.Footer>
	</Card.Root>

	<!-- live plan -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Era's plan</Card.Title>
			<Card.Description>Tokyo, four nights in October.</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<Plan {steps} />
			<ToolCall name="Searching fares" detail="HND, Oct 12 to 16" state="running" />
		</Card.Content>
	</Card.Root>

	<!-- today -->
	<div class="flex flex-col gap-4">
		<Card.Root>
			<Card.Header>
				<Card.Title>Today</Card.Title>
			</Card.Header>
			<Card.Content class="flex flex-wrap items-center gap-5">
				<CircularGauge value={72} label="Focus" size={96} />
				<div class="flex min-w-24 flex-1 flex-col gap-3">
					<div class="flex flex-col gap-1.5">
						<div class="flex justify-between text-xs">
							<span class="text-muted-foreground">Tasks done</span><span class="tabular-nums"
								>84%</span
							>
						</div>
						<Progress value={84} aria-label="Tasks done" />
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		{#if nudgeVisible}
			<Nudge
				title="Fares drop Tuesday"
				description="Era suggests booking then. Want a reminder?"
				onDismiss={() => (nudgeVisible = false)}
			>
				{#snippet actions()}
					<Button
						size="sm"
						onclick={() => {
							reminder = true;
							nudgeVisible = false;
						}}>Remind me</Button
					>
				{/snippet}
			</Nudge>
		{/if}
		{#if reminder}<p role="status" class="text-muted-foreground text-sm">
				Reminder added for Tuesday in this preview.
			</p>{/if}
	</div>
</div>
