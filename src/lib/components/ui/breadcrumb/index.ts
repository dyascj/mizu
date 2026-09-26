import Root from './breadcrumb.svelte';
import List from './breadcrumb-list.svelte';
import Item from './breadcrumb-item.svelte';
import Link from './breadcrumb-link.svelte';
import Page from './breadcrumb-page.svelte';
import Separator from './breadcrumb-separator.svelte';
import Ellipsis from './breadcrumb-ellipsis.svelte';
import Trail from './breadcrumb-trail.svelte';

export {
	Root,
	List,
	Item,
	Link,
	Page,
	Separator,
	Ellipsis,
	Trail,
	//
	Root as Breadcrumb,
	List as BreadcrumbList,
	Item as BreadcrumbItem,
	Link as BreadcrumbLink,
	Page as BreadcrumbPage,
	Separator as BreadcrumbSeparator,
	Ellipsis as BreadcrumbEllipsis,
	Trail as BreadcrumbTrail
};

export type { BreadcrumbCrumb } from './breadcrumb-trail.svelte';
