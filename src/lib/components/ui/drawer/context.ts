import { getContext, setContext } from 'svelte';

/** Lets a nested drawer tell the drawer behind it how far it has been dragged away. */
export type DrawerLayerContext = {
	/** 0 while the drawer on top is fully open, 1 once it is dragged fully away; null when released. */
	setNestedDrag: (progress: number | null) => void;
};

const KEY = Symbol('mizu-drawer-layer');

export function setDrawerLayer(layer: DrawerLayerContext) {
	setContext(KEY, layer);
}

export function getDrawerLayer(): DrawerLayerContext | undefined {
	return getContext<DrawerLayerContext | undefined>(KEY);
}
