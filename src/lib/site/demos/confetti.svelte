<script lang="ts">
	import Trophy from '@lucide/svelte/icons/trophy';
	import { ConfettiButton } from '$lib/components/ui/confetti';
</script>

<div
	class="bg-card flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl p-6 text-center shadow-sm"
>
	<span class="bg-secondary text-muted-foreground grid size-11 place-items-center rounded-full">
		<Trophy class="size-5" />
	</span>
	<div class="flex flex-col gap-1">
		<p class="font-semibold tracking-tight">10,000 conversations resolved</p>
		<p class="text-muted-foreground text-sm text-pretty">
			Your support agent just closed its ten thousandth ticket, with 94% of customers rating the
			answer helpful.
		</p>
	</div>
	<div class="flex flex-col items-center gap-2">
		<ConfettiButton>Celebrate</ConfettiButton>
		<p class="text-muted-foreground text-xs">Hold for a bigger one</p>
	</div>
</div>
