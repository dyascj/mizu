/** Shared autoplay switch for every playground card on the landing page. */
export const playground = $state({ autoplay: true });

export type CursorStep = {
	/** Selector for the element to act on, scoped to the card. */
	target: string;
	/** What the cursor does when it arrives. Defaults to click. */
	action?: 'click' | 'hover' | 'hold' | 'type';
	/** Text to enter for `type` steps. */
	text?: string;
	/** Milliseconds to hold for `hold` steps. */
	hold?: number;
	/** Milliseconds to rest after the step. */
	wait?: number;
};
