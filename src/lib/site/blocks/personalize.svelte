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
	let created = $state(false);
</script>

<div class="bg-card mx-auto flex w-full max-w-md flex-col gap-7 rounded-3xl p-5 shadow-md sm:p-7">
	<div>
		<h2 class="text-lg font-semibold tracking-tight">Make it yours</h2>
		<p class="text-muted-foreground mt-1 text-sm">
			Pick a look and a voice. You can change all of this later.
		</p>
	</div>

	<div class="flex flex-col gap-2.5">
		<p class="text-sm font-medium">Style</p>
		<div class="grid grid-cols-4 gap-3">
			{#each styles as s (s)}
				<button
					type="button"
					class="focus-visible:ring-ring rounded-xl outline-none focus-visible:ring-2"
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
		<ToggleGroup.Root type="single" bind:value={tone} class="w-fit max-w-full flex-wrap">
			<ToggleGroup.Item value="creative">Creative</ToggleGroup.Item>
			<ToggleGroup.Item value="balanced">Balanced</ToggleGroup.Item>
			<ToggleGroup.Item value="precise">Precise</ToggleGroup.Item>
		</ToggleGroup.Root>
	</div>

	<div class="flex flex-col gap-4">
		<div class="flex items-center justify-between gap-4">
			<div>
				<Label for="p-speech" class="font-medium">Speech recognition</Label>
				<p class="text-muted-foreground text-xs">Talk instead of typing.</p>
			</div>
			<Switch id="p-speech" bind:checked={speech} />
		</div>
		<div class="flex items-center justify-between gap-4">
			<div>
				<Label for="p-memory" class="font-medium">Long-term memory</Label>
				<p class="text-muted-foreground text-xs">Remembers across sessions.</p>
			</div>
			<Switch id="p-memory" bind:checked={memory} />
		</div>
	</div>

	<Button variant="ai" size="lg" class="w-full" onclick={() => (created = true)}>
		<Sparkles class="size-4" />
		Create my companion
	</Button>
	{#if created}<p role="status" class="text-muted-foreground text-sm">
			Preview saved. Your companion uses {style} with a {tone || 'balanced'} tone.
		</p>{/if}
</div>
