<script lang="ts">
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import { Button } from '$lib/components/ui/button';
	import { duration, easeIn, easeInOut, easeOut, springs } from '$lib/components/ui/motion';
	import CodeBlock from '$lib/site/code-block.svelte';
	import EasingCurve from '$lib/site/easing-curve.svelte';
	import { siteConfig } from '$lib/site/config';
	import Seo from '$lib/site/seo.svelte';

	const principles = [
		{
			title: 'Respond at once',
			body: 'Pressed controls react within 100 milliseconds. Feedback never waits for a network round trip.'
		},
		{
			title: 'Settle softly',
			body: 'Entrances start quickly and ease into place. Exits are shorter than entrances and accelerate away.'
		},
		{
			title: 'Physical when touched',
			body: 'Springs move what the reader drags, toggles, or opens. Color and opacity never overshoot.'
		},
		{
			title: 'Quiet at rest',
			body: 'Looping motion means an AI is working. Idle interfaces hold still so real activity stands out.'
		}
	];

	const durations = [
		{ token: '--duration-instant', value: duration.instant, use: 'Press feedback' },
		{ token: '--duration-fast', value: duration.fast, use: 'Hover, color, and exits' },
		{ token: '--duration-base', value: duration.base, use: 'State changes and popovers' },
		{ token: '--duration-slow', value: duration.slow, use: 'Sheets, dialogs, and layout' },
		{ token: '--duration-deliberate', value: duration.deliberate, use: 'Reveals and first paint' },
		{ token: '--duration-ambient', value: duration.ambient, use: 'Shimmer and breathing loops' }
	];

	const curves = [
		{
			name: 'Ease out',
			token: '--ease-out',
			durationToken: '--duration-slow',
			easing: easeOut,
			note: 'The house curve. Entrances, reveals, and most transitions.'
		},
		{
			name: 'Ease in',
			token: '--ease-in',
			durationToken: '--duration-slow',
			easing: easeIn,
			note: 'Exits and dismissals. Pair with a shorter duration.'
		},
		{
			name: 'Ease in out',
			token: '--ease-in-out',
			durationToken: '--duration-slow',
			easing: easeInOut,
			note: 'Movement between two resting states, such as a carousel.'
		},
		{
			name: 'Spring',
			token: '--ease-spring',
			durationToken: '--duration-spring',
			easing: springs.smooth.easing,
			note: 'Scale and position for things that open or appear.'
		},
		{
			name: 'Snappy spring',
			token: '--ease-spring-snappy',
			durationToken: '--duration-spring-snappy',
			easing: springs.snappy.easing,
			note: 'Thumbs, indicators, and toggles. No overshoot.'
		},
		{
			name: 'Bouncy spring',
			token: '--ease-spring-bouncy',
			durationToken: '--duration-spring-bouncy',
			easing: springs.bouncy.easing,
			note: 'Celebration and tactile delight. Use sparingly.'
		}
	];

	const animations = [
		{ name: 'Fade in', className: 'animate-fade-in' },
		{ name: 'Rise in', className: 'animate-rise-in' },
		{ name: 'Blur in', className: 'animate-blur-in' },
		{ name: 'Scale in', className: 'animate-scale-in' },
		{ name: 'Breathe', className: 'animate-breathe' },
		{ name: 'Float', className: 'animate-float' }
	];
	let replay = $state(0);

	const cssExample = `<!-- Utilities read the theme tokens -->
<div class="transition-transform duration-(--duration-base) ease-out hover:-translate-y-0.5">
<div class="transition-[scale] duration-(--duration-spring) ease-spring data-[state=open]:scale-100">

<!-- Entrances, staggered by index -->
{#each items as item, index (item.id)}
  <li class="animate-rise-in stagger" style="--index: {index}">{item.title}</li>
{/each}

<!-- Working state -->
<span class="text-shimmer animate-shimmer">Searching the web</span>`;

	const svelteExample = `<script lang="ts">
  import { blurIn, pop, reveal, magnetic, stagger } from '$lib/components/ui/motion';
<\/script>

<!-- Svelte transitions that fall back to a crossfade for reduced motion -->
{#if answer}
  <p in:blurIn>{answer}</p>
{/if}
{#if open}
  <div in:pop out:fade={{ duration: 160 }}>...</div>
{/if}

<!-- Reveal children in sequence the first time they scroll into view -->
<ul {@attach reveal({ children: true, stagger })}>...</ul>

<!-- Lean toward a fine pointer -->
<button {@attach magnetic({ strength: 0.3 })}>Generate</button>`;
</script>

<Seo
	title="Motion · {siteConfig.name}"
	description="Mizu's motion system: duration and easing tokens, generated spring curves, shared animations, Svelte transitions, scroll reveals, and reduced-motion rules."
/>
<article class="max-w-3xl">
	<h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">Motion</h1>
	<p class="text-muted-foreground mt-4 text-lg leading-relaxed">
		Quick to respond, soft to settle. Motion explains what changed and never makes the reader wait.
	</p>

	<h2 class="mt-12 mb-6 text-xl font-semibold">Principles</h2>
	<div class="grid gap-x-10 gap-y-7 sm:grid-cols-2">
		{#each principles as principle (principle.title)}
			<div>
				<h3 class="text-sm font-medium">{principle.title}</h3>
				<p class="text-muted-foreground mt-2 text-sm leading-relaxed">{principle.body}</p>
			</div>
		{/each}
	</div>

	<h2 class="mt-14 mb-3 text-xl font-semibold">Easing</h2>
	<p class="text-muted-foreground mb-6 leading-relaxed">
		Select a curve to play it. Springs are sampled from a physical model into CSS
		<code>linear()</code> curves, and each has a paired duration equal to its settling time.
	</p>
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
		{#each curves as curve (curve.token)}
			<EasingCurve {...curve} />
		{/each}
	</div>

	<h2 class="mt-14 mb-3 text-xl font-semibold">Duration</h2>
	<p class="text-muted-foreground mb-6 leading-relaxed">
		Smaller movements are faster. Exits use the next shorter step than their entrance.
	</p>
	<div class="bg-card flex flex-col gap-1 rounded-3xl p-2 shadow-sm">
		{#each durations as item (item.token)}
			<div class="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 rounded-2xl px-4 py-3">
				<div class="min-w-0">
					<code class="text-sm">{item.token}</code>
					<p class="text-muted-foreground text-sm">{item.use}</p>
				</div>
				<span class="text-muted-foreground font-mono text-sm tabular-nums">{item.value}ms</span>
				<div class="bg-secondary col-span-2 h-1.5 overflow-hidden rounded-full">
					<div
						class="bg-foreground h-full rounded-full"
						style:width="{Math.max(
							3,
							(Math.log(item.value) / Math.log(duration.ambient)) ** 4 * 100
						)}%"
					></div>
				</div>
			</div>
		{/each}
	</div>

	<h2 class="mt-14 mb-3 text-xl font-semibold">Animations</h2>
	<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
		<p class="text-muted-foreground leading-relaxed">
			Shared keyframes for entrances and ambient loops.
		</p>
		<Button variant="secondary" size="sm" onclick={() => replay++}>
			<RotateCcw class="size-3.5" /> Replay
		</Button>
	</div>
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
		{#each animations as animation, index (animation.name)}
			<div class="bg-card flex flex-col items-center gap-4 rounded-3xl p-6 shadow-sm">
				{#key replay}
					<div
						class="bg-foreground size-14 rounded-2xl {animation.className} stagger"
						style:--index={index}
					></div>
				{/key}
				<div class="text-center">
					<p class="text-sm font-medium">{animation.name}</p>
					<code class="text-muted-foreground mt-1 block text-xs">{animation.className}</code>
				</div>
			</div>
		{/each}
	</div>

	<h2 class="mt-14 mb-3 text-xl font-semibold">In CSS</h2>
	<p class="text-muted-foreground mb-4 leading-relaxed">
		The theme overrides Tailwind's <code>ease-out</code>, <code>ease-in</code>, and
		<code>ease-in-out</code>, and adds <code>ease-spring</code> variants, so every component shares the
		same curves.
	</p>
	<CodeBlock code={cssExample} />

	<h2 class="mt-14 mb-3 text-xl font-semibold">In Svelte</h2>
	<p class="text-muted-foreground mb-4 leading-relaxed">
		Install the <a
			class="text-foreground underline underline-offset-4"
			href="/docs/components/motion">Motion</a
		> item for transitions, scroll reveals, pointer effects, and JavaScript copies of every token.
	</p>
	<CodeBlock code={svelteExample} />

	<h2 class="mt-14 mb-3 text-xl font-semibold">Reduced motion</h2>
	<div class="text-muted-foreground space-y-4 leading-relaxed">
		<p>
			When a reader turns on reduced motion, the theme finishes every CSS animation and transition
			immediately. Svelte transitions from the Motion item become a 160 millisecond crossfade, so a
			change is still visible without movement.
		</p>
		<p>
			Scroll reveals never hide content, pointer effects switch off, and ambient loops such as the
			voice orb stop drawing frames. Streaming text shows the complete answer at once.
		</p>
	</div>
</article>
