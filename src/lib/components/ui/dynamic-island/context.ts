import { getContext, setContext } from 'svelte';

export type IslandShape = 'pill' | 'card';

export type DynamicIslandState = {
	/** Name of the activity on show. */
	readonly activity: string;
	/** Records an activity's announcement. Returns a function that forgets it. */
	register: (name: string, label: () => string | undefined) => () => void;
	/** Sizes the island to an activity's content while it is on show. */
	track: (node: HTMLElement, shape: IslandShape) => () => void;
};

const key = Symbol('dynamic-island');

export function setDynamicIslandState(state: DynamicIslandState) {
	return setContext(key, state);
}

export function getDynamicIslandState(): DynamicIslandState {
	const state = getContext<DynamicIslandState | undefined>(key);
	if (!state) throw new Error('DynamicIsland.Activity must be placed inside DynamicIsland.Root.');
	return state;
}
