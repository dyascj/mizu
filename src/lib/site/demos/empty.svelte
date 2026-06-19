<script lang="ts">
	import * as Empty from '$lib/components/ui/empty';
	import { Button } from '$lib/components/ui/button';
	import { Droplets } from '@lucide/svelte';
</script>

<Empty.Root class="w-full max-w-sm">
	<Empty.Media>
		<Droplets />
	</Empty.Media>
	<Empty.Title>Nothing here yet</Empty.Title>
	<Empty.Description>
		Your collection is dry. Add a source to start gathering water.
	</Empty.Description>
	<Empty.Content>
		<Button>Add source</Button>
	</Empty.Content>
</Empty.Root>
