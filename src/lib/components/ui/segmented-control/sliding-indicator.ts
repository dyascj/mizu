import type { Attachment } from 'svelte/attachments';

/**
 * Keeps the attached element sized and positioned over the descendant of its
 * parent that matches `selector`. Moving to a different match animates through
 * the element's own CSS transition. The first placement and layout changes
 * (resizes, wrapping, fonts loading) apply instantly so the indicator never
 * trails the content it marks.
 *
 * The parent must be positioned. It receives `data-indicator` while the
 * indicator is in place, so items can drop the fallback fill they show before
 * hydration.
 */
export function slidingIndicator(selector: string): Attachment<HTMLElement> {
	return (indicator) => {
		const container = indicator.parentElement;
		if (!container) return;

		let current: HTMLElement | null = null;

		const place = () => {
			const target = container.querySelector<HTMLElement>(selector);
			if (!target) {
				current = null;
				indicator.hidden = true;
				container.removeAttribute('data-indicator');
				return;
			}

			// Offsets ignore transforms, so a pressed item's scale never leaks in.
			let x = 0;
			let y = 0;
			for (let el: HTMLElement | null = target; el && el !== container;) {
				x += el.offsetLeft;
				y += el.offsetTop;
				el = el.offsetParent as HTMLElement | null;
			}

			const instant = current === null || current === target;
			current = target;
			if (instant) indicator.style.transition = 'none';
			indicator.hidden = false;
			indicator.style.translate = `${x}px ${y}px`;
			indicator.style.width = `${target.offsetWidth}px`;
			indicator.style.height = `${target.offsetHeight}px`;
			if (instant) {
				// Commit the jump before the transition comes back.
				void indicator.offsetWidth;
				indicator.style.transition = '';
			}
			container.setAttribute('data-indicator', '');
		};

		const resizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(place);
		const observeSizes = () => {
			if (!resizes) return;
			resizes.disconnect();
			resizes.observe(container);
			for (const child of container.children) {
				if (child !== indicator) resizes.observe(child);
			}
		};

		const mutations = new MutationObserver((records) => {
			if (records.some((record) => record.type === 'childList')) observeSizes();
			place();
		});
		mutations.observe(container, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: ['data-state']
		});

		observeSizes();
		place();

		return () => {
			mutations.disconnect();
			resizes?.disconnect();
			container.removeAttribute('data-indicator');
		};
	};
}
