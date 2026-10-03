<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { tick, untrack, type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { prefersReducedMotion, SpringValue, springPresets } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLButtonAttributes, 'children' | 'title'> & {
		/** The heading, shown on the card and carried into the detail view. */
		title: string;
		/** A short aside beside the title, such as a date or a count. */
		meta?: string;
		/** One line under the title on the card. The detail view shows it in full. */
		summary?: string;
		/** Whether the detail view is open. */
		open?: boolean;
		/** Called whenever the card opens or closes. */
		onOpenChange?: (open: boolean) => void;
		/** Accessible name of the close button. */
		closeLabel?: string;
		/** The card, which stays in the layout as the slot the detail view returns to. */
		ref?: HTMLButtonElement | null;
		/** Classes for the card. */
		class?: string;
		/** Classes for the detail view. */
		dialogClass?: string;
		/** What the detail view adds below the summary. */
		children?: Snippet;
	};

	let {
		title,
		meta,
		summary,
		open = $bindable(false),
		onOpenChange,
		closeLabel = 'Close',
		ref = $bindable(null),
		class: className,
		dialogClass,
		children,
		onclick,
		...restProps
	}: Props = $props();

	type Box = { left: number; top: number; width: number; height: number };
	type Offset = { x: number; y: number };

	const uid = $props.id();
	const titleId = `${uid}-title`;

	/** True from opening until the detail view has folded back into its slot. */
	let shown = $state(false);
	/** True while folding back, when the detail content has already gone. */
	let closing = $state(false);
	let closeButton = $state<HTMLButtonElement | null>(null);
	let cardTitle = $state<HTMLElement | null>(null);
	let cardMeta = $state<HTMLElement | null>(null);
	let cardSummary = $state<HTMLElement | null>(null);

	/** Where the card sits, and where its title and meta sit inside it. */
	let slot: Box | null = null;
	let slotText: { title: Offset; meta: Offset; summary: Offset; titleWidth: number } | null = null;
	/** Drives the morph from the slot (0) to the detail view (1). */
	let morph: SpringValue | null = null;
	/** Repaints the detail view for the morph's current progress. */
	let paint: (() => void) | null = null;
	/** Starts the fold back into the slot. */
	let collapse: (() => void) | null = null;
	/** Turns a fold in progress back toward the detail view. */
	let expand: (() => void) | null = null;

	const rel = (node: Element | null, box: DOMRect): Offset => {
		const rect = node?.getBoundingClientRect();
		return rect ? { x: rect.left - box.left, y: rect.top - box.top } : { x: 0, y: 0 };
	};
	const toBox = (rect: DOMRect): Box => ({
		left: rect.left,
		top: rect.top,
		width: rect.width,
		height: rect.height
	});

	/** Measures the card and its text, where the morph starts from and returns to. */
	function measureSlot() {
		if (!ref) return;
		const box = ref.getBoundingClientRect();
		slot = toBox(box);
		slotText = {
			title: rel(cardTitle, box),
			meta: rel(cardMeta, box),
			summary: rel(cardSummary, box),
			titleWidth: cardTitle?.getBoundingClientRect().width ?? 0
		};
	}

	// Opening from outside works too: measure while the card still shows its face.
	// Opening again while the view folds away turns the fold around, so the
	// card never lands closed while `open` says it is open.
	$effect.pre(() => {
		if (open) {
			untrack(() => {
				if (!shown) {
					measureSlot();
					closing = false;
					shown = true;
				} else if (closing) {
					unfold();
				}
			});
		} else if (untrack(() => shown && !closing)) {
			untrack(fold);
		}
	});

	function show() {
		if (open) return;
		open = true;
		onOpenChange?.(true);
	}

	function close() {
		if (!open) return;
		open = false;
		onOpenChange?.(false);
	}

	function fold() {
		closing = true;
		// Focus returns to the card at once, where it will land.
		void tick().then(() => ref?.focus({ preventScroll: true }));
		measureSlot();
		if (!collapse || prefersReducedMotion()) land();
		else collapse();
	}

	function unfold() {
		closing = false;
		expand?.();
	}

	function land() {
		morph?.stop();
		shown = false;
		closing = false;
	}

	/**
	 * Moves the detail view to the body, clear of any transformed or clipped
	 * ancestor, keeping the direction the card reads in.
	 */
	const portal: Attachment<HTMLElement> = (node) => {
		if (ref) node.dir = getComputedStyle(ref).direction;
		document.body.appendChild(node);
		return () => node.remove();
	};

	/**
	 * The detail view grows out of the card's box: its edges follow one spring
	 * from the slot to the centre of the screen, and the title and meta ride
	 * along by position only, so the glyphs never stretch.
	 */
	const grow: Attachment<HTMLElement> = (node) => {
		const inner = node.firstElementChild as HTMLElement;
		const dialogTitle = node.querySelector<HTMLElement>('[data-slot="title"]');
		const dialogMeta = node.querySelector<HTMLElement>('[data-slot="meta"]');
		const returning = node.querySelector<HTMLElement>('[data-slot="returning"]');
		const final = node.getBoundingClientRect();
		const target = toBox(final);
		const dialogText = { title: rel(dialogTitle, final), meta: rel(dialogMeta, final) };
		const dialogTitleWidth = dialogTitle?.getBoundingClientRect().width ?? 0;
		const rtl = !!ref && getComputedStyle(ref).direction === 'rtl';

		const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
		paint = () => {
			const t = spring.current;
			const from = slot ?? target;
			const text = slotText ?? { ...dialogText, summary: { x: 0, y: 0 } };
			node.style.left = `${lerp(from.left, target.left, t)}px`;
			node.style.top = `${lerp(from.top, target.top, t)}px`;
			node.style.width = `${lerp(from.width, target.width, t)}px`;
			node.style.height = `${lerp(from.height, target.height, t)}px`;
			const move = (el: HTMLElement | null, a: Offset, b: Offset) => {
				if (el) el.style.translate = `${(a.x - b.x) * (1 - t)}px ${(a.y - b.y) * (1 - t)}px`;
			};
			move(dialogTitle, text.title, dialogText.title);
			move(dialogMeta, text.meta, dialogText.meta);
			// A title the card truncates narrows toward the card's width on the way
			// back, so it never runs under the meta that lands beside it.
			if (dialogTitle && slotText && slotText.titleWidth < dialogTitleWidth) {
				const cut = (dialogTitleWidth - slotText.titleWidth) * (1 - t);
				const edges = rtl ? `-4px -4px -4px ${cut}px` : `-4px ${cut}px -4px -4px`;
				dialogTitle.style.clipPath = cut > 0.5 ? `inset(${edges})` : '';
			}
			if (returning) {
				returning.style.left = `${text.summary.x}px`;
				returning.style.top = `${text.summary.y}px`;
				returning.style.width = `${Math.max(0, (slot?.width ?? 0) - text.summary.x * 2)}px`;
			}
		};
		/** Pins the box to explicit geometry, with the content at its final width. */
		const pin = () => {
			// Content keeps its final width while the box changes around it, so
			// the paragraphs never reflow mid-flight.
			inner.style.width = `${target.width}px`;
			node.dataset.morphing = '';
		};
		/** Settled open: hand the box back to layout so it can scroll and resize. */
		const release = () => {
			for (const prop of ['left', 'top', 'width', 'height'] as const) {
				node.style.removeProperty(prop);
			}
			inner.style.removeProperty('width');
			delete node.dataset.morphing;
		};

		const spring: SpringValue = new SpringValue(0, {
			preset: springPresets.smooth,
			onUpdate: () => paint?.(),
			onRest: (value) => (value === 0 ? land() : release())
		});
		morph = spring;
		collapse = () => {
			// Folds back from wherever the view is now, which may have resized.
			if (!('morphing' in node.dataset)) Object.assign(target, toBox(node.getBoundingClientRect()));
			pin();
			paint?.();
			spring.set(0);
			if (!spring.moving) land();
		};
		expand = () => {
			pin();
			spring.set(1);
			if (!spring.moving) release();
		};
		pin();
		paint();
		spring.set(1);
		if (!spring.moving) release();

		return () => {
			spring.stop();
			if (morph === spring) morph = null;
			paint = null;
			collapse = null;
			expand = null;
		};
	};

	$effect(() => {
		if (!shown || closing) return;
		void tick().then(() => closeButton?.focus({ preventScroll: true }));
		const onkeydown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			close();
		};
		document.addEventListener('keydown', onkeydown);
		return () => document.removeEventListener('keydown', onkeydown);
	});

	/** Keeps Tab inside the detail view, as `aria-modal` promises. */
	function trapTab(event: KeyboardEvent & { currentTarget: HTMLElement }) {
		if (event.key !== 'Tab') return;
		const focusable = [
			...event.currentTarget.querySelectorAll<HTMLElement>(
				'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
			)
		].filter((el) => !el.hasAttribute('disabled'));
		if (focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}
</script>

<button
	{...restProps}
	bind:this={ref}
	type="button"
	aria-haspopup="dialog"
	aria-expanded={open}
	inert={shown && !closing}
	data-state={shown ? 'open' : 'closed'}
	class={cn(
		'bg-card text-card-foreground focus-visible:ring-ring focus-visible:ring-offset-background relative block w-full touch-manipulation rounded-2xl text-start shadow-sm transition-[scale,background-color,box-shadow] duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transition-[background-color,box-shadow]',
		// Holds the slot at the card's exact size and marks where it returns to.
		'data-[state=open]:bg-secondary data-[state=open]:shadow-none',
		className
	)}
	onclick={(event) => {
		onclick?.(event);
		if (!event.defaultPrevented) show();
	}}
>
	<span
		class={cn('flex flex-col items-start gap-1.5 px-5 py-4', shown && 'invisible')}
		aria-hidden={shown}
	>
		<span class="flex w-full items-baseline justify-between gap-4">
			<span bind:this={cardTitle} class="truncate text-base font-semibold tracking-tight">
				{title}
			</span>
			{#if meta}
				<span bind:this={cardMeta} class="text-muted-foreground shrink-0 text-sm tabular-nums">
					{meta}
				</span>
			{/if}
		</span>
		{#if summary}
			<span bind:this={cardSummary} class="text-muted-foreground max-w-full truncate text-sm">
				{summary}
			</span>
		{/if}
	</span>
</button>

{#if shown}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		{@attach portal}
		aria-hidden="true"
		class={cn(
			'fixed inset-0 z-50 bg-black/45 backdrop-blur-sm',
			closing
				? 'pointer-events-none opacity-0 transition-opacity duration-(--duration-fast) ease-in'
				: 'animate-fade-in'
		)}
		onclick={close}
	></div>
	<div {@attach portal} class="pointer-events-none fixed inset-0 z-50 flex p-4">
		<div
			{@attach grow}
			id="{uid}-dialog"
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			tabindex="-1"
			class={cn(
				'bg-card text-card-foreground pointer-events-auto m-auto max-h-full w-[27.5rem] max-w-full shrink-0 overflow-y-auto rounded-2xl shadow-xl outline-none',
				'data-morphing:fixed data-morphing:m-0 data-morphing:max-h-none data-morphing:overflow-hidden',
				// Folding back, it lies over its own card: a press passes through to
				// the card and turns the fold around, and never lands focus on a view
				// that is about to go.
				closing && 'pointer-events-none',
				dialogClass
			)}
			onkeydown={trapTab}
		>
			<div class="relative p-6">
				<div class="flex items-start justify-between gap-4">
					<div class="flex min-w-0 flex-col items-start gap-1">
						<h2 id={titleId} data-slot="title" class="text-base font-semibold tracking-tight">
							{title}
						</h2>
						{#if meta}
							<p data-slot="meta" class="text-muted-foreground text-sm tabular-nums">{meta}</p>
						{/if}
					</div>
					<button
						bind:this={closeButton}
						type="button"
						aria-label={closeLabel}
						class={cn(
							'text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-ring relative -me-1.5 -mt-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-[scale,background-color,color] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 active:scale-[0.96]',
							// Grows the hit area to 44px around the 32px circle.
							'after:absolute after:-inset-1.5 after:rounded-full',
							closing ? 'invisible' : 'expanding-card-arrive'
						)}
						onclick={close}
					>
						<XIcon class="size-4" />
					</button>
				</div>
				<!-- Not carried over from the card, where the summary is cut short:
				     it arrives with the detail once the box has nearly settled. -->
				<div class={closing ? 'invisible' : 'expanding-card-arrive'}>
					{#if summary}
						<p class="mt-4 text-sm">{summary}</p>
					{/if}
					{#if children}
						<div class="text-muted-foreground mt-2.5 text-sm leading-6 text-pretty">
							{@render children()}
						</div>
					{/if}
				</div>
				{#if closing && summary}
					<!-- The card's own summary line comes back into focus as it lands. -->
					<p
						data-slot="returning"
						aria-hidden="true"
						class="expanding-card-return text-muted-foreground absolute truncate text-sm"
					>
						{summary}
					</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* Waits out most of the morph, then resolves out of a soft blur, so the
	   words read as arriving rather than blinking on. */
	.expanding-card-arrive {
		animation: expanding-card-arrive var(--duration-base) var(--ease-out) var(--duration-base) both;
	}

	.expanding-card-return {
		animation: expanding-card-arrive var(--duration-fast) var(--ease-out) var(--duration-fast) both;
	}

	@keyframes expanding-card-arrive {
		from {
			opacity: 0;
			filter: blur(4px);
			translate: 0 4px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.expanding-card-arrive,
		.expanding-card-return {
			animation: fade-in var(--duration-fast) var(--ease-out) both;
		}
	}
</style>
