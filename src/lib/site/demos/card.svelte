<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
</script>

<Card.Root class="w-full max-w-sm">
	<Card.Header>
		<Card.Title>Clear skies</Card.Title>
		<Card.Description>A white surface with a hairline border and a soft shadow.</Card.Description>
	</Card.Header>
	<Card.Content>
		<p class="text-sm text-muted-foreground">
			Compose a header, content, and footer, or drop in anything you like.
		</p>
	</Card.Content>
	<Card.Footer>
		<Button class="w-full">Continue</Button>
	</Card.Footer>
</Card.Root>
