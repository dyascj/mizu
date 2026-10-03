<script lang="ts">
	import { Presence, type PresenceState, type PresenceTone } from '$lib/components/ui/presence';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';

	const states: PresenceState[] = [
		'idle',
		'listening',
		'thinking',
		'speaking',
		'happy',
		'sleeping'
	];
	const tones: PresenceTone[] = ['water', 'iris', 'ember', 'mint', 'mono'];
	const captions: Record<PresenceState, string> = {
		idle: 'Ready when you are.',
		listening: 'Go ahead, I am listening.',
		thinking: 'Working through the brief...',
		speaking: 'Here is what I found.',
		happy: 'Done. The draft is ready.',
		sleeping: 'Resting until you need me.'
	};

	let current = $state<PresenceState>('idle');
	let tone = $state<PresenceTone>('water');
	let volume = $state(0);

	// Simulate a voice level while listening or speaking.
	$effect(() => {
		if (current !== 'listening' && current !== 'speaking') {
			volume = 0;
			return;
		}
		const timer = setInterval(() => (volume = Math.random() * 0.9), 140);
		return () => clearInterval(timer);
	});

	// One tab stop for the group; arrows move the pick, mirrored in right-to-left text.
	function onToneKeydown(event: KeyboardEvent & { currentTarget: HTMLButtonElement }) {
		const forward = getComputedStyle(event.currentTarget).direction === 'rtl' ? -1 : 1;
		const step = { ArrowRight: forward, ArrowDown: 1, ArrowLeft: -forward, ArrowUp: -1 }[event.key];
		if (step === undefined) return;
		event.preventDefault();
		const next = (tones.indexOf(tone) + step + tones.length) % tones.length;
		tone = tones[next];
		(event.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
	}
</script>

<div class="flex w-full flex-col items-center gap-6">
	<Presence state={current} {tone} {volume} size={128} />
	<p class="text-muted-foreground text-sm" aria-live="polite">{captions[current]}</p>
	<ToggleGroup.Root
		type="single"
		aria-label="State"
		class="grid grid-cols-3 sm:flex"
		bind:value={() => current, (value) => value && (current = value as PresenceState)}
	>
		{#each states as item (item)}
			<ToggleGroup.Item value={item} size="sm" class="capitalize">{item}</ToggleGroup.Item>
		{/each}
	</ToggleGroup.Root>
	<div class="flex items-center gap-2" role="radiogroup" aria-label="Tone">
		{#each tones as item (item)}
			<button
				type="button"
				role="radio"
				aria-checked={tone === item}
				aria-label={item}
				tabindex={tone === item ? 0 : -1}
				onclick={() => (tone = item)}
				onkeydown={onToneKeydown}
				class="focus-visible:ring-ring aria-checked:bg-secondary rounded-full p-1 transition-[scale] duration-(--duration-fast) outline-none focus-visible:ring-2 active:scale-90"
			>
				<Presence tone={item} size={28} interactive={false} state="idle" aria-hidden="true" />
			</button>
		{/each}
	</div>
</div>
