<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
</script>

<Sheet.Root>
	<Sheet.Trigger class={buttonVariants({ variant: 'secondary' })}>Open settings</Sheet.Trigger>
	<Sheet.Content side="right">
		<Sheet.Header>
			<Sheet.Title>Project settings</Sheet.Title>
			<Sheet.Description>Update the project details, then save your changes.</Sheet.Description>
		</Sheet.Header>
		<div class="flex flex-col gap-4 py-2">
			<div class="flex flex-col gap-2">
				<Label for="source">Project name</Label>
				<Input id="source" value="Design system" />
			</div>
			<div class="flex flex-col gap-2">
				<Label for="flow">Team size</Label>
				<Input id="flow" type="number" value="42" />
			</div>
		</div>
		<Sheet.Footer>
			<Sheet.Close class={buttonVariants({ variant: 'ghost' })}>Cancel</Sheet.Close>
			<Button>Save changes</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
