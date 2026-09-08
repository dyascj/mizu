<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { buttonVariants } from '$lib/components/ui/button';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';

	let open = $state(false);
</script>

<Collapsible.Root bind:open class="w-full max-w-sm space-y-2">
	<div class="flex items-center justify-between gap-4">
		<h4 class="text-sm font-semibold">Project files</h4>
		<Collapsible.Trigger class={buttonVariants({ variant: 'ghost', size: 'icon' })}>
			<ChevronsUpDown class="size-4" />
			<span class="sr-only">Show project files</span>
		</Collapsible.Trigger>
	</div>
	<div class="bg-secondary/60 rounded-lg px-4 py-3 text-sm">Design brief.fig</div>
	<Collapsible.Content class="space-y-2">
		<div class="bg-secondary/60 rounded-lg px-4 py-3 text-sm">Research notes.md</div>
		<div class="bg-secondary/60 rounded-lg px-4 py-3 text-sm">Component library.fig</div>
	</Collapsible.Content>
</Collapsible.Root>
