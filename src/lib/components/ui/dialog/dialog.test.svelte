<script lang="ts">
	import * as Dialog from './index.js';
</script>

<Dialog.Root>
	<Dialog.Trigger>Settings</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Title>Assistant settings</Dialog.Title>
		<Dialog.Description>Changes apply everywhere.</Dialog.Description>
		<Dialog.Root>
			<Dialog.Trigger>Delete</Dialog.Trigger>
			<Dialog.Content closeButton={false}>
				<Dialog.Title>Delete assistant?</Dialog.Title>
				<Dialog.Description>This can't be undone.</Dialog.Description>
				<Dialog.Close>Cancel</Dialog.Close>
			</Dialog.Content>
		</Dialog.Root>
	</Dialog.Content>
</Dialog.Root>
