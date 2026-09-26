<script lang="ts">
	import * as Select from '$lib/components/ui/select';

	const models = [
		{ value: 'swift', label: 'Swift', detail: '32k' },
		{ value: 'balanced', label: 'Balanced', detail: '128k' },
		{ value: 'deep', label: 'Deep reasoning', detail: '200k' },
		{ value: 'vision', label: 'Vision', detail: '128k' },
		{ value: 'code', label: 'Code', detail: '256k' }
	];
	const voices = [
		'Arbor',
		'Breeze',
		'Cove',
		'Ember',
		'Juniper',
		'Maple',
		'Sol',
		'Spruce',
		'Vale',
		'Willow',
		'Wren'
	].map((name) => ({ value: name.toLowerCase(), label: name }));

	const uid = $props.id();
	let model = $state('balanced');
	let voice = $state('sol');

	const modelLabel = $derived(models.find((m) => m.value === model)?.label);
	const voiceLabel = $derived(voices.find((v) => v.value === voice)?.label);
</script>

<div class="bg-card flex w-full max-w-sm flex-col rounded-2xl px-5 py-2 shadow-sm">
	<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
		<span id="{uid}-model" class="text-sm font-medium">Model</span>
		<Select.Root type="single" bind:value={model}>
			<Select.Trigger class="w-44" aria-labelledby="{uid}-model {uid}-model-value">
				<span id="{uid}-model-value">{modelLabel}</span>
			</Select.Trigger>
			<Select.Content>
				{#each models as option (option.value)}
					<Select.Item value={option.value} label={option.label} class="gap-3">
						<span class="flex-1 truncate">{option.label}</span>
						<span class="text-muted-foreground text-xs tabular-nums">{option.detail}</span>
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>
	<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
		<span id="{uid}-voice" class="text-sm font-medium">Voice</span>
		<Select.Root type="single" bind:value={voice}>
			<Select.Trigger class="w-44" aria-labelledby="{uid}-voice {uid}-voice-value">
				<span id="{uid}-voice-value">{voiceLabel}</span>
			</Select.Trigger>
			<Select.Content>
				{#each voices as option (option.value)}
					<Select.Item value={option.value} label={option.label} />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>
</div>
