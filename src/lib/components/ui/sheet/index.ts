import { Dialog as SheetPrimitive } from 'bits-ui';

import Root from './sheet.svelte';
import Trigger from './sheet-trigger.svelte';
import Overlay from './sheet-overlay.svelte';
import Content from './sheet-content.svelte';
import Close from './sheet-close.svelte';
import Header from './sheet-header.svelte';
import Footer from './sheet-footer.svelte';
import Title from './sheet-title.svelte';
import Description from './sheet-description.svelte';

const Portal = SheetPrimitive.Portal;

export { sheetVariants, type SheetSide } from './sheet-content.svelte';

export {
	Root,
	Trigger,
	Portal,
	Overlay,
	Content,
	Close,
	Header,
	Footer,
	Title,
	Description,
	//
	Root as Sheet,
	Trigger as SheetTrigger,
	Portal as SheetPortal,
	Overlay as SheetOverlay,
	Content as SheetContent,
	Close as SheetClose,
	Header as SheetHeader,
	Footer as SheetFooter,
	Title as SheetTitle,
	Description as SheetDescription
};
