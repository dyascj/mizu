<script lang="ts">
	import * as Tabs from './index.js';

	let {
		value = $bindable('overview'),
		variant,
		overflow,
		panelStyle
	}: {
		value?: string;
		variant?: 'pill' | 'underline';
		overflow?: 'wrap' | 'scroll';
		panelStyle?: string;
	} = $props();
</script>

<Tabs.Root bind:value>
	<Tabs.List aria-label="Project" {variant} {overflow}>
		<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
		<Tabs.Trigger value="activity">Activity</Tabs.Trigger>
		<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="overview">Overview panel</Tabs.Content>
	<Tabs.Content value="activity">Activity panel</Tabs.Content>
	<Tabs.Content value="settings" style={panelStyle}>Settings panel</Tabs.Content>
</Tabs.Root>
