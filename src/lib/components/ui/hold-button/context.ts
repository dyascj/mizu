import { getContext, setContext } from 'svelte';

export type HoldPhase = 'idle' | 'holding' | 'retracting' | 'done';

export type HoldButtonState = {
	/** Where the press is in its lifecycle. */
	readonly phase: HoldPhase;
	/** How far the fill has swept, from 0 to 1. */
	readonly progress: number;
	/** True from the moment a hold confirms until the fill has fully retracted. */
	readonly confirmed: boolean;
	/** Lets an animated icon ask the label swap to wait for its own finish. */
	register: () => () => void;
};

const key = Symbol('hold-button');

export function setHoldButtonState(state: HoldButtonState) {
	return setContext(key, state);
}

export function getHoldButtonState(): HoldButtonState | undefined {
	return getContext(key);
}
