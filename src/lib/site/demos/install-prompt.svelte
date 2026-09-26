<script lang="ts">
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import { Button } from '$lib/components/ui/button';
	import { InstallPrompt } from '$lib/components/ui/install-prompt';
	import { toast } from '$lib/components/ui/toast';

	// Previews have no real install event, so force the card and replay it on demand.
	let run = $state(0);
</script>

<div class="flex w-full flex-col items-center gap-4">
	<div class="flex min-h-44 w-full items-center justify-center">
		{#key run}
			<InstallPrompt
				forceVisible
				title="Install Mizu Assistant"
				description="Start a chat or a voice session from your home screen in one tap."
				onInstall={(outcome) => outcome === 'accepted' && toast.success('Mizu Assistant installed')}
			>
				{#snippet icon()}
					<span
						class="bg-primary flex size-12 items-center justify-center rounded-[0.875rem] shadow-sm"
						aria-hidden="true"
					>
						<span class="size-7 rounded-full" style="background: var(--voice-orb-fallback)"></span>
					</span>
				{/snippet}
			</InstallPrompt>
		{/key}
	</div>
	<Button variant="ghost" size="sm" onclick={() => run++}>
		<RotateCcw class="size-3.5" />
		Replay
	</Button>
</div>
