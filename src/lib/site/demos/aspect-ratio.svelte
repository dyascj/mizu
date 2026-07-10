<script lang="ts">
	import { AspectRatio } from '$lib/components/ui/aspect-ratio';
</script>

<div class="w-full max-w-md">
	<AspectRatio ratio={16 / 9}>
		<div class="flex size-full items-center justify-center rounded-xl bg-primary shadow-xs">
			<span class="relative z-10 text-sm font-semibold text-primary-foreground">16 / 9</span>
		</div>
	</AspectRatio>
</div>
