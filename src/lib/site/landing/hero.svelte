<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { Button } from '$lib/components/ui/button';
	import { Presence, type PresenceState } from '$lib/components/ui/presence';
	import { TextRotate } from '$lib/components/ui/text-rotate';
	import CopyCommand from '$lib/site/copy-command.svelte';
	import { components } from '$lib/site/catalog';
	import { registryPinnedBase } from '$lib/site/config';

	const installCmd = `npx shadcn-svelte@latest add ${registryPinnedBase}/button.json`;
	let mood = $state<PresenceState>('idle');
</script>

<section class="relative mx-auto max-w-5xl px-5 pt-14 pb-20 text-center sm:px-8 sm:pt-20 sm:pb-24">
	<a
		href="/docs/motion"
		class="bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground animate-rise-in focus-visible:ring-ring group inline-flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm transition-colors duration-(--duration-fast) outline-none focus-visible:ring-2"
	>
		<span class="bg-foreground text-background rounded-full px-2 py-0.5 text-xs font-medium"
			>New</span
		>
		A motion system, and a companion
		<ArrowRight
			class="size-3.5 transition-transform duration-(--duration-fast) group-hover:translate-x-0.5"
		/>
	</a>

	<div class="animate-scale-in stagger mt-12 flex justify-center" style:--index="2">
		<Presence state={mood} size={84} label="Mizu, the companion" />
	</div>

	<h1
		class="animate-blur-in stagger mx-auto mt-8 max-w-4xl text-[clamp(2.75rem,7vw,5.75rem)] leading-[0.98] font-semibold tracking-[-0.055em] text-balance"
		style:--index="3"
	>
		Build a better<br />
		<span class="font-serif text-[1.08em] font-normal tracking-[-0.02em] whitespace-nowrap italic"
			><TextRotate
				words={['assistant', 'workspace', 'app', 'conversation']}
				interval={1700}
				loop={false}
			/>.</span
		>
	</h1>
	<p
		class="text-muted-foreground animate-blur-in stagger mx-auto mt-7 max-w-xl text-base leading-relaxed text-balance sm:text-lg"
		style:--index="5"
	>
		{components.length} components, a motion system, and complete screens for AI products, apps, and the
		sites that launch them. Copy the source. Make it yours.
	</p>
	<div
		class="animate-rise-in stagger mt-9 flex flex-wrap items-center justify-center gap-3"
		style:--index="7"
	>
		<Button
			href="/docs/installation"
			size="lg"
			onpointerenter={() => (mood = 'happy')}
			onpointerleave={() => (mood = 'idle')}
			onfocus={() => (mood = 'happy')}
			onblur={() => (mood = 'idle')}>Start building <ArrowRight class="size-4" /></Button
		>
		<Button
			href="/docs/components"
			variant="secondary"
			size="lg"
			onpointerenter={() => (mood = 'thinking')}
			onpointerleave={() => (mood = 'idle')}>Browse components</Button
		>
	</div>
	<div class="animate-rise-in stagger mt-8" style:--index="8">
		<CopyCommand
			command={installCmd}
			class="mx-auto w-full max-w-md bg-transparent shadow-none dark:bg-transparent"
		/>
	</div>
</section>
