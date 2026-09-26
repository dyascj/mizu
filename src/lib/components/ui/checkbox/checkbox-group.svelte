<script lang="ts">
	import { Checkbox as CheckboxPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { cn } from '$lib/utils.js';

	type Props = WithoutChildrenOrChild<CheckboxPrimitive.GroupProps> & {
		/** The `value` of every checked box inside, in the order they appear. Bindable. */
		value?: string[];
		/** Called with the new list whenever a box, or a range of boxes, changes. */
		onValueChange?: (value: string[]) => void;
		/**
		 * Shift-click a box, or press Shift and Space on it, to give every box
		 * between it and the last one you changed the same state.
		 */
		rangeSelect?: boolean;
		/** The group element. */
		ref?: HTMLElement | null;
		/** Classes for the group. */
		class?: string;
		/** `Checkbox` elements, each with a `value`, and their labels. */
		children?: Snippet;
	};

	let {
		ref = $bindable(null),
		value = $bindable([]),
		onValueChange,
		rangeSelect = true,
		class: className,
		children,
		...restProps
	}: Props = $props();

	const boxSelector = '[data-checkbox-root]';

	/**
	 * Range selection sits on top of bits-ui: a plain press sets the anchor and
	 * lets the box toggle itself; a Shift press stops that toggle and writes the
	 * whole range at once. The pressed box decides the direction, and the boxes
	 * between follow it.
	 */
	const ranges: Attachment<HTMLElement> = (group) => {
		let anchor: string | null = null;
		// A label forwards a second click to its box, and browsers disagree on
		// whether that one carries Shift, so the press that started it decides.
		let pressShift = false;

		const boxes = () =>
			[...group.querySelectorAll<HTMLElement>(boxSelector)].filter(
				(box) => box.closest('[data-checkbox-group]') === group && !box.hasAttribute('disabled')
			);

		const boxFrom = (target: EventTarget | null) => {
			const box = (target as Element | null)?.closest?.<HTMLElement>(boxSelector);
			return box && box.closest('[data-checkbox-group]') === group ? box : null;
		};

		/** Returns true when it handled the press as a range. */
		function select(box: HTMLElement, shift: boolean) {
			const id = box.dataset.value ?? null;
			const list = boxes();
			const to = list.indexOf(box);
			const from = anchor === null ? -1 : list.findIndex((b) => b.dataset.value === anchor);
			anchor = id;
			if (!rangeSelect || !shift || from === -1 || to === -1 || from === to) return false;

			const check = box.getAttribute('aria-checked') !== 'true';
			const [lo, hi] = from < to ? [from, to] : [to, from];
			const range = list
				.slice(lo, hi + 1)
				.map((item) => item.dataset.value)
				.filter((v): v is string => !!v);
			const order = list.map((b) => b.dataset.value).filter((v): v is string => !!v);
			const isChecked = (v: string) => (range.includes(v) ? check : value.includes(v));
			// Boxes in document order first, then any values the group holds without a box.
			const ordered = [...order.filter(isChecked), ...value.filter((v) => !order.includes(v))];
			value = ordered;
			onValueChange?.(ordered);
			return true;
		}

		const onpointerdown = (event: PointerEvent) => {
			pressShift = event.shiftKey;
		};
		// Shift extends the text selection on press; a range press should not.
		const onmousedown = (event: MouseEvent) => {
			if (!rangeSelect || !event.shiftKey || anchor === null) return;
			const target = event.target as Element | null;
			if (boxFrom(target) || target?.closest?.('label')) event.preventDefault();
		};
		const onclick = (event: MouseEvent) => {
			const box = boxFrom(event.target);
			if (!box) return;
			const shift = event.shiftKey || pressShift;
			pressShift = false;
			if (select(box, shift)) {
				// Keeps the press from reaching the box, which would toggle it alone.
				event.preventDefault();
				event.stopPropagation();
				box.focus({ preventScroll: true });
			}
		};
		const onkeydown = (event: KeyboardEvent) => {
			if (event.key !== ' ') return;
			const box = boxFrom(event.target);
			if (!box) return;
			pressShift = false;
			if (select(box, event.shiftKey)) {
				event.preventDefault();
				event.stopPropagation();
			}
		};

		group.addEventListener('pointerdown', onpointerdown, true);
		group.addEventListener('mousedown', onmousedown, true);
		group.addEventListener('click', onclick, true);
		group.addEventListener('keydown', onkeydown, true);
		return () => {
			group.removeEventListener('pointerdown', onpointerdown, true);
			group.removeEventListener('mousedown', onmousedown, true);
			group.removeEventListener('click', onclick, true);
			group.removeEventListener('keydown', onkeydown, true);
		};
	};
</script>

<CheckboxPrimitive.Group
	bind:ref
	bind:value
	{onValueChange}
	class={cn('grid gap-3', className)}
	{...restProps}
	{@attach ranges}
>
	{@render children?.()}
</CheckboxPrimitive.Group>
