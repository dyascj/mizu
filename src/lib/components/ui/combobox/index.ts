import { Combobox as ComboboxPrimitive } from 'bits-ui';

import Input from './combobox-input.svelte';
import Trigger from './combobox-trigger.svelte';
import Content from './combobox-content.svelte';
import Item from './combobox-item.svelte';
import Group from './combobox-group.svelte';
import GroupHeading from './combobox-group-heading.svelte';

const Root = ComboboxPrimitive.Root;
const Portal = ComboboxPrimitive.Portal;

export {
	Root,
	Input,
	Trigger,
	Portal,
	Content,
	Item,
	Group,
	GroupHeading,
	//
	Root as Combobox,
	Input as ComboboxInput,
	Trigger as ComboboxTrigger,
	Portal as ComboboxPortal,
	Content as ComboboxContent,
	Item as ComboboxItem,
	Group as ComboboxGroup,
	GroupHeading as ComboboxGroupHeading
};
