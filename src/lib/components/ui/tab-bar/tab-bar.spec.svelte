<script lang="ts">
	import House from '@lucide/svelte/icons/house';
	import TabBar from './tab-bar.svelte';
	import TabBarItem from './tab-bar-item.svelte';
	import type { TabBarLabels, TabBarVariant } from './context.js';

	let {
		active = 'home',
		labels = 'visible',
		variant = 'floating',
		links = false,
		fill = false,
		onselect
	}: {
		active?: string;
		labels?: TabBarLabels;
		variant?: TabBarVariant;
		links?: boolean;
		fill?: boolean;
		onselect?: (id: string) => void;
	} = $props();
</script>

<TabBar {labels} {variant} label="Primary">
	<TabBarItem
		label="Home"
		icon={House}
		{fill}
		href={links ? '/home' : undefined}
		active={active === 'home'}
		onclick={() => onselect?.('home')}
	/>
	<TabBarItem
		label="Inbox"
		badge={3}
		href={links ? '/inbox' : undefined}
		active={active === 'inbox'}
		onclick={() => onselect?.('inbox')}
	>
		<span data-testid="custom-icon">I</span>
	</TabBarItem>
	<TabBarItem label="Alerts" badge={120} badgeLabel="120 new" active={active === 'alerts'} />
</TabBar>
