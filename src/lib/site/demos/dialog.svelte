<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button, buttonVariants } from '$lib/components/ui/button';
</script>

<Dialog.Root>
	<Dialog.Trigger class={buttonVariants({ variant: 'primary' })}>Clear cache</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Clear your cache?</Dialog.Title>
			<Dialog.Description>This rinses out locally stored data and starts you fresh.</Dialog.Description>
		</Dialog.Header>
		<p class="text-sm text-muted-foreground">Your settings and saved items stay put.</p>
		<Dialog.Footer>
			<Dialog.Close class={buttonVariants({ variant: 'ghost' })}>Cancel</Dialog.Close>
			<Button>Clear cache</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
