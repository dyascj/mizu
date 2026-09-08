<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import Info from '@lucide/svelte/icons/info';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
</script>

<div class="flex w-full max-w-md flex-col gap-3">
	<Alert.Root variant="info">
		<Info />
		<Alert.Title>Review in progress</Alert.Title>
		<Alert.Description>You can keep editing while your team reviews the draft.</Alert.Description>
	</Alert.Root>
	<Alert.Root variant="success">
		<CircleCheck />
		<Alert.Title>Changes saved</Alert.Title>
		<Alert.Description>Your latest changes are available to the team.</Alert.Description>
	</Alert.Root>
</div>
