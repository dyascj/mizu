<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer';
	import { Button } from '$lib/components/ui/button';
	import { PromptSuggestions } from '$lib/components/ui/prompt-suggestions';
	import { VoiceOrb } from '$lib/components/ui/voice-orb';
</script>

<Drawer.Root>
	<Drawer.Trigger>
		{#snippet child({ props })}
			<Button variant="secondary" {...props}>Ask anything</Button>
		{/snippet}
	</Drawer.Trigger>
	<Drawer.Content>
		<div class="mx-auto flex w-full max-w-sm flex-col items-center gap-4 pb-8">
			<Drawer.Header class="items-center text-center">
				<VoiceOrb state="idle" size={48} />
				<Drawer.Title>What can I help with?</Drawer.Title>
				<Drawer.Description>Ask, or pick up where you left off.</Drawer.Description>
			</Drawer.Header>
			<PromptSuggestions
				class="justify-center"
				items={['Plan a cozy weekend', 'Summarize my inbox', 'Start voice mode']}
			/>
			<Drawer.Close>
				{#snippet child({ props })}
					<Button variant="ghost" size="sm" {...props}>Not now</Button>
				{/snippet}
			</Drawer.Close>
		</div>
	</Drawer.Content>
</Drawer.Root>
