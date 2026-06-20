<script lang="ts">
	import Gear from 'phosphor-svelte/lib/Gear';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Popover from '$lib/components/ui/popover';
	import { buttonVariants } from '$lib/components/ui/button';
	import ThemeSwatches from './theme-swatches.svelte';
	import Components from './showcase/components.svelte';
	import Game from './showcase/game.svelte';
	import Dive from './showcase/dive.svelte';
	import Player from './showcase/player.svelte';
	import Shop from './showcase/shop.svelte';

	const tabs = [
		{ value: 'components', label: 'Components' },
		{ value: 'game', label: 'Game' },
		{ value: 'dive', label: 'Dive' },
		{ value: 'player', label: 'Player' },
		{ value: 'shop', label: 'Ramen' }
	];
</script>

<div
	class="overflow-hidden rounded-3xl border border-[color:var(--glass-border)] glass shadow-glass-lg"
>
	<Tabs.Root value="components">
		<div class="flex items-center justify-between gap-3 border-b border-border p-3 sm:px-4">
			<Tabs.List
				class="min-w-0 max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
			>
				{#each tabs as t (t.value)}
					<Tabs.Trigger value={t.value} class="shrink-0 whitespace-nowrap">{t.label}</Tabs.Trigger>
				{/each}
			</Tabs.List>
			<div class="flex shrink-0 items-center gap-2">
				<ThemeSwatches class="hidden lg:flex" />
				<Popover.Root>
					<Popover.Trigger
						class={buttonVariants({ variant: 'ghost', size: 'icon' })}
						aria-label="Theme settings"
					>
						<Gear class="size-5" />
					</Popover.Trigger>
					<Popover.Content class="w-auto">
						<p class="mb-2.5 text-xs font-semibold text-muted-foreground">Accent color</p>
						<ThemeSwatches class="max-w-[12rem]" />
					</Popover.Content>
				</Popover.Root>
			</div>
		</div>

		<div class="p-4 sm:p-6">
			<Tabs.Content value="components"><Components /></Tabs.Content>
			<Tabs.Content value="game"><Game /></Tabs.Content>
			<Tabs.Content value="dive"><Dive /></Tabs.Content>
			<Tabs.Content value="player"><Player /></Tabs.Content>
			<Tabs.Content value="shop"><Shop /></Tabs.Content>
		</div>
	</Tabs.Root>
</div>
