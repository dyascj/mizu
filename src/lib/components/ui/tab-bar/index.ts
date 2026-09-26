import Root from './tab-bar.svelte';
import Item from './tab-bar-item.svelte';

export {
	Root,
	Item,
	//
	Root as TabBar,
	Item as TabBarItem
};

export type { TabBarLabels, TabBarVariant } from './context.js';
