<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type { TransitionConfig } from 'svelte/transition';
	import { duration, easeOut, prefersReducedMotion, springs } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { getPaginationState } from './context.js';

	type Props = {
		/**
		 * How many places the row keeps once there are more pages than fit, counting
		 * the first page, the last page, and the gaps. Odd, at least 5. The row never
		 * changes width, so the arrows beside it never move.
		 */
		slots?: number;
		/** Classes for each slot. */
		class?: string;
	};

	let { slots = 7, class: className }: Props = $props();

	type Slot = number | 'start-gap' | 'end-gap';

	const pagination = getPaginationState();
	const places = $derived(Math.max(5, slots % 2 ? slots : slots + 1));

	function layout(page: number, total: number, size: number): Slot[] {
		if (total <= size) return Array.from({ length: total }, (_, i) => i + 1);
		if (page <= size - 3) {
			return [...Array.from({ length: size - 2 }, (_, i) => i + 1), 'end-gap', total];
		}
		if (page >= total - (size - 4)) {
			return [
				1,
				'start-gap',
				...Array.from({ length: size - 2 }, (_, i) => total - (size - 3) + i)
			];
		}
		const side = (size - 5) / 2;
		const middle = Array.from({ length: size - 4 }, (_, i) => page - side + i);
		return [1, 'start-gap', ...middle, 'end-gap', total];
	}

	// A gap counts as the middle of the pages it hides, so every slot has a
	// number to compare and knows which way to roll.
	function valueAt(row: Slot[], i: number): number {
		const slot = row[i];
		if (typeof slot === 'number') return slot;
		return ((row[i - 1] as number) + (row[i + 1] as number)) / 2;
	}

	// The row as it stood when a number was clicked. It holds while the pointer
	// is still over the control, so the number just clicked stays under it and
	// its neighbors stay where the reader was aiming. Leaving recenters the row.
	let frozen = $state<Slot[] | null>(null);
	const standard = $derived(layout(pagination.page, pagination.totalPages, places));
	const visible = $derived(
		frozen && frozen.length === places && frozen.includes(pagination.page) ? frozen : standard
	);

	// Each slot rolls up when its number grows and down when it shrinks, worked
	// out from the row that was on screen before.
	let shownRow: Slot[] = [];
	const view = $derived.by(() => {
		const row = visible;
		const dirs = row.map((_, i) =>
			i < shownRow.length && shownRow.length === row.length
				? Math.sign(valueAt(row, i) - valueAt(shownRow, i))
				: 0
		);
		shownRow = row;
		return { row, dirs };
	});

	let settle: ReturnType<typeof setTimeout> | undefined;
	let pointerType = '';
	let focusCurrent = false;
	let list = $state<HTMLElement | null>(null);

	function recenter() {
		clearTimeout(settle);
		frozen = null;
	}

	function go(next: number) {
		pagination.setPage(Math.min(Math.max(next, 1), pagination.totalPages));
	}

	function pick(page: number) {
		frozen = visible;
		go(page);
		// Touch has no hover to wait out, so it recenters on its own once the tap
		// has registered.
		if (pointerType === 'touch') {
			clearTimeout(settle);
			settle = setTimeout(() => (frozen = null), duration.slow);
		}
	}

	function onkeydown(event: KeyboardEvent) {
		const page = pagination.page;
		// The row mirrors in right-to-left text, so the arrows follow what they point at.
		const forward = getComputedStyle(event.currentTarget as Element).direction === 'rtl' ? -1 : 1;
		const target = {
			ArrowLeft: page - forward,
			ArrowRight: page + forward,
			Home: 1,
			End: pagination.totalPages
		}[event.key];
		if (target === undefined) return;
		event.preventDefault();
		const next = Math.min(Math.max(target, 1), pagination.totalPages);
		// Already there, at either end: nothing moves, so nothing may wait to
		// pull focus on some later change.
		if (next === page) return;
		focusCurrent = true;
		recenter();
		go(next);
	}

	// Arrow keys move the page, and focus follows it to wherever it now sits.
	$effect(() => {
		void pagination.page;
		if (!focusCurrent || !list) return;
		focusCurrent = false;
		list.parentElement
			?.querySelector<HTMLElement>('[data-pagination-slot] [aria-current="page"]')
			?.focus();
	});

	$effect(() => () => clearTimeout(settle));

	/** Hooks the whole control: leaving it, blurring out of it, or using its arrows recenters. */
	const control: Attachment<HTMLElement> = (node) => {
		list = node;
		const root = node.closest<HTMLElement>('[data-pagination-root]') ?? node.parentElement;
		if (!root) return;
		const leave = (event: PointerEvent) => {
			if (event.pointerType !== 'touch') recenter();
		};
		const blur = (event: FocusEvent) => {
			if (!root.contains(event.relatedTarget as Node | null)) recenter();
		};
		const click = (event: MouseEvent) => {
			if (
				(event.target as Element | null)?.closest('[data-pagination-prev], [data-pagination-next]')
			) {
				recenter();
			}
		};
		root.addEventListener('pointerleave', leave);
		root.addEventListener('focusout', blur);
		root.addEventListener('click', click);
		return () => {
			root.removeEventListener('pointerleave', leave);
			root.removeEventListener('focusout', blur);
			root.removeEventListener('click', click);
		};
	};

	// The pill glides from the slot it last sat in, on a spring with no bounce.
	let pillFrom: number | null = null;
	const glide: Attachment<HTMLElement> = (pill) => {
		const slot = pill.parentElement;
		if (!slot) return;
		const x = slot.offsetLeft;
		if (pillFrom !== null && pillFrom !== x && !prefersReducedMotion()) {
			pill.style.transition = 'none';
			pill.style.translate = `${pillFrom - x}px 0`;
			void pill.offsetWidth;
			pill.style.transition = '';
			pill.style.translate = '';
		}
		pillFrom = x;
	};

	// Blurred at the ends of travel, so the outgoing and incoming numbers read as
	// one wheel turning rather than two labels swapping.
	function roll(
		_node: Element,
		{ dir, leaving }: { dir: number; leaving: boolean }
	): TransitionConfig {
		const distance = 14 * (leaving ? -dir : dir);
		if (prefersReducedMotion() || dir === 0) {
			return { duration: duration.fast, css: (t) => `opacity: ${t}` };
		}
		if (leaving) {
			// Leaves quicker than the new number arrives, so the eye lands on the new one.
			return {
				duration: duration.fast,
				easing: easeOut,
				css: (t, u) => `opacity: ${t}; translate: 0 ${u * distance}px; filter: blur(${u * 3}px)`
			};
		}
		const { duration: total, easing } = springs.snappy;
		return {
			duration: total,
			css: (t) => {
				const moved = easing(t);
				const shown = easeOut(Math.min(1, (t * total) / duration.base));
				return `opacity: ${shown}; translate: 0 ${(1 - moved) * distance}px; filter: blur(${(1 - shown) * 3}px)`;
			}
		};
	}
</script>

<!-- Keyed by place, not page: the slots never move or remount, only the numbers
     printed on them change. -->
{#each view.row as slot, index (index)}
	{@const current = slot === pagination.page}
	{@const label = typeof slot === 'number' ? String(slot) : '…'}
	<li
		data-pagination-slot=""
		class={cn('relative grid size-8 shrink-0 place-items-center sm:size-9', className)}
		{@attach index === 0 ? control : undefined}
	>
		{#if typeof slot === 'number'}
			<button
				type="button"
				data-pagination-page=""
				data-selected={current ? '' : undefined}
				aria-label="Page {slot}"
				aria-current={current ? 'page' : undefined}
				onpointerdown={(event) => (pointerType = event.pointerType)}
				onclick={() => pick(slot)}
				{onkeydown}
				class={cn(
					'peer focus-visible:ring-ring focus-visible:ring-offset-background absolute inset-0 rounded-full outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2',
					!current &&
						'hover:bg-secondary transition-[background-color,scale] duration-(--duration-fast) ease-out active:scale-[0.96] motion-reduce:active:scale-100'
				)}
			></button>
		{:else}
			<span class="sr-only">More pages</span>
		{/if}
		{#if current}
			<span
				aria-hidden="true"
				class="bg-primary ease-spring-snappy pointer-events-none absolute inset-0 rounded-full shadow-sm transition-[translate] duration-(--duration-spring-snappy)"
				{@attach glide}
			></span>
		{/if}
		<span
			aria-hidden="true"
			class={cn(
				'pointer-events-none relative grid h-5 place-items-center text-sm font-semibold tabular-nums transition-[color,scale] duration-(--duration-fast) ease-out select-none peer-active:scale-[0.96]',
				current
					? 'text-primary-foreground'
					: typeof slot === 'number'
						? 'text-foreground'
						: 'text-muted-foreground'
			)}
		>
			{#key label}
				<span
					class="col-start-1 row-start-1"
					in:roll={{ dir: view.dirs[index] ?? 0, leaving: false }}
					out:roll={{ dir: view.dirs[index] ?? 0, leaving: true }}
				>
					{label}
				</span>
			{/key}
		</span>
	</li>
{/each}
