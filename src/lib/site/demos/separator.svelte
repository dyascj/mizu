<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
</script>

<div class="flex w-full max-w-xs flex-col gap-4">
	<div class="flex flex-col gap-3">
		<p class="text-foreground text-sm">Surface tension</p>
		<Separator />
		<p class="text-muted-foreground text-sm">The quiet skin atop still water.</p>
	</div>
	<div class="text-muted-foreground flex h-5 items-center gap-3 text-sm">
		<span>Lake</span>
		<Separator orientation="vertical" />
		<span>River</span>
		<Separator orientation="vertical" />
		<span>Spring</span>
	</div>
</div>
