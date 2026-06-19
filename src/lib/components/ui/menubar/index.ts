import { Menubar as MenubarPrimitive } from 'bits-ui';
import Root from './menubar.svelte';
import Trigger from './menubar-trigger.svelte';
import Content from './menubar-content.svelte';
import Item from './menubar-item.svelte';
import CheckboxItem from './menubar-checkbox-item.svelte';
import RadioItem from './menubar-radio-item.svelte';
import Separator from './menubar-separator.svelte';
import Label from './menubar-label.svelte';
import SubTrigger from './menubar-sub-trigger.svelte';
import SubContent from './menubar-sub-content.svelte';
import Shortcut from './menubar-shortcut.svelte';

const Menu = MenubarPrimitive.Menu;
const Group = MenubarPrimitive.Group;
const Sub = MenubarPrimitive.Sub;
const RadioGroup = MenubarPrimitive.RadioGroup;
const Portal = MenubarPrimitive.Portal;

export {
	Root,
	Menu,
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
	Root as Menubar,
	Menu as MenubarMenu,
	Trigger as MenubarTrigger,
	Portal as MenubarPortal,
	Content as MenubarContent,
	Group as MenubarGroup,
	Item as MenubarItem,
	CheckboxItem as MenubarCheckboxItem,
	RadioGroup as MenubarRadioGroup,
	RadioItem as MenubarRadioItem,
	Separator as MenubarSeparator,
	Label as MenubarLabel,
	Sub as MenubarSub,
	SubTrigger as MenubarSubTrigger,
	SubContent as MenubarSubContent,
	Shortcut as MenubarShortcut
};
