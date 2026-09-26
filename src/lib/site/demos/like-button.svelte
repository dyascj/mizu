<script lang="ts">
	import FileText from '@lucide/svelte/icons/file-text';
	import { LikeButton } from '$lib/components/ui/like-button';

	let liked = $state(false);
</script>

<div class="bg-card flex w-full max-w-sm flex-col gap-4 rounded-3xl p-5 shadow-sm">
	<div class="flex items-start gap-3">
		<span
			class="bg-secondary text-muted-foreground grid size-10 shrink-0 place-items-center rounded-full"
		>
			<FileText class="size-4" />
		</span>
		<div class="min-w-0">
			<p class="font-semibold tracking-tight">Release notes writer</p>
			<p class="text-muted-foreground text-sm">
				Turns a week of merged pull requests into notes your users will actually read.
			</p>
		</div>
	</div>
	<div class="flex items-center justify-between gap-3">
		<span class="text-muted-foreground text-xs">Shared prompt · Maya Ruiz</span>
		<LikeButton bind:liked count={liked ? 129 : 128} />
	</div>
</div>
