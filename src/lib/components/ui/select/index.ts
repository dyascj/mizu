import { Select as SelectPrimitive } from 'bits-ui';
import Trigger from './select-trigger.svelte';
import Content from './select-content.svelte';
import Item from './select-item.svelte';
import Group from './select-group.svelte';
import Label from './select-label.svelte';

const Root = SelectPrimitive.Root;

export {
	Root,
	Trigger,
	Content,
	Item,
	Group,
	Label,
	//
	Root as Select,
	Trigger as SelectTrigger,
	Content as SelectContent,
	Item as SelectItem,
	Group as SelectGroup,
	Label as SelectLabel,
	Label as SelectGroupHeading
};
