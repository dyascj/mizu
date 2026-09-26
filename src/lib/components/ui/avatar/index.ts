import Root from './avatar.svelte';
import Image from './avatar-image.svelte';
import Fallback from './avatar-fallback.svelte';
import Status from './avatar-status.svelte';

export {
	Root,
	Image,
	Fallback,
	Status,
	//
	Root as Avatar,
	Image as AvatarImage,
	Fallback as AvatarFallback,
	Status as AvatarStatus
};

export { presenceLabels, type AvatarPresence } from './status.js';
