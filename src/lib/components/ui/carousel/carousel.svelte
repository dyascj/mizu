<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import {
		setCarouselContext,
		type CarouselApi,
		type CarouselOptions,
		type CarouselOrientation,
		type CarouselPlugins
	} from './context.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		opts?: CarouselOptions;
		plugins?: CarouselPlugins[];
		orientation?: CarouselOrientation;
		setApi?: (api: CarouselApi | undefined) => void;
		class?: string;
		ref?: HTMLDivElement | null;
		children?: Snippet;
	};

	let {
		opts = {},
		plugins = [],
		orientation = 'horizontal',
		setApi = () => {},
		class: className,
		ref = $bindable(null),
		children,
		...rest
	}: Props = $props();

	let api = $state<CarouselApi>();
	let canScrollPrev = $state(false);
	let canScrollNext = $state(false);
	let scrollSnaps = $state<number[]>([]);
	let selectedIndex = $state(0);

	const options = $derived<CarouselOptions>({
		...opts,
		axis: orientation === 'horizontal' ? 'x' : 'y'
	});

	function onSelect(emblaApi: CarouselApi) {
		canScrollPrev = emblaApi.canScrollPrev();
		canScrollNext = emblaApi.canScrollNext();
		selectedIndex = emblaApi.selectedScrollSnap();
	}

	function onInit(event: CustomEvent<CarouselApi>) {
		api = event.detail;
		scrollSnaps = api.scrollSnapList();
		onSelect(api);
		api.on('select', onSelect);
		api.on('reInit', (emblaApi) => {
			scrollSnaps = emblaApi.scrollSnapList();
			onSelect(emblaApi);
		});
		setApi(api);
	}

	function scrollPrev() {
		api?.scrollPrev();
	}
	function scrollNext() {
		api?.scrollNext();
	}
	function scrollTo(index: number, jump?: boolean) {
		api?.scrollTo(index, jump);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			scrollPrev();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			scrollNext();
		}
	}

	setCarouselContext({
		get api() {
			return api;
		},
		get orientation() {
			return orientation;
		},
		get canScrollPrev() {
			return canScrollPrev;
		},
		get canScrollNext() {
			return canScrollNext;
		},
		get options() {
			return options;
		},
		get plugins() {
			return plugins;
		},
		get scrollSnaps() {
			return scrollSnaps;
		},
		get selectedIndex() {
			return selectedIndex;
		},
		scrollPrev,
		scrollNext,
		scrollTo,
		handleKeyDown,
		onInit
	});
</script>

<div
	bind:this={ref}
	class={cn('relative', className)}
	role="region"
	aria-roledescription="carousel"
	onkeydown={handleKeyDown}
	{...rest}
>
	{@render children?.()}
</div>
