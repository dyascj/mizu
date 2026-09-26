import type { Attachment } from 'svelte/attachments';

// Select and Combobox each carry an identical copy of this file on purpose,
// so each registry item installs on its own without depending on the other.
// Change both together.

/**
 * Keeps a list that scrolls reachable by keyboard. While the viewport
 * overflows it joins the tab order as a group of the listbox, so the region
 * can be focused and scrolled; a list that fits stays out of the way. Arrow
 * keys, typeahead, and the highlighted option are still handled by the list.
 */
export const scrollReach: Attachment<HTMLElement> = (viewport) => {
	const initialRole = viewport.getAttribute('role');
	const update = () => {
		const scrolls = viewport.scrollHeight > viewport.clientHeight + 1;
		if (scrolls) {
			viewport.setAttribute('tabindex', '0');
			viewport.setAttribute('role', 'group');
		} else {
			viewport.removeAttribute('tabindex');
			if (initialRole === null) viewport.removeAttribute('role');
			else viewport.setAttribute('role', initialRole);
		}
	};
	update();
	if (typeof ResizeObserver === 'undefined') return;
	// The viewport resizes with its cap; its children resize as options come and go.
	const resizes = new ResizeObserver(update);
	const observe = () => {
		resizes.disconnect();
		resizes.observe(viewport);
		for (const child of viewport.children) resizes.observe(child);
	};
	const mutations = new MutationObserver(() => {
		observe();
		update();
	});
	mutations.observe(viewport, { childList: true });
	observe();
	return () => {
		resizes.disconnect();
		mutations.disconnect();
	};
};
