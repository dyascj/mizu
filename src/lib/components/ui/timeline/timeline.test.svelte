<script lang="ts">
	import * as Timeline from './index.js';

	let { titles, animated = true }: { titles: string[]; animated?: boolean } = $props();
</script>

<Timeline.Root {animated} aria-label="Activity">
	{#each titles as title, index (title)}
		<Timeline.Item last={index === titles.length - 1}>
			<Timeline.Time>Now</Timeline.Time>
			<Timeline.Title>{title}</Timeline.Title>
			<Timeline.Description>Details for {title}</Timeline.Description>
		</Timeline.Item>
	{/each}
</Timeline.Root>
