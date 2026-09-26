<script lang="ts">
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import { Button } from '$lib/components/ui/button';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { blurIn, magnetic, pointerPosition, pop, rise, stagger } from '$lib/components/ui/motion';

	const transitions = { rise, blurIn, pop };
	type Name = keyof typeof transitions;

	let name = $state<Name>('blurIn');
	let run = $state(0);
	const lines = ['Reading the brief', 'Drafting three directions', 'Ready for review'];
	const transition = $derived(transitions[name]);
</script>

<div class="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
	<div class="bg-card flex min-h-64 flex-col gap-4 rounded-3xl p-5 shadow-sm">
		<div class="flex items-center justify-between gap-2">
			<ToggleGroup.Root
				type="single"
				bind:value={() => name, (value) => value && ((name = value as Name), run++)}
				aria-label="Transition"
			>
				<ToggleGroup.Item size="sm" value="rise">Rise</ToggleGroup.Item>
				<ToggleGroup.Item size="sm" value="blurIn">Blur</ToggleGroup.Item>
				<ToggleGroup.Item size="sm" value="pop">Pop</ToggleGroup.Item>
			</ToggleGroup.Root>
			<Button variant="ghost" size="icon" aria-label="Replay" onclick={() => run++}>
				<RotateCcw class="size-4" />
			</Button>
		</div>
		{#key run}
			<ul class="flex flex-col gap-2" aria-live="polite">
				{#each lines as line, index (line)}
					<li
						in:transition={{ delay: index * stagger * 2 }}
						class="bg-secondary w-fit rounded-2xl px-4 py-2.5 text-sm"
					>
						{line}
					</li>
				{/each}
			</ul>
		{/key}
	</div>

	<div
		{@attach pointerPosition()}
		class="bg-card relative flex min-h-64 flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl p-5 shadow-sm"
	>
		<div
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 opacity-[var(--pointer-active)] transition-opacity duration-(--duration-slow)"
			style="background: radial-gradient(18rem circle at var(--pointer-x) var(--pointer-y), color-mix(in oklab, var(--foreground) 7%, transparent), transparent 70%)"
		></div>
		<span {@attach magnetic()} class="relative inline-flex">
			<Button size="lg"><Sparkles class="size-4" /> Generate</Button>
		</span>
		<p class="text-muted-foreground relative text-center text-sm">
			The light follows your pointer.<br />The button leans toward it.
		</p>
	</div>
</div>
