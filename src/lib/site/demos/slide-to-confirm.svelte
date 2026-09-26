<script lang="ts">
	import { SlideToConfirm } from '$lib/components/ui/slide-to-confirm';
	import Bot from '@lucide/svelte/icons/bot';

	let approved = $state(false);
</script>

<div class="bg-card flex w-full max-w-sm flex-col gap-4 rounded-2xl p-5 shadow-sm">
	<div class="flex items-center gap-3">
		<span
			class="bg-secondary text-muted-foreground grid size-10 shrink-0 place-items-center rounded-full"
		>
			<Bot class="size-4" />
		</span>
		<div class="min-w-0">
			<p class="truncate font-semibold tracking-tight">Deploy agent</p>
			<p class="text-muted-foreground truncate text-sm">
				{approved ? 'Approved · migrating now' : 'Waiting for your approval'}
			</p>
		</div>
	</div>
	<p class="text-muted-foreground text-sm">
		Run 3 schema migrations on the production database. Writes pause for about 40 seconds.
	</p>
	<SlideToConfirm
		label="Slide to approve"
		confirmedLabel="Approved"
		onConfirm={() => (approved = true)}
	/>
</div>
