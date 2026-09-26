<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Bot from '@lucide/svelte/icons/bot';

	let open = $state(false);
	let confirming = $state(false);
	let name = $state('Support copilot');
	let draft = $state('Support copilot');
	let deleted = $state(false);
	let cancel = $state<HTMLElement | null>(null);
</script>

<div class="bg-card flex w-full max-w-sm items-center gap-3 rounded-full py-2 pr-2 pl-2 shadow-sm">
	<span
		class="bg-secondary text-muted-foreground grid size-10 shrink-0 place-items-center rounded-full"
	>
		<Bot class="size-4" />
	</span>
	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-medium">{name}</p>
		<p class="text-muted-foreground truncate text-sm">
			{deleted ? 'Scheduled for deletion' : 'Answering in 3 channels'}
		</p>
	</div>
	<Dialog.Root bind:open onOpenChange={(next) => next && (draft = name)}>
		<Dialog.Trigger class={buttonVariants({ variant: 'secondary' })}>Settings</Dialog.Trigger>
		<Dialog.Content class="max-w-md">
			<Dialog.Header>
				<Dialog.Title>Assistant settings</Dialog.Title>
				<Dialog.Description
					>Changes apply to every channel this assistant answers.</Dialog.Description
				>
			</Dialog.Header>
			<form
				class="flex flex-col gap-5"
				onsubmit={(event) => {
					event.preventDefault();
					if (draft.trim()) name = draft.trim();
					open = false;
				}}
			>
				<div class="flex flex-col gap-2">
					<Label for="assistant-name">Name</Label>
					<Input id="assistant-name" bind:value={draft} autocomplete="off" spellcheck={false} />
				</div>
				<div class="bg-secondary flex flex-wrap items-center gap-3 rounded-2xl py-2.5 pr-2.5 pl-4">
					<p class="text-muted-foreground min-w-0 flex-1 text-sm text-pretty">
						Delete this assistant and its 1,240 conversations.
					</p>
					<Dialog.Root bind:open={confirming}>
						<Dialog.Trigger
							type="button"
							class={buttonVariants({
								variant: 'ghost',
								size: 'sm',
								class: 'text-destructive hover:bg-destructive/10'
							})}
						>
							Delete
						</Dialog.Trigger>
						<Dialog.Content
							class="max-w-sm"
							closeButton={false}
							onOpenAutoFocus={(event) => {
								// The safe choice takes focus, so a stray Enter can't delete.
								event.preventDefault();
								cancel?.focus();
							}}
						>
							<Dialog.Header>
								<Dialog.Title>Delete {name}?</Dialog.Title>
								<Dialog.Description>
									Its conversations and connected channels go with it. This can't be undone.
								</Dialog.Description>
							</Dialog.Header>
							<Dialog.Footer>
								<Dialog.Close
									type="button"
									bind:ref={cancel}
									class={buttonVariants({ variant: 'secondary' })}
								>
									Cancel
								</Dialog.Close>
								<Button
									variant="destructive"
									onclick={() => {
										deleted = true;
										confirming = false;
										open = false;
									}}
								>
									Delete
								</Button>
							</Dialog.Footer>
						</Dialog.Content>
					</Dialog.Root>
				</div>
				<Dialog.Footer>
					<Dialog.Close type="button" class={buttonVariants({ variant: 'ghost' })}>
						Cancel
					</Dialog.Close>
					<Button type="submit">Save</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</div>
