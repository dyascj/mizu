<script lang="ts">
	import { CompareSlider } from '$lib/components/ui/compare-slider';
	import Sparkles from '@lucide/svelte/icons/sparkles';
</script>

<!-- One scene drawn twice: flat and overcast, then relit by the model. The
     ridges are identical, so only the light changes as the divider moves. -->
{#snippet scene(relit: boolean)}
	<div class={['relative size-full overflow-hidden', relit ? 'aurora bg-card' : 'bg-muted']}>
		{#if relit}
			<div class="orb-peach absolute top-[18%] left-[58%] size-48 rounded-full blur-xl"></div>
		{/if}
		<svg
			viewBox="0 0 400 256"
			preserveAspectRatio="xMidYMax slice"
			class="absolute inset-0 size-full"
			aria-hidden="true"
		>
			<path
				d="M0 150 60 104l38 26 52-58 46 44 34-22 58 50 44-30 68 42v100H0Z"
				class={relit ? 'fill-foreground/12' : 'fill-foreground/10'}
			/>
			<path
				d="M0 186 48 150l40 20 50-44 58 52 36-24 52 34 46-28 70 38v58H0Z"
				class={relit ? 'fill-foreground/25' : 'fill-foreground/20'}
			/>
			<path
				d="M0 214 70 184l54 18 64-30 70 36 52-18 90 26v40H0Z"
				class={relit ? 'fill-foreground/45' : 'fill-foreground/35'}
			/>
		</svg>
	</div>
{/snippet}

<div class="flex w-full max-w-lg flex-col gap-3">
	<CompareSlider
		label="Original and relit photo comparison"
		beforeLabel="Original"
		afterLabel="Relit"
		value={45}
		class="h-64"
	>
		{#snippet before()}
			{@render scene(false)}
		{/snippet}
		{#snippet after()}
			{@render scene(true)}
		{/snippet}
	</CompareSlider>
	<div class="flex items-start gap-2 px-1">
		<Sparkles class="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
		<p class="text-muted-foreground text-sm text-pretty">
			<span class="text-foreground font-medium">Relight · Golden hour.</span> Drag the divider, or focus
			it and use the arrow keys.
		</p>
	</div>
</div>
