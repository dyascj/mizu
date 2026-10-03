<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLAttributes } from 'svelte/elements';
	import { prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn, type WithElementRef } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLUListElement>, HTMLUListElement> = $props();

	const ACTIVE = '[data-sidebar="menu-button"][data-active="true"]';
	const GLIDE = ['translate', 'width', 'height']
		.map((property) => `${property} var(--duration-spring-snappy) var(--ease-spring-snappy)`)
		.join(', ');

	/**
	 * One highlight for the whole menu that glides to whichever button is
	 * active. It is the list's own `::before`, so it adds no element and item
	 * selectors such as `first:` still see only the items. Only a change of
	 * item moves it; a resize, such as the rail folding, carries it along
	 * instantly so it never fights the width spring. Before this runs, and
	 * without JavaScript, each active button paints its own background.
	 */
	const indicator: Attachment<HTMLElement> = (menu) => {
		if (typeof ResizeObserver === 'undefined') return;

		let current: HTMLElement | null = null;
		/** Sizes last seen per observed element, so only a real resize snaps the highlight. */
		const sizes = new WeakMap<Element, string>();
		const sizeOf = (el: Element) =>
			el instanceof HTMLElement ? `${el.offsetWidth}x${el.offsetHeight}` : '';

		const find = () =>
			Array.from(menu.querySelectorAll<HTMLElement>(ACTIVE)).find(
				(button) =>
					button.closest('[data-sidebar="menu"]') === menu && button.getClientRects().length
			) ?? null;

		const set = (name: string, value: string) =>
			menu.style.setProperty(`--menu-glide-${name}`, value);

		const place = (moved: boolean) => {
			const active = find();
			if (active !== current) {
				if (current) resize.unobserve(current);
				if (active) {
					// Observing reports the element once straight away. Knowing its
					// size already, that report is ignored instead of cancelling the glide.
					sizes.set(active, sizeOf(active));
					resize.observe(active);
				}
			}
			if (!active) {
				menu.removeAttribute('data-glide');
				current = null;
				return;
			}
			const glide = moved && current !== null && !prefersReducedMotion();
			const box = menu.getBoundingClientRect();
			const rect = active.getBoundingClientRect();
			set('transition', glide ? GLIDE : 'none');
			set('x', `${rect.left - box.left}px`);
			set('y', `${rect.top - box.top}px`);
			set('width', `${rect.width}px`);
			set('height', `${rect.height}px`);
			menu.setAttribute('data-glide', '');
			current = active;
		};

		const resize = new ResizeObserver((entries) => {
			let changed = false;
			for (const { target } of entries) {
				const size = sizeOf(target);
				if (sizes.get(target) !== size) changed = true;
				sizes.set(target, size);
			}
			if (changed) place(false);
		});
		const mutations = new MutationObserver((records) =>
			place(records.some((record) => record.attributeName === 'data-active'))
		);
		sizes.set(menu, sizeOf(menu));
		resize.observe(menu);
		mutations.observe(menu, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: ['data-active']
		});
		place(false);

		return () => {
			resize.disconnect();
			mutations.disconnect();
			menu.removeAttribute('data-glide');
			for (const name of ['transition', 'x', 'y', 'width', 'height']) {
				menu.style.removeProperty(`--menu-glide-${name}`);
			}
		};
	};
</script>

<ul
	bind:this={ref}
	data-slot="sidebar-menu"
	data-sidebar="menu"
	class={cn(
		'relative flex w-full min-w-0 flex-col gap-0.5',
		'before:bg-secondary before:pointer-events-none before:absolute before:top-0 before:left-0 before:hidden before:h-(--menu-glide-height) before:w-(--menu-glide-width) before:[translate:var(--menu-glide-x)_var(--menu-glide-y)] before:rounded-lg before:[transition:var(--menu-glide-transition,none)] data-glide:before:block',
		className
	)}
	{...restProps}
	{@attach indicator}
>
	{@render children?.()}
</ul>
