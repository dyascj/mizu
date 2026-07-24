<script lang="ts">
	import * as HoverCard from '$lib/components/ui/hover-card';
	import * as Avatar from '$lib/components/ui/avatar';
	import Droplets from '@lucide/svelte/icons/droplets';
</script>

<HoverCard.Root>
	<HoverCard.Trigger
		href="#"
		class="text-primary focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
	>
		@rivers
	</HoverCard.Trigger>
	<HoverCard.Content>
		<div class="flex gap-3">
			<Avatar.Root>
				<Avatar.Fallback>RV</Avatar.Fallback>
			</Avatar.Root>
			<div class="flex flex-col gap-1">
				<h4 class="font-display text-foreground text-sm font-semibold">River Vale</h4>
				<p class="text-muted-foreground text-sm">Charting clear streams and quiet tide pools.</p>
				<div class="text-muted-foreground flex items-center gap-1.5 pt-1 text-xs">
					<Droplets class="text-primary size-3.5" />
					Joined the current in 2021
				</div>
			</div>
		</div>
	</HoverCard.Content>
</HoverCard.Root>
