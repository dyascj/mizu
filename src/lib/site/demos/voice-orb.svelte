<script lang="ts">
	import { VoiceOrb } from '$lib/components/ui/voice-orb';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';

	let orbState = $state('listening');
	const orb = $derived((orbState || 'idle') as 'idle' | 'listening' | 'thinking' | 'speaking');
</script>

<div class="flex w-full flex-col items-center gap-6">
	<VoiceOrb state={orb} size={112} />
	<p class="text-muted-foreground text-sm">
		{orb === 'idle' ? 'Standing by' : `I'm ${orb}...`}
	</p>
	<ToggleGroup.Root class="flex-wrap justify-center" type="single" bind:value={orbState}>
		<ToggleGroup.Item value="idle">Idle</ToggleGroup.Item>
		<ToggleGroup.Item value="listening">Listening</ToggleGroup.Item>
		<ToggleGroup.Item value="thinking">Thinking</ToggleGroup.Item>
		<ToggleGroup.Item value="speaking">Speaking</ToggleGroup.Item>
	</ToggleGroup.Root>
	<p class="text-muted-foreground max-w-xs text-center text-xs leading-relaxed">
		Cloud animation adapted for Svelte from <a
			class="text-foreground underline underline-offset-4"
			href="https://orb-ui.com/"
			target="_blank"
			rel="noreferrer">Orb UI</a
		> by Alexander Chen, under the MIT license.
	</p>
</div>
