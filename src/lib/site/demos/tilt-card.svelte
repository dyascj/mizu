<script lang="ts">
	import { TiltCard } from '$lib/components/ui/tilt-card';
	import Sparkles from '@lucide/svelte/icons/sparkles';
</script>

<!-- The `dark` class keeps the pass a dark, glossy object in both themes. -->
<div class="flex w-full justify-center py-6">
	<TiltCard class="dark aspect-[1.586] w-80 max-w-full rounded-[1.25rem]">
		<!-- Raised off the surface, so it drifts against it as the card leans. -->
		<div class="flex h-full [transform:translateZ(2rem)] flex-col justify-between p-5">
			<div class="flex items-center justify-between text-sm">
				<span class="flex items-center gap-2 font-medium">
					<Sparkles class="size-4" aria-hidden="true" />
					Assistant Pro
				</span>
				<span class="text-muted-foreground font-mono text-xs tabular-nums">No. 0042</span>
			</div>
			<div class="flex items-end justify-between gap-4">
				<div class="min-w-0">
					<p class="text-muted-foreground text-xs">Member since 2026</p>
					<p class="truncate text-2xl font-medium tracking-tight">Rin Kobayashi</p>
				</div>
				<span class="text-muted-foreground font-mono text-xs tabular-nums">5M tok/mo</span>
			</div>
		</div>
	</TiltCard>
</div>
