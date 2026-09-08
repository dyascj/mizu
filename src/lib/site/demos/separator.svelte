<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
</script>

<div class="flex w-full max-w-xs flex-col gap-4">
	<div class="flex flex-col gap-3">
		<p class="text-foreground text-sm">Project settings</p>
		<Separator />
		<p class="text-muted-foreground text-sm">Manage access and notifications for this project.</p>
	</div>
	<div class="text-muted-foreground flex h-5 items-center gap-3 text-sm">
		<span>General</span>
		<Separator orientation="vertical" />
		<span>Members</span>
		<Separator orientation="vertical" />
		<span>Billing</span>
	</div>
</div>
