<script lang="ts">
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
</script>

<Field.Group class="w-full max-w-sm">
	<Field.Root>
		<Field.Label for="reservoir">Reservoir name</Field.Label>
		<Input id="reservoir" placeholder="Clearwater Basin" />
		<Field.Description>How this source appears in your reports.</Field.Description>
	</Field.Root>
	<Field.Root>
		<Field.Label for="capacity">Capacity (litres)</Field.Label>
		<Input id="capacity" type="number" placeholder="0" />
		<Field.Error>Capacity must be greater than zero.</Field.Error>
	</Field.Root>
</Field.Group>
