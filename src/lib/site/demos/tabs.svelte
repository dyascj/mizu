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
		<p class="text-muted-foreground text-sm">
			A calm summary of everything flowing through your space.
		</p>
	</Tabs.Content>
	<Tabs.Content value="activity">
		<p class="text-muted-foreground text-sm">Recent ripples, sorted newest first.</p>
	</Tabs.Content>
	<Tabs.Content value="settings">
		<p class="text-muted-foreground text-sm">Adjust how the water behaves to suit your flow.</p>
	</Tabs.Content>
</Tabs.Root>
