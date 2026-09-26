<script lang="ts">
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import { Button } from '$lib/components/ui/button';
	import { TextReveal } from '$lib/components/ui/text-reveal';

	let run = $state(0);
</script>

<div class="flex w-full max-w-md flex-col gap-5">
	<div class="flex items-center justify-between gap-3">
		{#key run}
			<TextReveal
				as="h3"
				by="character"
				effect="rise"
				text="Your trip is planned."
				class="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
			/>
		{/key}
		<Button
			variant="ghost"
			size="icon"
			class="size-8 shrink-0"
			aria-label="Replay"
			onclick={() => run++}
		>
			<RotateCcw class="size-3.5" />
		</Button>
	</div>
	<!-- The surface and focus ring live on the wrapper, so the edge fade on the
	     scroller softens only the words, never the card. -->
	<div
		class="bg-card has-[:focus-visible]:ring-ring rounded-2xl shadow-sm has-[:focus-visible]:ring-2"
	>
		<!-- Focusable so keyboard readers can scroll it. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			role="region"
			aria-label="Trip summary"
			tabindex="0"
			class="h-72 overflow-y-auto overscroll-contain rounded-2xl [mask-image:linear-gradient(to_bottom,transparent,black_2.5rem,black_calc(100%-2.5rem),transparent)] px-6 outline-none"
		>
			<div class="pt-24 pb-40">
				<TextReveal
					as="p"
					trigger="scroll"
					class="text-lg leading-7 font-medium tracking-tight text-pretty"
					text="Three nights in Lisbon, a window seat on the Friday flight, and a table for two at the place with the tiled courtyard. I booked the hotel near the river so every morning starts with a walk along the water. Saturday is the tram up to the castle and a slow lunch, and I kept Sunday open on purpose, because the best part of a trip is usually the part nobody planned."
				/>
			</div>
		</div>
	</div>
</div>
