import { getContext, setContext } from 'svelte';

export type TabsListVariant = 'pill' | 'underline';

export type TabsRootState = {
	/** Which way the last change of tab went: 1 forward, -1 back, 0 before any change. */
	direction: number;
};

export type TabsListState = {
	readonly variant: TabsListVariant;
};

const ROOT_KEY = Symbol('mizu-tabs');
const LIST_KEY = Symbol('mizu-tabs-list');

export function setTabsRootState(state: TabsRootState) {
	setContext(ROOT_KEY, state);
}

/** Undefined when a part is used outside `Tabs.Root`, which bits-ui reports on its own. */
export function getTabsRootState(): TabsRootState | undefined {
	return getContext(ROOT_KEY);
}

export function setTabsListState(state: TabsListState) {
	setContext(LIST_KEY, state);
}

export function getTabsListState(): TabsListState | undefined {
	return getContext(LIST_KEY);
}
