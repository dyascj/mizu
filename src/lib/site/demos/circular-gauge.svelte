<script lang="ts">
	import { CircularGauge } from '$lib/components/ui/circular-gauge';
	import { cn } from '$lib/utils.js';

	const sessions = [
		{ name: 'Chat', value: 34 },
		{ name: 'Agent', value: 72 },
		{ name: 'Batch', value: 91 }
	];

	let active = $state(1);
	const session = $derived(sessions[active]);
</script>

<div class="flex w-full max-w-sm flex-col items-center gap-6">
	<CircularGauge
		variant="ticks"
		value={session.value}
		label="Context used"
		threshold={85}
		size={260}
	/>
	<div role="group" aria-label="Session" class="bg-secondary flex gap-1 rounded-full p-1">
		{#each sessions as item, i (item.name)}
			<button
				type="button"
				aria-pressed={i === active}
				onclick={() => (active = i)}
				class={cn(
					'focus-visible:ring-ring h-9 rounded-full px-3.5 text-sm font-medium transition-[background-color,color,box-shadow,scale] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 active:scale-[0.96]',
					i === active
						? 'bg-card text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'
				)}
			>
				{item.name}
			</button>
		{/each}
	</div>
</div>
