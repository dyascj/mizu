import { getContext, setContext } from 'svelte';
const key = Symbol('mizu-select');
type SelectContext = { readonly open: boolean; contentId: string | undefined };
export const setSelectContext = (context: SelectContext) => setContext(key, context);
export const getSelectContext = () => getContext<SelectContext | undefined>(key);
