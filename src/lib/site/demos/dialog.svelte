<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button, buttonVariants } from '$lib/components/ui/button';
</script>

<Dialog.Root>
	<Dialog.Trigger class={buttonVariants({ variant: 'primary' })}>Clear cache</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Clear your cache?</Dialog.Title>
			<Dialog.Description>Remove temporary files stored on this device.</Dialog.Description>
		</Dialog.Header>
		<p class="text-muted-foreground text-sm">
			Your account, settings, and saved projects will stay available.
		</p>
		<Dialog.Footer>
			<Dialog.Close class={buttonVariants({ variant: 'ghost' })}>Cancel</Dialog.Close>
			<Button>Clear cache</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
