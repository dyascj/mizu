<script lang="ts">
	import { NativeSelect } from '$lib/components/ui/native-select';

	let value = $state('still');
</script>

<div class="w-full max-w-xs">
	<NativeSelect bind:value>
		<option value="still">Still</option>
		<option value="sparkling">Sparkling</option>
		<option value="mineral">Mineral</option>
		<option value="spring">Spring</option>
	</NativeSelect>
</div>
