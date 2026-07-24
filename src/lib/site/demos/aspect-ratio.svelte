<script lang="ts">
	import { AspectRatio } from '$lib/components/ui/aspect-ratio';
</script>

<div class="w-full max-w-md">
	<AspectRatio ratio={16 / 9}>
		<div class="bg-primary flex size-full items-center justify-center rounded-xl shadow-xs">
			<span class="text-primary-foreground relative z-10 text-sm font-semibold">16 / 9</span>
		</div>
	</AspectRatio>
</div>
