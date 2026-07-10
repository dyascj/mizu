<script lang="ts">
	import { ripple } from '$lib/components/ui/ripple';
</script>

<div class="flex flex-wrap items-center justify-center gap-4">
	<!-- The action drops onto any surface — here a glass tile and an aqua one. -->
	<button
		use:ripple
		class="bg-popover flex h-32 w-44 items-center justify-center rounded-2xl border border-border text-sm font-semibold text-foreground shadow-lg"
	>
		<span class="relative z-10">Press anywhere</span>
	</button>

	<button
		use:ripple={{ color: 'rgba(255,255,255,0.55)' }}
		class="bg-primary flex h-32 w-44 items-center justify-center rounded-2xl text-sm font-semibold text-primary-foreground shadow-sm"
	>
		<span class="relative z-10">Aqua surface</span>
	</button>
</div>
