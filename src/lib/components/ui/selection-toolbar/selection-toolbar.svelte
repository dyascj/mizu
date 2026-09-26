<script lang="ts" module>
	/** What the toolbar knows about the current selection, handed to `actions`. */
	export type SelectionToolbarState = {
		/** The selected text. */
		text: string;
		/** A copy of the selected range, or null when nothing is selected. */
		range: Range | null;
		/** Selects `range` again, such as after rewrapping the text it covered. */
		select: (range: Range) => void;
		/** Hides the toolbar until the selection changes. */
		dismiss: () => void;
		/** Reads a short status to screen readers, such as "Bold on" or "Copied". */
		announce: (message: string) => void;
	};
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { follower } from './follow.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Accessible name of the toolbar. */
		label?: string;
		/**
		 * The toolbar's buttons: `SelectionToolbarButton` and
		 * `SelectionToolbarSeparator` elements, given the current selection.
		 */
		actions: Snippet<[SelectionToolbarState]>;
		/**
		 * The text people select from. Anything works; make it focusable (or
		 * `contenteditable`) so keyboard users can select with Shift and the
		 * arrow keys, then Tab into the toolbar.
		 */
		children: Snippet;
		/** The wrapper, which positions the toolbar. */
		ref?: HTMLDivElement | null;
		/** Classes for the wrapper. */
		class?: string;
		/** Classes for the toolbar. */
		toolbarClass?: string;
	};

	let {
		label = 'Selection actions',
		actions,
		children,
		ref = $bindable(null),
		class: className,
		toolbarClass,
		...restProps
	}: Props = $props();

	/** Space between the selection and the toolbar. */
	const GAP = 8;

	let content = $state<HTMLDivElement | null>(null);
	let toolbar = $state<HTMLDivElement | null>(null);
	let open = $state(false);
	/** Typing hides the toolbar at once; every other close fades. */
	let instant = $state(false);
	let text = $state('');
	let range = $state.raw<Range | null>(null);
	let origin = $state('50% 100%');
	let message = $state('');
	let pressing = false;
	/** Set by Escape: stays hidden until the selection actually changes. */
	let dismissed = false;

	const motion = follower((x, y) => {
		if (toolbar) toolbar.style.translate = `${x}px ${y}px`;
	});

	function sameRange(a: Range | null, b: Range) {
		return (
			!!a &&
			a.startContainer === b.startContainer &&
			a.startOffset === b.startOffset &&
			a.endContainer === b.endContainer &&
			a.endOffset === b.endOffset
		);
	}

	function show(next: boolean, fast = false) {
		instant = fast;
		open = next;
	}

	function sync() {
		if (!ref || !content || !toolbar) return;
		const selection = window.getSelection();
		const current = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
		if (!current || current.collapsed || !content.contains(current.commonAncestorContainer)) {
			// Tabbing into the toolbar can nudge the selection; keep it open.
			if (toolbar.contains(document.activeElement)) return;
			if (open) show(false);
			return;
		}
		// A drag in progress settles on release, so the toolbar doesn't chase
		// every pixel of it.
		if (pressing) return;
		if (dismissed) {
			if (sameRange(range, current)) return;
			dismissed = false;
		}
		range = current.cloneRange();
		text = current.toString();

		const box = ref.getBoundingClientRect();
		const bounds = current.getBoundingClientRect();
		const lines = [...current.getClientRects()].filter((rect) => rect.width > 0);
		const first = lines[0] ?? bounds;
		const last = lines.at(-1) ?? bounds;
		const width = toolbar.offsetWidth;
		const height = toolbar.offsetHeight;

		// Flips below when there's no room above inside the wrapper or on screen.
		const below = first.top - box.top < height + GAP || first.top < height + GAP;
		const center = bounds.left + bounds.width / 2 - box.left;
		const spare = box.width - width;
		const left = spare < 0 ? spare / 2 : Math.min(Math.max(center - width / 2, 0), spare);
		const top = below ? last.bottom - box.top + GAP : first.top - box.top - height - GAP;

		// Scales out of the selection itself, even when clamped to an edge.
		origin = `${center - left}px ${below ? 0 : height}px`;
		if (!open || prefersReducedMotion()) motion.jump(left, top);
		else motion.set(left, top);
		if (!open) show(true);
	}

	function select(next: Range) {
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(next);
	}

	function dismiss() {
		dismissed = true;
		show(false);
	}

	function announce(next: string) {
		// Cleared first so the same words read again when repeated.
		message = '';
		queueMicrotask(() => (message = next));
	}

	$effect(() => {
		const root = ref;
		const area = content;
		if (!root || !area) return;
		let frame = 0;
		const release = () => {
			if (!pressing) return;
			pressing = false;
			// The selection finalises after pointerup, so read it a frame later.
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(sync);
		};
		const observer = new ResizeObserver(() => sync());
		observer.observe(root);
		document.addEventListener('selectionchange', sync);
		window.addEventListener('pointerup', release);
		window.addEventListener('pointercancel', release);
		area.addEventListener('scroll', sync, { capture: true, passive: true });
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			document.removeEventListener('selectionchange', sync);
			window.removeEventListener('pointerup', release);
			window.removeEventListener('pointercancel', release);
			area.removeEventListener('scroll', sync, { capture: true });
			motion.stop();
		};
	});

	/** The toolbar's buttons, for the roving focus. */
	const buttons = () => [
		...(toolbar?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
	];

	// One tab stop for the whole toolbar, the first button, reset each time it opens.
	$effect(() => {
		if (!open || !toolbar) return;
		buttons().forEach((button, i) => (button.tabIndex = i === 0 ? 0 : -1));
	});

	function focusButton(index: number) {
		const list = buttons();
		if (!list.length) return;
		const next = list[(index + list.length) % list.length];
		for (const button of list) button.tabIndex = button === next ? 0 : -1;
		next.focus();
	}

	function onToolbarKeydown(event: KeyboardEvent) {
		const list = buttons();
		const at = list.indexOf(document.activeElement as HTMLButtonElement);
		if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
			event.preventDefault();
			focusButton(at + (event.key === 'ArrowRight' ? 1 : -1));
		} else if (event.key === 'Home' || event.key === 'End') {
			event.preventDefault();
			focusButton(event.key === 'Home' ? 0 : -1);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			dismiss();
			content?.querySelector<HTMLElement>('[contenteditable], [tabindex]')?.focus({
				preventScroll: true
			});
			if (range) select(range);
		}
	}

	function onContentKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			event.preventDefault();
			dismiss();
			return;
		}
		const modified = event.metaKey || event.ctrlKey || event.altKey;
		const typing =
			!modified &&
			(event.key.length === 1 ||
				event.key === 'Backspace' ||
				event.key === 'Delete' ||
				event.key === 'Enter');
		if (typing && open) show(false, true);
	}

	const selectionState: SelectionToolbarState = {
		get text() {
			return text;
		},
		get range() {
			return range;
		},
		select,
		dismiss,
		announce
	};
</script>

<div
	bind:this={ref}
	{...restProps}
	class={cn('relative', className)}
	onfocusout={(event) => {
		restProps.onfocusout?.(event);
		// Focus leaving both the text and the toolbar takes the toolbar along.
		if (!ref?.contains(event.relatedTarget as Node | null) && open) show(false);
	}}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={content}
		onpointerdown={(event) => {
			if (event.button === 0) pressing = true;
		}}
		onkeydown={onContentKeydown}
	>
		{@render children()}
	</div>

	<!-- Grows out of the selection and glides after it as it grows. Arrives on
	     the house curve, leaves faster, and vanishes at once when typing. -->
	<div
		bind:this={toolbar}
		role="toolbar"
		aria-label={label}
		aria-hidden={open ? undefined : 'true'}
		inert={!open}
		tabindex="-1"
		data-state={open ? 'open' : 'closed'}
		style:transform-origin={origin}
		onmousedown={(event) => {
			// Keeps the text selected and focused when a button is clicked.
			if (!(event.target instanceof HTMLInputElement)) event.preventDefault();
		}}
		onkeydown={onToolbarKeydown}
		class={cn(
			'bg-popover text-popover-foreground absolute top-0 left-0 z-10 flex items-center gap-0.5 rounded-full p-1 whitespace-nowrap shadow-lg outline-none',
			'transition-[opacity,scale] duration-(--duration-fast) ease-out data-[state=closed]:pointer-events-none data-[state=closed]:opacity-0 data-[state=closed]:duration-(--duration-instant) data-[state=closed]:ease-in motion-safe:data-[state=closed]:scale-[0.96]',
			instant && 'data-[state=closed]:transition-none',
			toolbarClass
		)}
	>
		{@render actions(selectionState)}
	</div>

	<span class="sr-only" aria-live="polite">{message}</span>
</div>
