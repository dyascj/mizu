<script lang="ts">
	import { NativeSelect } from '$lib/components/ui/native-select';

	let value = $state('still');
</script>

<div class="w-full max-w-xs">
	<NativeSelect aria-label="Notification frequency" bind:value>
		<option value="still">Every update</option>
		<option value="sparkling">Daily summary</option>
		<option value="mineral">Weekly summary</option>
		<option value="spring">Never</option>
	</NativeSelect>
</div>
