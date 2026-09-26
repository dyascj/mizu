<script lang="ts" module>
	export type ChecklistTask = {
		/** Stable key for the task. */
		id: string;
		/** What to do, in a few words. */
		title: string;
		/** Why it matters, shown when the row opens. */
		description?: string;
		/** Label for the button that does the task, such as "Connect". */
		action?: string;
	};
</script>

<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { Button } from '$lib/components/ui/button';
	import { blurIn, duration, SpringValue, springPresets, stagger } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> & {
		/** The tasks, in the order they are best done. */
		tasks: ChecklistTask[];
		/** Ids of the finished tasks. */
		done?: string[];
		/** Ids of the rows whose details are open. */
		open?: string[];
		/** The checklist's heading. */
		title?: string;
		/** Names the progress ring for screen readers. */
		progressLabel?: string;
		/** Heading level for the title; the finished heading sits one below it. */
		level?: 2 | 3 | 4 | 5;
		/**
		 * Called when a task's action button is pressed. The task is then marked
		 * done, so start the real work here, such as opening the invite dialog.
		 */
		onAction?: (task: ChecklistTask) => void;
		/** Called when a task is checked or unchecked. */
		onToggle?: (task: ChecklistTask, done: boolean) => void;
		/** Called once the last task is done and the finish has played. */
		onComplete?: () => void;
		/** Shows a dismiss button in the finished state and is called when it is pressed. */
		onDismiss?: () => void;
		/** Heading of the finished state. */
		finishedTitle?: string;
		/** Line under the finished heading. */
		finishedDescription?: string;
		/** Label of the dismiss button. */
		dismissLabel?: string;
		/** Replaces the finished state's default content. */
		finished?: Snippet;
		/** The section element. */
		ref?: HTMLElement | null;
		class?: string;
	};

	let {
		tasks,
		done = $bindable([]),
		open = $bindable([]),
		title = 'Get started',
		progressLabel = 'Setup progress',
		level = 3,
		onAction,
		onToggle,
		onComplete,
		onDismiss,
		finishedTitle = "You're all set",
		finishedDescription = 'Everything is ready. You can find these steps again in settings.',
		dismissLabel = 'Dismiss',
		finished,
		ref = $bindable(null),
		class: className,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const titleId = `${uid}-title`;

	/** Lets the last check and the ring reaching 100 land before the card changes. */
	const CELEBRATE_AFTER = duration.slow * 2;

	const count = $derived(tasks.filter((task) => done.includes(task.id)).length);
	const complete = $derived(tasks.length > 0 && count === tasks.length);
	const progress = $derived(tasks.length ? count / tasks.length : 0);

	let celebrating = $state(false);
	let announcement = $state('');
	let finishedHeading = $state<HTMLElement | null>(null);
	/** Takes focus instead when a custom `finished` snippet has no heading of ours. */
	let finishedBox = $state<HTMLElement | null>(null);

	// The ring and its number are the reward, so they count up rather than
	// jump. The spring never overshoots, so the number never reads past 100.
	let arc: SVGCircleElement | null = null;
	let percent: HTMLElement | null = null;
	const ring: SpringValue = new SpringValue(0, { preset: springPresets.smooth, onUpdate: paint });
	ring.jump(progressAtStart());
	function progressAtStart() {
		return tasks.length ? tasks.filter((task) => done.includes(task.id)).length / tasks.length : 0;
	}
	function paint(v: number = ring.current) {
		arc?.setAttribute('stroke-dashoffset', String(1 - v));
		if (percent) percent.textContent = String(Math.round(v * 100));
	}
	function holdArc(el: SVGCircleElement) {
		arc = el;
		paint();
	}
	function holdPercent(el: HTMLElement) {
		percent = el;
		paint();
	}

	$effect(() => {
		ring.set(progress);
	});

	$effect(() => {
		if (!complete) {
			celebrating = false;
			return;
		}
		const timer = setTimeout(() => {
			// Keyboard focus inside the list would be lost as it collapses, so it
			// follows the change to the finished heading.
			const hadFocus = ref?.contains(document.activeElement) ?? false;
			celebrating = true;
			announcement = `All tasks complete. ${finishedTitle}.`;
			onComplete?.();
			if (hadFocus) {
				queueMicrotask(() => (finishedHeading ?? finishedBox)?.focus({ preventScroll: true }));
			}
		}, CELEBRATE_AFTER);
		return () => clearTimeout(timer);
	});

	$effect(() => () => ring.stop());

	function setDone(task: ChecklistTask, value: boolean) {
		const next = value
			? [...done.filter((id) => id !== task.id), task.id]
			: done.filter((id) => id !== task.id);
		done = next;
		const total = tasks.filter((t) => next.includes(t.id)).length;
		announcement = `${task.title} ${value ? 'done' : 'not done'}. ${total} of ${tasks.length} complete.`;
		onToggle?.(task, value);
	}

	function toggleOpen(id: string) {
		open = open.includes(id) ? open.filter((o) => o !== id) : [...open, id];
	}

	// The check springs up out of a blur; unchecking drops it away faster.
	const markShown =
		'scale-100 opacity-100 blur-none [transition:scale_var(--duration-spring-snappy)_var(--ease-spring-snappy),opacity_var(--duration-base)_var(--ease-out),filter_var(--duration-base)_var(--ease-out)]';
	const markHidden =
		'scale-25 opacity-0 blur-[4px] motion-reduce:scale-100 motion-reduce:blur-none transition-[scale,opacity,filter] duration-(--duration-fast) ease-in';
	const collapse = (shown: boolean) =>
		cn(
			'grid transition-[grid-template-rows] ease-out motion-reduce:transition-none',
			shown
				? 'grid-rows-[1fr] duration-(--duration-slow)'
				: 'grid-rows-[0fr] duration-(--duration-base)'
		);
</script>

<section
	bind:this={ref}
	aria-labelledby={titleId}
	class={cn(
		'bg-card text-card-foreground w-full max-w-md overflow-hidden rounded-2xl shadow-sm',
		className
	)}
	{...rest}
>
	<header class="flex items-center justify-between gap-4 p-5 pb-3">
		<div class="flex min-w-0 flex-col gap-0.5">
			<svelte:element this={`h${level}`} id={titleId} class="text-lg font-semibold tracking-tight">
				{title}
			</svelte:element>
			<p class="text-muted-foreground text-sm tabular-nums">
				{count} of {tasks.length} complete
			</p>
		</div>
		<div
			role="progressbar"
			aria-label={progressLabel}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={Math.round(progress * 100)}
			data-complete={complete ? '' : undefined}
			class="checklist-ring relative grid size-12 shrink-0 place-items-center"
		>
			<svg viewBox="0 0 48 48" class="absolute inset-0 size-full -rotate-90" aria-hidden="true">
				<circle cx="24" cy="24" r="20" fill="none" stroke-width="4" class="stroke-primary/10" />
				<circle
					{@attach holdArc}
					cx="24"
					cy="24"
					r="20"
					fill="none"
					stroke-width="4"
					stroke-linecap="round"
					pathLength="1"
					stroke-dasharray="1 1"
					stroke-dashoffset={1 - progressAtStart()}
					class="stroke-primary"
				/>
			</svg>
			<span aria-hidden="true" class="relative text-xs font-medium tracking-tight tabular-nums"
				><span {@attach holdPercent}>{Math.round(progressAtStart() * 100)}</span><span
					class="text-muted-foreground text-[0.625rem]">%</span
				></span
			>
		</div>
	</header>

	<!-- The list and the finished state swap by collapsing one and opening the
	     other, so the card only ever changes height below its header. -->
	<div class={collapse(!celebrating)} inert={celebrating}>
		<div class="min-h-0 overflow-hidden">
			<ul class="px-2 pb-2">
				{#each tasks as task (task.id)}
					{@const isDone = done.includes(task.id)}
					{@const isOpen = open.includes(task.id)}
					{@const expandable = !!(task.description || task.action)}
					{@const detailsId = `${uid}-${task.id}-details`}
					<li>
						<div class="flex items-center">
							<!-- A 40px hit area around the 20px box. -->
							<label class="group relative grid size-10 shrink-0 cursor-pointer place-items-center">
								<input
									type="checkbox"
									checked={isDone}
									onchange={(event) => setDone(task, event.currentTarget.checked)}
									aria-label={task.title}
									class="peer absolute inset-0 cursor-pointer opacity-0"
								/>
								<span
									aria-hidden="true"
									class={cn(
										'peer-focus-visible:ring-ring peer-focus-visible:ring-offset-card pointer-events-none grid size-5 place-items-center rounded-xs border transition-[background-color,border-color,scale] duration-(--duration-fast) ease-out group-active:scale-[0.94] peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
										isDone
											? 'bg-primary text-primary-foreground border-transparent'
											: 'bg-control border-input'
									)}
								>
									<Check class={cn('size-3.5', isDone ? markShown : markHidden)} strokeWidth={3} />
								</span>
							</label>

							{#snippet name()}
								<span
									class={cn(
										'relative min-w-0 truncate text-sm transition-colors duration-(--duration-base) ease-out',
										isDone ? 'text-muted-foreground' : 'text-foreground'
									)}
								>
									{task.title}
									<!-- Draws left to right when checked and retracts faster when
									     unchecked: slow where it rewards, quick where it undoes. -->
									<span
										aria-hidden="true"
										class={cn(
											'absolute start-0 top-1/2 h-px w-full origin-left bg-current ease-out motion-reduce:transition-none rtl:origin-right',
											isDone
												? 'scale-x-100 transition-[scale] duration-(--duration-slow)'
												: 'scale-x-0 transition-[scale] duration-(--duration-fast)'
										)}
									></span>
								</span>
							{/snippet}

							{#if expandable}
								<button
									type="button"
									aria-expanded={isOpen}
									aria-controls={detailsId}
									onclick={() => toggleOpen(task.id)}
									class="focus-visible:ring-ring hover:bg-secondary active:bg-secondary flex h-12 min-w-0 flex-1 items-center justify-between gap-3 rounded-xl ps-1 pe-3 text-start transition-colors duration-(--duration-fast) ease-out outline-none focus-visible:ring-2"
								>
									{@render name()}
									<ChevronDown
										aria-hidden="true"
										class={cn(
											'text-muted-foreground size-4 shrink-0 transition-[rotate] duration-(--duration-base) ease-out motion-reduce:transition-none',
											isOpen && 'rotate-180'
										)}
									/>
								</button>
							{:else}
								<span class="flex h-12 min-w-0 flex-1 items-center ps-1 pe-3">
									{@render name()}
								</span>
							{/if}
						</div>

						{#if expandable}
							<!-- 0fr to 1fr opens to the content's real height. The row above
							     never moves; only what is below it slides. -->
							<div id={detailsId} inert={!isOpen} class={collapse(isOpen)}>
								<div class="min-h-0 overflow-hidden">
									<div
										class={cn(
											'flex flex-col items-start gap-3 ps-11 pe-3 pb-4 motion-reduce:translate-y-0 motion-reduce:blur-none',
											isOpen
												? 'translate-y-0 opacity-100 blur-none transition-[opacity,filter,translate] duration-(--duration-base) ease-out'
												: '-translate-y-1 opacity-0 blur-[4px] transition-[opacity,filter,translate] duration-(--duration-fast) ease-in'
										)}
									>
										{#if task.description}
											<p class="text-muted-foreground text-sm leading-5 text-pretty">
												{task.description}
											</p>
										{/if}
										{#if task.action}
											<Button
												size="sm"
												variant={isDone ? 'secondary' : 'primary'}
												aria-disabled={isDone}
												class={cn('grid', isDone && 'text-muted-foreground cursor-default')}
												onclick={() => {
													if (isDone) return;
													onAction?.(task);
													setDone(task, true);
												}}
											>
												<!-- Both labels share one cell, so the button keeps its width. -->
												<span
													aria-hidden={isDone}
													class={cn(
														'col-start-1 row-start-1 transition-[opacity,filter] duration-(--duration-base) ease-out',
														isDone && 'opacity-0 blur-[4px]'
													)}
												>
													{task.action}
												</span>
												<span
													aria-hidden={!isDone}
													class="col-start-1 row-start-1 flex items-center justify-center gap-1.5"
												>
													<Check class={cn('size-4', isDone ? markShown : markHidden)} />
													<span
														class={cn(
															'transition-[opacity,filter] duration-(--duration-base) ease-out',
															!isDone && 'opacity-0 blur-[4px]'
														)}
													>
														Done
													</span>
												</span>
											</Button>
										{/if}
									</div>
								</div>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<div class={collapse(celebrating)} inert={!celebrating}>
		<div class="min-h-0 overflow-hidden">
			{#if celebrating}
				<div bind:this={finishedBox} tabindex="-1" class="px-5 pt-1 pb-5 outline-none">
					{#if finished}
						{@render finished()}
					{:else}
						<!-- A rare moment, so it gets a gentle staggered entrance: the
						     heading, then the note, then the button. -->
						<div class="flex flex-col items-start gap-1">
							<svelte:element
								this={`h${level + 1}`}
								bind:this={finishedHeading}
								tabindex="-1"
								class="text-base font-semibold tracking-tight outline-none"
								in:blurIn={{ delay: duration.instant, duration: duration.slow, y: 6, blur: 4 }}
							>
								{finishedTitle}
							</svelte:element>
							<p
								class="text-muted-foreground text-sm leading-5 text-pretty"
								in:blurIn={{
									delay: duration.instant + stagger,
									duration: duration.slow,
									y: 6,
									blur: 4
								}}
							>
								{finishedDescription}
							</p>
							{#if onDismiss}
								<div
									class="mt-3"
									in:blurIn={{
										delay: duration.instant + stagger * 2,
										duration: duration.slow,
										y: 6,
										blur: 4
									}}
								>
									<Button size="sm" onclick={onDismiss}>{dismissLabel}</Button>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<p class="sr-only" aria-live="polite">{announcement}</p>
</section>

<style>
	/* The ring gives a small bounce as it reaches 100, once the count lands. */
	.checklist-ring[data-complete] {
		animation: checklist-pop var(--duration-spring-bouncy) var(--ease-out) var(--duration-slow);
	}

	@keyframes checklist-pop {
		40% {
			scale: 1.08;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.checklist-ring[data-complete] {
			animation: none;
		}
	}
</style>
