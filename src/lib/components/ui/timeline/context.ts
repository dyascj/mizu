import { getContext, setContext } from 'svelte';

const key = Symbol('timeline');

export type TimelineState = {
	/** True once the timeline has mounted and `animated` is on: items added now slide in. */
	readonly animateNewItems: boolean;
};

export function setTimelineState(state: TimelineState) {
	setContext(key, state);
}

export function getTimelineState(): TimelineState | undefined {
	return getContext<TimelineState | undefined>(key);
}
