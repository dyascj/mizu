<script lang="ts" module>
	export type UploadStatus = 'idle' | 'uploading' | 'done';
</script>

<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Upload from '@lucide/svelte/icons/upload';
	import { untrack } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { duration as durations, prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLButtonAttributes, 'children' | 'onclick'> & {
		/** Where the upload is. You own it: start, cancel, and finish from your callbacks. */
		status: UploadStatus;
		/** From 0 to 1. Read while uploading. */
		progress: number;
		/** Called when the resting pill is pressed. Begin the upload and set `status` to uploading. */
		onStart: () => void;
		/** Called when the ring is pressed mid-upload. Abort it and set `status` back to idle. */
		onCancel: () => void;
		/** Called `timeout` ms after the check appears. Set `status` back to idle. */
		onReset: () => void;
		/** The resting label and the button's name at rest. */
		label?: string;
		/** The button's name while uploading, when pressing cancels. */
		cancelLabel?: string;
		/** The button's name once finished. Also announced. */
		completeLabel?: string;
		/** How long the check shows before `onReset`, in milliseconds. */
		timeout?: number;
		/** The button element. */
		ref?: HTMLButtonElement | null;
		/** Classes for the wrapper around the button and its ring. */
		class?: string;
	};

	let {
		status,
		progress,
		onStart,
		onCancel,
		onReset,
		label = 'Upload',
		cancelLabel = 'Cancel upload',
		completeLabel = 'Upload complete',
		timeout = 1500,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	/** The ring's circle sits 1px inside the 40px pill so its stroke never touches the edge. */
	const RADIUS = 18;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
	/** Close enough to full that the check never waits on the glide's tail. */
	const FULL = 0.995;
	/**
	 * Progress events land every few hundred milliseconds. The ring glides
	 * toward each one without trailing so far behind that it feels dishonest.
	 */
	const glide = durations.slow / 4;

	let arc = $state<SVGCircleElement | null>(null);
	/** The whole-number percent on show. Changes at most a hundred times per upload. */
	let percent = $state(0);
	let ringFull = $state(false);
	let note = $state('');
	let shown = 0;
	let target = 0;
	let frame = 0;
	let previous: UploadStatus = untrack(() => status);

	function paint() {
		if (arc) {
			arc.style.strokeDashoffset = `${CIRCUMFERENCE * (1 - shown)}`;
			// A round cap at 0% would draw a lone dot at twelve o'clock.
			arc.style.opacity = `${Math.min(1, shown / 0.02)}`;
		}
		percent = Math.round(shown * 100);
		ringFull = shown >= FULL;
	}

	function follow() {
		if (frame) return;
		let last: number | undefined;
		const tick = (now: number) => {
			const dt = now - (last ?? now);
			last = now;
			shown += (target - shown) * (1 - Math.exp(-dt / glide));
			if (Math.abs(target - shown) < 0.001) shown = target;
			paint();
			// Sleeps at rest.
			frame = shown === target ? 0 : requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
	}

	$effect(() => {
		const next = status;
		const value = progress;
		untrack(() => {
			const wasActive = previous !== 'idle';
			previous = next;
			// Idle keeps the last value, so a cancelled ring fades out where it was.
			if (next === 'idle') return;
			// A fresh upload starts empty rather than sweeping back from full.
			if (!wasActive) {
				shown = 0;
				paint();
			}
			target = next === 'done' ? 1 : Math.min(Math.max(value, 0), 1);
			if (prefersReducedMotion()) {
				cancelAnimationFrame(frame);
				frame = 0;
				shown = target;
				paint();
			} else follow();
		});
	});

	// The check waits for the ring to visibly close, not just for the status.
	const checked = $derived(status === 'done' && ringFull);
	const uploading = $derived(status === 'uploading');
	const ringVisible = $derived(uploading || (status === 'done' && !checked));

	$effect(() => {
		if (!checked) return;
		const timer = setTimeout(() => onReset(), timeout);
		return () => clearTimeout(timer);
	});

	// Width rather than scale, so nothing inside ever stretches.
	function morph(compact: boolean) {
		const node = ref;
		if (!node) return;
		const from = node.offsetWidth;
		node.style.width = '';
		const to = compact ? node.offsetHeight : node.offsetWidth;
		if (prefersReducedMotion() || from === to) {
			if (compact) node.style.width = `${to}px`;
			return;
		}
		node.style.width = `${from}px`;
		void node.offsetWidth;
		node.style.width = `${to}px`;
	}

	let morphed = false;
	$effect(() => {
		const compact = status !== 'idle';
		if (!morphed && !compact) return;
		morphed = true;
		untrack(() => morph(compact));
	});

	$effect(() => () => cancelAnimationFrame(frame));

	function onclick() {
		if (status === 'uploading') {
			note = 'Upload cancelled';
			onCancel();
		} else if (status === 'idle') {
			note = '';
			onStart();
		}
	}

	// Layers enter over a longer beat and leave faster, so the outgoing state
	// is gone before the width can clip it.
	const layer =
		'col-start-1 row-start-1 flex items-center justify-center transition-[opacity,filter,translate] ease-out';
	const layerShown = 'translate-y-0 opacity-100 blur-none duration-(--duration-base)';
	const layerHidden = 'translate-y-0.5 opacity-0 blur-[4px] duration-(--duration-instant)';
</script>

<!-- Press scale lives on the wrapper so the ring, which sits outside the button
     for accessibility, shrinks with it. -->
<span
	class={cn(
		'relative inline-flex transition-[scale] duration-(--duration-fast) ease-out active:scale-[0.96]',
		className
	)}
>
	<button
		{...restProps}
		bind:this={ref}
		type="button"
		aria-label={uploading ? cancelLabel : status === 'done' ? completeLabel : label}
		aria-busy={uploading || undefined}
		aria-disabled={status === 'done' || undefined}
		data-status={status}
		{onclick}
		ontransitionend={(event) => {
			if (
				event.currentTarget === event.target &&
				event.propertyName === 'width' &&
				status === 'idle'
			)
				event.currentTarget.style.width = '';
		}}
		class={cn(
			'group focus-visible:ring-ring focus-visible:ring-offset-background relative inline-flex h-10 touch-manipulation items-center justify-center overflow-hidden rounded-full text-sm font-medium outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2',
			'[transition:width_var(--duration-spring-snappy)_var(--ease-spring-snappy),background-color_var(--duration-base)_var(--ease-out),color_var(--duration-base)_var(--ease-out)]',
			checked
				? 'bg-primary text-primary-foreground shadow-sm'
				: 'bg-secondary text-secondary-foreground hover:bg-control',
			status === 'done' && 'cursor-default'
		)}
	>
		<!-- One grid cell: the resting layer sets the open width, and the others
		     center on top of it and overflow evenly when the pill is a circle. -->
		<span aria-hidden="true" class="grid">
			<!-- Waits for the pill to open most of the way, so the label never shows
			     up clipped. The icon side is a touch tighter; the glyph brings its
			     own air. -->
			<span
				class={cn(
					layer,
					'gap-2 ps-3.5 pe-4 whitespace-nowrap [&_svg]:size-4',
					status === 'idle' ? cn(layerShown, 'delay-(--duration-instant)') : layerHidden
				)}
			>
				<Upload />
				{label}
			</span>
			<!-- The percent by default. Hover or keyboard focus swaps it for a stop
			     mark, which is how the cancel action becomes discoverable. -->
			<span
				class={cn(
					layer,
					'text-[0.6875rem] tabular-nums',
					ringVisible ? layerShown : layerHidden,
					uploading &&
						'group-hover:opacity-0 group-hover:blur-[4px] group-focus-visible:opacity-0 group-focus-visible:blur-[4px]'
				)}
			>
				{percent}
			</span>
			<span
				class={cn(
					layer,
					layerHidden,
					uploading &&
						'group-hover:translate-y-0 group-hover:opacity-100 group-hover:blur-none group-focus-visible:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:blur-none'
				)}
			>
				<svg viewBox="0 0 16 16" fill="currentColor" class="size-3">
					<rect x="3" y="3" width="10" height="10" rx="2" />
				</svg>
			</span>
			<span class="col-start-1 row-start-1 flex items-center justify-center">
				<Check
					stroke-width={2.5}
					class={cn(
						'size-4',
						checked
							? 'scale-100 opacity-100 blur-none [transition:scale_var(--duration-spring-snappy)_var(--ease-spring-snappy),opacity_var(--duration-base)_var(--ease-out),filter_var(--duration-base)_var(--ease-out)]'
							: 'scale-25 opacity-0 blur-[4px] transition-[scale,opacity,filter] duration-(--duration-fast) ease-in'
					)}
				/>
			</span>
		</span>
	</button>

	<!-- Outside the button: a button's children are presentational, so a
	     progressbar nested inside would never reach assistive technology. -->
	<span
		role="progressbar"
		aria-label="Upload progress"
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={uploading ? Math.round(Math.min(Math.max(progress, 0), 1) * 100) : undefined}
		aria-hidden={!uploading}
		class={cn(
			'pointer-events-none absolute top-0 left-1/2 size-10 -translate-x-1/2 transition-opacity',
			ringVisible
				? 'opacity-100 duration-(--duration-fast) ease-out'
				: 'opacity-0 duration-(--duration-base) ease-in'
		)}
	>
		<!-- Rotated a quarter turn so the stroke starts at twelve o'clock. -->
		<svg viewBox="0 0 40 40" class="size-full -rotate-90" fill="none" stroke-width="2">
			<circle cx="20" cy="20" r={RADIUS} class="stroke-foreground/10" />
			<circle
				bind:this={arc}
				cx="20"
				cy="20"
				r={RADIUS}
				class="stroke-foreground"
				stroke-linecap="round"
				stroke-dasharray={CIRCUMFERENCE}
				stroke-dashoffset={CIRCUMFERENCE}
				opacity="0"
			/>
		</svg>
	</span>

	<span class="sr-only" aria-live="polite">
		{uploading ? 'Uploading' : status === 'done' ? completeLabel : note}
	</span>
</span>
