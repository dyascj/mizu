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
			Your project is on track. The next review is on Thursday.
		</p>
	</Tabs.Content>
	<Tabs.Content value="activity">
		<p class="text-muted-foreground text-sm">Alex updated the design brief two hours ago.</p>
	</Tabs.Content>
	<Tabs.Content value="settings">
		<p class="text-muted-foreground text-sm">
			Manage your project name, team access, and notifications.
		</p>
	</Tabs.Content>
</Tabs.Root>
