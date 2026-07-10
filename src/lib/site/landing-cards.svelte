<script lang="ts">
	// A shadcn-style "wall of cards": self-contained Mizu component compositions
	// in a masonry, so the landing shows real, interactive components (wearing the
	// gel + glass) instead of a generic feature grid.
	import { Bell, Search, Droplets, Check } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
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

	// Live state so the wall is actually interactive.
	let volume = $state(70);
	let plan = $state('pro');
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
		{ name: 'Ask Mizu anything', keys: ['⌘', 'K'] },
		{ name: 'Toggle theme', keys: ['⌘', 'J'] },
		{ name: 'Copy install command', keys: ['⌘', 'C'] },
		{ name: 'Go to docs', keys: ['G', 'D'] }
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

	<!-- Create account -->
	<Card.Root class="break-inside-avoid">
		<Card.Header>
			<Card.Title>Create your account</Card.Title>
			<Card.Description>Dive in. It takes a few seconds.</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-3">
			<div class="flex flex-col gap-1.5">
				<Label for="lc-email">Email</Label>
				<Input id="lc-email" type="email" placeholder="you@water.com" />
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="lc-pass">Password</Label>
				<Input id="lc-pass" type="password" placeholder="••••••••" />
			</div>
		</Card.Content>
		<Card.Footer class="flex-col gap-2">
			<Button class="w-full">Create account</Button>
			<Button variant="ghost" class="w-full">
				<svg viewBox="0 0 24 24" fill="currentColor" class="size-4" aria-hidden="true"
					><path
						d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 4.5 18 4.8 18 4.8c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"
					/></svg
				>
				Continue with GitHub
			</Button>
		</Card.Footer>
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

	<!-- Choose a plan -->
	<Card.Root class="break-inside-avoid">
		<Card.Header>
			<Card.Title>Choose a plan</Card.Title>
			<Card.Description>Switch or cancel any time.</Card.Description>
		</Card.Header>
		<Card.Content>
			<RadioGroup.Root bind:value={plan} class="grid gap-2.5">
				{#each [{ v: 'free', t: 'Free', p: '$0', s: 'Chat, 50 messages a day' }, { v: 'pro', t: 'Pro', p: '$9', s: 'Voice mode and memory' }, { v: 'team', t: 'Team', p: '$29', s: 'Shared agents' }] as o (o.v)}
					<Label
						for="plan-{o.v}"
						class="flex cursor-pointer items-center gap-3 rounded-xl p-3 font-normal transition-colors {plan ===
						o.v
							? 'bg-primary-muted'
							: 'bg-secondary/60 hover:bg-secondary'}"
					>
						<RadioGroup.Item value={o.v} id="plan-{o.v}" />
						<span class="flex-1">
							<span class="block font-semibold text-foreground">{o.t}</span>
							<span class="block text-xs text-muted-foreground">{o.s}</span>
						</span>
						<span class="font-display font-semibold tabular-nums"
							>{o.p}<span class="text-xs font-normal text-muted-foreground">/mo</span></span
						>
					</Label>
				{/each}
			</RadioGroup.Root>
		</Card.Content>
		<Card.Footer>
			<Button class="w-full"
				>Upgrade to {plan === 'free' ? 'Pro' : plan.charAt(0).toUpperCase() + plan.slice(1)}</Button
			>
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
				<span class="flex-1 text-sm text-muted-foreground">Type a command…</span>
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

	<!-- Volume / quick control -->
	<Card.Root class="break-inside-avoid">
		<Card.Header>
			<Card.Title>One token, your color</Card.Title>
			<Card.Description
				>Every control recolors from <code class="font-mono text-foreground">--primary</code
				>.</Card.Description
			>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="flex flex-wrap gap-2">
				<Badge>Primary</Badge>
				<Badge variant="secondary">Secondary</Badge>
				<Badge variant="outline">Outline</Badge>
				<Badge variant="success"><Check class="size-3" />Live</Badge>
			</div>
			<div class="flex flex-col gap-1.5">
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Volume</span><span class="tabular-nums"
						>{volume}%</span
					>
				</div>
				<Slider type="single" bind:value={volume} max={100} />
			</div>
		</Card.Content>
	</Card.Root>
</div>
