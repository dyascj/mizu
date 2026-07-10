<script lang="ts">
	import * as HoverCard from '$lib/components/ui/hover-card';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Droplets } from '@lucide/svelte';
</script>

<HoverCard.Root>
	<HoverCard.Trigger
		href="#"
		class="rounded-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
	>
		@rivers
	</HoverCard.Trigger>
	<HoverCard.Content>
		<div class="flex gap-3">
			<Avatar.Root>
				<Avatar.Fallback>RV</Avatar.Fallback>
			</Avatar.Root>
			<div class="flex flex-col gap-1">
				<h4 class="font-display text-sm font-semibold text-foreground">River Vale</h4>
				<p class="text-sm text-muted-foreground">Charting clear streams and quiet tide pools.</p>
				<div class="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
					<Droplets class="size-3.5 text-primary" />
					Joined the current in 2021
				</div>
			</div>
		</div>
	</HoverCard.Content>
</HoverCard.Root>
