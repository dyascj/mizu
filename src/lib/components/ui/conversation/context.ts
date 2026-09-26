import { getContext, setContext } from 'svelte';

export type ConversationContext = {
	/** A message mounted after the thread first rendered. */
	arrived: (role: 'user' | 'assistant') => void;
};

const key = Symbol('conversation');

export function setConversationContext(context: ConversationContext) {
	setContext(key, context);
}

export function getConversationContext(): ConversationContext | undefined {
	return getContext<ConversationContext | undefined>(key);
}
