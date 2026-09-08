<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import Check from '@lucide/svelte/icons/check';
	import { Button } from '$lib/components/ui/button';
	import { ChatInput } from '$lib/components/ui/chat-input';
	import { ChatBubble } from '$lib/components/ui/chat-bubble';
	import { MessageActions } from '$lib/components/ui/message-actions';
	import { VoiceOrb } from '$lib/components/ui/voice-orb';
	import { Waveform } from '$lib/components/ui/waveform';
	import { Reasoning } from '$lib/components/ui/reasoning';
	import { Plan, type PlanStep } from '$lib/components/ui/plan';
	import { ToolCall } from '$lib/components/ui/tool-call';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';

	let prompt = $state('Help me prepare for the design review.');
	let reply = $state(
		'Start with the decision you need to make. Here is an agenda that leaves room for the conversation.'
	);
	let input = $state('');
	let voice = $state<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
	let memory = $state(true);
	let notifications = $state(false);
	const states = ['idle', 'listening', 'thinking', 'speaking'] as const;
	const steps: PlanStep[] = [
		{ label: 'Read the project brief', state: 'done' },
		{ label: 'Review the latest designs', state: 'done' },
		{ label: 'Draft the meeting notes', state: 'active' }
	];
	function submit(message: string) {
		prompt = message;
		reply =
			'I have your follow-up. This demo keeps the conversation in your browser, so no message was sent to a model.';
	}
</script>

<div class="grid gap-4 md:grid-cols-12">
	<article
		class="showcase bg-secondary/60 flex min-w-0 flex-col rounded-3xl p-5 sm:p-8 md:col-span-12 xl:col-span-8"
	>
		<div class="mb-8 flex items-center justify-between gap-4">
			<h2 class="text-sm font-medium">Conversation</h2>
			<a
				href="/docs/components/chat-input"
				class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
				>Explore chat <ArrowUpRight class="size-3.5" /></a
			>
		</div>
		<div class="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5">
			<ChatBubble
				role="user"
				animate={false}
				class="bg-card text-foreground max-w-[90%] rounded-2xl px-5 py-3">{prompt}</ChatBubble
			>
			<Reasoning summary="Review notes organized">
				Group the feedback by the decisions the team needs to make. Keep implementation details in
				the notes.
			</Reasoning>
			<div class="text-sm leading-7 sm:text-base">
				<p>{reply}</p>
				<ol class="mt-4 space-y-2 text-sm">
					<li class="flex gap-3">
						<span class="text-muted-foreground w-4 shrink-0 tabular-nums">1.</span> The problem and the
						people it affects
					</li>
					<li class="flex gap-3">
						<span class="text-muted-foreground w-4 shrink-0 tabular-nums">2.</span> What changed, and
						why
					</li>
					<li class="flex gap-3">
						<span class="text-muted-foreground w-4 shrink-0 tabular-nums">3.</span> Open questions and
						the next step
					</li>
				</ol>
			</div>
			<MessageActions text={reply} />
		</div>
		<ChatInput
			bind:value={input}
			onSubmit={submit}
			placeholder="Ask a follow-up..."
			class="mt-8 min-h-14 p-2 pl-4"
		/>
	</article>

	<article
		class="showcase bg-secondary/60 flex min-w-0 flex-col rounded-3xl p-5 sm:p-8 md:col-span-6 xl:col-span-4"
	>
		<div class="flex items-center justify-between gap-4">
			<h2 class="text-sm font-medium">Voice</h2>
			<a
				href="/docs/components/voice-orb"
				class="text-muted-foreground hover:text-foreground"
				aria-label="Explore voice orb"><ArrowUpRight class="size-4" /></a
			>
		</div>
		<div class="flex min-h-72 flex-1 flex-col items-center justify-center gap-7 py-8">
			<VoiceOrb state={voice} size={172} volume={voice === 'speaking' ? 0.4 : 0} />
			<div class="flex h-6 items-center gap-2 text-sm">
				{#if voice !== 'idle'}<Waveform
						active={voice === 'speaking' || voice === 'listening'}
						bars={9}
						class="h-5"
					/>{/if}
				<span
					>{voice === 'idle'
						? 'Ready when you are'
						: voice === 'listening'
							? 'Listening'
							: voice === 'thinking'
								? 'Thinking it through'
								: 'Speaking'}</span
				>
			</div>
		</div>
		<div class="flex flex-wrap justify-center gap-1" aria-label="Voice state">
			{#each states as state (state)}
				<button
					type="button"
					aria-pressed={voice === state}
					onclick={() => (voice = state)}
					class="rounded-full px-3 py-2 text-xs font-medium transition-colors {voice === state
						? 'bg-card text-foreground shadow-xs'
						: 'text-muted-foreground hover:text-foreground'}"
					>{state[0].toUpperCase() + state.slice(1)}</button
				>
			{/each}
		</div>
	</article>

	<article
		class="showcase bg-secondary/60 min-w-0 rounded-3xl p-5 sm:p-8 md:col-span-6 xl:col-span-5"
	>
		<div class="mb-6 flex items-center justify-between gap-4">
			<h2 class="text-sm font-medium">Work in progress</h2>
			<a
				href="/docs/components/plan"
				aria-label="Explore agent plans"
				class="text-muted-foreground hover:text-foreground"><ArrowUpRight class="size-4" /></a
			>
		</div>
		<Plan {steps} />
		<ToolCall name="Organizing feedback" detail="4 documents" state="running" class="mt-5" />
	</article>

	<article
		class="showcase bg-secondary/60 min-w-0 rounded-3xl p-5 sm:p-8 md:col-span-6 xl:col-span-4"
	>
		<div class="mb-6 flex items-center justify-between gap-4">
			<h2 class="text-sm font-medium">Your preferences</h2>
			<a
				href="/docs/components/switch"
				aria-label="Explore form controls"
				class="text-muted-foreground hover:text-foreground"><ArrowUpRight class="size-4" /></a
			>
		</div>
		<div class="flex flex-col gap-6">
			<div class="flex items-center justify-between gap-5">
				<div>
					<Label for="landing-memory">Remember context</Label>
					<p class="text-muted-foreground mt-1 text-xs">Pick up where you left off.</p>
				</div>
				<Switch id="landing-memory" bind:checked={memory} />
			</div>
			<div class="flex items-center justify-between gap-5">
				<div>
					<Label for="landing-notifications">Notify when finished</Label>
					<p class="text-muted-foreground mt-1 text-xs">Updates on work in progress.</p>
				</div>
				<Switch id="landing-notifications" bind:checked={notifications} />
			</div>
		</div>
	</article>

	<article
		class="showcase bg-secondary/60 flex min-w-0 flex-col justify-between gap-8 rounded-3xl p-5 sm:p-8 md:col-span-6 xl:col-span-3"
	>
		<h2 class="text-sm font-medium">The essentials, too</h2>
		<div class="flex flex-wrap gap-2">
			<Badge variant="secondary">Draft</Badge><Badge variant="success"
				><Check class="size-3" /> Published</Badge
			>
		</div>
		<Button href="/docs/components" variant="primary" class="w-fit"
			>All components <ArrowUpRight class="size-4" /></Button
		>
	</article>
</div>

<style>
	.showcase {
		animation: arrive 280ms ease-out both;
	}
	@keyframes arrive {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.showcase {
			animation: none;
		}
	}
</style>
