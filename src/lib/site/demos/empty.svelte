<script lang="ts">
	import * as Empty from '$lib/components/ui/empty';
	import { Button } from '$lib/components/ui/button';
	import Droplets from '@lucide/svelte/icons/droplets';
</script>

<Empty.Root class="w-full max-w-sm">
	<Empty.Media>
		<Droplets />
	</Empty.Media>
	<Empty.Title>Nothing here yet</Empty.Title>
	<Empty.Description>
		Your workspace is ready. Add your first project to get started.
	</Empty.Description>
	<Empty.Content>
		<Button>Add a project</Button>
	</Empty.Content>
</Empty.Root>
