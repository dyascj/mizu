import Provider from './sidebar-provider.svelte';
import Root from './sidebar.svelte';
import Trigger from './sidebar-trigger.svelte';
import Rail from './sidebar-rail.svelte';
import Inset from './sidebar-inset.svelte';
import Header from './sidebar-header.svelte';
import Footer from './sidebar-footer.svelte';
import Content from './sidebar-content.svelte';
import Group from './sidebar-group.svelte';
import GroupLabel from './sidebar-group-label.svelte';
import Menu from './sidebar-menu.svelte';
import MenuItem from './sidebar-menu-item.svelte';
import MenuButton from './sidebar-menu-button.svelte';
import Separator from './sidebar-separator.svelte';

export { SidebarState, setSidebar, getSidebar } from './sidebar-context.svelte.js';

export {
	Provider,
	Root,
	Trigger,
	Rail,
	Inset,
	Header,
	Footer,
	Content,
	Group,
	GroupLabel,
	Menu,
	MenuItem,
	MenuButton,
	Separator,
	//
	Provider as SidebarProvider,
	Root as Sidebar,
	Trigger as SidebarTrigger,
	Rail as SidebarRail,
	Inset as SidebarInset,
	Header as SidebarHeader,
	Footer as SidebarFooter,
	Content as SidebarContent,
	Group as SidebarGroup,
	GroupLabel as SidebarGroupLabel,
	Menu as SidebarMenu,
	MenuItem as SidebarMenuItem,
	MenuButton as SidebarMenuButton,
	Separator as SidebarSeparator
};
