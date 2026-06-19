<script lang="ts">
	import * as Item from '$lib/components/ui/item';
	import { Button } from '$lib/components/ui/button';
	import { Droplets } from '@lucide/svelte';
</script>

<Item.Root class="w-full max-w-sm">
	<Item.Media>
		<Droplets />
	</Item.Media>
	<Item.Content>
		<Item.Title>Spring water</Item.Title>
		<Item.Description>Filtered and ready to bottle.</Item.Description>
	</Item.Content>
	<Item.Actions>
		<Button variant="outline" size="sm">View</Button>
	</Item.Actions>
</Item.Root>
