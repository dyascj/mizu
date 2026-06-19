import { Collapsible as CollapsiblePrimitive } from 'bits-ui';
import Trigger from './collapsible-trigger.svelte';
import Content from './collapsible-content.svelte';

const Root = CollapsiblePrimitive.Root;

export {
	Root,
	Trigger,
	Content,
	//
	Root as Collapsible,
	Trigger as CollapsibleTrigger,
	Content as CollapsibleContent
};
