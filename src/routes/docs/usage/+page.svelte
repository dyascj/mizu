<script lang="ts">
	import { siteConfig } from '$lib/site/config';
	import Seo from '$lib/site/seo.svelte';

	const principles = [
		[
			'Quiet by default',
			'Hierarchy comes from space, hairlines, and type. White surfaces and soft shadows carry the structure; nothing shines.'
		],
		[
			'You own the code',
			'Components are copied into your project, not imported from a black box. Rename them, restyle them, delete what you do not use.'
		],
		[
			'Recolor from one token',
			'Change --primary and the whole system retints. Reach for tokens first and one-off overrides second.'
		],
		[
			'Accessible by default',
			'Interactive components wrap bits-ui, so keyboard and screen-reader behavior come for free. Keep it that way.'
		],
		[
			'Restraint over decoration',
			'The content does the talking. One blue accent, one glow, and generous space go further than any effect.'
		]
	];

	const doList = [
		'Theme by editing tokens in app.css, not hex values in markup',
		'Reserve the pastel auras for AI moments, not chrome',
		'Compose with the exported parts (Dialog.Root, Dialog.Trigger, …)',
		'Label dialogs, inputs, and icon-only buttons',
		'Match a child radius to its parent minus padding'
	];
	const dontList = [
		'Hard-code colors that ignore the theme',
		'Stack heavy shadows where a hairline would do',
		'Remove focus rings to make it look cleaner',
		'Ship an icon-only control with no accessible name',
		'Animate without honoring prefers-reduced-motion'
	];

	const choices = [
		[
			'Dialog vs Sheet vs Popover',
			'Dialog for a focused, blocking task. Sheet for side panels and mobile navigation. Popover for a lightweight, non-blocking overlay anchored to a trigger.'
		],
		[
			'Button variants',
			'primary for the one main action on a view, secondary for everything else, ghost for low-emphasis actions, and destructive only for something irreversible.'
		],
		[
			'Badge tones',
			'primary to highlight, success / warning / destructive for status, and outline for quiet metadata.'
		]
	];
</script>

<Seo
	title="Usage · {siteConfig.name}"
	description="How to build AI products with Mizu: the design principles behind it, how to drop components in and own them, composition and accessibility guidelines, and how to choose the right component."
/>

<article class="max-w-2xl">
	<h1 class="font-display text-3xl font-semibold">Usage</h1>
	<p class="mt-3 text-lg text-muted-foreground">
		The principles behind Mizu, how to drop components in and make them yours, and how to keep
		things coherent as you compose. The components are the vocabulary; this is the grammar.
	</p>

	<h2 class="mt-10 mb-3 font-display text-xl font-semibold">Principles</h2>
	<p class="mb-4 leading-relaxed text-muted-foreground">
		Five ideas hold the whole system together. When a decision is unclear, these break the tie.
	</p>
	<div class="overflow-hidden rounded-xl border border-border">
		{#each principles as [name, desc], i}
			<div
				class={'flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4 ' +
					(i % 2 ? 'bg-muted/40' : '')}
			>
				<span class="shrink-0 font-display text-sm font-semibold text-foreground sm:w-44"
					>{name}</span
				>
				<span class="text-sm text-muted-foreground">{desc}</span>
			</div>
		{/each}
	</div>

	<h2 class="mt-10 mb-3 font-display text-xl font-semibold">Using a component</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Add a component with the CLI, or copy the source straight from its page. Either way the files
		land in <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
			>src/lib/components/ui/</code
		>
		and belong to you. Style any part through its
		<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">class</code> prop. Classes
		merge with tailwind-merge, so your overrides win without
		<code class="font-mono text-[0.85em]">!important</code>.
	</p>
	<ul class="mb-2 ml-5 list-disc space-y-1.5 leading-relaxed text-muted-foreground">
		<li>
			Compose with the exported parts, like <code class="font-mono text-[0.85em]">Dialog.Root</code
			>,
			<code class="font-mono text-[0.85em]">Dialog.Trigger</code>, and
			<code class="font-mono text-[0.85em]">Dialog.Content</code>.
		</li>
		<li>Prefer tokens and utilities (bg-primary, shadow-sm, rounded-lg) over raw values.</li>
		<li>Delete the components you do not use. Nothing is loaded that you did not add.</li>
	</ul>

	<h2 class="mt-10 mb-3 font-display text-xl font-semibold">Composition</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Mizu ships a few surface utilities: <code
			class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">glass</code
		>
		for flat frosted panels that float above content, and the
		<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">orb-*</code> and
		<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">aurora-*</code> pastel washes
		for the moments where the AI is present. Two rules keep them looking right:
	</p>
	<ul class="mb-2 ml-5 list-disc space-y-1.5 leading-relaxed text-muted-foreground">
		<li>
			<span class="font-semibold text-foreground">One frost per layer.</span> Translucency is for the
			single floating panel above the page, never for panels stacked on panels. Everything else is solid
			white or slate.
		</li>
		<li>
			<span class="font-semibold text-foreground">Concentric radius.</span> A child's corner radius should
			equal its parent's radius minus the padding between them, or the corners read as misaligned.
		</li>
	</ul>

	<h2 class="mt-10 mb-3 font-display text-xl font-semibold">Do and don't</h2>
	<div class="grid gap-4 sm:grid-cols-2">
		<div class="rounded-xl bg-[color:color-mix(in_srgb,var(--success)_8%,var(--card))] p-4">
			<p class="mb-2 font-display text-sm font-semibold text-[color:var(--success)]">Do</p>
			<ul class="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
				{#each doList as item}
					<li class="flex gap-2"><span class="text-[color:var(--success)]">✓</span>{item}</li>
				{/each}
			</ul>
		</div>
		<div class="rounded-xl bg-[color:color-mix(in_srgb,var(--destructive)_7%,var(--card))] p-4">
			<p class="mb-2 font-display text-sm font-semibold text-[color:var(--destructive)]">Don't</p>
			<ul class="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
				{#each dontList as item}
					<li class="flex gap-2"><span class="text-[color:var(--destructive)]">✕</span>{item}</li>
				{/each}
			</ul>
		</div>
	</div>

	<h2 class="mt-10 mb-3 font-display text-xl font-semibold">Accessibility</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Behavior is delegated to bits-ui, so focus traps, roving focus, escape handling, and ARIA wiring
		are handled for you. Your job is to keep the names and contrast intact.
	</p>
	<ul class="mb-2 ml-5 list-disc space-y-1.5 leading-relaxed text-muted-foreground">
		<li>
			Give every dialog a <code class="font-mono text-[0.85em]">Dialog.Title</code> (use
			<code class="font-mono text-[0.85em]">sr-only</code> if it is visually hidden) and every input
			a
			<code class="font-mono text-[0.85em]">Label</code>.
		</li>
		<li>Icon-only buttons need an sr-only label so screen readers can announce them.</li>
		<li>
			Motion respects <code class="font-mono text-[0.85em]">prefers-reduced-motion</code> globally; keep
			any custom animation behind the same guard.
		</li>
		<li>On light surfaces, use mizu-600 or darker for small text to keep contrast comfortable.</li>
	</ul>

	<h2 class="mt-10 mb-3 font-display text-xl font-semibold">Choosing the right component</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		A few pairings come up constantly. When two components could work, this is the default call.
	</p>
	<div class="overflow-hidden rounded-xl border border-border">
		{#each choices as [name, desc], i}
			<div
				class={'flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4 ' +
					(i % 2 ? 'bg-muted/40' : '')}
			>
				<span class="shrink-0 font-display text-sm font-semibold text-foreground sm:w-52"
					>{name}</span
				>
				<span class="text-sm text-muted-foreground">{desc}</span>
			</div>
		{/each}
	</div>
</article>
