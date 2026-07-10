<script lang="ts">
	import { ToolCall } from '$lib/components/ui/tool-call';
</script>

<div class="flex w-full max-w-md flex-col gap-2">
	<ToolCall name="Searching the web" detail="best miso salmon recipe" state="running" />
	<ToolCall name="Read your calendar" detail="3 events tomorrow" state="done">
		Standup at 10:00, design review at 13:30, and a hold for the gym at 17:00. The evening is
		free.
	</ToolCall>
	<ToolCall name="Book the table" detail="API rate limit reached" state="error" />
</div>
