<script lang="ts">
	import * as HoverCard from './index.js';
</script>

<HoverCard.Group>
	<p>
		Ask
		<HoverCard.GroupTrigger label="Ava Chen, @ava">
			@ava
			{#snippet card()}<span>Builds eval harnesses.</span><button type="button">Follow Ava</button
				>{/snippet}
		</HoverCard.GroupTrigger>
		or
		<HoverCard.GroupTrigger label="Ben Ortiz, @ben">
			@ben
			{#snippet card()}<span>Tunes retrieval.</span>{/snippet}
		</HoverCard.GroupTrigger>
	</p>
</HoverCard.Group>
<button type="button">Elsewhere</button>
