<script lang="ts">
	import Volume from '@lucide/svelte/icons/volume';
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import { Slider } from '$lib/components/ui/slider';

	let volume = $state(60);
	let price = $state([2, 15]);
	let quiet = $state<HTMLSpanElement | null>(null);
	let loud = $state<HTMLSpanElement | null>(null);
	// Sliders take their direction as a prop; pass the page's, as an app would.
	let dir = $state<'ltr' | 'rtl'>('ltr');
	$effect(() => {
		if (quiet) dir = getComputedStyle(quiet).direction === 'rtl' ? 'rtl' : 'ltr';
	});

	/** The speaker icons ride the ends of the track as it stretches. */
	function carryIcons(offset: number) {
		// `offset` is on screen, negative to the left, where the quiet end sits
		// unless the page reads right to left.
		const left = `${Math.min(offset, 0)}px 0`;
		const right = `${Math.max(offset, 0)}px 0`;
		if (quiet) quiet.style.translate = dir === 'rtl' ? right : left;
		if (loud) loud.style.translate = dir === 'rtl' ? left : right;
	}

	const usd = (value: number) => `$${value}`;
</script>

<div class="flex w-full max-w-xs flex-col gap-8">
	<div class="flex flex-col gap-3">
		<div class="flex items-center justify-between text-sm">
			<span class="font-medium">Voice volume</span>
			<span class="text-muted-foreground tabular-nums">{volume}%</span>
		</div>
		<div class="text-muted-foreground flex items-center gap-3">
			<span bind:this={quiet} class="shrink-0"><Volume class="size-4" aria-hidden="true" /></span>
			<Slider
				aria-label="Voice volume"
				type="single"
				{dir}
				bind:value={volume}
				elastic
				onStretch={carryIcons}
			/>
			<span bind:this={loud} class="shrink-0"><Volume2 class="size-4" aria-hidden="true" /></span>
		</div>
	</div>

	<div class="flex flex-col gap-3">
		<div class="flex items-center justify-between text-sm">
			<span class="font-medium">Price per million tokens</span>
			<span class="text-muted-foreground tabular-nums">{usd(price[0])} to {usd(price[1])}</span>
		</div>
		<!-- Room above the track for the value bubbles. -->
		<Slider
			thumbLabels={['Minimum price', 'Maximum price']}
			type="multiple"
			{dir}
			bind:value={price}
			min={0}
			max={30}
			step={1}
			autoSort={false}
			showValue
			format={usd}
			class="mt-7"
		/>
	</div>
</div>
