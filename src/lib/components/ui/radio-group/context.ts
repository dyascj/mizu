import { getContext, setContext } from 'svelte';

export type RadioGroupState = {
	/** Where the selection ring sat just before the value last changed, in viewport pixels. */
	readonly previousRing: DOMRect | null;
};

const key = Symbol('radio-group');

export function setRadioGroupState(state: RadioGroupState) {
	return setContext(key, state);
}

export function getRadioGroupState(): RadioGroupState | undefined {
	return getContext(key);
}
