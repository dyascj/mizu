<script lang="ts" module>
	export type StickyStackItem = {
		/** The card's heading. Also names its jump button. */
		title: string;
		/** A line or two under the heading. */
		description: string;
	};
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The cards, in the order they pile up. */
		items: StickyStackItem[];
		/** Names the scroll region for assistive technology. */
		label: string;
		/** Content above the first card, such as a title and a hint to scroll. */
		heading?: Snippet;
		/** Label for the column of jump buttons beside the stack. */
		navLabel?: string;
		/** The root element. */
		ref?: HTMLDivElement | null;
		/** Classes for the root element. */
		class?: string;
	};

	let {
		items,
		label,
		heading,
		navLabel = 'Jump to card',
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	// Layout is fixed in pixels so every scroll position can be computed rather
	// than measured: sticky elements report their stuck position, not their
	// natural one, so measuring them mid-scroll would be wrong anyway.
	const VIEWPORT = 480;
	const HEADER = 112;
	const CARD = 280;
	/** Scroll distance between one card settling and the next one arriving. */
	const GAP = 80;
	const FIRST_TOP = 20;
	/** Each stuck card sits this much lower, leaving a strip of every card beneath it. */
	const STEP = 14;
	/** Per card resting on top. Four deep reaches 0.84, still a stack rather than a fan. */
	const SCALE_PER_CARD = 0.04;
	const DIM_PER_CARD = 0.12;
	const MAX_DIM = 0.4;

	let scroller = $state<HTMLDivElement | null>(null);
	let front = $state(0);

	const header = $derived(heading ? HEADER : FIRST_TOP);
	const last = $derived(items.length - 1);
	const top = (i: number) => FIRST_TOP + i * STEP;
	const natural = (i: number) => header + i * (CARD + GAP);
	// Just enough room below the last card for it to reach its stuck spot, so
	// the scroll ends exactly as the stack completes.
	const bottomPad = $derived(Math.max(0, VIEWPORT - CARD - top(last)));

	$effect(() => {
		const el = scroller;
		const count = items.length;
		// Read so the effect reruns when the heading comes or goes.
		void header;
		if (!el || count === 0) return;
		const reduce = prefersReducedMotion();
		const cards = Array.from(el.querySelectorAll<HTMLElement>('[data-sticky-stack-card]'));
		const shades = Array.from(el.querySelectorAll<HTMLElement>('[data-sticky-stack-shade]'));
		const fills = Array.from(ref?.querySelectorAll<HTMLElement>('[data-sticky-stack-fill]') ?? []);
		let frame = 0;

		// One read (scrollTop) and a batch of scale and opacity writes per frame,
		// nothing that triggers layout.
		const update = () => {
			frame = 0;
			const s = el.scrollTop;
			// How far card i + 1 has slid over card i, 0 to 1: from its top edge
			// meeting card i's bottom edge until it sticks.
			const covered = Array.from({ length: count }, (_, i) => {
				if (i === count - 1) return 0;
				const start = natural(i + 1) - top(i) - CARD;
				const end = natural(i + 1) - top(i + 1);
				return Math.min(Math.max((s - start) / (end - start), 0), 1);
			});

			let depth = 0;
			for (let i = count - 1; i >= 0; i--) {
				depth += covered[i];
				if (cards[i]) cards[i].style.scale = reduce ? '' : String(1 - depth * SCALE_PER_CARD);
				if (shades[i]) {
					shades[i].style.opacity = reduce ? '0' : String(Math.min(depth * DIM_PER_CARD, MAX_DIM));
				}
				if (fills[i]) fills[i].style.scale = `1 ${i === 0 ? 1 : covered[i - 1]}`;
			}
			front = covered.filter((c) => c >= 0.5).length;
		};

		const onscroll = () => {
			frame ||= requestAnimationFrame(update);
		};

		update();
		el.addEventListener('scroll', onscroll, { passive: true });
		return () => {
			el.removeEventListener('scroll', onscroll);
			cancelAnimationFrame(frame);
		};
	});

	function goTo(i: number) {
		scroller?.scrollTo({
			top: i === 0 ? 0 : natural(i) - top(i),
			behavior: prefersReducedMotion() ? 'auto' : 'smooth'
		});
	}
</script>

<div {...restProps} bind:this={ref} class={cn('flex w-[min(480px,100%)] gap-2', className)}>
	<!-- A focusable region so keyboard readers can scroll it with the arrow keys. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		bind:this={scroller}
		role="region"
		aria-label={label}
		tabindex="0"
		class="bg-secondary dark:bg-card focus-visible:ring-ring focus-visible:ring-offset-background min-w-0 flex-1 [scrollbar-width:none] overflow-y-auto overscroll-contain rounded-3xl px-4 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [&::-webkit-scrollbar]:hidden"
		style:height="{VIEWPORT}px"
	>
		<div style:padding-bottom="{bottomPad}px">
			<div class="flex flex-col justify-center gap-1 px-2" style:height="{header}px">
				{@render heading?.()}
			</div>
			{#each items as item, i (i)}
				<article
					data-sticky-stack-card
					class="bg-card dark:bg-secondary sticky flex origin-top flex-col justify-between rounded-2xl p-6 shadow-sm will-change-transform"
					style:top="{top(i)}px"
					style:height="{CARD}px"
					style:margin-top={i === 0 ? '0px' : `${GAP}px`}
				>
					<span class="text-muted-foreground font-mono text-sm tabular-nums" aria-hidden="true">
						{String(i + 1).padStart(2, '0')}
					</span>
					<div class="flex flex-col gap-2">
						<h3 class="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
							{item.title}
						</h3>
						<p class="text-muted-foreground text-sm leading-relaxed text-pretty sm:text-[15px]">
							{item.description}
						</p>
					</div>
					<!-- Buried cards sink into the surface they sit on. -->
					<div
						data-sticky-stack-shade
						aria-hidden="true"
						class="bg-secondary dark:bg-card pointer-events-none absolute inset-0 rounded-[inherit] opacity-0"
					></div>
				</article>
			{/each}
		</div>
	</div>
	<nav aria-label={navLabel} class="flex flex-col justify-center">
		{#each items as item, i (i)}
			<button
				type="button"
				aria-label="{i + 1}. {item.title}"
				aria-current={front === i ? 'step' : undefined}
				onclick={() => goTo(i)}
				class="group focus-visible:ring-ring flex h-10 w-6 touch-manipulation items-center justify-center rounded-full transition-[scale] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 active:scale-[0.96] motion-reduce:transition-none"
			>
				<span
					class="bg-control h-7 w-[3px] overflow-hidden rounded-full transition-[scale] duration-(--duration-fast) ease-out group-hover:scale-x-150 motion-reduce:transition-none"
				>
					<!-- Fills as the card arrives. Matches scroll position 0 before the effect runs. -->
					<span
						data-sticky-stack-fill
						class="bg-primary block size-full origin-top"
						style:scale="1 {i === 0 ? 1 : 0}"
					></span>
				</span>
			</button>
		{/each}
	</nav>
</div>
