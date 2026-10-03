<script lang="ts" module>
	export type DownloadStatus = 'idle' | 'downloading' | 'done';
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { duration as durations, prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLButtonAttributes, 'children' | 'onclick'> & {
		/** Where the download is. You own it: start, cancel, and finish from your callbacks. */
		status: DownloadStatus;
		/** From 0 to 1. Read while downloading. */
		progress: number;
		/** Called when the resting pill is pressed. Begin and set `status` to downloading. */
		onStart: () => void;
		/** Called when pressed mid-download. Abort and set `status` back to idle. */
		onCancel: () => void;
		/** Called `timeout` ms after the check appears. Set `status` back to idle. */
		onReset: () => void;
		/** The resting word and the button's name. */
		label?: string;
		/** The word beside the check once finished. */
		doneLabel?: string;
		/** The word that replaces the percent on hover or focus, and the name mid-download. */
		cancelLabel?: string;
		/** How long the check shows before `onReset`, in milliseconds. */
		timeout?: number;
		/** The button element. */
		ref?: HTMLButtonElement | null;
		/** Classes for the wrapper. Set a width on the button with `[&>button]:w-*` if needed. */
		class?: string;
	};

	let {
		status,
		progress,
		onStart,
		onCancel,
		onReset,
		label = 'Download',
		doneLabel = 'Done',
		cancelLabel = 'Cancel',
		timeout = 1800,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	/** Close enough to full that the check never waits on the glide's tail. */
	const FULL = 0.995;
	/** Glides between progress events without trailing far enough to feel dishonest. */
	const glide = durations.slow / 4;
	/** Cancelling drains the fill back out fast: the system is responding. */
	const drain = durations.fast / 4;

	let cover = $state<HTMLElement | null>(null);
	let covered = $state(true);
	let full = $state(false);
	/** The whole-number percent on show. Changes at most a hundred times per download. */
	let percent = $state(0);
	let note = $state('');
	let fill = 0;
	let target = 0;
	let frame = 0;
	let fadeTimer: ReturnType<typeof setTimeout> | undefined;
	/** Read as the fill starts moving, so it fills from the side reading starts on. */
	let rtl = false;
	let previous: DownloadStatus = untrack(() => status);

	function paint() {
		percent = Math.round(fill * 100);
		const rest = `${(1 - fill) * 100}%`;
		if (cover) cover.style.clipPath = `inset(0 ${rtl ? 0 : rest} 0 ${rtl ? rest : 0})`;
		full = fill >= FULL;
	}

	function follow(tau: number) {
		cancelAnimationFrame(frame);
		rtl = !!ref && getComputedStyle(ref).direction === 'rtl';
		if (prefersReducedMotion()) {
			frame = 0;
			fill = target;
			paint();
			return;
		}
		let last: number | undefined;
		const tick = (now: number) => {
			const dt = now - (last ?? now);
			last = now;
			fill += (target - fill) * (1 - Math.exp(-dt / tau));
			if (Math.abs(target - fill) < 0.001) fill = target;
			paint();
			frame = fill === target ? 0 : requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
	}

	$effect(() => {
		const next = status;
		const value = progress;
		untrack(() => {
			const prev = previous;
			previous = next;
			if (next === 'idle') {
				if (prev === 'downloading') {
					target = 0;
					follow(drain);
				} else if (prev === 'done') {
					// A finished download fades back to plain rather than draining, so
					// it never looks like the file was taken back.
					covered = false;
					fadeTimer = setTimeout(() => {
						cancelAnimationFrame(frame);
						fill = target = 0;
						paint();
						covered = true;
					}, durations.base);
				}
				return;
			}
			if (prev === 'idle') {
				// A fresh run starts empty, even if the last fade was still going.
				clearTimeout(fadeTimer);
				covered = true;
				fill = 0;
				paint();
			}
			// "Downloading" has had its say; finishing hands the live region to the
			// completion, and nothing is repeated once the button returns to rest.
			if (next === 'done') note = '';
			target = next === 'done' ? 1 : Math.min(Math.max(value, 0), 1);
			follow(glide);
		});
	});

	// The check waits for the fill to visibly reach the end, so it never appears
	// over a bar that is still moving.
	const checked = $derived(status === 'done' && full);
	const downloading = $derived(status === 'downloading');
	const view = $derived(checked ? 'done' : status === 'idle' ? 'idle' : 'busy');

	$effect(() => {
		if (!checked) return;
		const timer = setTimeout(() => onReset(), timeout);
		return () => clearTimeout(timer);
	});

	// Only the live word takes up space, so the icon and word stay centered as a
	// pair. When the word changes length they glide to their new spots instead
	// of jumping, while the words cross-fade in place.
	let before: number[] = [];
	const glideNodes = () => [...(ref?.querySelectorAll<HTMLElement>('[data-glide]') ?? [])];

	$effect.pre(() => {
		void view;
		untrack(() => (before = glideNodes().map((node) => node.getBoundingClientRect().left)));
	});

	$effect(() => {
		void view;
		untrack(() => {
			if (prefersReducedMotion()) return;
			const nodes = glideNodes();
			for (const node of nodes) node.style.translate = '';
			const shifts = nodes.map((node, index) =>
				before[index] === undefined ? 0 : before[index] - node.getBoundingClientRect().left
			);
			nodes.forEach((node, index) => {
				if (!shifts[index]) return;
				node.style.transition = 'none';
				node.style.translate = `${shifts[index]}px 0`;
			});
			void ref?.offsetWidth;
			for (const node of nodes) {
				node.style.transition = '';
				node.style.translate = '';
			}
		});
	});

	$effect(() => () => {
		cancelAnimationFrame(frame);
		clearTimeout(fadeTimer);
	});

	function onclick() {
		if (status === 'downloading') {
			note = 'Download cancelled';
			onCancel();
		} else if (status === 'idle') {
			note = 'Downloading';
			onStart();
		}
	}

	const iconShown =
		'scale-100 opacity-100 blur-none [transition:scale_var(--duration-spring-snappy)_var(--ease-spring-snappy),opacity_var(--duration-base)_var(--ease-out),filter_var(--duration-base)_var(--ease-out)]';
	const iconHidden =
		'scale-25 opacity-0 blur-[4px] transition-[scale,opacity,filter] duration-(--duration-fast) ease-in motion-reduce:scale-100 motion-reduce:blur-none';
	// Words enter over a longer beat and leave faster, so two never read as
	// overlapping. Hidden words leave the flow so only the live one sizes the row.
	const word = 'block whitespace-nowrap transition-[opacity,filter,translate] ease-out';
	const wordShown = 'relative translate-y-0 opacity-100 blur-none duration-(--duration-base)';
	const wordHidden =
		'absolute start-0 top-0 translate-y-0.5 opacity-0 blur-[4px] duration-(--duration-instant)';
</script>

{#snippet content()}
	<span aria-hidden="true" class="flex items-center gap-2">
		<span
			data-glide
			class="grid transition-[translate] duration-(--duration-spring-snappy) ease-(--ease-spring-snappy)"
		>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class={cn('col-start-1 row-start-1 size-5', view === 'done' ? iconHidden : iconShown)}
			>
				<!-- The arrow drops so its tip lands inside the tray and stays there
				     while the file comes in. No spring: a bounce would read as the
				     arrow hitting a floor. -->
				<g
					class={cn(
						'transition-[translate] ease-out',
						view === 'busy'
							? 'translate-y-[3.5px] duration-(--duration-slow)'
							: 'duration-(--duration-base)'
					)}
				>
					<path d="M12 15V3" />
					<path d="m7 10 5 5 5-5" />
				</g>
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			</svg>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.25"
				stroke-linecap="round"
				stroke-linejoin="round"
				class={cn('col-start-1 row-start-1 size-5', view === 'done' ? iconShown : iconHidden)}
			>
				<path d="M20 6 9 17l-5-5" />
			</svg>
		</span>
		<span
			data-glide
			class="relative transition-[translate] duration-(--duration-spring-snappy) ease-(--ease-spring-snappy)"
		>
			<span class={cn(word, view === 'idle' ? wordShown : wordHidden)}>{label}</span>
			<!-- One slot holds both the percent and the hover swap, so neither the
			     digits nor the swap nudge the icon. -->
			<span
				class={cn(
					word,
					'w-14 text-center tabular-nums',
					view === 'busy' ? wordShown : wordHidden,
					downloading &&
						'group-hover:-translate-y-0.5 group-hover:opacity-0 group-hover:blur-[4px] group-focus-visible:-translate-y-0.5 group-focus-visible:opacity-0 group-focus-visible:blur-[4px]'
				)}>{percent}%</span
			>
			<span
				class={cn(
					word,
					'w-14 text-center',
					wordHidden,
					downloading &&
						'group-hover:translate-y-0 group-hover:opacity-100 group-hover:blur-none group-focus-visible:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:blur-none'
				)}
			>
				{cancelLabel}
			</span>
			<span class={cn(word, view === 'done' ? wordShown : wordHidden)}>{doneLabel}</span>
		</span>
	</span>
{/snippet}

<span class={cn('relative inline-flex', className)}>
	<button
		{...restProps}
		bind:this={ref}
		type="button"
		aria-label={downloading
			? `${cancelLabel} ${label.charAt(0).toLowerCase()}${label.slice(1)}`
			: label}
		aria-busy={downloading || undefined}
		aria-disabled={status === 'done' || undefined}
		data-status={status}
		{onclick}
		class={cn(
			// A fixed width that fits every state, so nothing around it moves.
			'group focus-visible:ring-ring focus-visible:ring-offset-background bg-secondary text-foreground relative isolate inline-flex h-11 w-42 max-w-full touch-manipulation items-center justify-center overflow-hidden rounded-full text-sm font-medium transition-[scale] duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96]',
			status === 'done' && 'cursor-default'
		)}
	>
		{@render content()}
		<!-- The same content again, inverted and clipped to the fill, so the word
		     and icon change color exactly where the fill passes them. -->
		<span
			bind:this={cover}
			class={cn(
				'bg-primary text-primary-foreground absolute inset-0 flex items-center justify-center transition-opacity',
				covered ? 'opacity-100 duration-0' : 'opacity-0 duration-(--duration-base) ease-out'
			)}
			style="clip-path: inset(0 100% 0 0)"
		>
			{@render content()}
		</span>
	</button>

	<!-- Outside the button: a button's children are presentational, so a
	     progressbar nested inside would never reach assistive technology. -->
	<span
		role="progressbar"
		aria-label="Download progress"
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={downloading ? Math.round(Math.min(Math.max(progress, 0), 1) * 100) : undefined}
		aria-hidden={!downloading}
		class="sr-only"
	></span>
	<span class="sr-only" aria-live="polite">{checked ? 'Download complete' : note}</span>
</span>
