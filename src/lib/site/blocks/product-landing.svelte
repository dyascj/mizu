<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import BookOpenCheck from '@lucide/svelte/icons/book-open-check';
	import Quote from '@lucide/svelte/icons/quote';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import { Button } from '$lib/components/ui/button';
	import { Marquee } from '$lib/components/ui/marquee';
	import { reveal } from '$lib/components/ui/motion';
	import { NumberTicker } from '$lib/components/ui/number-ticker';
	import { Presence } from '$lib/components/ui/presence';
	import { TextRotate } from '$lib/components/ui/text-rotate';

	// A launch page for an AI product: navigation, hero, social proof, live
	// numbers, and features. Swap the copy and links for your own.

	const questions = [
		'What changed in the 2026 budget?',
		'Compare these three papers',
		'Summarize the earnings call',
		'Find the original source',
		'Which study is most cited?',
		'Explain this chart simply'
	];
	const features = [
		{
			icon: Quote,
			title: 'Every claim, cited',
			body: 'Answers link to the exact passage they come from.'
		},
		{
			icon: BookOpenCheck,
			title: 'Reads what you read',
			body: 'PDFs, papers, and pages, organized into one library.'
		},
		{
			icon: ShieldCheck,
			title: 'Private by default',
			body: 'Your library is never used to train a model.'
		}
	];

	let answered = $state(2_418_604);
	$effect(() => {
		const timer = setInterval(() => (answered += Math.ceil(Math.random() * 7)), 2200);
		return () => clearInterval(timer);
	});
</script>

<div class="bg-background w-full overflow-hidden rounded-[2rem] shadow-sm">
	<nav class="flex items-center justify-between gap-4 px-5 py-4 sm:px-8" aria-label="Halo">
		<a href="#top" class="flex items-center gap-2 font-semibold tracking-tight">
			<Presence size={26} tone="iris" interactive={false} label="Halo" />
			Halo
		</a>
		<div class="text-muted-foreground hidden items-center gap-6 text-sm md:flex">
			<a href="#features" class="hover:text-foreground transition-colors">Features</a>
			<a href="#pricing" class="hover:text-foreground transition-colors">Pricing</a>
			<a href="#changelog" class="hover:text-foreground transition-colors">Changelog</a>
		</div>
		<Button size="sm">Try Halo</Button>
	</nav>

	<section id="top" class="px-5 pt-14 pb-12 text-center sm:px-8 sm:pt-20">
		<a
			href="#changelog"
			class="bg-secondary text-muted-foreground hover:text-foreground animate-rise-in inline-flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-xs transition-colors"
		>
			<span class="aurora-iris text-foreground rounded-full px-2 py-0.5 font-medium">New</span>
			Cited answers from your own library
		</a>
		<h1
			class="animate-blur-in stagger mx-auto mt-8 max-w-2xl text-[clamp(2.25rem,6vw,4rem)] leading-[1.02] font-semibold tracking-[-0.045em] text-balance"
			style:--index="2"
		>
			Your calm partner for <TextRotate
				words={['research', 'reading', 'writing', 'research']}
				loop={false}
				class="text-muted-foreground"
			/>.
		</h1>
		<p
			class="text-muted-foreground animate-blur-in stagger mx-auto mt-5 max-w-md text-balance"
			style:--index="4"
		>
			Ask anything about the papers, pages, and PDFs you collect. Halo answers with sources you can
			check.
		</p>
		<div
			class="animate-rise-in stagger mt-8 flex flex-wrap items-center justify-center gap-3"
			style:--index="6"
		>
			<Button>Start free <ArrowRight class="size-4" /></Button>
			<Button variant="secondary">Watch the demo</Button>
		</div>
	</section>

	<Marquee speed={32} class="py-2" aria-label="Questions people ask Halo">
		{#each questions as question (question)}
			<span
				class="bg-secondary text-muted-foreground rounded-full px-4 py-2 text-sm whitespace-nowrap"
				>{question}</span
			>
		{/each}
	</Marquee>

	<section
		class="grid gap-3 px-5 pt-12 sm:grid-cols-3 sm:px-8"
		aria-label="Halo by the numbers"
		{@attach reveal({ children: true })}
	>
		<div class="bg-secondary/60 rounded-3xl p-6">
			<NumberTicker value={answered} class="text-3xl font-semibold tracking-tight" />
			<p class="text-muted-foreground mt-1 text-sm">Questions answered</p>
		</div>
		<div class="bg-secondary/60 rounded-3xl p-6">
			<NumberTicker
				value={0.98}
				format={{ style: 'percent' }}
				class="text-3xl font-semibold tracking-tight"
			/>
			<p class="text-muted-foreground mt-1 text-sm">Answers with a source</p>
		</div>
		<div class="bg-secondary/60 rounded-3xl p-6">
			<NumberTicker
				value={1.2}
				format={{ style: 'unit', unit: 'second', unitDisplay: 'short', maximumFractionDigits: 1 }}
				class="text-3xl font-semibold tracking-tight"
			/>
			<p class="text-muted-foreground mt-1 text-sm">Median time to answer</p>
		</div>
	</section>

	<section
		id="features"
		class="grid gap-8 px-5 py-14 sm:grid-cols-3 sm:px-8"
		{@attach reveal({ children: true })}
	>
		{#each features as feature (feature.title)}
			{@const Icon = feature.icon}
			<div>
				<span class="bg-secondary inline-flex size-10 items-center justify-center rounded-2xl">
					<Icon class="size-5" />
				</span>
				<h2 class="mt-4 font-medium">{feature.title}</h2>
				<p class="text-muted-foreground mt-1.5 text-sm leading-relaxed">{feature.body}</p>
			</div>
		{/each}
	</section>
</div>
