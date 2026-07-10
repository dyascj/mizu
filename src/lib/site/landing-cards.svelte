<script lang="ts">
	// A shadcn-style "wall of cards": every card is an agentic scenario built
	// from real, interactive components, the same way the blocks are. No generic
	// SaaS filler; this is what the system is for.
	import { Bell, Search, Droplets, Check } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Slider } from '$lib/components/ui/slider';
	import { Progress } from '$lib/components/ui/progress';
	import { CircularGauge } from '$lib/components/ui/circular-gauge';
	import { Kbd, KbdGroup } from '$lib/components/ui/kbd';
	import { Separator } from '$lib/components/ui/separator';
	import * as Select from '$lib/components/ui/select';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Avatar from '$lib/components/ui/avatar';
	import { ChatBubble } from '$lib/components/ui/chat-bubble';
	import { ChatInput } from '$lib/components/ui/chat-input';
	import { VoiceOrb } from '$lib/components/ui/voice-orb';
	import { Waveform } from '$lib/components/ui/waveform';
	import { PromptSuggestions } from '$lib/components/ui/prompt-suggestions';
	import { StreamingText } from '$lib/components/ui/streaming-text';
	import { Reasoning } from '$lib/components/ui/reasoning';
	import { ToolCall } from '$lib/components/ui/tool-call';
	import { MessageActions } from '$lib/components/ui/message-actions';
	import { Plan, type PlanStep } from '$lib/components/ui/plan';

	// Live state so the wall is actually interactive.
	let autonomy = $state(65);
	const autonomyLabel = $derived(
		autonomy < 40 ? 'Asks first' : autonomy < 80 ? 'Confirms big steps' : 'Acts alone'
	);
	let brain = $state('fjord-3');
	const brains = [
		{ v: 'era-3', t: 'Era 3.0', tag: 'Fast', s: 'Quick and warm, for everyday' },
		{ v: 'fjord-3', t: 'Fjord 3.0', tag: 'Deep', s: 'Slow thinking for hard problems' },
		{ v: 'super-2', t: 'Super 2.4', tag: 'Agentic', s: 'Tool-happy, loves long tasks' }
	];
	const runSteps: PlanStep[] = [
		{ label: 'Read the brief', state: 'done' },
		{ label: 'Compare 14 flights', detail: 'Nonstop first', state: 'done' },
		{ label: 'Hold the best two fares', state: 'active' },
		{ label: 'Draft the itinerary', state: 'pending' }
	];
	let ai = $state({ speech: true, memory: true, personalization: false });

	const agents = [
		{ name: 'Era', task: 'Researching your trip', model: 'era-3' },
		{ name: 'Fjord', task: 'Drafting the blog post', model: 'fjord-3' },
		{ name: 'Super', task: 'Watching the inbox', model: 'super-2' }
	];
	const models = [
		{ value: 'era-3', label: 'Era 3.0' },
		{ value: 'fjord-3', label: 'Fjord 3.0' },
		{ value: 'super-2', label: 'Super 2.4' }
	];
	let lunaRun = $state(0);
	const lunaReply =
		'Two things: standup at ten, and you promised yourself a walk. I can remind you at three.';

	const activity = [
		{ title: 'Finished the research doc', detail: 'Sources cited and summarized', time: '9:41 AM' },
		{ title: 'Rescheduled your standup', detail: 'Moved to 10:30 with a note', time: '9:12 AM' },
		{ title: 'Sorted 86 receipts', detail: 'Tax season, handled', time: '8:47 AM' }
	];
	const commands = [
		{ name: 'Start voice mode', keys: ['⌘', 'V'] },
		{ name: 'New agent', keys: ['⌘', 'N'] },
		{ name: 'Summarize my inbox', keys: ['⌘', 'I'] },
		{ name: 'Search her memories', keys: ['⌘', 'M'] }
	];
</script>

<div class="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
	<!-- Companion chat -->
	<Card.Root class="break-inside-avoid">
		<Card.Header class="flex-row items-center gap-3">
			<VoiceOrb state="idle" size={36} />
			<div class="flex flex-col gap-0.5">
				<Card.Title>Luna</Card.Title>
				<Card.Description>Online now</Card.Description>
			</div>
		</Card.Header>
		<Card.Content class="flex flex-col gap-2">
			<ChatBubble role="user" animate={false}>Good morning! Anything on my plate today?</ChatBubble>
			<Reasoning summary="Thought for 2 seconds" class="pl-1">
				They asked about today. Calendar shows one meeting, and the walk they planned yesterday is
				still unscheduled. Lead with the meeting, nudge the walk.
			</Reasoning>
			<ChatBubble role="assistant" animate={false} class="min-h-16 w-full max-w-[85%]">
				{#key lunaRun}
					<StreamingText
						text={lunaReply}
						speed={80}
						onComplete={() => setTimeout(() => (lunaRun += 1), 3600)}
					/>
				{/key}
			</ChatBubble>
			<MessageActions text={lunaReply} class="pl-1" />
		</Card.Content>
		<Card.Footer>
			<ChatInput placeholder="Message Luna..." />
		</Card.Footer>
	</Card.Root>

	<!-- Live agent run -->
	<Card.Root class="break-inside-avoid">
		<Card.Header class="flex-row items-center gap-3">
			<VoiceOrb state="thinking" size={32} />
			<div class="flex flex-col gap-0.5">
				<Card.Title>Era is working</Card.Title>
				<Card.Description>Tokyo, four nights in October.</Card.Description>
			</div>
		</Card.Header>
		<Card.Content class="flex flex-col gap-3">
			<Plan steps={runSteps} />
			<ToolCall name="Comparing fares" detail="HND, Oct 12 to 16" state="running" />
		</Card.Content>
	</Card.Root>

	<!-- Agent activity -->
	<Card.Root class="break-inside-avoid">
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Bell class="size-4 text-primary" />
				While you were away
			</Card.Title>
			<Card.Description>Your agent kept going.</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-3">
			<ToolCall name="Summarizing your inbox" detail="12 unread" state="running" />
			{#each activity as a (a.title)}
				<div class="flex items-start gap-3 rounded-xl bg-secondary/60 p-3">
					<VoiceOrb state="idle" size={22} class="mt-0.5" />
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{a.title}</p>
						<p class="truncate text-xs text-muted-foreground">{a.detail}</p>
					</div>
					<span class="text-[0.6875rem] text-muted-foreground tabular-nums">{a.time}</span>
				</div>
			{/each}
		</Card.Content>
	</Card.Root>

	<!-- Model picker -->
	<Card.Root class="break-inside-avoid">
		<Card.Header>
			<Card.Title>Choose her brain</Card.Title>
			<Card.Description>Swap models any time, memory stays.</Card.Description>
		</Card.Header>
		<Card.Content>
			<RadioGroup.Root bind:value={brain} class="grid gap-2.5">
				{#each brains as o (o.v)}
					<Label
						for="brain-{o.v}"
						class="flex cursor-pointer items-center gap-3 rounded-xl p-3 font-normal transition-colors {brain ===
						o.v
							? 'bg-primary-muted'
							: 'bg-secondary/60 hover:bg-secondary'}"
					>
						<RadioGroup.Item value={o.v} id="brain-{o.v}" />
						<span class="flex-1">
							<span class="block font-semibold text-foreground">{o.t}</span>
							<span class="block text-xs text-muted-foreground">{o.s}</span>
						</span>
						<Badge variant={brain === o.v ? 'primary' : 'secondary'}>{o.tag}</Badge>
					</Label>
				{/each}
			</RadioGroup.Root>
		</Card.Content>
		<Card.Footer>
			<Button class="w-full">Run on {brains.find((b) => b.v === brain)?.t}</Button>
		</Card.Footer>
	</Card.Root>

	<!-- Your agents -->
	<Card.Root class="break-inside-avoid">
		<Card.Header>
			<Card.Title>Your agents</Card.Title>
			<Card.Description>Each one on its own model.</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			{#each agents as m (m.name)}
				<div class="flex items-center gap-3">
					<VoiceOrb state="idle" size={32} />
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-semibold">{m.name}</p>
						<p class="truncate text-xs text-muted-foreground">{m.task}</p>
					</div>
					<Select.Root type="single" value={m.model}>
						<Select.Trigger class="h-8 w-28 text-xs">
							{models.find((r) => r.value === m.model)?.label}
						</Select.Trigger>
						<Select.Content>
							{#each models as r (r.value)}
								<Select.Item value={r.value} label={r.label}>{r.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{/each}
		</Card.Content>
	</Card.Root>

	<!-- System status -->
	<Card.Root class="break-inside-avoid">
		<Card.Header>
			<Card.Title>Today</Card.Title>
			<Card.Description>Your assistant's day at a glance.</Card.Description>
		</Card.Header>
		<Card.Content class="flex items-center gap-5">
			<CircularGauge value={72} label="Focus">
				<Droplets class="size-5 text-primary" />
			</CircularGauge>
			<div class="flex flex-1 flex-col gap-3">
				<div class="flex flex-col gap-1.5">
					<div class="flex justify-between text-xs">
						<span class="text-muted-foreground">Tasks done</span><span class="tabular-nums"
							>84%</span
						>
					</div>
					<Progress value={84} />
				</div>
				<div class="flex flex-col gap-1.5">
					<div class="flex justify-between text-xs">
						<span class="text-muted-foreground">Memory used</span><span class="tabular-nums"
							>61%</span
						>
					</div>
					<Progress value={61} />
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Voice mode -->
	<Card.Root class="break-inside-avoid">
		<Card.Content class="flex flex-col items-center gap-4 pt-8 pb-6">
			<VoiceOrb state="listening" size={88} />
			<p class="text-sm text-muted-foreground">I'm listening...</p>
			<Waveform bars={7} class="h-6" />
			<div class="flex gap-2">
				<Button variant="secondary" size="sm">Cancel</Button>
				<Button size="sm">Done</Button>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Command menu -->
	<Card.Root class="break-inside-avoid">
		<Card.Content class="flex flex-col gap-3 pt-6">
			<div class="flex items-center gap-2 rounded-full bg-secondary px-3.5 py-2">
				<Search class="size-4 text-muted-foreground" />
				<span class="flex-1 text-sm text-muted-foreground">Ask, or command...</span>
				<KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>
			</div>
			<div class="flex flex-col">
				{#each commands as c, i (c.name)}
					{#if i > 0}<Separator />{/if}
					<div class="flex items-center justify-between gap-3 py-2">
						<span class="text-sm">{c.name}</span>
						<KbdGroup
							>{#each c.keys as k (k)}<Kbd>{k}</Kbd>{/each}</KbdGroup
						>
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>

	<!-- AI permissions -->
	<Card.Root class="break-inside-avoid">
		<Card.Header>
			<Card.Title>AI permissions</Card.Title>
			<Card.Description>You decide what it can do.</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="flex items-start justify-between gap-4">
				<div>
					<p class="text-sm font-medium">Speech recognition</p>
					<p class="text-xs text-muted-foreground">Talk instead of typing.</p>
				</div>
				<Switch bind:checked={ai.speech} />
			</div>
			<div class="flex items-start justify-between gap-4">
				<div>
					<p class="text-sm font-medium">Long-term memory</p>
					<p class="text-xs text-muted-foreground">Remembers across sessions.</p>
				</div>
				<Switch bind:checked={ai.memory} />
			</div>
			<div class="flex items-start justify-between gap-4">
				<div>
					<p class="text-sm font-medium">Personalization</p>
					<p class="text-xs text-muted-foreground">Learns your preferences.</p>
				</div>
				<Switch bind:checked={ai.personalization} />
			</div>
		</Card.Content>
		<Card.Footer>
			<Button variant="secondary" class="w-full">Save preferences</Button>
		</Card.Footer>
	</Card.Root>

	<!-- Starter prompts -->
	<Card.Root class="break-inside-avoid">
		<Card.Header>
			<Card.Title>Good morning</Card.Title>
			<Card.Description>Pick up where you left off.</Card.Description>
		</Card.Header>
		<Card.Content>
			<PromptSuggestions
				items={['Plan a cozy weekend', 'Summarize my inbox', 'What should I cook tonight?']}
			/>
		</Card.Content>
	</Card.Root>

	<!-- Autonomy dial -->
	<Card.Root class="break-inside-avoid">
		<Card.Header>
			<Card.Title>Autonomy</Card.Title>
			<Card.Description>How much she does before asking you.</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="flex flex-wrap gap-2">
				<Badge>Chat</Badge>
				<Badge variant="secondary">Browse</Badge>
				<Badge variant="success"><Check class="size-3" />Calendar</Badge>
				<Badge variant="outline">Purchases off</Badge>
			</div>
			<div class="flex flex-col gap-1.5">
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">{autonomyLabel}</span><span
						class="text-muted-foreground tabular-nums">{autonomy}%</span
					>
				</div>
				<Slider type="single" bind:value={autonomy} max={100} />
			</div>
		</Card.Content>
	</Card.Root>
</div>
