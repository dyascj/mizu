import { getContext, hasContext, setContext } from 'svelte';

export type DockState = {
	/** Pointer X in viewport px while hovering the dock, or null when away. */
	readonly pointerX: number | null;
	/** Max scale applied to the item directly under the pointer. */
	readonly magnification: number;
	/** Influence radius in px — how far the magnify falls off either side. */
	readonly distance: number;
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
