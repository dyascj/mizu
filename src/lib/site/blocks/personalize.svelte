<script lang="ts">
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import { AuraTile } from '$lib/components/ui/aura-tile';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';

	const styles = ['Aura Waves', 'Neon Dreams', 'Riptide', 'Golden Hour'];
	let style = $state('Aura Waves');
	let tone = $state('balanced');
	let speech = $state(true);
	let memory = $state(true);
</script>

<div class="mx-auto flex w-full max-w-md flex-col gap-7 rounded-3xl bg-card p-7 shadow-md">
	<div>
		<h2 class="text-lg font-semibold tracking-tight">Make it yours</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			Pick a look and a voice. You can change all of this later.
		</p>
	</div>

	<div class="flex flex-col gap-2.5">
		<p class="text-sm font-medium">Style</p>
		<div class="grid grid-cols-4 gap-3">
			{#each styles as s (s)}
				<button
					type="button"
					class="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
					onclick={() => (style = s)}
					aria-pressed={style === s}
					aria-label={s}
				>
					<AuraTile seed={s} selected={style === s} class="w-full" />
				</button>
			{/each}
		</div>
	</div>

	<div class="flex flex-col gap-2.5">
		<p class="text-sm font-medium">Conversation style</p>
		<ToggleGroup.Root type="single" bind:value={tone} class="w-fit">
			<ToggleGroup.Item value="creative">Creative</ToggleGroup.Item>
			<ToggleGroup.Item value="balanced">Balanced</ToggleGroup.Item>
			<ToggleGroup.Item value="precise">Precise</ToggleGroup.Item>
		</ToggleGroup.Root>
	</div>

	<div class="flex flex-col gap-4">
		<div class="flex items-center justify-between gap-4">
			<div>
				<Label for="p-speech" class="font-medium">Speech recognition</Label>
				<p class="text-xs text-muted-foreground">Talk instead of typing.</p>
			</div>
			<Switch id="p-speech" bind:checked={speech} />
		</div>
		<div class="flex items-center justify-between gap-4">
			<div>
				<Label for="p-memory" class="font-medium">Long-term memory</Label>
				<p class="text-xs text-muted-foreground">Remembers across sessions.</p>
			</div>
			<Switch id="p-memory" bind:checked={memory} />
		</div>
	</div>

	<Button variant="ai" size="lg" class="w-full">
		<Sparkles class="size-4" />
		Create my companion
	</Button>
</div>
