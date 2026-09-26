<script lang="ts">
	import {
		ColorSwatches,
		ColorSwatchesFlood,
		swatchInk,
		type Swatch
	} from '$lib/components/ui/color-swatches';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import { cn } from '$lib/utils.js';

	// The swatches are the data: muted mid-tones that hold their own on either theme.
	const swatches: Swatch[] = [
		{ name: 'Graphite', color: 'oklch(0.42 0.02 260)' },
		{ name: 'Clay', color: 'oklch(0.6 0.13 35)' },
		{ name: 'Ochre', color: 'oklch(0.78 0.12 80)' },
		{ name: 'Sage', color: 'oklch(0.72 0.08 145)' },
		{ name: 'Teal', color: 'oklch(0.58 0.08 210)' },
		{ name: 'Iris', color: 'oklch(0.56 0.13 280)' },
		{ name: 'Rose', color: 'oklch(0.7 0.1 0)' }
	];

	let value = $state('Iris');

	const index = $derived(
		Math.max(
			swatches.findIndex((swatch) => swatch.name === value),
			0
		)
	);
	const swatch = $derived(swatches[index]);
	// The color pours in from the side its swatch sits on.
	const flood = $derived({ color: swatch.color, origin: index / (swatches.length - 1) });
</script>

<div class="flex w-full max-w-sm flex-col items-center gap-5">
	<ColorSwatches {swatches} bind:value label="Assistant color" class="justify-center" />

	<!-- A preview, not a control: screen readers already hear the choice from
	     the radio group. -->
	<div aria-hidden="true" class="bg-card flex w-full flex-col gap-4 rounded-2xl p-4 shadow-sm">
		<div class="flex items-center gap-3">
			<ColorSwatchesFlood {...flood} order={0} class="grid size-9 place-items-center rounded-full">
				<Sparkles
					class="size-4 transition-[color] delay-(--stagger) duration-(--duration-base) ease-out"
					style="color: {swatchInk(swatch)}"
				/>
			</ColorSwatchesFlood>
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-semibold tracking-tight">Nova</p>
				<p class="text-muted-foreground truncate text-xs">Research assistant</p>
			</div>
			<!-- Every name shares one cell, so the tag keeps the longest one's width. -->
			<span class="bg-secondary grid shrink-0 rounded-full px-2.5 py-1 text-xs font-medium">
				{#each swatches as option (option.name)}
					<span
						class={cn(
							'col-start-1 row-start-1 transition-[opacity,filter,translate] ease-out motion-reduce:translate-y-0',
							option.name === value
								? 'translate-y-0 opacity-100 blur-none duration-(--duration-base)'
								: 'translate-y-0.5 opacity-0 blur-[4px] duration-(--duration-fast)'
						)}
					>
						{option.name}
					</span>
				{/each}
			</span>
		</div>

		<div class="flex flex-col gap-2 text-sm">
			<ColorSwatchesFlood
				{...flood}
				order={1}
				class="max-w-[85%] self-end rounded-2xl rounded-br-md px-3 py-2"
			>
				<span
					class="relative transition-[color] delay-(--stagger) duration-(--duration-base) ease-out"
					style="color: {swatchInk(swatch)}"
				>
					Summarize the launch notes
				</span>
			</ColorSwatchesFlood>
			<p class="bg-secondary max-w-[85%] self-start rounded-2xl rounded-bl-md px-3 py-2">
				Three changes matter most: pricing, the new API, and the migration window.
			</p>
		</div>

		<div class="flex flex-col gap-1.5">
			<div class="flex justify-between text-xs">
				<span class="text-muted-foreground">Context used</span>
				<span class="font-medium tabular-nums">64%</span>
			</div>
			<span class="bg-secondary block h-1.5 w-full overflow-hidden rounded-full">
				<ColorSwatchesFlood {...flood} order={2} class="block h-full w-[64%] rounded-full" />
			</span>
		</div>
	</div>
</div>
