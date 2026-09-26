import { getContext, setContext } from 'svelte';
const key = Symbol('mizu-select');
type SelectContext = {
	readonly open: boolean;
	contentId: string | undefined;
	/** The trigger, so item-aligned content can sit its choice on top of it. */
	trigger: HTMLElement | null;
	/**
	 * Where the press that opened the list began, until it is released. A
	 * release that has not travelled is the end of a click, not a pick.
	 */
	press: { x: number; y: number; moved: boolean } | null;
};
export const setSelectContext = (context: SelectContext) => setContext(key, context);
export const getSelectContext = () => getContext<SelectContext | undefined>(key);
