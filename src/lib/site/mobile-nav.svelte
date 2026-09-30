<script lang="ts">
	import Menu from '@lucide/svelte/icons/menu';
	import X from '@lucide/svelte/icons/x';
	import { afterNavigate } from '$app/navigation';
	import * as Drawer from '$lib/components/ui/drawer';
	import { buttonVariants } from '$lib/components/ui/button';
	import DocsSidebar from './docs-sidebar.svelte';
	import { cn } from '$lib/utils.js';

	let open = $state(false);

	// Close the sheet whenever a navigation finishes (i.e. a link was tapped).
	afterNavigate(() => (open = false));
</script>

<Drawer.Root bind:open shouldScaleBackground={false}>
	<Drawer.Trigger
		class={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-9 lg:hidden')}
		aria-label="Open navigation menu"
	>
		<Menu class="size-5" />
	</Drawer.Trigger>
	<Drawer.Content class="h-[88dvh] max-h-[88dvh]! pb-[env(safe-area-inset-bottom)]">
		<Drawer.Title class="sr-only">Navigation</Drawer.Title>
		<div class="min-h-0 flex-1">
			<DocsSidebar>
				{#snippet close()}
					<Drawer.Close
						aria-label="Close navigation menu"
						class="bg-secondary text-foreground hover:bg-accent focus-visible:ring-ring inline-flex size-9 shrink-0 items-center justify-center rounded-xl outline-none focus-visible:ring-2"
					>
						<X class="size-4" />
					</Drawer.Close>
				{/snippet}
			</DocsSidebar>
		</div>
	</Drawer.Content>
</Drawer.Root>
