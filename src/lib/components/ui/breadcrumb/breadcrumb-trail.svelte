<script lang="ts" module>
	export type BreadcrumbCrumb = {
		/** The text shown for this level. */
		label: string;
		/** Where the level links to. The last crumb is the current page and never links. */
		href?: string;
	};
</script>

<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import type { HTMLAttributes } from 'svelte/elements';
	import { flip } from 'svelte/animate';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { blurIn, duration, prefersReducedMotion, springs } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import BreadcrumbPage from './breadcrumb-page.svelte';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The path from the top level down to the current page, which comes last. */
		items: BreadcrumbCrumb[];
		/**
		 * Called when a crumb or a folded crumb is picked, with its index in `items`.
		 * Providing it stops the browser from following the link, so the app can
		 * route itself.
		 */
		onNavigate?: (item: BreadcrumbCrumb, index: number) => void;
		/** The wrapper element. */
		ref?: HTMLDivElement | null;
		/** Classes for the wrapper. */
		class?: string;
	};

	let {
		items,
		onNavigate,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	let ruler = $state<HTMLOListElement | null>(null);
	// Index of the first crumb shown after the fold. 1 means nothing is folded.
	let start = $state(1);

	/*
	 * Fitting works off a hidden copy of the whole trail, so the widths never
	 * depend on what is currently folded and the decision cannot oscillate. The
	 * first crumb and the current page always stay; middle crumbs fold into the
	 * menu from the left, so the nearest parents stay visible longest.
	 */
	$effect(() => {
		const frame = ref;
		const copy = ruler;
		void items.length;
		if (!frame || !copy) return;

		const fit = () => {
			const widths = [...copy.children].map((node) => node.getBoundingClientRect().width);
			const fold = widths.pop() ?? 0;
			const n = widths.length;
			const available = frame.clientWidth;
			let next = Math.max(n - 1, 1);
			let tail = widths.slice(1).reduce((sum, width) => sum + width, 0);
			for (let k = 1; k < n; k++) {
				// Half a pixel of slack absorbs subpixel rounding between the copy and the row.
				if (widths[0] + (k > 1 ? fold : 0) + tail <= available + 0.5) {
					next = k;
					break;
				}
				tail -= widths[k];
			}
			start = next;
		};

		fit();
		const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
		observer?.observe(frame);
		observer?.observe(copy);
		let alive = true;
		// Web fonts can land after the first measure and change every width.
		document.fonts?.ready.then(() => alive && fit());
		return () => {
			alive = false;
			observer?.disconnect();
		};
	});

	const last = $derived(items.length - 1);
	const folded = $derived(Math.min(start, Math.max(last, 1)));
	const hidden = $derived(items.slice(1, folded).map((item, i) => ({ item, index: i + 1 })));

	type Segment = { key: string; index: number; fold?: boolean };
	const segments = $derived.by(() => {
		const list: Segment[] = [];
		items.forEach((_, index) => {
			if (index !== 0 && index < folded) return;
			list.push({ key: `crumb-${index}`, index });
			if (index === 0 && hidden.length > 0) list.push({ key: 'fold', index: -1, fold: true });
		});
		return list;
	});

	function follow(event: MouseEvent, item: BreadcrumbCrumb, index: number) {
		if (!onNavigate) return;
		event.preventDefault();
		onNavigate(item, index);
	}

	// Crumbs slide over to close a gap at UI speed with no bounce; a trail that
	// overshoots reads as unstable. Arrivals resolve from a soft blur, and
	// departures leave faster so the gap is already closing when the eye looks.
	const slide = () => (prefersReducedMotion() ? { duration: 0 } : springs.snappy);
	const leave = (_node: Element) => ({
		duration: duration.instant,
		css: (t: number) => `opacity: ${t}`
	});
</script>

{#snippet separator()}
	<ChevronRight aria-hidden="true" class="text-muted-foreground/70 mx-0.5 size-3.5 shrink-0" />
{/snippet}

<div {...restProps} bind:this={ref} class={cn('relative w-full min-w-0', className)}>
	<!-- The whole trail, measured but never shown. The zero-size box keeps its
	     width from widening the page. -->
	<div
		aria-hidden="true"
		inert
		class="pointer-events-none invisible absolute top-0 left-0 size-0 overflow-hidden"
	>
		<ol bind:this={ruler} class="flex w-max items-center text-sm whitespace-nowrap">
			{#each items as item, index (index)}
				<li class="flex shrink-0 items-center">
					{#if index > 0}{@render separator()}{/if}
					<span class={cn('px-1.5', index === last && 'font-semibold')}>{item.label}</span>
				</li>
			{/each}
			<li class="flex shrink-0 items-center">
				{@render separator()}
				<span class="block w-8"></span>
			</li>
		</ol>
	</div>

	<ol class="text-muted-foreground relative flex h-9 min-w-0 items-center text-sm">
		{#each segments as segment (segment.key)}
			{@const item = items[segment.index]}
			<li
				class={cn('flex items-center', segment.index === last ? 'min-w-0' : 'shrink-0')}
				animate:flip={slide()}
				in:blurIn={{ duration: duration.base, blur: 4, y: 0 }}
				out:leave
			>
				{#if segment.index !== 0}{@render separator()}{/if}
				{#if segment.fold}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							aria-label="Show {hidden.length} hidden {hidden.length === 1 ? 'level' : 'levels'}"
							class="hover:bg-foreground/6 hover:text-foreground data-[state=open]:bg-foreground/6 data-[state=open]:text-foreground focus-visible:ring-ring grid h-8 w-8 place-items-center rounded-full transition-[color,background-color,scale] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 active:scale-[0.96]"
						>
							<Ellipsis class="size-4" aria-hidden="true" />
						</DropdownMenu.Trigger>
						<DropdownMenu.Content
							align="start"
							class="w-48 origin-(--bits-dropdown-menu-content-transform-origin)"
						>
							{#each hidden as { item: crumb, index } (index)}
								<DropdownMenuPrimitive.Item
									class="data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground flex cursor-pointer items-center rounded-lg px-2 py-1.5 text-sm outline-none select-none"
								>
									{#snippet child({ props })}
										<a
											{...props}
											href={crumb.href}
											onclick={(event) => follow(event, crumb, index)}
										>
											<span class="truncate">{crumb.label}</span>
										</a>
									{/snippet}
								</DropdownMenuPrimitive.Item>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{:else if segment.index === last}
					<!-- The current page is text, not a link: it cannot take you anywhere. -->
					<BreadcrumbPage class="block truncate px-1.5">{item.label}</BreadcrumbPage>
				{:else}
					<a
						href={item.href}
						onclick={(event) => follow(event, item, segment.index)}
						class="hover:text-foreground focus-visible:ring-ring inline-flex h-8 items-center rounded-full px-1.5 whitespace-nowrap transition-[color,scale] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 active:scale-[0.96] motion-reduce:active:scale-100"
					>
						{item.label}
					</a>
				{/if}
			</li>
		{/each}
	</ol>
</div>
