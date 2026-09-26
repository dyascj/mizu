<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	// The icon tint + bar color all derive from one `--toast` channel per variant,
	// mirroring how alert.svelte themes itself from `--alert`.
	export const toastVariants = tv({
		base: 'group bg-popover pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl py-3.5 pl-4 pr-10 shadow-xl',
		variants: {
			variant: {
				info: '[--toast:var(--info)]',
				success: '[--toast:var(--success)]',
				warning: '[--toast:var(--warning)]',
				error: '[--toast:var(--destructive)]'
			}
		},
		defaultVariants: { variant: 'info' }
	});

	export type ToastCardVariant = VariantProps<typeof toastVariants>['variant'];
</script>

<script lang="ts">
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import XCircleIcon from '@lucide/svelte/icons/circle-x';
	import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';
	import InfoIcon from '@lucide/svelte/icons/info';
	import XIcon from '@lucide/svelte/icons/x';
	import { onMount, untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { TransitionConfig } from 'svelte/transition';
	import { buttonVariants } from '$lib/components/ui/button';
	import {
		duration as durations,
		easeIn,
		easeOut,
		prefersReducedMotion,
		springs
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { toaster, type ToastData } from './toast-state.svelte.js';

	type Props = {
		/** The toast to show, usually one entry of `toaster.toasts`. */
		toast: ToastData;
		/**
		 * Holds the card at this height in pixels, for a stack that tucks every
		 * toast behind the front one to the front one's size.
		 */
		height?: number;
		/** Tucked behind another toast: the content fades out and only the card shows. */
		behind?: boolean;
		/** Reports the card's natural height in pixels whenever it changes. */
		onHeight?: (height: number) => void;
		/** Classes for the card. */
		class?: string;
	};

	let { toast, height, behind = false, onHeight, class: className }: Props = $props();

	const icons = {
		info: InfoIcon,
		success: CheckCircleIcon,
		warning: AlertTriangleIcon,
		error: XCircleIcon
	};
	const Icon = $derived(icons[toast.variant]);
	// Fixed at creation: a toast that morphs into an error later keeps speaking
	// politely instead of switching live-region roles mid-announcement.
	const assertive = untrack(() => toast.variant === 'error' && !toast.loading);
	const running = $derived(toaster.running[toast.id] ?? false);

	let root = $state<HTMLDivElement | null>(null);
	let natural = $state<number | undefined>(undefined);
	let hovered = false;
	let focused = false;
	// Nothing morphs on the first frame; the entrance belongs to whoever shows the toast.
	let mounted = false;
	onMount(() => {
		mounted = true;
	});

	function syncTimer() {
		if (hovered || focused) toaster.pause(toast.id);
		else toaster.resume(toast.id);
	}

	const shortcut =
		typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
			? 'Command Z'
			: 'Control Z';

	/** Measures the content, so the card can animate its real height when the content changes. */
	const measure: Attachment<HTMLElement> = (node) => {
		if (typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(() => {
			natural = node.offsetHeight;
			onHeight?.(node.offsetHeight);
		});
		observer.observe(node);
		return () => observer.disconnect();
	};

	/**
	 * Runs a countdown with the Web Animations API, so it keeps counting under
	 * reduced motion (it is a clock, not decoration) and pauses exactly when the
	 * dismiss timer does. Linear, because every second must look the same.
	 */
	function countdown(keyframes: { strokeDashoffset: number }[]): Attachment<Element> {
		return (node) => {
			if (typeof node.animate !== 'function') return;
			const animation = untrack(() =>
				node.animate(keyframes, { duration: toast.duration, easing: 'linear', fill: 'forwards' })
			);
			$effect(() => {
				if (running) animation.play();
				else animation.pause();
			});
			return () => animation.cancel();
		};
	}

	// The incoming content develops out of a blur while the outgoing copy steps
	// out of the flow, so the card sizes to the new content straight away.
	function develop(_node: Element): TransitionConfig {
		if (!mounted) return { duration: 0 };
		if (prefersReducedMotion()) return { duration: durations.fast, css: (t) => `opacity: ${t}` };
		return {
			duration: durations.base,
			easing: easeOut,
			css: (t, u) => `opacity: ${t}; filter: blur(${u * 4}px); translate: 0 ${u * 4}px`
		};
	}
	function fadeAway(node: HTMLElement): TransitionConfig {
		const { offsetLeft, offsetTop, offsetWidth } = node;
		Object.assign(node.style, {
			position: 'absolute',
			left: `${offsetLeft}px`,
			top: `${offsetTop}px`,
			width: `${offsetWidth}px`
		});
		if (prefersReducedMotion()) return { duration: durations.fast, css: (t) => `opacity: ${t}` };
		return {
			duration: durations.fast,
			easing: easeIn,
			css: (t, u) => `opacity: ${t}; filter: blur(${u * 4}px); translate: 0 ${u * -4}px`
		};
	}
	// A new status icon springs up from a quarter of its size. Opacity rides a
	// plain curve so the spring never pushes it past fully opaque.
	function iconIn(_node: Element): TransitionConfig {
		if (!mounted) return { duration: 0 };
		if (prefersReducedMotion()) return { duration: durations.fast, css: (t) => `opacity: ${t}` };
		const spring = springs.snappy;
		return {
			duration: spring.duration,
			css: (t) =>
				`opacity: ${Math.min(1, easeOut(t) * 1.6)}; scale: ${0.25 + 0.75 * spring.easing(t)}; filter: blur(${(1 - easeOut(t)) * 4}px)`
		};
	}

	function runAction() {
		const action = toast.action;
		if (!action) return;
		const keepOpen = action.dismiss === false;
		// The action may morph the toast and take this button with it; keep focus
		// on the toast rather than dropping it on the page.
		if (keepOpen && root?.contains(document.activeElement)) root.focus({ preventScroll: true });
		action.onclick();
		if (!keepOpen) toaster.dismiss(toast.id);
	}

	/** The hairline edge: traces the card's corners, half a pixel in. */
	const RADIUS = 24;
	/** The undo ring: r=8 in a 20px box leaves room for the 2px stroke. */
	const RING = 2 * Math.PI * 8;
</script>

<div
	bind:this={root}
	role={assertive ? 'alert' : 'status'}
	aria-live={assertive ? 'assertive' : 'polite'}
	tabindex="-1"
	data-version={toast.version ?? 0}
	data-loading={toast.loading ? '' : undefined}
	data-undo={toast.undo ? '' : undefined}
	class={cn(
		toastVariants({ variant: toast.variant }),
		'block p-0 outline-none',
		'transition-[height] duration-(--duration-spring-snappy) ease-(--ease-spring-snappy)',
		className
	)}
	style:height={height !== undefined
		? `${height}px`
		: natural !== undefined
			? `${natural}px`
			: undefined}
	onpointerenter={(event) => {
		if (event.pointerType === 'touch') return;
		hovered = true;
		syncTimer();
	}}
	onpointerleave={() => {
		hovered = false;
		syncTimer();
	}}
	onfocusin={() => {
		focused = true;
		syncTimer();
	}}
	onfocusout={(event) => {
		focused =
			event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget);
		syncTimer();
	}}
>
	<div
		{@attach measure}
		class={cn(
			'relative grid transition-opacity duration-(--duration-fast) ease-out',
			behind && 'opacity-0'
		)}
	>
		{#key toast.version ?? 0}
			<div
				in:develop
				out:fadeAway
				class={cn(
					'col-start-1 row-start-1 flex items-start gap-3 py-3.5 pl-4',
					toast.undo ? 'items-center py-2 pr-2' : 'pr-10'
				)}
			>
				<span
					in:iconIn
					class={cn(
						'relative z-10 grid size-5 shrink-0 place-items-center',
						!toast.undo && 'mt-0.5'
					)}
				>
					{#if toast.undo}
						<svg
							viewBox="0 0 20 20"
							class="text-foreground size-5 -rotate-90"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<circle cx="10" cy="10" r="8" class="opacity-15" />
							<circle
								{@attach countdown([{ strokeDashoffset: 0 }, { strokeDashoffset: RING }])}
								cx="10"
								cy="10"
								r="8"
								stroke-linecap="round"
								stroke-dasharray={RING}
							/>
						</svg>
					{:else if toast.loading}
						<!-- Quick on purpose: a brisker spinner makes the same wait feel shorter. -->
						<svg
							viewBox="0 0 16 16"
							class="text-muted-foreground size-4 animate-spin [animation-duration:var(--duration-deliberate)]"
							fill="none"
							stroke="currentColor"
							stroke-width="1.75"
							stroke-linecap="round"
							aria-hidden="true"
						>
							<circle cx="8" cy="8" r="6" opacity="0.2" />
							<path d="M8 2a6 6 0 0 1 6 6" />
						</svg>
					{:else}
						<Icon class="size-5 text-[color:var(--toast)]" aria-hidden="true" />
					{/if}
				</span>

				<div
					class={cn(
						'relative z-10 min-w-0 flex-1 [overflow-wrap:anywhere]',
						toast.undo ? 'self-center' : 'pt-0.5'
					)}
				>
					<p class={cn('text-foreground text-sm', toast.undo ? 'font-medium' : 'font-semibold')}>
						{toast.title}
					</p>
					{#if toast.description}
						<p class="text-muted-foreground mt-0.5 text-sm">{toast.description}</p>
					{/if}
					{#if toast.undo}
						<span class="sr-only">Press {toast.undo.label ?? 'Undo'} or {shortcut} to restore.</span
						>
					{/if}
					{#if toast.action && !toast.undo}
						<button
							type="button"
							class={cn(
								buttonVariants({ variant: 'secondary', size: 'sm' }),
								'mt-2.5 px-3 text-xs'
							)}
							onclick={runAction}
						>
							<span class="relative z-10">{toast.action.label}</span>
						</button>
					{/if}
				</div>

				{#if toast.undo}
					<button
						type="button"
						aria-keyshortcuts="Control+Z Meta+Z"
						class={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'shrink-0 px-3.5')}
						onclick={() => toaster.undo(toast.id)}
					>
						{toast.undo.label ?? 'Undo'}
					</button>
				{/if}
			</div>
		{/key}
	</div>

	{#if !toast.undo}
		<button
			type="button"
			class="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring focus-visible:ring-offset-background absolute top-2.5 right-2.5 z-20 inline-flex size-7 items-center justify-center rounded-full transition-[scale,background-color] duration-(--duration-base) outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96]"
			onclick={() => toaster.dismiss(toast.id)}
		>
			<XIcon class="size-3.5" />
			<span class="sr-only">Dismiss</span>
		</button>
	{/if}

	{#if toast.duration > 0 && !toast.undo}
		{#key toast.version ?? 0}
			<!-- The card's own edge is its timer: a hairline that drains around the
			     outline, clockwise from the top left, and stops whenever the dismiss
			     timer does. -->
			<svg
				class={cn(
					'mizu-toast-edge text-foreground pointer-events-none absolute inset-0 z-10 size-full overflow-visible opacity-20 transition-opacity duration-(--duration-fast) motion-reduce:hidden',
					behind && 'opacity-0'
				)}
				aria-hidden="true"
			>
				<rect
					{@attach countdown([{ strokeDashoffset: 0 }, { strokeDashoffset: -1 }])}
					x="0.5"
					y="0.5"
					rx={RADIUS - 0.5}
					pathLength="1"
					stroke-dasharray="1 1"
					fill="none"
					stroke="currentColor"
					style="width: calc(100% - 1px); height: calc(100% - 1px)"
				/>
			</svg>
		{/key}
	{/if}
</div>
