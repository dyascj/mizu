import { getContext, hasContext, setContext } from 'svelte';

export type TabBarVariant = 'floating' | 'docked';
export type TabBarLabels = 'visible' | 'hidden' | 'active';

export type TabBarState = {
	readonly variant: TabBarVariant;
	readonly labels: TabBarLabels;
	/** True once the sliding indicator has measured its first position. */
	readonly measured: boolean;
	/** Mark an element as the active target for the indicator; returns a release function. */
	activate(target: HTMLElement): () => void;
};

const TAB_BAR_KEY = Symbol('mizu-tab-bar');

export function setTabBarContext(state: TabBarState) {
	setContext(TAB_BAR_KEY, state);
}

export function getTabBarContext(): TabBarState {
	if (!hasContext(TAB_BAR_KEY)) {
		throw new Error('<TabBar.Item> must be used within a <TabBar.Root> component.');
	}
	return getContext(TAB_BAR_KEY);
}
