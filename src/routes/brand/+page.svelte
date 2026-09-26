<script lang="ts">
	import Download from '@lucide/svelte/icons/download';
	import { Button } from '$lib/components/ui/button';
	import { reveal } from '$lib/components/ui/motion';
	import MizuMark from '$lib/site/mizu-mark.svelte';
	import MizuWordmark from '$lib/site/mizu-wordmark.svelte';
	import SiteFooter from '$lib/site/site-footer.svelte';
	import { siteConfig } from '$lib/site/config';
	import Seo from '$lib/site/seo.svelte';

	const colors = [
		{
			name: 'Ink',
			hex: '#171717',
			note: 'Primary text and the mark',
			swatch: 'bg-[#171717] dark:shadow-[inset_0_0_0_1px_var(--border-strong)]'
		},
		{ name: 'Paper', hex: '#FFFFFF', note: 'Light pages and cards', swatch: 'bg-white shadow-sm' },
		{ name: 'Mist', hex: '#F5F5F5', note: 'Controls and quiet fills', swatch: 'bg-[#f5f5f5]' },
		{
			name: 'Night',
			hex: '#000000',
			note: 'Dark pages',
			swatch: 'bg-black dark:shadow-[inset_0_0_0_1px_var(--border-strong)]'
		},
		{
			name: 'Water',
			hex: '#626AFB',
			note: 'AI presence and the brand tone',
			swatch: 'bg-[#626afb]'
		},
		{ name: 'Shallows', hex: '#9AA6FC', note: 'Gradient highlight', swatch: 'bg-[#9aa6fc]' }
	];

	const auras = [
		{ name: 'Aurora', utility: 'aurora' },
		{ name: 'Cool', utility: 'aurora-cool' },
		{ name: 'Iris', utility: 'aurora-iris' },
		{ name: 'Mint', utility: 'aurora-mint' }
	];

	const downloads = [
		{ label: 'Mark', file: '/brand/mizu-mark.svg' },
		{ label: 'Mark, inverse', file: '/brand/mizu-mark-inverse.svg' },
		{ label: 'Mark, water', file: '/brand/mizu-mark-water.svg' },
		{ label: 'Lockup', file: '/brand/mizu-lockup.svg' },
		{ label: 'Lockup, inverse', file: '/brand/mizu-lockup-inverse.svg' },
		{ label: 'App icon', file: '/brand/icon-512.png' }
	];

	const sizes = [
		{ size: 48, className: 'size-12' },
		{ size: 32, className: 'size-8' },
		{ size: 24, className: 'size-6' },
		{ size: 16, className: 'size-4' }
	];

	const misuse = [
		'Rotate or flip the mark. The water always rests level.',
		'Outline the vessel or add a stroke around the lockup.',
		'Fill the water with colors other than ink, paper, or the water gradient.',
		'Set the wordmark in a typeface. It is drawn, not typed.'
	];

	const voice = [
		{
			title: 'Calm',
			body: 'Say what happened and what to do next. Leave out exclamation points and urgency.'
		},
		{
			title: 'Specific',
			body: 'Name the file, the step, or the setting. "Couldn\'t upload brief.pdf" beats "Something went wrong."'
		},
		{
			title: 'Human',
			body: 'Write like a thoughtful colleague. Sentence case, plain words, and no jargon the reader did not bring.'
		}
	];
</script>

<Seo
	title="Brand · {siteConfig.name}"
	description="The Mizu mark, wordmark, color, type, and voice. Download the logo and app icons, and learn how to use them."
/>

<main id="main-content" tabindex="-1" class="mx-auto max-w-6xl px-5 sm:px-8">
	<section class="flex flex-col items-center pt-16 pb-20 text-center sm:pt-24 sm:pb-28">
		<div class="animate-scale-in group">
			<MizuMark tone="water" class="size-28 sm:size-36" />
		</div>
		<h1
			class="animate-blur-in stagger mt-10 max-w-3xl text-[clamp(2.5rem,6vw,4.75rem)] leading-[1.02] font-semibold tracking-[-0.045em]"
			style:--index="2"
		>
			A vessel <span class="font-serif font-normal tracking-[-0.02em] italic">holding</span> a wave.
		</h1>
		<p
			class="text-muted-foreground animate-blur-in stagger mt-6 max-w-lg text-lg leading-relaxed text-balance"
			style:--index="4"
		>
			Mizu means water. The mark holds still until something happens, then the surface begins to
			move. That is the whole idea: quiet interfaces that come alive when intelligence is at work.
		</p>
	</section>

	<section aria-labelledby="mark" class="py-12" {@attach reveal({ children: true })}>
		<h2 id="mark" class="text-3xl font-semibold tracking-tight">The mark</h2>
		<div class="mt-8 grid gap-4 md:grid-cols-3">
			<div
				class="bg-card group flex aspect-square flex-col items-center justify-center gap-4 rounded-[2rem] shadow-sm md:col-span-2 md:aspect-auto md:min-h-96"
			>
				<span class="text-foreground inline-flex items-center gap-4">
					<MizuMark class="size-20 sm:size-24" />
					<MizuWordmark class="h-12 sm:h-16" />
				</span>
				<p class="text-muted-foreground text-sm">Hover to let the water move</p>
			</div>
			<div class="grid grid-cols-2 gap-4 md:grid-cols-1">
				<div
					class="group grid aspect-square place-items-center rounded-[2rem] bg-[#171717] text-[#f5f5f5] md:aspect-auto"
				>
					<MizuMark class="size-20" />
				</div>
				<div
					class="group grid aspect-square place-items-center rounded-[2rem] bg-[#626afb] text-white md:aspect-auto"
				>
					<MizuMark class="size-20" />
				</div>
			</div>
		</div>
		<div class="mt-4 grid gap-4 sm:grid-cols-2">
			<div class="bg-card rounded-[2rem] p-8 shadow-sm">
				<h3 class="font-medium">Clear space</h3>
				<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
					Keep a margin of half the mark's diameter on every side of the lockup.
				</p>
				<div class="mt-8 grid place-items-center">
					<div
						class="text-foreground relative inline-flex items-center gap-2 rounded-2xl p-6 outline-2 outline-offset-0 outline-dashed"
						style="outline-color: color-mix(in oklab, var(--foreground) 22%, transparent)"
					>
						<MizuMark class="size-12" />
						<MizuWordmark class="h-8" />
					</div>
				</div>
			</div>
			<div class="bg-card rounded-[2rem] p-8 shadow-sm">
				<h3 class="font-medium">Minimum size</h3>
				<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
					The mark holds its shape down to 16 pixels. Use the lockup at 80 pixels wide or larger.
				</p>
				<div class="text-foreground mt-8 flex items-end justify-center gap-8">
					{#each sizes as item (item.size)}
						<div class="flex flex-col items-center gap-3">
							<MizuMark class={item.className} />
							<span class="text-muted-foreground font-mono text-xs">{item.size}px</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section aria-labelledby="color" class="py-12" {@attach reveal({ children: true })}>
		<h2 id="color" class="text-3xl font-semibold tracking-tight">Color</h2>
		<p class="text-muted-foreground mt-3 max-w-xl leading-relaxed">
			Black, white, and gray carry the interface. Water marks the brand and moments of AI presence.
		</p>
		<div class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
			{#each colors as color (color.name)}
				<div class="bg-card rounded-[2rem] p-3 shadow-sm">
					<div class="h-28 rounded-[1.5rem] {color.swatch}"></div>
					<div class="px-2 pt-4 pb-2">
						<div class="flex items-baseline justify-between gap-2">
							<p class="font-medium">{color.name}</p>
							<code class="text-muted-foreground text-xs">{color.hex}</code>
						</div>
						<p class="text-muted-foreground mt-1 text-sm">{color.note}</p>
					</div>
				</div>
			{/each}
		</div>
		<div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
			{#each auras as aura (aura.utility)}
				<div class="{aura.utility} flex h-32 items-end rounded-[2rem] p-5">
					<div>
						<p class="text-sm font-medium">{aura.name}</p>
						<code class="text-muted-foreground text-xs">{aura.utility}</code>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section aria-labelledby="type" class="py-12" {@attach reveal({ children: true })}>
		<h2 id="type" class="text-3xl font-semibold tracking-tight">Type</h2>
		<div class="mt-8 grid gap-4 md:grid-cols-3">
			<div class="bg-card rounded-[2rem] p-8 shadow-sm md:col-span-2">
				<p class="text-muted-foreground text-sm">Inter · interface and headlines</p>
				<p class="mt-6 text-5xl font-semibold tracking-[-0.045em] sm:text-6xl">Aa Bb Cc</p>
				<p class="text-muted-foreground mt-6 max-w-md leading-relaxed">
					Semibold titles with tight tracking, medium labels, regular body. Nothing heavier.
				</p>
			</div>
			<div class="flex flex-col gap-4">
				<div class="bg-card flex-1 rounded-[2rem] p-8 shadow-sm">
					<p class="text-muted-foreground text-sm">Instrument Serif · accents</p>
					<p class="mt-4 font-serif text-5xl italic">holding</p>
				</div>
				<div class="bg-card flex-1 rounded-[2rem] p-8 shadow-sm">
					<p class="text-muted-foreground text-sm">JetBrains Mono · code</p>
					<p class="mt-4 font-mono text-2xl">--ease-spring</p>
				</div>
			</div>
		</div>
	</section>

	<section aria-labelledby="voice" class="py-12" {@attach reveal({ children: true })}>
		<h2 id="voice" class="text-3xl font-semibold tracking-tight">Voice</h2>
		<div class="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-3">
			{#each voice as item (item.title)}
				<div>
					<h3 class="font-medium">{item.title}</h3>
					<p class="text-muted-foreground mt-2 text-sm leading-relaxed">{item.body}</p>
				</div>
			{/each}
		</div>
	</section>

	<section aria-labelledby="misuse" class="py-12" {@attach reveal({ children: true })}>
		<h2 id="misuse" class="text-3xl font-semibold tracking-tight">Please don't</h2>
		<ul class="mt-8 grid gap-4 sm:grid-cols-2">
			{#each misuse as item (item)}
				<li
					class="bg-card text-muted-foreground rounded-[1.5rem] p-6 text-sm leading-relaxed shadow-sm"
				>
					{item}
				</li>
			{/each}
		</ul>
	</section>

	<section aria-labelledby="downloads" class="py-12 pb-24" {@attach reveal()}>
		<h2 id="downloads" class="text-3xl font-semibold tracking-tight">Downloads</h2>
		<p class="text-muted-foreground mt-3 leading-relaxed">
			Vector files for the mark and lockup, plus the app icon.
		</p>
		<div class="mt-6 flex flex-wrap gap-2">
			{#each downloads as item (item.file)}
				<Button href={item.file} download variant="secondary" size="sm">
					<Download class="size-3.5" />
					{item.label}
				</Button>
			{/each}
		</div>
	</section>
</main>
<SiteFooter />
