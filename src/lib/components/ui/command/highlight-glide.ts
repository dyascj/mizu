import type { Attachment } from 'svelte/attachments';
import { prefersReducedMotion } from '$lib/components/ui/motion';

// Command and Combobox each carry an identical copy of this file on purpose,
// so each registry item installs on its own without depending on the other.
// Change both together.

/**
 * One highlight for the whole list that glides from row to row, so moving
 * through results reads as a single thing travelling rather than rows
 * blinking on and off. Attach to the positioned element that holds both the
 * items and a `[data-highlight-pill]` element; the pill is moved under
 * whichever item matches `highlighted`. When the list is rebuilt (opened or
 * filtered) the pill lands in place instead of sliding from its last spot.
 */
export function highlightGlide(highlighted: string): Attachment<HTMLElement> {
	return (container) => {
		const pill = container.querySelector<HTMLElement>(':scope > [data-highlight-pill]');
		if (!pill) return;
		container.setAttribute('data-highlight-glide', '');

		let shown = false;
		let rebuilt = true;

		const move = () => {
			const item = container.querySelector<HTMLElement>(highlighted);
			if (!item || !item.offsetHeight) {
				shown = false;
				pill.style.opacity = '0';
				return;
			}
			const jump = !shown || rebuilt || prefersReducedMotion();
			rebuilt = false;
			shown = true;
			if (jump) pill.style.transition = 'none';
			pill.style.translate = `${item.offsetLeft}px ${item.offsetTop}px`;
			pill.style.width = `${item.offsetWidth}px`;
			pill.style.height = `${item.offsetHeight}px`;
			pill.style.opacity = '1';
			if (jump) {
				// Commits the jump before the transition comes back.
				void pill.offsetHeight;
				pill.style.removeProperty('transition');
			}
		};

		const observer = new MutationObserver((records) => {
			if (records.some((record) => record.type === 'childList')) rebuilt = true;
			move();
		});
		observer.observe(container, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: ['data-highlighted', 'data-selected', 'aria-selected', 'hidden']
		});
		// The list can settle its width after it opens; re-measure in place.
		const resize = new ResizeObserver(() => {
			rebuilt = true;
			move();
		});
		resize.observe(container);
		move();

		return () => {
			observer.disconnect();
			resize.disconnect();
			container.removeAttribute('data-highlight-glide');
		};
	};
}
