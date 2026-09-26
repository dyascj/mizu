<script lang="ts">
	import { DotGrid } from '$lib/components/ui/dot-grid';
</script>

<DotGrid class="grid aspect-square place-items-center sm:aspect-[3/2]">
	<!-- A soft clearing in the grid keeps the copy easy to read. -->
	<div
		class="pointer-events-none flex flex-col items-center gap-2 bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--card)_85%,transparent)_40%,transparent)] p-6 text-center sm:p-10"
	>
		<p class="text-muted-foreground text-sm font-medium">New session</p>
		<h2 class="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
			What should we build today?
		</h2>
		<p class="text-muted-foreground text-sm">Move across the grid, then click it.</p>
	</div>
</DotGrid>
