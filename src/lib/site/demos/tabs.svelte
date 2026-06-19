<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
</script>

<Tabs.Root value="overview" class="w-full max-w-md">
	<Tabs.List>
		<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
		<Tabs.Trigger value="activity">Activity</Tabs.Trigger>
		<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="overview">
		<p class="text-sm text-muted-foreground">A calm summary of everything flowing through your space.</p>
	</Tabs.Content>
	<Tabs.Content value="activity">
		<p class="text-sm text-muted-foreground">Recent ripples, sorted newest first.</p>
	</Tabs.Content>
	<Tabs.Content value="settings">
		<p class="text-sm text-muted-foreground">Adjust how the water behaves to suit your flow.</p>
	</Tabs.Content>
</Tabs.Root>
