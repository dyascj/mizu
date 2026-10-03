<script lang="ts">
	import { Select as SelectPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { getSelectContext } from './context.js';
	import { scrollReach } from './scroll-reach.js';
	import { cn } from '$lib/utils.js';

	type Props = WithoutChildrenOrChild<SelectPrimitive.ContentProps> & {
		/**
		 * `item-aligned` opens the list over the trigger with the current choice
		 * sitting exactly where the trigger shows it, the way macOS menus do.
		 * `popper` drops the list below the trigger and honors `side`, `align`,
		 * and `sideOffset`. Defaults to `item-aligned`, or `popper` when `side` or
		 * `align` is set.
		 */
		position?: 'item-aligned' | 'popper';
		/** Classes for the list panel. */
		class?: string;
		/** `Select.Item` and `Select.Group` elements. */
		children: Snippet;
	};

	const uid = $props.id();
	let {
		id = `mizu-select-${uid}`,
		ref = $bindable(null),
		class: className,
		position,
		sideOffset = 6,
		children,
		...restProps
	}: Props = $props();
	const context = getSelectContext();
	$effect(() => {
		if (context) context.contentId = ref?.id;
	});

	// Portaled to the body, the list would lose a right-to-left page's
	// direction. Without a `dir` prop it takes the trigger's.
	const dir = $derived(
		restProps.dir ??
			(context?.open && context.trigger
				? getComputedStyle(context.trigger).direction === 'rtl'
					? 'rtl'
					: 'ltr'
				: undefined)
	);

	const itemAligned = $derived(
		(position ?? (restProps.side || restProps.align ? 'popper' : 'item-aligned')) === 'item-aligned'
	);
	// Item-aligned content places itself, so it takes none of the floating options.
	const {
		side: _side,
		align: _align,
		alignOffset: _alignOffset,
		avoidCollisions: _avoidCollisions,
		collisionBoundary: _collisionBoundary,
		collisionPadding: _collisionPadding,
		arrowPadding: _arrowPadding,
		sticky: _sticky,
		hideWhenDetached: _hideWhenDetached,
		updatePositionStrategy: _updatePositionStrategy,
		strategy: _strategy,
		customAnchor: _customAnchor,
		...staticProps
	} = $derived(restProps);

	/** Keeps the panel this far inside the viewport. */
	const MARGIN = 8;

	/** Written through style directives, which survive bits-ui restyling the node. */
	let placement = $state<{ top: number; left: number; minWidth: number; origin: string } | null>(
		null
	);

	const px = (value: string) => Number.parseFloat(value) || 0;

	/**
	 * Places the panel so the current choice (or the first option) lands on the
	 * trigger: same row, same text column. When that would run off screen, the
	 * panel slides inward and scrolls its list by the same amount, so the choice
	 * stays put for as long as the list can make room.
	 */
	const alignToTrigger: Attachment<HTMLElement> = (panel) => {
		const trigger = context?.trigger;
		const viewport = panel.querySelector<HTMLElement>('[data-select-viewport]');
		if (!trigger || !viewport) return;

		let anchorTop = 0;
		let anchorLeft = 0;

		const place = () => {
			const box = trigger.getBoundingClientRect();
			const item =
				viewport.querySelector<HTMLElement>('[data-select-item][data-selected]') ??
				viewport.querySelector<HTMLElement>('[data-select-item]');
			const panelStyle = getComputedStyle(panel);
			const padTop = px(panelStyle.paddingTop);
			const itemTop = item?.offsetTop ?? 0;
			const itemHeight = item?.offsetHeight ?? box.height;
			// Text starts on the right in a right-to-left list.
			const rtl = panelStyle.direction === 'rtl';
			const start = rtl ? 'paddingRight' : 'paddingLeft';

			// Text columns: the option's label starts after the panel padding and
			// the item's check gutter; the trigger's after its own padding.
			const textShift =
				px(panelStyle[start]) +
				(item ? px(getComputedStyle(item)[start]) : 0) -
				px(getComputedStyle(trigger)[start]);
			// Measured at the width it will open with.
			panel.style.minWidth = `${box.width + textShift}px`;

			const height = panel.offsetHeight;
			const width = panel.offsetWidth;
			const maxScroll = viewport.scrollHeight - viewport.clientHeight;
			// The choice starts centered in the list when the list scrolls.
			let scroll = Math.min(
				Math.max(itemTop - (viewport.clientHeight - itemHeight) / 2, 0),
				maxScroll
			);
			let top = box.top + (box.height - itemHeight) / 2 - (padTop + itemTop - scroll);

			const minTop = MARGIN;
			const maxBottom = window.innerHeight - MARGIN;
			if (top < minTop) {
				const d = minTop - top;
				top += d;
				scroll += Math.min(d, maxScroll - scroll);
			}
			if (top + height > maxBottom) {
				const d = top + height - maxBottom;
				top -= d;
				scroll -= Math.min(d, scroll);
			}
			top = Math.max(top, minTop);

			const left = Math.max(
				MARGIN,
				Math.min(
					rtl ? box.right + textShift - width : box.left - textShift,
					window.innerWidth - MARGIN - width
				)
			);

			viewport.scrollTop = scroll;
			placement = {
				top,
				left,
				minWidth: box.width + textShift,
				// Grows out of the trigger itself, wherever it ended up in the panel.
				origin: `${box.left + box.width / 2 - left}px ${box.top + box.height / 2 - top}px`
			};
			anchorTop = top - box.top;
			anchorLeft = left - box.left;
		};

		// Page scroll carries the trigger away; the panel follows it without
		// re-running the alignment, so the list keeps its own scroll.
		const follow = (event: Event) => {
			if (event.target instanceof Node && panel.contains(event.target)) return;
			const box = trigger.getBoundingClientRect();
			if (placement) {
				placement.top = box.top + anchorTop;
				placement.left = box.left + anchorLeft;
			}
		};

		place();
		window.addEventListener('scroll', follow, true);
		window.addEventListener('resize', place);
		return () => {
			window.removeEventListener('scroll', follow, true);
			window.removeEventListener('resize', place);
			placement = null;
		};
	};

	/**
	 * Fades whichever edge of the list hides more options, written straight to
	 * the node so scrolling never re-renders the list.
	 */
	const edgeFades: Attachment<HTMLElement> = (viewport) => {
		const update = () => {
			viewport.toggleAttribute('data-fade-up', viewport.scrollTop > 1);
			viewport.toggleAttribute(
				'data-fade-down',
				viewport.scrollTop < viewport.scrollHeight - viewport.clientHeight - 1
			);
		};
		const frame = requestAnimationFrame(update);
		viewport.addEventListener('scroll', update, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			viewport.removeEventListener('scroll', update);
		};
	};

	// Enters from the trigger in a blink; leaves faster still, so choosing never
	// waits on the list.
	const surface =
		'bg-popover text-popover-foreground z-50 max-h-72 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl p-1 shadow-lg outline-none transition-[opacity,scale] duration-(--duration-fast) ease-out data-[starting-style]:opacity-0 motion-safe:data-[starting-style]:scale-[0.96] data-[state=closed]:pointer-events-none data-[state=closed]:opacity-0 data-[state=closed]:duration-(--duration-instant) data-[state=closed]:ease-in motion-safe:data-[state=closed]:scale-[0.96]';
</script>

{#snippet list()}
	<SelectPrimitive.Viewport
		class="w-full min-w-[var(--bits-select-anchor-width)] overscroll-contain [mask-image:linear-gradient(to_bottom,transparent,black_var(--fade-top),black_calc(100%_-_var(--fade-bottom)),transparent)] [--fade-bottom:0px] [--fade-top:0px] data-[fade-down]:[--fade-bottom:1.25rem] data-[fade-up]:[--fade-top:1.25rem]"
		{@attach edgeFades}
		{@attach scrollReach}
	>
		{@render children?.()}
	</SelectPrimitive.Viewport>
{/snippet}

<SelectPrimitive.Portal>
	{#if itemAligned}
		<SelectPrimitive.ContentStatic
			bind:ref
			{id}
			aria-label="Options"
			data-position="item-aligned"
			class={cn(surface, 'fixed top-0 left-0', className)}
			{...staticProps}
		>
			{#snippet child({ props })}
				<div
					{...props}
					{id}
					{dir}
					style:top={placement ? `${placement.top}px` : undefined}
					style:left={placement ? `${placement.left}px` : undefined}
					style:min-width={placement ? `${placement.minWidth}px` : undefined}
					style:transform-origin={placement?.origin}
					{@attach alignToTrigger}
				>
					{@render list()}
				</div>
			{/snippet}
		</SelectPrimitive.ContentStatic>
	{:else}
		<SelectPrimitive.Content
			bind:ref
			{id}
			aria-label="Options"
			data-position="popper"
			{sideOffset}
			class={cn(surface, 'origin-(--bits-select-content-transform-origin)', className)}
			{...restProps}
			{dir}
		>
			{#snippet child({ props, wrapperProps })}
				<div {...wrapperProps}>
					<div {...props} {id}>
						{@render list()}
					</div>
				</div>
			{/snippet}
		</SelectPrimitive.Content>
	{/if}
</SelectPrimitive.Portal>
