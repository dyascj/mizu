import { getContext, setContext } from 'svelte';
const key = Symbol('mizu-command');
type CommandContext = {
	/** The current search text, so matches can be marked inside results. */
	search: string;
};
export const setCommandContext = (context: CommandContext) => setContext(key, context);
export const getCommandContext = () => getContext<CommandContext | undefined>(key);
