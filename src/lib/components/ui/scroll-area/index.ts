import { ScrollArea as ScrollAreaPrimitive } from 'bits-ui';
import Root from './scroll-area.svelte';
import Scrollbar from './scroll-area-scrollbar.svelte';

const Corner = ScrollAreaPrimitive.Corner;
const Thumb = ScrollAreaPrimitive.Thumb;
const Viewport = ScrollAreaPrimitive.Viewport;

export {
	Root,
	Scrollbar,
	Corner,
	Thumb,
	Viewport,
	//
	Root as ScrollArea,
	Scrollbar as ScrollAreaScrollbar,
	Corner as ScrollAreaCorner,
	Thumb as ScrollAreaThumb,
	Viewport as ScrollAreaViewport
};
