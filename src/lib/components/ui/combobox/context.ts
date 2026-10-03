import { getContext, setContext } from 'svelte';
const key = Symbol('mizu-combobox');
type ComboboxContext = {
	readonly open: boolean;
	/** The chosen value, so the input can carry a fresh pick in from the list. */
	readonly value: string | string[] | undefined;
	contentId: string | undefined;
	/** The field, so the list can take the direction it reads in. */
	input: HTMLElement | null;
	/** Whether the open list lays out right to left. */
	readonly rtl: boolean;
};
export const setComboboxContext = (context: ComboboxContext) => setContext(key, context);
export const getComboboxContext = () => getContext<ComboboxContext | undefined>(key);
