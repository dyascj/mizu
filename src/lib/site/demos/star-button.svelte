<script lang="ts">
	import Bot from '@lucide/svelte/icons/bot';
	import { StarButton } from '$lib/components/ui/star-button';

	let starred = $state(false);
</script>

<div class="bg-card flex w-full max-w-sm flex-col gap-4 rounded-3xl p-5 shadow-sm">
	<div class="flex items-start gap-3">
		<span
			class="bg-secondary text-muted-foreground grid size-10 shrink-0 place-items-center rounded-full"
		>
			<Bot class="size-4" />
		</span>
		<div class="min-w-0">
			<p class="font-semibold tracking-tight">Triage agent</p>
			<p class="text-muted-foreground text-sm">
				Labels new issues, links duplicates, and asks for a repro when one is missing.
			</p>
		</div>
	</div>
	<!-- Start aligned, so starring grows the button toward the end and never
	     slides it out from under the pointer. -->
	<div class="flex flex-wrap items-center gap-3">
		<StarButton bind:starred count={starred ? 1300 : 1299} locale="en-US" />
		<span class="text-muted-foreground text-xs">Updated 2 days ago</span>
	</div>
</div>
