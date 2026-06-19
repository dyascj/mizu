<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<div class="flex w-full max-w-xs items-center gap-3">
	<Skeleton class="size-10 rounded-full" />
	<div class="flex flex-1 flex-col gap-2">
		<Skeleton class="h-4 w-3/4" />
		<Skeleton class="h-4 w-1/2" />
	</div>
</div>
