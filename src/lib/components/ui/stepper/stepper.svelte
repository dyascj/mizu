<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import Check from '@lucide/svelte/icons/check';
	import { untrack } from 'svelte';
	import {
		duration,
		easeInOut,
		prefersReducedMotion,
		stagger as staggerStep
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Step = {
		/** The step's name. */
		label: string;
		/** A short line under the name. */
		description?: string;
	};

	type Props = Omit<HTMLAttributes<HTMLOListElement>, 'children'> & {
		/** The steps, in order. */
		steps: Step[];
		/** Active zero-based step. Out-of-range values display at the nearest valid step. */
		current?: number;
		/** Lays the trail out in a row or a column. */
		orientation?: 'horizontal' | 'vertical';
		/** Turns each node into a button that jumps to its step. */
		clickable?: boolean;
		/** Called with the step a node click jumps to. */
		onStepChange?: (i: number) => void;
		/**
		 * Marks every step complete, the current one included, for a flow that
		 * has finished. The last node draws its check.
		 */
		complete?: boolean;
		class?: string;
		/** The list element. */
		ref?: HTMLOListElement | null;
	};

	let {
		steps,
		current = $bindable(0),
		orientation = 'horizontal',
		clickable = false,
		onStepChange,
		complete = false,
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();

	/** One connector fills in this long: long enough to read as travel. */
	const LINE = duration.base;
	/** A jump across several steps runs the connectors as a relay, each starting halfway through the last. */
	const RELAY = staggerStep * 2;
	/** A step lights up just before the fill reaches it, so the node reads as the line's destination. */
	const ARRIVE = duration.fast;
	/** Half the halo: an 18px node radius plus a 4px ring. */
	const HALO = 22;

	const isVertical = $derived(orientation === 'vertical');
	const normalizedCurrent = $derived(
		steps.length === 0
			? -1
			: Math.min(steps.length - 1, Math.max(0, Math.round(Number.isFinite(current) ? current : 0)))
	);

	// Where the last move started, so delays run in the direction of travel:
	// forward fills from the start, back unfills from the end.
	let previous = untrack(() => normalizedCurrent);
	const move = $derived.by(() => {
		const to = normalizedCurrent;
		const from = previous;
		previous = to;
		return { from, to };
	});

	function lineDelay(k: number) {
		const { from, to } = move;
		if (to > from && k >= from && k < to) return (k - from) * RELAY;
		if (to < from && k >= to && k < from) return (from - 1 - k) * RELAY;
		return 0;
	}

	function stepDelay(j: number) {
		const { from, to } = move;
		if (to > from && j > from && j <= to) return (j - 1 - from) * RELAY + ARRIVE;
		if (to < from && j >= to && j < from) return (from - 1 - j) * RELAY + ARRIVE;
		return 0;
	}

	function go(i: number) {
		if (!clickable) return;
		current = i;
		onStepChange?.(i);
	}

	const announcement = $derived.by(() => {
		if (complete) return 'All steps complete';
		const { from, to } = move;
		if (from === to || to < 0) return '';
		return `Step ${to + 1} of ${steps.length}: ${steps[to]?.label ?? ''}`;
	});

	// The "you are here" halo is one capsule that inches along the trail: its
	// head leaves with the line fill and lands as it does, and its tail lets go
	// a beat later and catches up, so the halo stretches over the connector and
	// then pulls itself in around the new step.
	let halo = $state<HTMLElement | null>(null);
	let head = untrack(() => normalizedCurrent);
	let tail = head;
	let frame = 0;
	const initial = untrack(() => Math.max(0, normalizedCurrent));

	function place() {
		if (!halo || !ref) return;
		const lo = Math.min(head, tail);
		const hi = Math.max(head, tail);
		if (!isVertical) {
			// Equal columns, so percentages of one item's width find any center.
			halo.style.insetInlineStart = `calc(${lo + 0.5} * 100% - ${HALO}px)`;
			halo.style.width = `calc(${hi - lo} * 100% + ${HALO * 2}px)`;
			halo.style.top = '';
			halo.style.height = '';
			return;
		}
		// Rows vary in height, so the column measures its node centers.
		const nodes = Array.from(ref.querySelectorAll<HTMLElement>('[data-stepper-node]'));
		const origin = halo.parentElement?.getBoundingClientRect().top ?? 0;
		const centers = nodes.map((node) => {
			const box = node.getBoundingClientRect();
			return box.top - origin + box.height / 2;
		});
		const at = (x: number) => {
			const i = Math.min(centers.length - 1, Math.max(0, Math.floor(x)));
			const j = Math.min(centers.length - 1, i + 1);
			return centers[i] + (centers[j] - centers[i]) * (x - i);
		};
		halo.style.insetInlineStart = `${-4}px`;
		halo.style.width = `${HALO * 2}px`;
		halo.style.top = `${at(lo) - HALO}px`;
		halo.style.height = `${at(hi) - at(lo) + HALO * 2}px`;
		halo.style.opacity = centers.length ? '1' : '0';
	}

	$effect(() => {
		const to = normalizedCurrent;
		void isVertical;
		void steps.length;
		untrack(() => {
			cancelAnimationFrame(frame);
			const distance = Math.abs(to - head);
			if (
				distance === 0 ||
				prefersReducedMotion() ||
				typeof requestAnimationFrame === 'undefined'
			) {
				head = tail = to;
				place();
				return;
			}
			// Matches the relay: the last connector finishes filling here.
			const travel = (Math.max(1, Math.round(distance)) - 1) * RELAY + LINE;
			const fromHead = head;
			const fromTail = tail;
			let start: number | undefined;
			const tick = (now: number) => {
				start ??= now;
				const elapsed = now - start;
				const h = Math.min(1, elapsed / travel);
				const t = Math.min(1, Math.max(0, (elapsed - RELAY) / travel));
				head = fromHead + (to - fromHead) * easeInOut(h);
				tail = fromTail + (to - fromTail) * easeInOut(t);
				place();
				if (t < 1) frame = requestAnimationFrame(tick);
			};
			frame = requestAnimationFrame(tick);
		});
	});

	// A column's rows can rewrap, which moves its centers.
	$effect(() => {
		if (!isVertical || !ref || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(() => place());
		observer.observe(ref);
		return () => observer.disconnect();
	});

	$effect(() => () => cancelAnimationFrame(frame));

	function nodeClass(completed: boolean, active: boolean, upcoming: boolean) {
		return cn(
			'relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold tabular-nums [transition:background-color_var(--duration-base)_var(--ease-out)_var(--step-delay),color_var(--duration-base)_var(--ease-out)_var(--step-delay),box-shadow_var(--duration-base)_var(--ease-out)_var(--step-delay),scale_var(--duration-instant)_var(--ease-out)]',
			completed && 'bg-primary text-primary-foreground shadow-sm',
			active && !completed && 'bg-primary text-primary-foreground',
			upcoming && 'bg-secondary text-muted-foreground'
		);
	}

	// Glyphs cross in one cell: the arriving one springs up out of a blur and
	// waits for its node's fill, so a node is never blank while its color is
	// still catching up. The leaving one drops away faster.
	const glyphShown =
		'scale-100 opacity-100 blur-none [transition:scale_var(--duration-spring-snappy)_var(--ease-spring-snappy)_var(--step-delay),opacity_var(--duration-base)_var(--ease-out)_var(--step-delay),filter_var(--duration-base)_var(--ease-out)_var(--step-delay)]';
	const glyphHidden =
		'scale-25 opacity-0 blur-[4px] motion-reduce:scale-100 motion-reduce:blur-none [transition:scale_var(--duration-fast)_var(--ease-in)_var(--step-delay),opacity_var(--duration-fast)_var(--ease-in)_var(--step-delay),filter_var(--duration-fast)_var(--ease-in)_var(--step-delay)]';
</script>

<ol
	bind:this={ref}
	data-orientation={orientation}
	class={cn('flex w-full', isVertical ? 'flex-col' : 'items-start', className)}
	{...rest}
>
	{#each steps as step, i (i)}
		{@const completed = complete || i < normalizedCurrent}
		{@const active = i === normalizedCurrent}
		{@const upcoming = !completed && !active}
		<li
			class={cn(
				'group relative flex min-w-0 motion-reduce:[--line-delay:0ms]! motion-reduce:[--step-delay:0ms]!',
				isVertical ? 'gap-4 pb-6 last:pb-0' : 'flex-1 flex-col items-center'
			)}
			style:--line-delay="{lineDelay(i)}ms"
			style:--step-delay="{stepDelay(i)}ms"
			aria-current={active && !complete ? 'step' : undefined}
		>
			{#if i === 0}
				<!-- Sits under the nodes and the connectors, so at rest only a thin
				     ring shows and in flight the line runs through it like a tube. -->
				<span
					bind:this={halo}
					aria-hidden="true"
					data-stepper-halo=""
					class={cn(
						'bg-primary/10 pointer-events-none absolute rounded-full',
						isVertical ? 'opacity-0' : '-top-1 h-11'
					)}
					style:inset-inline-start={isVertical
						? undefined
						: `calc(${initial + 0.5} * 100% - ${HALO}px)`}
					style:width={isVertical ? undefined : `${HALO * 2}px`}
				></span>
			{/if}

			<!-- Connector: a track with a fill that runs toward the next step and
			     drains back the way it came. It starts clear of each node. -->
			{#if i < steps.length - 1}
				<span
					aria-hidden="true"
					class={cn(
						'bg-border pointer-events-none absolute overflow-hidden rounded-full',
						isVertical
							? 'start-[calc(1.125rem-1px)] top-10 bottom-1 w-0.5'
							: 'start-[calc(50%+1.375rem)] end-[calc(-50%+1.375rem)] top-[calc(1.125rem-1px)] h-0.5'
					)}
				>
					<span
						class={cn(
							'bg-primary absolute inset-0 rounded-full [transition:scale_var(--duration-base)_var(--ease-in-out)_var(--line-delay)] motion-reduce:transition-none',
							isVertical ? 'origin-top' : 'origin-left rtl:origin-right',
							completed
								? 'scale-100'
								: isVertical
									? 'scale-x-100 scale-y-0'
									: 'scale-x-0 scale-y-100'
						)}
					></span>
				</span>
			{/if}

			<!-- Node + label -->
			<div class={cn('relative z-10 flex', isVertical ? 'shrink-0' : 'flex-col items-center')}>
				{#snippet glyph()}
					<span class="grid place-items-center">
						<span class={cn('col-start-1 row-start-1', completed ? glyphHidden : glyphShown)}>
							{i + 1}
						</span>
						<Check
							class={cn('col-start-1 row-start-1 size-4', completed ? glyphShown : glyphHidden)}
						/>
					</span>
				{/snippet}
				{#if clickable}
					<button
						type="button"
						data-stepper-node=""
						onclick={() => go(i)}
						aria-label={step.label}
						class={cn(
							nodeClass(completed, active, upcoming),
							'focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96]',
							upcoming && 'hover:bg-accent'
						)}
					>
						{@render glyph()}
					</button>
				{:else}
					<span
						aria-hidden="true"
						data-stepper-node=""
						class={nodeClass(completed, active, upcoming)}
					>
						{@render glyph()}
					</span>
				{/if}
			</div>

			<div
				class={cn(
					'min-w-0 break-words',
					isVertical ? 'pt-1.5' : 'mt-2 flex flex-col items-center px-1 text-center'
				)}
			>
				<span
					class={cn(
						'block text-sm font-semibold [transition:color_var(--duration-base)_var(--ease-out)_var(--step-delay)]',
						upcoming ? 'text-muted-foreground' : 'text-foreground'
					)}
				>
					{step.label}
				</span><span class="sr-only"
					>{completed ? ', completed' : upcoming ? ', not started' : ''}</span
				>
				{#if step.description}
					<span class="text-muted-foreground mt-0.5 block text-xs">{step.description}</span>
				{/if}
			</div>
		</li>
	{/each}
</ol>
<span class="sr-only" aria-live="polite">{announcement}</span>
