<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import { Info, CircleCheck } from '@lucide/svelte';
</script>

<div class="flex w-full max-w-md flex-col gap-3">
	<Alert.Root variant="info">
		<Info />
		<Alert.Title>Conditions are calm</Alert.Title>
		<Alert.Description>The water is clear and the current is gentle today.</Alert.Description>
	</Alert.Root>
	<Alert.Root variant="success">
		<CircleCheck />
		<Alert.Title>Filtered successfully</Alert.Title>
		<Alert.Description>Every drop passed the clarity check.</Alert.Description>
	</Alert.Root>
</div>
