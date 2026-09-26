<script lang="ts">
	import { FlipCard } from '$lib/components/ui/flip-card';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';

	const specs = [
		['Context window', '200K tokens'],
		['Input', '$3 / 1M tokens'],
		['Output', '$15 / 1M tokens'],
		['Knowledge cutoff', 'Mar 2026']
	] as const;
</script>

{#snippet hint(text: string)}
	<span class="flex items-center gap-1.5 text-sm font-medium">
		<RefreshCw class="size-3.5" aria-hidden="true" />
		{text}
	</span>
{/snippet}

<div class="flex w-full justify-center py-4">
	<FlipCard frontLabel="Show Atlas 3 specs" backLabel="Show Atlas 3 overview">
		{#snippet front()}
			<div
				class="bg-primary text-primary-foreground flex size-full flex-col justify-between rounded-[inherit] p-6"
			>
				<div class="flex items-baseline justify-between">
					<span class="text-sm font-medium opacity-70">Model</span>
					<span class="font-mono text-xs tabular-nums opacity-60">v3.2</span>
				</div>
				<div class="flex flex-col gap-2">
					<span class="text-4xl leading-none font-semibold tracking-tight">Atlas 3</span>
					<span class="text-sm text-pretty opacity-70">
						Our fastest model for everyday writing, code, and analysis.
					</span>
				</div>
				<div class="flex items-end justify-between">
					<div class="flex flex-col gap-0.5">
						<span class="text-xs opacity-60">Released</span>
						<span class="text-sm font-medium tabular-nums">June 2026</span>
					</div>
					<span class="opacity-70">{@render hint('Specs')}</span>
				</div>
			</div>
		{/snippet}
		{#snippet back()}
			<div
				class="bg-card text-card-foreground flex size-full flex-col justify-between rounded-[inherit] p-6 shadow-sm"
			>
				<div class="flex flex-col gap-1">
					<span class="text-muted-foreground text-sm font-medium">Specs</span>
					<span class="text-2xl font-semibold tracking-tight">Atlas 3</span>
				</div>
				<dl class="divide-border flex flex-col divide-y">
					{#each specs as [term, value] (term)}
						<div class="flex items-baseline justify-between gap-3 py-2.5 text-sm">
							<dt class="text-muted-foreground">{term}</dt>
							<dd class="font-medium tabular-nums">{value}</dd>
						</div>
					{/each}
				</dl>
				<div class="text-muted-foreground flex items-center justify-between">
					<span class="font-mono text-xs tabular-nums">atlas-3-0626</span>
					{@render hint('Overview')}
				</div>
			</div>
		{/snippet}
	</FlipCard>
</div>
