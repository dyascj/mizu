<script lang="ts">
	import { tick, untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import X from '@lucide/svelte/icons/x';
	import { prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
		/**
		 * Whether the bar shows. Bindable. Closing folds the bar away and the
		 * page below slides up into its space; opening reverses it.
		 */
		open?: boolean;
		/** Called after the dismiss button closes the bar. */
		onDismiss?: () => void;
		/**
		 * Where keyboard focus goes when the dismiss button closes the bar, as an
		 * element or a CSS selector. By default it moves to the first focusable
		 * element after the bar, then the nearest one before it, and only lands on
		 * the page itself when there is nothing else. Focus that `onDismiss`
		 * already moved elsewhere is left alone.
		 */
		returnFocus?: HTMLElement | string;
		/** Shows the dismiss button. */
		dismissible?: boolean;
		/** Accessible name for the bar's region. */
		label?: string;
		/** Accessible name for the dismiss button. */
		dismissLabel?: string;
		/** `primary` is the bold, inverted bar; `secondary` is a quiet gray one. */
		variant?: 'primary' | 'secondary';
		/** A small leading glyph, decorative. */
		icon?: Snippet;
		/** Trailing content after the message, such as a link. */
		action?: Snippet;
		/** The message. */
		children: Snippet;
		/** The bar's section element. */
		ref?: HTMLElement | null;
		/** Classes for the bar. */
		class?: string;
	};

	let {
		open = $bindable(true),
		onDismiss,
		returnFocus,
		dismissible = true,
		label = 'Announcement',
		dismissLabel = 'Dismiss announcement',
		variant = 'primary',
		icon,
		action,
		children,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	// The very first appearance slides down from above. Every later one reverses
	// the dismissal instead: the space opens, then the bar fades in.
	let wasOpen = untrack(() => open);
	let dismissedOnce = $state(false);
	$effect.pre(() => {
		if (wasOpen && !open) dismissedOnce = true;
		wasOpen = open;
	});

	const FOCUSABLE =
		'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, iframe, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])';

	/** Out of reach: inside something inert or hidden. */
	function unreachable(el: Element) {
		for (let node: Element | null = el; node; node = node.parentElement) {
			const inert = node.getAttribute('inert');
			if (inert !== null && inert !== 'false') return true;
			if (node.hasAttribute('hidden') || node.getAttribute('aria-hidden') === 'true') return true;
		}
		return el instanceof HTMLElement && el.checkVisibility?.() === false;
	}

	function focusable(el: Element | null | undefined): el is HTMLElement {
		return el instanceof HTMLElement && el.matches(FOCUSABLE) && !unreachable(el);
	}

	/** The nearest focusable element outside `root`, after it first, then before it. */
	function neighbour(root: Element) {
		const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
		for (const step of ['nextNode', 'previousNode'] as const) {
			walker.currentNode = root;
			for (let node = walker[step](); node; node = walker[step]()) {
				// Skips the bar's own contents and, going back, the elements holding it.
				if (root.contains(node) || node.contains(root)) continue;
				if (focusable(node as Element)) return node as HTMLElement;
			}
		}
		return null;
	}

	let wrapper = $state<HTMLDivElement | null>(null);

	async function handOffFocus() {
		await tick();
		const active = document.activeElement;
		// `onDismiss` may have placed focus somewhere on purpose.
		if (active && active !== document.body && !ref?.contains(active)) return;
		const chosen =
			typeof returnFocus === 'string' ? document.querySelector(returnFocus) : returnFocus;
		const target = focusable(chosen) ? chosen : wrapper && neighbour(wrapper);
		if (target) target.focus({ preventScroll: true });
		else if (active instanceof HTMLElement && active !== document.body) active.blur();
	}

	function dismiss() {
		// The bar turns inert as it closes, which would drop focus on the page.
		const hadFocus = !!ref?.contains(document.activeElement);
		open = false;
		onDismiss?.();
		if (hadFocus) void handOffFocus();
	}

	// The height moves on the house curve: quick to start and long to settle, so
	// the page below glides instead of lurching. Closing waits a beat for the
	// text to fade, so it never gets squeezed while it is still readable.
	// Reduced motion snaps both ways; the global rule would shorten the
	// durations but keep the delays, leaving a pause before the snap.
	const rows = $derived(
		prefersReducedMotion()
			? 'none'
			: open
				? 'grid-template-rows var(--duration-slow) var(--ease-out)'
				: 'grid-template-rows var(--duration-base) var(--ease-out) var(--duration-instant)'
	);
	const content = $derived(
		prefersReducedMotion()
			? 'none'
			: !open
				? 'opacity var(--duration-instant) var(--ease-in), filter var(--duration-instant) var(--ease-in)'
				: dismissedOnce
					? // Starts once the space has mostly opened.
						'opacity var(--duration-base) var(--ease-out) var(--duration-fast), filter var(--duration-base) var(--ease-out) var(--duration-fast)'
					: 'translate var(--duration-slow) var(--ease-out), opacity var(--duration-base) var(--ease-out), filter var(--duration-base) var(--ease-out)'
	);
	const tucked = $derived(!open && !dismissedOnce);
</script>

<div
	bind:this={wrapper}
	class="grid"
	data-state={open ? 'open' : 'closed'}
	style:grid-template-rows={open ? '1fr' : '0fr'}
	style:transition={rows}
>
	<div class="min-h-0 overflow-hidden">
		<section
			bind:this={ref}
			aria-label={label}
			inert={!open}
			tabindex="-1"
			class={cn(
				'flex min-h-11 items-center gap-2.5 py-1.5 pr-1.5 pl-4 text-sm outline-none',
				variant === 'primary'
					? 'bg-primary text-primary-foreground'
					: 'bg-secondary text-secondary-foreground',
				className
			)}
			style:opacity={open ? 1 : 0}
			style:filter={open ? 'blur(0px)' : 'blur(2px)'}
			style:translate={tucked ? '0 -100%' : '0 0'}
			style:transition={content}
			{...restProps}
		>
			{#if icon}
				<span aria-hidden="true" class="flex shrink-0 [&_svg]:size-4">{@render icon()}</span>
			{/if}
			<p class="min-w-0 flex-1 text-pretty">{@render children()}</p>
			{#if action}
				<span
					class={cn(
						'shrink-0 [&_a]:rounded-sm [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-[3px] [&_a]:transition-[text-decoration-color] [&_a]:duration-(--duration-fast) [&_a]:outline-none [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-2 [&_a]:focus-visible:outline-current',
						variant === 'primary'
							? '[&_a]:decoration-primary-foreground/40 [&_a:hover]:decoration-primary-foreground'
							: '[&_a]:decoration-foreground/30 [&_a:hover]:decoration-foreground'
					)}
				>
					{@render action()}
				</span>
			{/if}
			{#if dismissible}
				<button
					type="button"
					aria-label={dismissLabel}
					onclick={dismiss}
					class={cn(
						'relative ml-auto inline-flex size-8 shrink-0 touch-manipulation items-center justify-center rounded-full outline-none select-none',
						'transition-[scale,color,background-color] duration-(--duration-fast) ease-out active:scale-[0.96]',
						'focus-visible:outline-2 focus-visible:outline-current',
						// Grows the hit area to 40px without growing the circle.
						'after:absolute after:-inset-1 after:rounded-full',
						variant === 'primary'
							? 'text-primary-foreground/70 hover:bg-primary-foreground/15 hover:text-primary-foreground'
							: 'text-muted-foreground hover:bg-foreground/8 hover:text-foreground'
					)}
				>
					<X class="size-4" aria-hidden="true" />
				</button>
			{/if}
		</section>
	</div>
</div>
