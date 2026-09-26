<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { reveal, springs } from '$lib/components/ui/motion';
	import EasingCurve from '$lib/site/easing-curve.svelte';

	const curves = [
		{
			name: 'Spring',
			token: '--ease-spring',
			durationToken: '--duration-spring',
			easing: springs.smooth.easing,
			note: 'For what opens and appears.'
		},
		{
			name: 'Snappy',
			token: '--ease-spring-snappy',
			durationToken: '--duration-spring-snappy',
			easing: springs.snappy.easing,
			note: 'For thumbs and indicators.'
		},
		{
			name: 'Bouncy',
			token: '--ease-spring-bouncy',
			durationToken: '--duration-spring-bouncy',
			easing: springs.bouncy.easing,
			note: 'For moments of delight.'
		}
	];
</script>

<!-- Always rendered with the dark tokens: a quiet stage for motion. -->
<section aria-labelledby="motion-title" class="dark mx-auto mt-28 max-w-[1376px] px-4 sm:px-6">
	<div
		class="bg-card text-foreground relative overflow-hidden rounded-[2.5rem] px-6 py-16 sm:px-12 sm:py-20"
	>
		<div
			aria-hidden="true"
			class="orb-purple animate-breathe pointer-events-none absolute -top-40 -right-32 size-[36rem] rounded-full blur-3xl"
		></div>
		<div
			aria-hidden="true"
			class="orb-blue animate-float pointer-events-none absolute -bottom-48 -left-40 size-[34rem] rounded-full blur-3xl"
		></div>
		<div class="relative grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-center">
			<div {@attach reveal({ children: true })}>
				<p class="text-muted-foreground text-sm">Motion</p>
				<h2
					id="motion-title"
					class="mt-4 text-4xl leading-[1.05] font-semibold tracking-[-0.04em] sm:text-5xl"
				>
					Settles like <span class="font-serif font-normal tracking-normal italic">water.</span>
				</h2>
				<p class="text-muted-foreground mt-5 max-w-md leading-relaxed">
					Real springs, sampled into CSS so they cost nothing at runtime. Quick to respond, soft to
					settle, and still for anyone who asks for less motion.
				</p>
				<a
					href="/docs/motion"
					class="hover:text-foreground text-foreground/80 mt-7 inline-flex items-center gap-2 text-sm font-medium transition-colors"
					>Read the motion guide <ArrowRight class="size-4" /></a
				>
			</div>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-3" {@attach reveal({ children: true })}>
				{#each curves as curve (curve.token)}
					<EasingCurve {...curve} class="bg-secondary/70 hover:bg-secondary shadow-none" />
				{/each}
			</div>
		</div>
	</div>
</section>
