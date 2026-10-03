<script lang="ts">
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import { ThemeToggle } from '$lib/components/ui/theme-toggle';

	// Demo state only. In an app, apply the mode to the page in onModeChange.
	let mode = $state<'light' | 'dark'>('light');
</script>

<div class="flex w-full max-w-sm flex-col gap-4">
	<div class="bg-card flex items-center gap-3 rounded-full py-1.5 ps-4 pe-1.5 shadow-sm">
		<Sparkles class="text-muted-foreground size-4 shrink-0" />
		<p class="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">Assistant</p>
		<ThemeToggle bind:mode variant="ghost" size="sm" />
	</div>
	<div class="bg-card flex items-center justify-between gap-4 rounded-2xl p-4 shadow-sm">
		<div class="flex min-w-0 flex-col gap-0.5">
			<p class="text-sm font-semibold">Appearance</p>
			<p class="text-muted-foreground text-sm">
				{mode === 'dark' ? 'Dark' : 'Light'} theme for chats and the canvas
			</p>
		</div>
		<ThemeToggle bind:mode size="lg" />
	</div>
</div>
