<script lang="ts">
	import { ShareButton } from '$lib/components/ui/share-button';
</script>

<div class="flex w-full max-w-sm flex-col items-center gap-4 text-center">
	<div class="flex flex-col gap-1">
		<p class="font-semibold tracking-tight">Kyoto trip itinerary</p>
		<p class="text-muted-foreground text-sm">Anyone with the link can read this chat.</p>
	</div>
	<ShareButton
		url="https://chat.example.com/share/c-4821"
		title="Kyoto trip itinerary"
		label="Share chat"
	/>
</div>
