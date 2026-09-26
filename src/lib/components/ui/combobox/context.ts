import { getContext, setContext } from 'svelte';
const key = Symbol('mizu-combobox');
type ComboboxContext = {
	readonly open: boolean;
	/** The chosen value, so the input can carry a fresh pick in from the list. */
	readonly value: string | string[] | undefined;
	contentId: string | undefined;
};
export const setComboboxContext = (context: ComboboxContext) => setContext(key, context);
export const getComboboxContext = () => getContext<ComboboxContext | undefined>(key);
