<script lang="ts">
	import { ripple } from '$lib/components/ui/ripple';
</script>

<div class="flex flex-wrap items-center justify-center gap-4">
	<!-- The action drops onto any surface — here a glass tile and an aqua one. -->
	<button
		use:ripple
		class="glass gloss flex h-32 w-44 items-center justify-center rounded-2xl border border-[color:var(--glass-border)] text-sm font-semibold text-foreground shadow-glass"
	>
		<span class="relative z-10">Press anywhere</span>
	</button>

	<button
		use:ripple={{ color: 'rgba(255,255,255,0.55)' }}
		class="gradient-primary gloss flex h-32 w-44 items-center justify-center rounded-2xl text-sm font-semibold text-primary-foreground shadow-aqua"
	>
		<span class="relative z-10">Aqua surface</span>
	</button>
</div>
