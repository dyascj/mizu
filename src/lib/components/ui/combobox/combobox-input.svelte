<script lang="ts">
	import { Combobox as ComboboxPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { untrack } from 'svelte';
	import { prefersReducedMotion, springs } from '$lib/components/ui/motion';
	import { getComboboxContext } from './context.js';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<ComboboxPrimitive.InputProps> & {
		class?: string;
	} = $props();
	const context = getComboboxContext();

	/** True while a picked label is flying in; the field's own text waits for it. */
	let landing = $state(false);
	let flight: Animation | undefined;
	let ghost: HTMLElement | undefined;
	/** The field's text color, kept for a pick that lands while its text is still hidden. */
	let ink = '';

	/** Where the label's text starts inside an option, as a viewport rect. */
	function labelRect(item: HTMLElement, label: string) {
		const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
		const start = label.trim().slice(0, 3).toLowerCase();
		for (let node = walker.nextNode(); node; node = walker.nextNode()) {
			const text = node.textContent?.trim().toLowerCase() ?? '';
			if (!text || !text.startsWith(start)) continue;
			const range = document.createRange();
			range.selectNodeContents(node);
			const rect = range.getClientRects?.()[0];
			if (rect) return rect;
		}
		const box = item.getBoundingClientRect();
		const pad = Number.parseFloat(getComputedStyle(item).paddingLeft) || 0;
		return new DOMRect(box.left + pad, box.top, box.width - pad, box.height);
	}

	/**
	 * The pick is carried, not swapped: its label leaves the option and lands
	 * where the field shows its text, easing from the list's size to the
	 * field's on the way.
	 */
	function fly(item: HTMLElement, input: HTMLInputElement) {
		// A pick still in the air is dropped; its own handler clears it up.
		flight?.cancel();
		const label = item.dataset.label || input.value;
		if (!label) return;
		const from = labelRect(item, label);
		const box = input.getBoundingClientRect();
		const style = getComputedStyle(input);
		const itemSize = Number.parseFloat(getComputedStyle(item).fontSize) || 14;
		const fieldSize = Number.parseFloat(style.fontSize) || 14;
		const lineHeight = Number.parseFloat(style.lineHeight) || fieldSize * 1.5;
		const toX = box.left + (Number.parseFloat(style.paddingLeft) || 0);
		const toY = box.top + box.height / 2 - lineHeight / 2;
		const fromY = from.top + from.height / 2 - lineHeight / 2;
		if (Math.hypot(from.left - toX, fromY - toY) < 2) return;

		// While an earlier pick is landing the field's text is transparent, so
		// the color comes from before it went.
		if (!landing || !ink) ink = style.color;
		const carried = document.createElement('span');
		carried.textContent = label;
		carried.setAttribute('aria-hidden', 'true');
		Object.assign(carried.style, {
			position: 'fixed',
			left: `${toX}px`,
			top: `${toY}px`,
			zIndex: '60',
			pointerEvents: 'none',
			whiteSpace: 'pre',
			fontFamily: style.fontFamily,
			fontSize: style.fontSize,
			fontWeight: style.fontWeight,
			letterSpacing: style.letterSpacing,
			lineHeight: `${lineHeight}px`,
			color: ink,
			transformOrigin: '0 50%'
		});
		document.body.append(carried);
		ghost = carried;
		landing = true;

		// Position rides the snappy spring, sampled into keyframes so the curve
		// comes from the motion tokens rather than a hand-tuned bezier.
		const dx = from.left - toX;
		const dy = fromY - toY;
		const scale = itemSize / fieldSize;
		const { duration, easing } = springs.snappy;
		const steps = 16;
		const frames: Record<string, number | string>[] = Array.from({ length: steps + 1 }, (_, i) => {
			const left = 1 - easing(i / steps);
			return {
				offset: i / steps,
				transform: `translate(${dx * left}px, ${dy * left}px) scale(${1 + (scale - 1) * left})`
			};
		});
		const animation = carried.animate(frames, { duration, fill: 'both' });
		flight = animation;
		// Cancel events arrive a frame late, after a newer pick may have taken
		// over, so each flight removes only its own copy and only the latest one
		// hands the field its text back.
		const land = () => {
			carried.remove();
			if (flight !== animation) return;
			flight = undefined;
			ghost = undefined;
			landing = false;
		};
		animation.onfinish = land;
		animation.oncancel = land;
	}

	let previous = untrack(() => context?.value);
	$effect(() => {
		const value = context?.value;
		if (value === previous) return;
		previous = value;
		const input = ref as HTMLInputElement | null;
		if (typeof value !== 'string' || !value || !input || !context?.contentId) return;
		if (prefersReducedMotion() || typeof input.animate !== 'function') return;
		const item = document
			.getElementById(context.contentId)
			?.querySelector<HTMLElement>(`[data-combobox-item][data-value="${CSS.escape(value)}"]`);
		if (item) untrack(() => fly(item, input));
	});

	$effect(() => () => {
		flight?.cancel();
		ghost?.remove();
	});
</script>

<ComboboxPrimitive.Input
	bind:ref
	aria-controls={context?.open ? context.contentId : undefined}
	data-landing={landing ? '' : undefined}
	class={cn(
		'bg-control placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full items-center rounded-full px-3.5 py-2 text-base transition-[box-shadow,border-color] duration-(--duration-base) outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 data-[landing]:text-transparent sm:text-sm',
		className
	)}
	{...restProps}
/>
