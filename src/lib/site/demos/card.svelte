<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	let expanded = $state(false);
</script>

<Card.Root class="w-full max-w-sm">
	<Card.Header>
		<Card.Title>Design review</Card.Title>
		<Card.Description>Thursday, 10:00 am</Card.Description>
	</Card.Header>
	<Card.Content>
		<p class="text-muted-foreground text-sm">
			Review the onboarding updates and agree on the changes for this week's release.
		</p>
		{#if expanded}<ol class="mt-4 list-inside list-decimal space-y-2 text-sm">
				<li>Walk through the new flow</li>
				<li>Review open questions</li>
				<li>Assign next steps</li>
			</ol>{/if}
	</Card.Content>
	<Card.Footer>
		<Button class="w-full" aria-expanded={expanded} onclick={() => (expanded = !expanded)}
			>{expanded ? 'Hide agenda' : 'View agenda'}</Button
		>
	</Card.Footer>
</Card.Root>
