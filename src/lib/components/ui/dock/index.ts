import Root from './dock.svelte';
import Item from './dock-item.svelte';

export {
	Root,
	Item,
	//
	Root as Dock,
	Item as DockItem
};

export type { DockState } from './context.js';
