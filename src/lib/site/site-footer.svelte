<script lang="ts">
	import MizuMark from './mizu-mark.svelte';
	import MizuWordmark from './mizu-wordmark.svelte';
	import { siteConfig } from './config';

	const columns = [
		{
			title: 'Build',
			links: [
				{ href: '/docs/components', label: 'Components' },
				{ href: '/blocks', label: 'Blocks' },
				{ href: '/docs/motion', label: 'Motion' },
				{ href: '/docs/theming', label: 'Theming' }
			]
		},
		{
			title: 'Learn',
			links: [
				{ href: '/docs', label: 'Introduction' },
				{ href: '/docs/installation', label: 'Installation' },
				{ href: '/docs/build-a-chat', label: 'Build a chat' },
				{ href: '/docs/agents', label: 'UI for agents' }
			]
		},
		{
			title: 'Project',
			links: [
				{ href: '/brand', label: 'Brand' },
				{ href: siteConfig.repo, label: 'GitHub', external: true },
				{ href: `${siteConfig.repo}/blob/main/CHANGELOG.md`, label: 'Changelog', external: true },
				{ href: '/llms.txt', label: 'llms.txt' }
			]
		}
	];
</script>

<footer class="mt-auto overflow-hidden">
	<div class="mx-auto max-w-6xl px-5 pt-20 sm:px-8">
		<div class="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
			<div class="max-w-xs">
				<a href="/" class="group text-foreground inline-flex" aria-label="{siteConfig.name} home">
					<MizuMark class="size-8" />
				</a>
				<p class="text-muted-foreground mt-4 text-sm leading-relaxed">
					The design system for AI products. Open source and MIT licensed.
				</p>
			</div>
			{#each columns as column (column.title)}
				<nav aria-label={column.title}>
					<p class="text-sm font-medium">{column.title}</p>
					<ul class="mt-4 flex flex-col gap-2.5">
						{#each column.links as link (link.href)}
							<li>
								<a
									href={link.href}
									target={link.external ? '_blank' : undefined}
									rel={link.external ? 'noreferrer' : undefined}
									class="text-muted-foreground hover:text-foreground text-sm transition-colors duration-(--duration-fast)"
									>{link.label}</a
								>
							</li>
						{/each}
					</ul>
				</nav>
			{/each}
		</div>
		<div
			class="text-muted-foreground mt-16 flex flex-col justify-between gap-2 text-sm sm:flex-row"
		>
			<p>
				Designed and built by <a
					href={siteConfig.authorUrl}
					target="_blank"
					rel="noreferrer"
					class="text-foreground decoration-foreground/30 hover:decoration-foreground underline underline-offset-4 transition-colors"
					>CJ Dyas</a
				>
			</p>
			<p>MIT license</p>
		</div>
	</div>
	<!-- The wordmark sinks below the fold of the page like a horizon. -->
	<div class="mx-auto max-w-6xl px-5 pt-12 sm:px-8" aria-hidden="true">
		<div class="text-foreground/[0.05] mx-auto aspect-[77.5/17] max-w-4xl overflow-hidden">
			<MizuWordmark class="h-auto w-full" />
		</div>
	</div>
</footer>
