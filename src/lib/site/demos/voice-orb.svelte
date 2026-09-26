<script lang="ts">
	import Mic from '@lucide/svelte/icons/mic';
	import MicOff from '@lucide/svelte/icons/mic-off';
	import { Button } from '$lib/components/ui/button';
	import * as SegmentedControl from '$lib/components/ui/segmented-control';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { VoiceOrb, openMicrophone, type Microphone } from '$lib/components/ui/voice-orb';

	type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

	let orbState = $state<OrbState>('idle');
	let variant = $state<'mist' | 'cloud'>('mist');
	let microphone = $state<Microphone | null>(null);
	let micNote = $state('');
	/** True while the browser's permission prompt is up, so a second press opens nothing. */
	let opening = $state(false);
	let destroyed = false;

	const captions: Record<OrbState, string> = {
		idle: 'Tap listening to talk',
		listening: 'Listening',
		thinking: 'Thinking',
		speaking: 'Speaking'
	};

	function closeMicrophone() {
		microphone?.close();
		microphone = null;
		micNote = '';
	}

	function choose(next: string) {
		orbState = (next || 'idle') as OrbState;
		if (orbState !== 'listening') closeMicrophone();
	}

	// The microphone opens only when asked, and closes as soon as the orb stops listening.
	async function toggleMicrophone() {
		if (opening) return;
		if (microphone) {
			closeMicrophone();
			return;
		}
		opening = true;
		try {
			const opened = await openMicrophone();
			// Left the page while the prompt was up: nothing is listening anymore.
			if (destroyed) {
				opened.close();
				return;
			}
			microphone = opened;
			micNote = 'Using your mic. Nothing is recorded.';
		} catch {
			micNote = 'The microphone is blocked, so the orb pretends to hear a quiet room.';
		} finally {
			opening = false;
		}
		if (!destroyed) orbState = 'listening';
	}

	$effect(() => () => {
		destroyed = true;
		microphone?.close();
	});
</script>

<div class="flex w-full flex-col items-center gap-5">
	<VoiceOrb state={orbState} {variant} size={176} analyser={microphone?.analyser} />
	<p class="text-muted-foreground text-sm">{captions[orbState]}</p>
	<ToggleGroup.Root
		class="flex flex-wrap justify-center"
		type="single"
		aria-label="Assistant state"
		bind:value={() => (orbState === 'idle' ? '' : orbState), choose}
	>
		<ToggleGroup.Item value="listening">Listening</ToggleGroup.Item>
		<ToggleGroup.Item value="thinking">Thinking</ToggleGroup.Item>
		<ToggleGroup.Item value="speaking">Speaking</ToggleGroup.Item>
	</ToggleGroup.Root>
	<div class="flex flex-wrap items-center justify-center gap-2">
		<Button
			variant="secondary"
			size="sm"
			aria-pressed={!!microphone}
			aria-busy={opening}
			onclick={toggleMicrophone}
		>
			{#if microphone}<MicOff class="size-4" />Stop microphone{:else}<Mic class="size-4" />Use my
				microphone{/if}
		</Button>
		<SegmentedControl.Root bind:value={variant} size="sm" aria-label="Orb style">
			<SegmentedControl.Item value="mist">Mist</SegmentedControl.Item>
			<SegmentedControl.Item value="cloud">Cloud</SegmentedControl.Item>
		</SegmentedControl.Root>
	</div>
	<p class="text-muted-foreground min-h-4 max-w-xs text-center text-xs" aria-live="polite">
		{micNote}
	</p>
	<p class="text-muted-foreground max-w-xs text-center text-xs leading-relaxed">
		Cloud animation adapted for Svelte from <a
			class="text-foreground underline underline-offset-4"
			href="https://orb-ui.com/"
			target="_blank"
			rel="noreferrer">Orb UI</a
		> by Alexander Chen, under the MIT license.
	</p>
</div>
