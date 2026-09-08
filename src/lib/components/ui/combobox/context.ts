import { getContext, setContext } from 'svelte';
const key = Symbol('mizu-combobox');
type ComboboxContext = { readonly open: boolean; contentId: string | undefined };
export const setComboboxContext = (context: ComboboxContext) => setContext(key, context);
export const getComboboxContext = () => getContext<ComboboxContext | undefined>(key);
