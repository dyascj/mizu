<script lang="ts">
	import * as Timeline from '$lib/components/ui/timeline';
	import Droplet from '@lucide/svelte/icons/droplet';
</script>

<div class="w-full max-w-md">
	<Timeline.Root>
		<Timeline.Item icon={Droplet}>
			<Timeline.Time>Now</Timeline.Time>
			<Timeline.Title>Rainfall collected</Timeline.Title>
			<Timeline.Description>Fresh water gathers in the rooftop catch.</Timeline.Description>
		</Timeline.Item>
		<Timeline.Item>
			<Timeline.Time>06:20</Timeline.Time>
			<Timeline.Title>Clouds condense</Timeline.Title>
			<Timeline.Description>Vapor cools and beads into droplets.</Timeline.Description>
		</Timeline.Item>
		<Timeline.Item>
			<Timeline.Time>04:45</Timeline.Time>
			<Timeline.Title>Surface evaporates</Timeline.Title>
			<Timeline.Description>Morning sun lifts moisture from the reservoir.</Timeline.Description>
		</Timeline.Item>
		<Timeline.Item last>
			<Timeline.Time>00:00</Timeline.Time>
			<Timeline.Title>Cycle begins</Timeline.Title>
			<Timeline.Description>Still water rests under a clear night sky.</Timeline.Description>
		</Timeline.Item>
	</Timeline.Root>
</div>
