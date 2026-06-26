<script lang="ts">
	import { LensFlare } from '$lib/components/ui/lens-flare';
</script>

<div
	class="relative h-56 w-full max-w-lg overflow-hidden rounded-2xl border border-[color:var(--glass-border)]"
	style="background: linear-gradient(180deg, var(--color-mizu-300) 0%, var(--color-mizu-600) 58%, var(--color-mizu-800) 100%);"
>
	<!-- A faint horizon line for the sun to sit above. -->
	<div class="absolute inset-x-0 bottom-[34%] h-px bg-white/20"></div>

	<LensFlare x={76} y={26} />
</div>
