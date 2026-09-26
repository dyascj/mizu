<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { NotificationBell, type BellNotification } from '$lib/components/ui/notification-bell';

	const incoming = [
		'Research agent finished "Competitor pricing"',
		'Eval run passed 48 of 50 checks',
		'Priya shared the onboarding prompt with you',
		'Batch summaries are ready to download',
		'Voice agent needs approval to send an email'
	];

	let notifications = $state<BellNotification[]>([
		{ id: 'n3', title: 'Support agent drafted 12 replies', time: '5m' },
		{ id: 'n2', title: 'Nightly eval run finished', time: '1h' },
		{ id: 'n1', title: 'Your API key was rotated', time: '2d' }
	]);
	let next = 0;
	let simulate = $state<HTMLElement | null>(null);

	function arrive() {
		const n = next++;
		notifications = [
			{ id: `live-${n}`, title: incoming[n % incoming.length], time: 'now' },
			...notifications
		].slice(0, 4);
	}
</script>

<div class="flex flex-wrap items-center justify-center gap-3">
	<NotificationBell
		{notifications}
		readId="n2"
		contentProps={{
			align: 'start',
			// Simulating an arrival should not count as clicking away.
			onInteractOutside: (event) => {
				if (simulate?.contains(event.target as Node)) event.preventDefault();
			}
		}}
	/>
	<Button bind:ref={simulate} variant="secondary" onclick={arrive}>Simulate arrival</Button>
</div>
