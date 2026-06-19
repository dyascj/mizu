<script lang="ts">
	import { Toggle } from '$lib/components/ui/toggle';
	import { Bold } from '@lucide/svelte';

	let pressed = $state(false);
</script>

<Toggle bind:pressed aria-label="Toggle bold">
	<Bold class="size-5" />
	Bold
</Toggle>
