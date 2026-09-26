import { getContext, hasContext, setContext } from 'svelte';

/** Resting tile size in px, matching `size-11`. */
export const DOCK_TILE = 44;
/** Space between tiles in px, matching the row's `gap-2`. */
export const DOCK_GAP = 8;

export type DockState = {
	/** Pointer X in viewport px while hovering the dock, or null when away. */
	readonly pointerX: number | null;
	/** Max scale applied to the item directly under the pointer. */
	readonly magnification: number;
	/** Influence radius in px: how far the magnify falls off either side. */
	readonly distance: number;
	/**
	 * Share of a magnified tile's extra size its slot may take, from 0 to 1.
	 * Slots only widen into free room beside the dock, so the row never wraps
	 * under the pointer; a dock with no room magnifies in place.
	 */
	readonly growth: number;
	/** The item whose caption is showing, if any. */
	readonly tip: string | null;
	/** True when the caption moved from a neighbor and should swap without animating. */
	readonly tipInstant: boolean;
	/**
	 * Show an item's caption. The first one waits a beat so a pointer passing
	 * through doesn't flash it; once one is up, neighbors swap in at once.
	 * `now` skips the wait, for keyboard focus.
	 */
	showTip: (id: string, now?: boolean) => void;
	/** Hide the caption. */
	hideTip: () => void;
};

const DOCK_KEY = Symbol('mizu-dock');

export function setDockContext(state: DockState) {
	setContext(DOCK_KEY, state);
}

export function getDockContext(): DockState {
	if (!hasContext(DOCK_KEY)) {
		throw new Error('<Dock.Item> must be used within a <Dock.Root> component.');
	}
	return getContext(DOCK_KEY);
}
