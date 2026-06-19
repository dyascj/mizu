<script lang="ts">
	import { ArrowRight, Droplets, Layers, Moon, Sparkles } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { Slider } from '$lib/components/ui/slider';
	import { Progress } from '$lib/components/ui/progress';
	import { CircularGauge } from '$lib/components/ui/circular-gauge';
	import { Orb } from '$lib/components/ui/orb';
	import { Bubbles } from '$lib/components/ui/bubbles';
	import CopyCommand from '$lib/site/copy-command.svelte';
	import { siteConfig } from '$lib/site/config';
	import { components } from '$lib/site/catalog';

	let glossy = $state(true);
	let level = $state(68);

	const features = [
		{
			icon: Droplets,
			title: 'Physically glossy',
			body: 'Real frosted glass, wet sheen, and layered light. The Frutiger Aero look, built from honest CSS, not screenshots.'
		},
		{
			icon: Sparkles,
			title: 'Svelte 5 native',
			body: 'Runes, snippets, and bits-ui under the hood. Accessible behavior with a glossy skin on top.'
		},
		{
			icon: Layers,
			title: 'Copy in, own it',
			body: 'A shadcn-style registry. Install with the tools you know, then the source is yours to bend.'
		},
		{
			icon: Moon,
			title: 'Light & deep water',
			body: 'Every token has a sunlit and a deep-water variant. Dark mode that still feels like Mizu.'
		}
	];
</script>

<svelte:head>
	<title>{siteConfig.name} — {siteConfig.tagline}</title>
	<meta name="description" content={siteConfig.description} />
</svelte:head>

<!-- Hero -->
<section class="relative overflow-hidden">
	<div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
		<div class="absolute -top-24 left-1/2 -translate-x-1/2">
			<Orb size={640} />
		</div>
		<Bubbles count={18} />
	</div>

	<div class="mx-auto flex max-w-3xl flex-col items-center gap-7 px-6 pt-24 pb-20 text-center">
		<Badge variant="secondary" class="gap-1.5">
			<span class="size-1.5 rounded-full bg-[color:var(--primary)]"></span>
			Frutiger Aero · Svelte 5 · Tailwind v4
		</Badge>

		<h1 class="font-display text-5xl leading-[1.05] font-extrabold sm:text-6xl">
			The last good era of UI,
			<span
				class="bg-gradient-to-br from-mizu-400 to-mizu-700 bg-clip-text text-transparent"
			>
				rebuilt for Svelte.
			</span>
		</h1>

		<p class="max-w-xl text-lg text-muted-foreground">
			{siteConfig.description}
		</p>

		<div class="flex flex-wrap items-center justify-center gap-3">
			<Button href="/docs" size="lg">
				Get started
				<ArrowRight class="size-4" />
			</Button>
			<Button href="/docs/components/button" variant="secondary" size="lg">
				Browse components
			</Button>
		</div>

		<CopyCommand
			command={`npx shadcn-svelte@latest add ${siteConfig.registryBase}/button.json`}
			class="mt-1 w-full max-w-md"
		/>
	</div>
</section>

<!-- Showcase -->
<section class="mx-auto max-w-5xl px-6 pb-20">
	<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
		<Card.Root class="lg:col-span-2">
			<Card.Header>
				<Card.Title>Today</Card.Title>
				<Card.Description>A glance at the surface.</Card.Description>
			</Card.Header>
			<Card.Content class="flex flex-col gap-5">
				<div class="flex flex-wrap gap-2">
					<Button size="sm">Save</Button>
					<Button size="sm" variant="secondary">Share</Button>
					<Button size="sm" variant="outline">Later</Button>
					<Badge variant="success">Synced</Badge>
					<Badge variant="warning">Beta</Badge>
				</div>
				<label class="flex items-center justify-between gap-3 text-sm font-semibold">
					Glossy surfaces
					<Switch bind:checked={glossy} />
				</label>
				<div class="flex flex-col gap-2">
					<div class="flex items-center justify-between text-sm">
						<span class="font-semibold">Clarity</span>
						<span class="font-mono text-muted-foreground tabular-nums">{level}%</span>
					</div>
					<Slider type="single" bind:value={level} max={100} />
					<Progress value={level} class="mt-1" />
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="items-center justify-center">
			<Card.Content class="flex flex-col items-center gap-4 pt-6">
				<CircularGauge value={level} label="Focus">
					<Droplets class="size-6 text-[color:var(--primary)]" />
				</CircularGauge>
				<p class="text-center text-sm text-muted-foreground">
					Physically accurate gloss, glass, and glow.
				</p>
			</Card.Content>
		</Card.Root>
	</div>
</section>

<!-- Features -->
<section class="mx-auto max-w-5xl px-6 pb-24">
	<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
		{#each features as feature}
			<Card.Root>
				<Card.Content class="flex flex-col gap-3 pt-6">
					<span
						class="gradient-surface gloss relative inline-flex size-10 items-center justify-center overflow-hidden rounded-xl border border-border shadow-bevel"
					>
						<feature.icon class="relative z-10 size-5 text-[color:var(--primary)]" />
					</span>
					<h3 class="font-display text-base font-bold">{feature.title}</h3>
					<p class="text-sm text-muted-foreground">{feature.body}</p>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
</section>

<!-- Component count strip -->
<section class="mx-auto max-w-5xl px-6 pb-28">
	<div
		class="flex flex-col items-center gap-6 overflow-hidden rounded-2xl border border-[color:var(--glass-border)] glass-strong p-10 text-center shadow-glass"
	>
		<h2 class="font-display text-3xl font-extrabold">
			{components.length} components, and counting.
		</h2>
		<p class="max-w-md text-muted-foreground">
			Everything you need to build a glossy, optimistic interface, from buttons to dialogs to a
			blooming orb.
		</p>
		<div class="flex flex-wrap justify-center gap-2">
			{#each components as c}
				<a href={`/docs/components/${c.slug}`}>
					<Badge variant="outline" class="transition-colors hover:border-[color:var(--primary)]">
						{c.name}
					</Badge>
				</a>
			{/each}
		</div>
		<Button href="/docs" class="mt-2">
			Read the docs
			<ArrowRight class="size-4" />
		</Button>
	</div>
</section>

<footer class="border-t border-border">
	<div
		class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row"
	>
		<p>
			<span class="font-display font-bold text-foreground">{siteConfig.name}</span>
			{siteConfig.wordmark} · A Frutiger Aero design system for Svelte.
		</p>
		<p>Built with Svelte 5, Tailwind v4 & bits-ui.</p>
	</div>
</footer>
