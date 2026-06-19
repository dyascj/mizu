<script lang="ts">
	import Gear from 'phosphor-svelte/lib/Gear';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Popover from '$lib/components/ui/popover';
	import { buttonVariants } from '$lib/components/ui/button';
	import ThemeSwatches from './theme-swatches.svelte';
	import Components from './showcase/components.svelte';
	import Dashboard from './showcase/dashboard.svelte';
	import Mail from './showcase/mail.svelte';
	import Chat from './showcase/chat.svelte';
	import Finances from './showcase/finances.svelte';

	const tabs = [
		{ value: 'components', label: 'Components' },
		{ value: 'dashboard', label: 'Dashboard' },
		{ value: 'mail', label: 'Mail' },
		{ value: 'chat', label: 'Chat' },
		{ value: 'finances', label: 'Finances' }
	];
</script>

<div
	class="overflow-hidden rounded-3xl border border-[color:var(--glass-border)] glass shadow-glass-lg"
>
	<Tabs.Root value="components">
		<div class="flex items-center justify-between gap-3 border-b border-border p-3 sm:px-4">
			<Tabs.List class="max-w-full overflow-x-auto">
				{#each tabs as t (t.value)}
					<Tabs.Trigger value={t.value}>{t.label}</Tabs.Trigger>
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
			<Tabs.Content value="dashboard"><Dashboard /></Tabs.Content>
			<Tabs.Content value="mail"><Mail /></Tabs.Content>
			<Tabs.Content value="chat"><Chat /></Tabs.Content>
			<Tabs.Content value="finances"><Finances /></Tabs.Content>
		</div>
	</Tabs.Root>
</div>
