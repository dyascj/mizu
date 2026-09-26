<script lang="ts">
	import { Tabs as TabsPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { edgeIndicator } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { getTabsRootState, setTabsListState, type TabsListVariant } from './context.js';
	import { scrollFrame } from './scroll-frame.js';
	import { slidingIndicator } from './sliding-indicator.js';

	type Props = WithoutChildrenOrChild<TabsPrimitive.ListProps> & {
		/**
		 * `pill` slides a tonal pill behind the active tab on a gray track.
		 * `underline` stretches a line toward the picked tab, then gathers it in,
		 * and floats a soft pill under the pointer as it moves across the tabs.
		 */
		variant?: TabsListVariant;
		/**
		 * `wrap` lets tabs flow onto more rows. `scroll` keeps one row that scrolls
		 * sideways, fading at whichever edge hides more tabs and offering page
		 * buttons on hover. In scroll mode `class` styles the scrolling frame.
		 */
		overflow?: 'wrap' | 'scroll';
		/** The tablist element. */
		ref?: HTMLElement | null;
		/** Classes for the list, or for the frame around it in scroll mode. */
		class?: string;
		/** `Tabs.Trigger` elements. */
		children: Snippet;
	};

	let {
		ref = $bindable(null),
		variant = 'pill',
		overflow = 'wrap',
		class: className,
		children,
		...restProps
	}: Props = $props();

	setTabsListState({
		get variant() {
			return variant;
		}
	});

	const root = getTabsRootState();
	const underline = edgeIndicator({ item: '[data-tabs-trigger]', active: '[data-state="active"]' });

	// Report which way each change of tab went, so the panel enters from that side.
	$effect(() => {
		const list = ref;
		if (!list || !root) return;
		const activeIndex = () =>
			[...list.querySelectorAll<HTMLElement>('[data-tabs-trigger]')].findIndex(
				(trigger) => trigger.dataset.state === 'active'
			);
		let previous = activeIndex();
		const observer = new MutationObserver(() => {
			const index = activeIndex();
			if (index !== -1 && previous !== -1 && index !== previous) {
				root.direction = Math.sign(index - previous);
			}
			previous = index;
		});
		observer.observe(list, { subtree: true, attributes: true, attributeFilter: ['data-state'] });
		return () => observer.disconnect();
	});

	/**
	 * A soft pill that follows the pointer across the tabs. Each time the pointer
	 * comes back into the list it fades in where it is instead of sliding over
	 * from wherever it was when the pointer left.
	 */
	const hoverPill: Attachment<HTMLElement> = (pill) => {
		const list = pill.parentElement;
		if (!list) return;
		let shown = false;
		const inset = 4;

		const over = (event: PointerEvent) => {
			if (event.pointerType === 'touch') return;
			const trigger = (event.target as Element | null)?.closest<HTMLElement>('[data-tabs-trigger]');
			if (!trigger || trigger.parentElement !== list || trigger.hasAttribute('disabled')) return;
			if (!shown) pill.style.transition = 'none';
			// Inset from top and bottom so the pill floats inside the tab, clear of the underline.
			pill.style.translate = `${trigger.offsetLeft}px ${trigger.offsetTop + inset}px`;
			pill.style.width = `${trigger.offsetWidth}px`;
			pill.style.height = `${trigger.offsetHeight - inset * 2}px`;
			if (!shown) {
				void pill.offsetWidth;
				pill.style.transition = '';
			}
			shown = true;
			pill.setAttribute('data-visible', '');
		};
		const leave = () => {
			shown = false;
			pill.removeAttribute('data-visible');
		};

		list.addEventListener('pointerover', over);
		list.addEventListener('pointerleave', leave);
		return () => {
			list.removeEventListener('pointerover', over);
			list.removeEventListener('pointerleave', leave);
		};
	};

	const scrolls = $derived(overflow === 'scroll');

	const listClass = $derived(
		cn(
			'relative items-center',
			variant === 'pill' ? 'gap-1' : 'gap-0.5',
			scrolls ? 'flex w-max' : 'inline-flex max-w-full flex-wrap',
			!scrolls && variant === 'pill' && 'bg-secondary rounded-xl p-1',
			!scrolls && className
		)
	);

	const arrow =
		'bg-card text-foreground absolute top-1/2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-full shadow-md transition-[opacity,scale] select-none active:scale-[0.96] motion-reduce:transition-opacity [&>svg]:size-4 pointer-events-none scale-[0.96] opacity-0 duration-(--duration-instant) ease-in data-visible:pointer-events-auto data-visible:scale-100 data-visible:opacity-100 data-visible:duration-(--duration-fast) data-visible:ease-out';
</script>

{#snippet list()}
	<TabsPrimitive.List
		bind:ref
		data-variant={variant}
		class={listClass}
		{...restProps}
		onpointerdown={(event: PointerEvent & { currentTarget: HTMLDivElement }) => {
			underline.cause = 'pointer';
			restProps.onpointerdown?.(event);
		}}
		onkeydown={(event: KeyboardEvent & { currentTarget: HTMLDivElement }) => {
			// Arrow keys fire in quick runs, so the line moves as one piece.
			underline.cause = 'key';
			restProps.onkeydown?.(event);
		}}
	>
		{#if variant === 'underline'}
			<span
				aria-hidden="true"
				data-slot="tabs-hover"
				class="bg-foreground/6 pointer-events-none absolute top-0 left-0 rounded-full opacity-0 transition-[translate,width,height,opacity] duration-(--duration-fast) ease-out data-visible:opacity-100 motion-reduce:transition-opacity [&:not([data-visible])]:duration-(--duration-instant) [&:not([data-visible])]:ease-in"
				{@attach hoverPill}
			></span>
			<!-- Clipped from two edges that travel on their own springs, so the line
			     reaches toward the picked tab, then pulls its tail in. -->
			<span
				aria-hidden="true"
				hidden
				data-slot="tabs-underline"
				class="bg-primary pointer-events-none absolute top-0 left-0 h-0.5 rounded-full"
				style="translate: var(--edge-left) calc(var(--edge-top) + var(--edge-height) - 2px); width: calc(var(--edge-right) - var(--edge-left));"
				{@attach underline.attach}
			></span>
		{:else}
			<span
				aria-hidden="true"
				hidden
				class="bg-primary-muted ease-spring-snappy pointer-events-none absolute top-0 left-0 rounded-full shadow-xs transition-[translate,width,height] duration-(--duration-spring-snappy) motion-reduce:transition-none"
				{@attach slidingIndicator('[data-tabs-trigger][data-state="active"]')}
			></span>
		{/if}
		{@render children?.()}
	</TabsPrimitive.List>
{/snippet}

{#if scrolls}
	<div
		data-slot="tabs-scroll-frame"
		class={cn(
			'relative max-w-full min-w-0',
			variant === 'pill' && 'bg-secondary rounded-full p-1',
			className
		)}
		{@attach scrollFrame()}
	>
		<div
			data-slot="tabs-scroller"
			class="-my-1 scroll-px-12 [scrollbar-width:none] overflow-x-auto overscroll-x-contain py-1 [&::-webkit-scrollbar]:hidden"
			style="mask-image: linear-gradient(to right, transparent, black var(--fade-start, 0px), black calc(100% - var(--fade-end, 0px)), transparent); -webkit-mask-image: linear-gradient(to right, transparent, black var(--fade-start, 0px), black calc(100% - var(--fade-end, 0px)), transparent);"
		>
			{@render list()}
		</div>
		<!-- Pointer shortcuts only: keyboard readers already move with the arrow
		     keys, so these stay out of the tab order and the accessibility tree. -->
		<button
			type="button"
			tabindex="-1"
			aria-hidden="true"
			data-slot="tabs-scroll-prev"
			class={cn(arrow, 'left-1')}
		>
			<ChevronLeft />
		</button>
		<button
			type="button"
			tabindex="-1"
			aria-hidden="true"
			data-slot="tabs-scroll-next"
			class={cn(arrow, 'right-1')}
		>
			<ChevronRight />
		</button>
	</div>
{:else}
	{@render list()}
{/if}
