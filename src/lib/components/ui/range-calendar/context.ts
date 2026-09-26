import { getContext, setContext } from 'svelte';

/**
 * The span the calendar paints, as ISO dates. While an end is being picked it
 * runs from the start to the day under the pointer or keyboard focus.
 */
export type RangePaint = {
	/** The earlier edge of the painted span. */
	readonly lo: string | null;
	/** The later edge of the painted span. */
	readonly hi: string | null;
	/** The day that would become the other end, while one is being picked. */
	readonly prospective: string | null;
};

const key = Symbol('range-calendar-paint');

export function setRangePaint(paint: RangePaint) {
	setContext(key, paint);
}

export function getRangePaint(): RangePaint | undefined {
	return getContext<RangePaint | undefined>(key);
}
