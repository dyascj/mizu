<script lang="ts">
	import { BookmarkButton } from '$lib/components/ui/bookmark-button';

	let reportSaved = $state(false);
	let promptSaved = $state(false);
</script>

<div class="flex w-full max-w-sm flex-col gap-4">
	<article class="bg-card flex w-full flex-col gap-4 rounded-2xl p-5 shadow-sm">
		<div class="flex flex-col gap-1">
			<p class="text-muted-foreground text-xs">Deep research · 14 sources</p>
			<h3 class="font-semibold tracking-tight text-balance">
				Home battery prices over the last five years
			</h3>
			<p class="text-muted-foreground text-sm text-pretty">
				Cell costs fell by half, but installed prices barely moved. Most of the gap is labor and
				permitting.
			</p>
		</div>
		<div class="flex items-center justify-between gap-3">
			<span class="text-muted-foreground text-sm">6 min read</span>
			<BookmarkButton bind:saved={reportSaved} count={reportSaved ? 128 : 127} />
		</div>
	</article>
	<div class="bg-card flex w-full items-center gap-3 rounded-full py-1 pr-1 pl-4 shadow-sm">
		<p class="min-w-0 flex-1 truncate text-sm">Summarize this thread in three bullets</p>
		<BookmarkButton bind:saved={promptSaved} variant="ghost" />
	</div>
</div>
