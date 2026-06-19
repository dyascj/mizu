import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
import Content from './dropdown-menu-content.svelte';
import Item from './dropdown-menu-item.svelte';
import CheckboxItem from './dropdown-menu-checkbox-item.svelte';
import RadioItem from './dropdown-menu-radio-item.svelte';
import Separator from './dropdown-menu-separator.svelte';
import Label from './dropdown-menu-label.svelte';
import SubTrigger from './dropdown-menu-sub-trigger.svelte';
import SubContent from './dropdown-menu-sub-content.svelte';
import Shortcut from './dropdown-menu-shortcut.svelte';

const Root = DropdownMenuPrimitive.Root;
const Trigger = DropdownMenuPrimitive.Trigger;
const Group = DropdownMenuPrimitive.Group;
const Sub = DropdownMenuPrimitive.Sub;
const RadioGroup = DropdownMenuPrimitive.RadioGroup;
const Portal = DropdownMenuPrimitive.Portal;

export {
	Root,
	Trigger,
	Portal,
	Content,
	Group,
	Item,
	CheckboxItem,
	RadioGroup,
	RadioItem,
	Separator,
	Label,
	Sub,
	SubTrigger,
	SubContent,
	Shortcut,
	//
	Root as DropdownMenu,
	Trigger as DropdownMenuTrigger,
	Portal as DropdownMenuPortal,
	Content as DropdownMenuContent,
	Group as DropdownMenuGroup,
	Item as DropdownMenuItem,
	CheckboxItem as DropdownMenuCheckboxItem,
	RadioGroup as DropdownMenuRadioGroup,
	RadioItem as DropdownMenuRadioItem,
	Separator as DropdownMenuSeparator,
	Label as DropdownMenuLabel,
	Sub as DropdownMenuSub,
	SubTrigger as DropdownMenuSubTrigger,
	SubContent as DropdownMenuSubContent,
	Shortcut as DropdownMenuShortcut
};
