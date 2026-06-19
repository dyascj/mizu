import { Dialog as DialogPrimitive } from 'bits-ui';

import Root from './dialog.svelte';
import Trigger from './dialog-trigger.svelte';
import Overlay from './dialog-overlay.svelte';
import Content from './dialog-content.svelte';
import Close from './dialog-close.svelte';
import Header from './dialog-header.svelte';
import Footer from './dialog-footer.svelte';
import Title from './dialog-title.svelte';
import Description from './dialog-description.svelte';

const Portal = DialogPrimitive.Portal;

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
	Root as Dialog,
	Trigger as DialogTrigger,
	Portal as DialogPortal,
	Overlay as DialogOverlay,
	Content as DialogContent,
	Close as DialogClose,
	Header as DialogHeader,
	Footer as DialogFooter,
	Title as DialogTitle,
	Description as DialogDescription
};
