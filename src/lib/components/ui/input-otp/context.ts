import { getContext, setContext } from 'svelte';

/** Where a code stands: being typed, being checked, refused, or accepted. */
export type InputOTPStatus = 'idle' | 'checking' | 'error' | 'success';

type InputOTPState = { readonly status: InputOTPStatus };

const key = Symbol('input-otp');

export function setInputOTPState(state: InputOTPState) {
	setContext(key, state);
}

/** Slots rendered outside a Root read as idle. */
export function getInputOTPState(): InputOTPState {
	return getContext<InputOTPState | undefined>(key) ?? { status: 'idle' };
}
