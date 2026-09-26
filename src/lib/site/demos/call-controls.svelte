<script lang="ts">
	import { CallControls, type CallPhase } from '$lib/components/ui/call-controls';
	import { VoiceOrb } from '$lib/components/ui/voice-orb';

	let phase = $state<CallPhase>('incoming');
	let muted = $state(false);
	let speaker = $state(false);
</script>

<div class="flex w-full justify-center">
	<CallControls name="Mizu voice" bind:phase bind:muted bind:speaker>
		{#snippet avatar()}
			<VoiceOrb
				state={phase === 'active' && !muted ? 'listening' : 'idle'}
				size={44}
				role="presentation"
				aria-hidden="true"
			/>
		{/snippet}
	</CallControls>
</div>
