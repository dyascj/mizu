<script lang="ts" module>
	export type ScrollSpineItem = {
		/** The `id` of the section's heading or wrapper in the document. */
		id: string;
		/** The section's heading, shown beside its band or as a preview on hover. */
		label: string;
	};
</script>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { prefersReducedMotion, SpringValue, springPresets } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
		/** The sections in document order. Each band is as tall as its section is long. */
		items: ScrollSpineItem[];
		/**
		 * The element that scrolls. Leave it out to follow the page itself. Pass
		 * `null` while the element has not mounted yet, such as a `bind:this`
		 * reference, and the spine waits for it. Sections are found by id either way.
		 */
		target?: HTMLElement | null;
		/** Height of the whole spine in pixels. The bands share it in proportion. */
		height?: number;
		/**
		 * Where the reading line sits, as a share of the viewport from the top. A
		 * section counts as current once its start passes the line.
		 */
		readLine?: number;
		/** Accessible name for the navigation landmark. */
		label?: string;
		/** Called with the id of the section being read whenever it changes. */
		onSectionChange?: (id: string) => void;
		/** The nav element. */
		ref?: HTMLElement | null;
		/**
		 * Classes for the nav. Below 120px wide the spine shows bands alone and
		 * each heading appears on hover or focus. Set `--scroll-spine-surface` to
		 * the color behind the spine so the reading dot cuts cleanly into the bands.
		 */
		class?: string;
	};

	let {
		items,
		target,
		height = 320,
		readLine = 0.3,
		label = 'On this page',
		onSectionChange,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	type Band = { top: number; height: number };

	/** Room between bands so neighboring sections read as separate pieces. */
	const GAP = 8;
	/** Big enough to hover and click, and with headings, tall enough for a line. */
	const MIN_BAND = 14;
	const MIN_BAND_LABELLED = 24;
	/** Below this width there is no room for headings beside the bands. */
	const INLINE_MIN = 120;
	/** The current-section block reaches a little past its band. */
	const MARK_PAD = 4;
	/** Scroll positions land a few pixels short of the end on some trackpads. */
	const END_SLACK = 4;
	/** Space left above a heading after jumping to it, so it is not flush. */
	const JUMP_OFFSET = 16;

	let inline = $state(true);
	let current = $state(0);
	let preview = $state<number | null>(null);
	let measured = $state<Band[] | null>(null);

	let marker: HTMLDivElement | null = null;
	let notch: HTMLDivElement | null = $state(null);
	const fills: (HTMLSpanElement | null)[] = [];

	/** Keeps a list of elements by index without making the list reactive. */
	function collect<T extends Element>(list: (T | null)[], index: number) {
		return (node: T) => {
			list[index] = node;
			return () => {
				if (list[index] === node) list[index] = null;
			};
		};
	}
	// Scroll events read these, so they never wait on a render.
	let offsets: number[] = [];
	let docEnd = 0;

	const scroller = $derived(target === undefined ? 'window' : target);

	function layout(lengths: number[], minBand: number): Band[] {
		const total = lengths.reduce((a, b) => a + b, 0) || 1;
		const free = Math.max(0, height - GAP * (lengths.length - 1) - minBand * lengths.length);
		let y = 0;
		return lengths.map((length) => {
			const band = { top: y, height: minBand + (free * length) / total };
			y += band.height + GAP;
			return band;
		});
	}

	// Even bands until the document is measured, so the spine has a shape on
	// the server and before the first frame.
	const bands = $derived(
		measured && measured.length === items.length
			? measured
			: layout(
					items.map(() => 1),
					inline ? MIN_BAND_LABELLED : MIN_BAND
				)
	);

	function metrics(el: HTMLElement | undefined) {
		if (!el) {
			return {
				scrollTop: window.scrollY,
				viewport: window.innerHeight,
				height: document.documentElement.scrollHeight,
				offsetOf: (node: HTMLElement) => node.getBoundingClientRect().top + window.scrollY
			};
		}
		const top = el.getBoundingClientRect().top;
		return {
			scrollTop: el.scrollTop,
			viewport: el.clientHeight,
			height: el.scrollHeight,
			offsetOf: (node: HTMLElement) => node.getBoundingClientRect().top - top + el.scrollTop
		};
	}

	// Wide enough for words: every band carries its heading. Narrow: bands
	// only, and the heading shows on hover or focus.
	$effect(() => {
		const nav = ref;
		if (!nav || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(([entry]) => {
			inline = entry.contentRect.width >= INLINE_MIN;
		});
		observer.observe(nav);
		return () => observer.disconnect();
	});

	// Measure the sections and lay the bands out in proportion to their length.
	$effect(() => {
		const source = scroller;
		const list = items;
		const minBand = inline ? MIN_BAND_LABELLED : MIN_BAND;
		void height;
		if (!source) return;
		const el = source === 'window' ? undefined : source;

		const measure = () => {
			const m = metrics(el);
			const tops = list.map((item) => {
				const node = document.getElementById(item.id);
				return node ? m.offsetOf(node) : 0;
			});
			offsets = tops;
			docEnd = m.height;
			measured = layout(
				tops.map((top, i) => Math.max(1, (tops[i + 1] ?? m.height) - top)),
				minBand
			);
		};

		measure();
		if (typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(measure);
		observer.observe(el ? (el.firstElementChild ?? el) : document.body);
		return () => observer.disconnect();
	});

	// Follow the scroll: the reading dot and the read part of each band are
	// written straight to the DOM; Svelte only hears about it when the current
	// section changes.
	$effect(() => {
		const source = scroller;
		const layoutBands = bands;
		const line = readLine;
		void notch;
		if (!source) return;
		const el = source === 'window' ? undefined : source;
		let frame = 0;

		const update = () => {
			frame = 0;
			const tops = offsets;
			if (tops.length === 0) return;
			const m = metrics(el);
			const atEnd = m.scrollTop >= m.height - m.viewport - END_SLACK;
			const reading = m.scrollTop + m.viewport * line;
			let i = 0;
			while (i < tops.length - 1 && tops[i + 1] <= reading) i++;
			if (atEnd) i = tops.length - 1;
			const start = tops[i];
			const end = tops[i + 1] ?? docEnd;
			const within = atEnd
				? 1
				: Math.min(1, Math.max(0, (reading - start) / Math.max(1, end - start)));
			const band = layoutBands[i];
			if (band && notch) notch.style.translate = `0 ${band.top + within * band.height}px`;
			fills.forEach((fill, k) => {
				if (fill) fill.style.scale = `1 ${k < i ? 1 : k === i ? within : 0}`;
			});
			current = i;
		};
		const onscroll = () => {
			frame ||= requestAnimationFrame(update);
		};

		update();
		const node = el ?? window;
		node.addEventListener('scroll', onscroll, { passive: true });
		window.addEventListener('resize', onscroll, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			node.removeEventListener('scroll', onscroll);
			window.removeEventListener('resize', onscroll);
		};
	});

	// The marker moves like a caterpillar: the edge in the direction of travel
	// leads on a quick spring and the other catches up on a slower one, so it
	// stretches while it travels and settles to the size of the band it lands on.
	const paintMarker = () => {
		if (!marker) return;
		marker.style.top = `${markTop.current}px`;
		marker.style.height = `${Math.max(0, markBottom.current - markTop.current)}px`;
	};
	const markTop = new SpringValue(0, { onUpdate: paintMarker });
	const markBottom = new SpringValue(0, { onUpdate: paintMarker });
	let placed = false;

	$effect(() => {
		const band = bands[current];
		if (!band) return;
		const top = band.top - MARK_PAD;
		const bottom = band.top + band.height + MARK_PAD;
		if (!placed) {
			placed = true;
			markTop.jump(top);
			markBottom.jump(bottom);
			return;
		}
		const down = top >= markTop.current;
		// Never stopped between moves: a new target keeps each edge's velocity,
		// so fast scrolling bends the marker instead of restarting it.
		markTop.set(top, { preset: down ? springPresets.smooth : springPresets.snappy });
		markBottom.set(bottom, { preset: down ? springPresets.snappy : springPresets.smooth });
	});

	let announced = -1;
	$effect(() => {
		const id = items[current]?.id;
		if (announced === -1) {
			announced = current;
			return;
		}
		if (announced === current || !id) return;
		announced = current;
		onSectionChange?.(id);
	});

	$effect(() => () => {
		markTop.stop();
		markBottom.stop();
	});

	function jump(event: MouseEvent, index: number) {
		const source = scroller;
		const heading = document.getElementById(items[index].id);
		if (!source || !heading) return;
		event.preventDefault();
		const el = source === 'window' ? undefined : source;
		const top = Math.max(0, metrics(el).offsetOf(heading) - JUMP_OFFSET);
		(el ?? window).scrollTo({ top, behavior: prefersReducedMotion() ? 'instant' : 'smooth' });
		// Keyboard and screen reader users continue from the section they chose.
		if (heading.tabIndex < 0 && !heading.hasAttribute('tabindex')) {
			heading.setAttribute('tabindex', '-1');
		}
		heading.focus({ preventScroll: true });
	}
</script>

<nav
	{...restProps}
	bind:this={ref}
	aria-label={label}
	class={cn('relative w-44 shrink-0 select-none', className)}
	style:height="{height}px"
>
	<!-- The current section, as a soft block that stretches from band to band. -->
	<div
		bind:this={marker}
		aria-hidden="true"
		class={cn(
			'bg-primary/6 absolute rounded-lg',
			inline ? 'right-0 -left-2' : 'left-1/2 w-5 -translate-x-1/2'
		)}
	></div>
	<ol class="absolute inset-0">
		{#each items as item, i (item.id)}
			{@const band = bands[i]}
			{@const active = i === current}
			{#if band}
				<li class="absolute inset-x-0" style:top="{band.top}px" style:height="{band.height}px">
					<!-- The band: as tall as the section is long, filling in as it is read. -->
					<span
						aria-hidden="true"
						class={cn(
							'bg-primary/12 absolute inset-y-0 w-[3px] overflow-hidden rounded-full',
							inline ? 'left-0' : 'left-1/2 -translate-x-1/2'
						)}
					>
						<span
							{@attach collect(fills, i)}
							class="bg-primary absolute inset-0 origin-top rounded-full"
							style:scale="1 0"
						></span>
					</span>
					<a
						href="#{item.id}"
						aria-current={active ? 'location' : undefined}
						onclick={(event) => jump(event, i)}
						onpointerenter={(event) => {
							if (event.pointerType !== 'touch') preview = i;
						}}
						onpointerleave={() => {
							if (preview === i) preview = null;
						}}
						onfocus={(event) => {
							if (event.currentTarget.matches(':focus-visible')) preview = i;
						}}
						onblur={() => {
							if (preview === i) preview = null;
						}}
						class={cn(
							'group/band focus-visible:ring-ring absolute touch-manipulation rounded-md text-left outline-none focus-visible:ring-2 active:scale-[0.96] motion-safe:transition-[scale] motion-safe:duration-(--duration-fast) motion-safe:ease-out',
							inline ? 'inset-y-0 right-0 -left-2 pl-5' : 'inset-0'
						)}
					>
						{#if inline}
							<span
								class={cn(
									'block truncate text-[0.8125rem] leading-4 transition-[color] duration-(--duration-fast) ease-out',
									active
										? 'text-foreground font-medium'
										: 'text-muted-foreground group-hover/band:text-foreground'
								)}
							>
								{item.label}
							</span>
						{:else}
							<span class="sr-only">{item.label}</span>
						{/if}
					</a>
					{#if !inline}
						<!-- The heading, hung off the left of the band while hovered or focused. -->
						<span
							aria-hidden="true"
							class={cn(
								'bg-primary text-primary-foreground pointer-events-none absolute top-0 right-full z-10 mr-1 rounded-full px-3 py-1.5 text-[0.8125rem] font-medium whitespace-nowrap shadow-md motion-reduce:translate-x-0 motion-reduce:blur-none',
								preview === i
									? 'translate-x-0 opacity-100 blur-none transition-[opacity,translate,filter] duration-(--duration-base) ease-out'
									: 'translate-x-1.5 opacity-0 blur-[2px] transition-[opacity,translate,filter] duration-(--duration-instant) ease-in'
							)}
						>
							{item.label}
						</span>
					{/if}
				</li>
			{/if}
		{/each}
	</ol>
	<!-- Exactly where the reading line is, riding the bands. -->
	<div
		bind:this={notch}
		aria-hidden="true"
		class={cn(
			'bg-primary pointer-events-none absolute top-0 -mt-[4.5px] size-[9px] rounded-full ring-[3px] ring-[color:var(--scroll-spine-surface,var(--background))]',
			inline ? '-left-[3px]' : 'left-1/2 -ml-[4.5px]',
			!measured && 'opacity-0'
		)}
	></div>
</nav>
