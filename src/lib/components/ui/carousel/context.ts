import { getContext, hasContext, setContext } from 'svelte';
import type {
	EmblaCarouselType as CarouselApi,
	EmblaOptionsType as CarouselOptions,
	EmblaPluginType as CarouselPlugins
} from 'embla-carousel';

export type { CarouselApi, CarouselOptions, CarouselPlugins };

export type CarouselOrientation = 'horizontal' | 'vertical';

export type CarouselState = {
	api: CarouselApi | undefined;
	orientation: CarouselOrientation;
	scrollPrev: () => void;
	scrollNext: () => void;
	canScrollPrev: boolean;
	canScrollNext: boolean;
	handleKeyDown: (e: KeyboardEvent) => void;
	options: CarouselOptions;
	plugins: CarouselPlugins[];
	onInit: (event: CustomEvent<CarouselApi>) => void;
	scrollSnaps: number[];
	selectedIndex: number;
	scrollTo: (index: number, jump?: boolean) => void;
};

const CAROUSEL_KEY = Symbol('mizu-carousel');

export function setCarouselContext(config: CarouselState) {
	setContext(CAROUSEL_KEY, config);
}

export function getCarouselContext(): CarouselState {
	if (!hasContext(CAROUSEL_KEY)) {
		throw new Error('A carousel part must be used within a <Carousel.Root> component.');
	}
	return getContext(CAROUSEL_KEY);
}
