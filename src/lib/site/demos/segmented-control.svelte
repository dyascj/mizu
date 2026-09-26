<script lang="ts">
	import * as SegmentedControl from '$lib/components/ui/segmented-control';
	import Zap from '@lucide/svelte/icons/zap';
	import Scale from '@lucide/svelte/icons/scale';
	import Brain from '@lucide/svelte/icons/brain';

	const modes = [
		{
			value: 'fast',
			label: 'Fast',
			icon: Zap,
			hint: 'Answers in a second or two. Best for quick lookups and rewrites.'
		},
		{
			value: 'balanced',
			label: 'Balanced',
			icon: Scale,
			hint: 'Thinks briefly before answering. A good default for most questions.'
		},
		{
			value: 'thorough',
			label: 'Thorough',
			icon: Brain,
			hint: 'Reasons step by step and checks its work. Best for code and analysis.'
		}
	];

	const id = $props.id();
	let mode = $state('balanced');
	const hint = $derived(modes.find((m) => m.value === mode)?.hint);
</script>

<div class="flex w-full max-w-sm flex-col gap-3">
	<p id="{id}-label" class="text-sm font-medium">Response mode</p>
	<SegmentedControl.Root
		bind:value={mode}
		fullWidth
		aria-labelledby="{id}-label"
		aria-describedby="{id}-hint"
	>
		{#each modes as { value, label, icon: Icon } (value)}
			<SegmentedControl.Item {value}>
				<Icon class="max-[380px]:hidden" />
				{label}
			</SegmentedControl.Item>
		{/each}
	</SegmentedControl.Root>
	<p id="{id}-hint" class="text-muted-foreground min-h-10 text-sm">{hint}</p>
</div>
