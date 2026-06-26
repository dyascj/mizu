<script lang="ts">
	import { Caustics } from '$lib/components/ui/caustics';
</script>

<div
	class="relative h-56 w-full max-w-lg overflow-hidden rounded-2xl border border-[color:var(--glass-border)]"
	style="background: linear-gradient(180deg, var(--color-mizu-700) 0%, var(--color-mizu-950) 100%);"
>
	<Caustics class="absolute inset-0" />

	<div class="absolute inset-0 flex items-end justify-center p-5">
		<p class="font-display text-xs font-medium tracking-wide text-mizu-100/70 uppercase">
			Deep end
		</p>
	</div>
</div>
