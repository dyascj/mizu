<script lang="ts">
	import Mic from '@lucide/svelte/icons/mic';
	import X from '@lucide/svelte/icons/x';
	import { Aurora } from '$lib/components/ui/aurora';
	import { Button } from '$lib/components/ui/button';
	import { VoiceOrb } from '$lib/components/ui/voice-orb';
	import { Waveform } from '$lib/components/ui/waveform';

	let muted = $state(false);
	let ended = $state(false);
</script>

<div
	class="bg-card relative mx-auto flex h-[30rem] w-full max-w-xl flex-col items-center justify-center overflow-hidden rounded-3xl shadow-md"
>
	{#if !ended}<Aurora speed={22} class="dark:opacity-35" />{/if}

	<div class="relative flex flex-col items-center gap-5">
		<VoiceOrb state={ended || muted ? 'idle' : 'listening'} size={128} />
		<p class="text-foreground text-sm font-medium">
			{ended
				? 'Voice session ended.'
				: muted
					? 'Muted. Tap the mic when you are ready.'
					: "I'm listening..."}
		</p>
		<Waveform bars={9} active={!muted && !ended} class="h-8" />
	</div>

	<div class="relative mt-10 flex items-center gap-3">
		{#if ended}<Button
				onclick={() => {
					ended = false;
					muted = false;
				}}>Start again</Button
			>{:else}
			<Button
				variant={muted ? 'primary' : 'outline'}
				size="icon"
				aria-label={muted ? 'Unmute' : 'Mute'}
				aria-pressed={muted}
				onclick={() => (muted = !muted)}
			>
				<Mic class="size-4" />
			</Button>
			<Button variant="secondary" size="lg" onclick={() => (ended = true)}>Done</Button>
			<Button
				variant="ghost"
				size="icon"
				aria-label="Close voice mode"
				onclick={() => (ended = true)}
			>
				<X class="size-4" />
			</Button>
		{/if}
	</div>
</div>
