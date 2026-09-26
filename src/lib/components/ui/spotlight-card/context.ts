import { getContext, hasContext, setContext } from 'svelte';

export type SpotlightGroupState = {
	/** Adds a card to the group's light. Returns the matching removal. */
	register: (card: HTMLElement) => () => void;
};

const SPOTLIGHT_KEY = Symbol('mizu-spotlight');

export function setSpotlightGroup(state: SpotlightGroupState) {
	setContext(SPOTLIGHT_KEY, state);
}

export function getSpotlightGroup(): SpotlightGroupState | undefined {
	return hasContext(SPOTLIGHT_KEY) ? getContext(SPOTLIGHT_KEY) : undefined;
}
