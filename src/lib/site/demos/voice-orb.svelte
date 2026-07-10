<script lang="ts">
	import { VoiceOrb } from '$lib/components/ui/voice-orb';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';

	let orbState = $state('listening');
	const orb = $derived(orbState as 'idle' | 'listening' | 'thinking' | 'speaking');
</script>

<div class="flex flex-col items-center gap-6">
	<VoiceOrb state={orb} size={112} />
	<p class="text-sm text-muted-foreground">
		{orb === 'idle' ? 'Standing by' : `I'm ${orb}...`}
	</p>
	<ToggleGroup.Root type="single" bind:value={orbState}>
		<ToggleGroup.Item value="idle">Idle</ToggleGroup.Item>
		<ToggleGroup.Item value="listening">Listening</ToggleGroup.Item>
		<ToggleGroup.Item value="thinking">Thinking</ToggleGroup.Item>
		<ToggleGroup.Item value="speaking">Speaking</ToggleGroup.Item>
	</ToggleGroup.Root>
</div>
