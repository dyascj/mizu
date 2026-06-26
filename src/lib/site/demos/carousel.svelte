<script lang="ts">
	import * as Carousel from '$lib/components/ui/carousel';

	const drops = [
		{ label: 'Rainfall', value: '1,240 L' },
		{ label: 'Spring', value: '860 L' },
		{ label: 'Reservoir', value: '3,500 L' },
		{ label: 'Glacier', value: '2,180 L' },
		{ label: 'Estuary', value: '940 L' }
	];
</script>

<Carousel.Root opts={{ loop: true }} class="w-full max-w-xs">
	<Carousel.Content>
		{#each drops as drop, i (drop.label)}
			<Carousel.Item>
				<div
					class="glass-strong gloss relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-2xl border border-[color:var(--glass-border)] shadow-glass"
				>
					<div class="relative z-10 flex flex-col items-center gap-1">
						<span class="font-display text-5xl font-bold tabular-nums text-primary">{i + 1}</span>
						<span class="text-sm font-medium">{drop.label}</span>
						<span class="text-xs tabular-nums text-muted-foreground">{drop.value}</span>
					</div>
				</div>
			</Carousel.Item>
		{/each}
	</Carousel.Content>
	<Carousel.Previous />
	<Carousel.Next />
</Carousel.Root>
