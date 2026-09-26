<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { HoldButton } from '$lib/components/ui/hold-button';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	let deleted = $state(false);
</script>

<div class="bg-card flex w-full max-w-sm flex-col gap-4 rounded-2xl p-5 shadow-sm">
	<div class="flex items-center gap-3">
		<span
			class="bg-secondary text-muted-foreground grid size-10 shrink-0 place-items-center rounded-full"
		>
			<MessageSquare class="size-4" />
		</span>
		<div class="min-w-0">
			<p class="truncate font-semibold tracking-tight">Kyoto trip itinerary</p>
			<p class="text-muted-foreground truncate text-sm">
				{deleted ? 'Deleted just now' : '38 messages · 2 days ago'}
			</p>
		</div>
	</div>
	<p class="text-muted-foreground text-sm">
		Deleting removes the conversation, its uploaded files, and any shared links from every device.
	</p>
	<div class="flex flex-wrap items-center gap-2">
		<HoldButton onConfirm={() => (deleted = true)}>
			<Trash2 />
			Hold to delete
		</HoldButton>
		{#if deleted}
			<Button variant="ghost" onclick={() => (deleted = false)}>Undo</Button>
		{/if}
	</div>
</div>
