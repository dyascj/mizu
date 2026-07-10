<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { buttonVariants } from '$lib/components/ui/button';
	import { ChevronsUpDown } from '@lucide/svelte';

	let open = $state(false);
</script>

<Collapsible.Root bind:open class="w-full max-w-sm space-y-2">
	<div class="flex items-center justify-between gap-4">
		<h4 class="text-sm font-semibold">Water sources</h4>
		<Collapsible.Trigger class={buttonVariants({ variant: 'ghost', size: 'icon' })}>
			<ChevronsUpDown class="size-4" />
			<span class="sr-only">Toggle</span>
		</Collapsible.Trigger>
	</div>
	<div class="rounded-lg bg-secondary/60 px-4 py-3 text-sm">Mountain spring</div>
	<Collapsible.Content class="space-y-2">
		<div class="rounded-lg bg-secondary/60 px-4 py-3 text-sm">Glacial melt</div>
		<div class="rounded-lg bg-secondary/60 px-4 py-3 text-sm">Artesian well</div>
	</Collapsible.Content>
</Collapsible.Root>
