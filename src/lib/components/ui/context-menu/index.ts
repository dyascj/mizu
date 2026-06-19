import { ContextMenu as ContextMenuPrimitive } from 'bits-ui';
import Content from './context-menu-content.svelte';
import Item from './context-menu-item.svelte';
import CheckboxItem from './context-menu-checkbox-item.svelte';
import RadioItem from './context-menu-radio-item.svelte';
import Separator from './context-menu-separator.svelte';
import Label from './context-menu-label.svelte';
import SubTrigger from './context-menu-sub-trigger.svelte';
import SubContent from './context-menu-sub-content.svelte';
import Shortcut from './context-menu-shortcut.svelte';

const Root = ContextMenuPrimitive.Root;
const Trigger = ContextMenuPrimitive.Trigger;
const Group = ContextMenuPrimitive.Group;
const Sub = ContextMenuPrimitive.Sub;
const RadioGroup = ContextMenuPrimitive.RadioGroup;
const Portal = ContextMenuPrimitive.Portal;

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
	Root as ContextMenu,
	Trigger as ContextMenuTrigger,
	Portal as ContextMenuPortal,
	Content as ContextMenuContent,
	Group as ContextMenuGroup,
	Item as ContextMenuItem,
	CheckboxItem as ContextMenuCheckboxItem,
	RadioGroup as ContextMenuRadioGroup,
	RadioItem as ContextMenuRadioItem,
	Separator as ContextMenuSeparator,
	Label as ContextMenuLabel,
	Sub as ContextMenuSub,
	SubTrigger as ContextMenuSubTrigger,
	SubContent as ContextMenuSubContent,
	Shortcut as ContextMenuShortcut
};
