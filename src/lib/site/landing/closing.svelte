<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { Button } from '$lib/components/ui/button';
	import { reveal } from '$lib/components/ui/motion';
	import { Presence, type PresenceState } from '$lib/components/ui/presence';

	const principles = [
		{ title: 'Source you own', body: 'Install one component or all of them. Edit it in place.' },
		{ title: 'One visual language', body: 'Shared tokens for color, space, type, and motion.' },
		{ title: 'Accessible by default', body: 'Keyboard, screen reader, and reduced motion tested.' },
		{ title: 'Every surface', body: 'Assistants, apps, installable PWAs, and websites.' }
	];

	let mood = $state<PresenceState>('idle');
</script>

<section class="mx-auto max-w-6xl px-5 pt-28 sm:px-8">
	<div
		class="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4"
		{@attach reveal({ children: true })}
	>
		{#each principles as item (item.title)}
			<div>
				<h3 class="text-sm font-medium">{item.title}</h3>
				<p class="text-muted-foreground mt-2 text-sm leading-relaxed">{item.body}</p>
			</div>
		{/each}
	</div>

	<div class="flex flex-col items-center py-28 text-center" {@attach reveal({ children: true })}>
		<Presence state={mood} size={72} label="Mizu, the companion" />
		<h2
			class="mt-8 max-w-2xl text-4xl leading-[1.05] font-semibold tracking-[-0.04em] text-balance sm:text-6xl"
		>
			Start with <span class="font-serif font-normal tracking-normal italic">one</span> component.
		</h2>
		<p class="text-muted-foreground mt-5 max-w-md leading-relaxed text-balance">
			Copy it in, read every line, and shape it to your product. Add the next one when you need it.
		</p>
		<div class="mt-8 flex flex-wrap justify-center gap-3">
			<Button
				href="/docs/installation"
				size="lg"
				onpointerenter={() => (mood = 'happy')}
				onpointerleave={() => (mood = 'idle')}
				onfocus={() => (mood = 'happy')}
				onblur={() => (mood = 'idle')}>Get started <ArrowRight class="size-4" /></Button
			>
			<Button href="/blocks" variant="secondary" size="lg">See complete screens</Button>
		</div>
	</div>
</section>
