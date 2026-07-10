<script lang="ts">
	import Mic from '@lucide/svelte/icons/mic';
	import X from '@lucide/svelte/icons/x';
	import { Aurora } from '$lib/components/ui/aurora';
	import { Button } from '$lib/components/ui/button';
	import { VoiceOrb } from '$lib/components/ui/voice-orb';
	import { Waveform } from '$lib/components/ui/waveform';

	let muted = $state(false);
</script>

<div
	class="relative mx-auto flex h-[30rem] w-full max-w-xl flex-col items-center justify-center overflow-hidden rounded-3xl bg-card shadow-md"
>
	<Aurora speed={22} />

	<div class="relative flex flex-col items-center gap-5">
		<VoiceOrb state={muted ? 'idle' : 'listening'} size={128} />
		<p class="text-sm text-muted-foreground">
			{muted ? 'Muted. Tap the mic when you are ready.' : "I'm listening..."}
		</p>
		<Waveform bars={9} active={!muted} class="h-8" />
	</div>

	<div class="relative mt-10 flex items-center gap-3">
		<Button
			variant={muted ? 'primary' : 'outline'}
			size="icon"
			aria-label={muted ? 'Unmute' : 'Mute'}
			aria-pressed={muted}
			onclick={() => (muted = !muted)}
		>
			<Mic class="size-4" />
		</Button>
		<Button variant="secondary" size="lg">Done</Button>
		<Button variant="ghost" size="icon" aria-label="Close voice mode">
			<X class="size-4" />
		</Button>
	</div>
</div>
