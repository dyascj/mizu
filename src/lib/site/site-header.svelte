<script lang="ts">
	import { Droplet } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import ModeToggle from './mode-toggle.svelte';
	import { siteConfig } from './config';
</script>

<header
	class="sticky top-0 z-40 border-b border-[color:var(--glass-border)] glass-strong"
>
	<div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
		<a href="/" class="group flex items-center gap-2.5">
			<span
				class="gradient-primary gloss relative inline-flex size-8 items-center justify-center overflow-hidden rounded-lg shadow-aqua"
			>
				<Droplet class="relative z-10 size-[1.1rem] text-white" />
			</span>
			<span class="font-display text-lg font-extrabold tracking-tight">{siteConfig.name}</span>
		</a>

		<nav class="flex items-center gap-1">
			<Button href="/docs" variant="ghost" size="sm" class="hidden sm:inline-flex">Docs</Button>
			<Button href="/docs/components/button" variant="ghost" size="sm" class="hidden sm:inline-flex">
				Components
			</Button>
			<Button
				href={siteConfig.repo}
				target="_blank"
				rel="noreferrer"
				variant="ghost"
				size="icon"
				aria-label="GitHub"
			>
				<svg viewBox="0 0 24 24" fill="currentColor" class="size-5" aria-hidden="true">
					<path
						d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 4.5 18 4.8 18 4.8c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"
					/>
				</svg>
			</Button>
			<ModeToggle />
		</nav>
	</div>
</header>
