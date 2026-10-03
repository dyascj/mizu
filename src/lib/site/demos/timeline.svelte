<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Timeline from '$lib/components/ui/timeline';
	import type { LucideProps } from '@lucide/svelte';
	import Bot from '@lucide/svelte/icons/bot';
	import FileSearch from '@lucide/svelte/icons/file-search';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import Rocket from '@lucide/svelte/icons/rocket';
	import type { Component } from 'svelte';

	type Event = {
		id: string;
		icon: Component<LucideProps>;
		time: string;
		title: string;
		detail: string;
	};

	const pool: Omit<Event, 'id' | 'time'>[] = [
		{
			icon: FileSearch,
			title: 'Research agent read 12 sources',
			detail: 'Pricing pages and changelogs, cited in the brief.'
		},
		{
			icon: MessageSquare,
			title: 'Mira commented on the draft',
			detail: 'Tighten the intro, the numbers can lead.'
		},
		{
			icon: Bot,
			title: 'Writer agent revised the draft',
			detail: 'Intro cut to two sentences, 3 edits accepted.'
		},
		{
			icon: Rocket,
			title: 'Brief shared with the team',
			detail: 'Posted to #pricing with a summary.'
		}
	];

	let events = $state<Event[]>([
		{
			id: 's1',
			icon: Bot,
			time: '4m ago',
			title: 'Writer agent drafted the brief',
			detail: '1,240 words from 9 sources.'
		},
		{
			id: 's2',
			icon: FileSearch,
			time: '18m ago',
			title: 'Research agent started',
			detail: 'Goal: compare usage-based pricing.'
		},
		{
			id: 's3',
			icon: MessageSquare,
			time: '1h ago',
			title: 'You asked for a pricing brief',
			detail: 'Due before the Thursday planning call.'
		}
	]);
	let next = 0;
	let announcement = $state('');

	function simulate() {
		const template = pool[next % pool.length];
		events = [
			{ ...template, id: `new-${next++}`, time: 'Just now' },
			...events.map((event) => (event.time === 'Just now' ? { ...event, time: '1m ago' } : event))
		].slice(0, 12);
		announcement = template.title;
	}
</script>

<div class="bg-card w-full max-w-md overflow-hidden rounded-2xl shadow-md">
	<div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3 ps-5 pe-3">
		<p class="font-semibold tracking-tight whitespace-nowrap">Run activity</p>
		<Button variant="secondary" size="sm" onclick={simulate}>Simulate event</Button>
	</div>
	<!-- Fixed height with its own scroll, so new events never push the page. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		role="region"
		aria-label="Run activity feed"
		tabindex="0"
		class="focus-visible:ring-ring h-80 overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,black_calc(100%-2rem),transparent)] px-5 pt-2 pb-6 outline-none focus-visible:ring-2 focus-visible:ring-inset"
	>
		<Timeline.Root>
			{#each events as event, index (event.id)}
				<Timeline.Item icon={event.icon} last={index === events.length - 1}>
					<Timeline.Time>{event.time}</Timeline.Time>
					<Timeline.Title>{event.title}</Timeline.Title>
					<Timeline.Description>{event.detail}</Timeline.Description>
				</Timeline.Item>
			{/each}
		</Timeline.Root>
	</div>
	<span class="sr-only" aria-live="polite">{announcement}</span>
</div>
