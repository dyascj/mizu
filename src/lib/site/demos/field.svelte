<script lang="ts">
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
</script>

<Field.Group class="w-full max-w-sm">
	<Field.Root>
		<Field.Label for="reservoir">Project name</Field.Label>
		<Input id="reservoir" placeholder="Product launch" />
		<Field.Description>Visible to everyone in your workspace.</Field.Description>
	</Field.Root>
	<Field.Root>
		<Field.Label for="capacity">Team size</Field.Label>
		<Input
			id="capacity"
			type="number"
			placeholder="0"
			aria-invalid="true"
			aria-describedby="capacity-error"
		/>
		<Field.Error id="capacity-error">Enter at least one team member.</Field.Error>
	</Field.Root>
</Field.Group>
