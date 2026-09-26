<script lang="ts">
	import Carousel from './carousel.svelte';
	import CarouselContent from './carousel-content.svelte';
	import CarouselItem from './carousel-item.svelte';
	import CarouselNext from './carousel-next.svelte';
	import CarouselPrevious from './carousel-previous.svelte';
	import type { CarouselApi } from './context.js';

	let {
		effect = 'none',
		setApi
	}: { effect?: 'none' | 'focus'; setApi?: (api: CarouselApi | undefined) => void } = $props();
</script>

<Carousel {effect} {setApi} aria-label="Agent templates">
	<CarouselContent>
		{#each ['Research', 'Notes', 'Review'] as title (title)}
			<CarouselItem class="basis-1/2">
				<div>{title}<button type="button">Use {title}</button></div>
			</CarouselItem>
		{/each}
	</CarouselContent>
	<CarouselPrevious />
	<CarouselNext />
</Carousel>
