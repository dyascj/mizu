<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import {
		setCarouselContext,
		type CarouselApi,
		type CarouselOptions,
		type CarouselOrientation,
		type CarouselPlugins
	} from './context.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		/** Embla options, such as `{ loop: true }`. */
		opts?: CarouselOptions;
		/** Embla plugins, such as autoplay. */
		plugins?: CarouselPlugins[];
		/** The axis the slides travel along. */
		orientation?: CarouselOrientation;
		/** Receives the Embla API once the carousel is ready. */
		setApi?: (api: CarouselApi | undefined) => void;
		/**
		 * `focus` snaps each slide to the center and lets its neighbours shrink
		 * and fade as they leave the middle, tracked frame by frame as you drag
		 * with a mouse, swipe, or step with the arrows. The edges fade out to
		 * hint at more. The neighbours are previews: inert until they arrive,
		 * with their animations paused. Give items a width below 100% so the
		 * neighbours show.
		 */
		effect?: 'none' | 'focus';
		/** Classes for the region. */
		class?: string;
		/** The region element. */
		ref?: HTMLDivElement | null;
		/** Content, Previous, and Next. */
		children?: Snippet;
	};

	// `effect` is renamed locally, since a variable by that name would shadow `$effect`.
	let {
		opts = {},
		plugins = [],
		orientation = 'horizontal',
		setApi = () => {},
		effect: effectMode = 'none',
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
	// Embla needs the reading direction up front to scroll a mirrored track.
	// Read once the region mounts; `opts.direction` still wins.
	let direction = $state<'ltr' | 'rtl'>('ltr');
	$effect(() => {
		if (ref) direction = getComputedStyle(ref).direction === 'rtl' ? 'rtl' : 'ltr';
	});

	// Focus centers every slide, the first and last included.
	const options = $derived<CarouselOptions>({
		...(effectMode === 'focus' ? { align: 'center', containScroll: false } : {}),
		direction,
		...opts,
		axis: orientation === 'horizontal' ? 'x' : 'y'
	});

	function onSelect(emblaApi: CarouselApi) {
		canScrollPrev = emblaApi.canScrollPrev();
		canScrollNext = emblaApi.canScrollNext();
		selectedIndex = emblaApi.selectedScrollSnap();
	}

	/** Names each slide by its position, unless it already has a name. */
	function labelSlides(emblaApi: CarouselApi) {
		const slides = emblaApi.slideNodes();
		slides.forEach((slide, index) => {
			if (!slide.hasAttribute('aria-label') || slide.dataset.carouselLabel !== undefined) {
				slide.setAttribute('aria-label', `${index + 1} of ${slides.length}`);
				slide.dataset.carouselLabel = '';
			}
		});
	}

	/** Marks the slides in the selected snap, so styles can find the centered one. */
	function markActive(emblaApi: CarouselApi) {
		const registry = emblaApi.internalEngine().slideRegistry;
		const selected = emblaApi.selectedScrollSnap();
		const active = new Set(registry[selected] ?? [selected]);
		const slides = emblaApi.slideNodes();
		const focused = typeof document === 'undefined' ? null : document.activeElement;
		let stranded = false;
		slides.forEach((slide, index) => {
			slide.toggleAttribute('data-active', active.has(index));
			// With the focus effect the faded neighbours are previews, not
			// content: inert until they arrive in the middle, so focus, clicks,
			// and assistive technology all land on the centered slide.
			const inert = effectMode === 'focus' && !active.has(index);
			if (inert && !slide.inert && focused && slide.contains(focused)) stranded = true;
			slide.inert = inert;
		});
		// Focus inside a slide that just turned inert would fall to the page and
		// take the arrow keys with it, so it follows the selection instead.
		if (stranded) focusSlide(slides[[...active][0] ?? selected]);
	}

	/** Focuses a slide's first control, or the slide itself when it has none. */
	function focusSlide(slide: HTMLElement | undefined) {
		if (!slide) return;
		const control = slide.querySelector<HTMLElement>(
			'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
		);
		if (control) {
			control.focus({ preventScroll: true });
			return;
		}
		slide.tabIndex = -1;
		slide.focus({ preventScroll: true });
	}

	function onInit(event: CustomEvent<CarouselApi>) {
		api = event.detail;
		scrollSnaps = api.scrollSnapList();
		onSelect(api);
		labelSlides(api);
		markActive(api);
		api.on('select', (emblaApi) => {
			onSelect(emblaApi);
			markActive(emblaApi);
		});
		api.on('reInit', (emblaApi) => {
			scrollSnaps = emblaApi.scrollSnapList();
			onSelect(emblaApi);
			labelSlides(emblaApi);
			markActive(emblaApi);
		});
		setApi(api);
	}

	/**
	 * How centered each slide is, from 1 in the middle to 0 once it has left
	 * the viewport, written to `--carousel-focus` on the slide. It follows the
	 * slide's own position, so dragging, swiping, looping, and arrows all read
	 * the same. Writes styles directly, so scrolling never re-renders.
	 */
	function paintFocus(emblaApi: CarouselApi) {
		const horizontal = orientation === 'horizontal';
		const viewport = emblaApi.rootNode().getBoundingClientRect();
		const middle = horizontal
			? viewport.left + viewport.width / 2
			: viewport.top + viewport.height / 2;
		const slides = emblaApi.slideNodes();
		// The first child is the card itself, without the slide's gutter.
		const boxes = slides.map((slide) => (slide.firstElementChild ?? slide).getBoundingClientRect());
		slides.forEach((slide, index) => {
			const box = boxes[index];
			const center = horizontal ? box.left + box.width / 2 : box.top + box.height / 2;
			const reach = horizontal
				? (viewport.width + box.width) / 2
				: (viewport.height + box.height) / 2;
			const focus = reach > 0 ? Math.max(0, 1 - Math.abs(center - middle) / reach) : 1;
			slide.style.setProperty('--carousel-focus', focus.toFixed(3));
		});
	}

	$effect(() => {
		const emblaApi = api;
		if (!emblaApi || effectMode !== 'focus') return;
		const paint = () => paintFocus(emblaApi);
		markActive(emblaApi);
		// Grab and grabbing cursors for a mouse drag, which Embla already handles.
		const grab = () => emblaApi.rootNode().setAttribute('data-dragging', '');
		const release = () => emblaApi.rootNode().removeAttribute('data-dragging');
		paint();
		for (const name of ['scroll', 'reInit', 'resize', 'slidesChanged'] as const) {
			emblaApi.on(name, paint);
		}
		emblaApi.on('pointerDown', grab);
		emblaApi.on('pointerUp', release);
		return () => {
			for (const name of ['scroll', 'reInit', 'resize', 'slidesChanged'] as const) {
				emblaApi.off(name, paint);
			}
			emblaApi.off('pointerDown', grab);
			emblaApi.off('pointerUp', release);
			release();
			for (const slide of emblaApi.slideNodes()) {
				slide.style.removeProperty('--carousel-focus');
				slide.inert = false;
			}
		};
	});

	// Only the centered slide's animations play, and only while the carousel
	// is on screen.
	$effect(() => {
		if (!ref || effectMode !== 'focus' || typeof IntersectionObserver === 'undefined') return;
		const node = ref;
		const observer = new IntersectionObserver(([entry]) => {
			node.toggleAttribute('data-onscreen', entry.isIntersecting);
		});
		observer.observe(node);
		return () => {
			observer.disconnect();
			node.removeAttribute('data-onscreen');
		};
	});

	// Reduced motion jumps straight to the next slide instead of gliding.
	function scrollPrev() {
		api?.scrollPrev(prefersReducedMotion());
	}
	function scrollNext() {
		api?.scrollNext(prefersReducedMotion());
	}
	function scrollTo(index: number, jump = false) {
		api?.scrollTo(index, jump || prefersReducedMotion());
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (
			e.defaultPrevented ||
			(e.target instanceof HTMLElement &&
				e.target.closest('input, textarea, select, [contenteditable]'))
		)
			return;
		// A mirrored track puts the next slide on the left, so the arrows swap.
		const rtl = getComputedStyle(e.currentTarget as HTMLElement).direction === 'rtl';
		const previousKey = orientation === 'vertical' ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
		const nextKey = orientation === 'vertical' ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
		if (e.key === previousKey) {
			e.preventDefault();
			scrollPrev();
		} else if (e.key === nextKey) {
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
		get effect() {
			return effectMode;
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
	data-slot="carousel"
	data-carousel-effect={effectMode}
	onkeydown={handleKeyDown}
	{...rest}
>
	{@render children?.()}
</div>
