<script lang="ts">
	import { UptimeBar, type UptimeService } from '$lib/components/ui/uptime-bar';

	const services: UptimeService[] = [
		{
			name: 'Chat API',
			incidents: [
				{ daysAgo: 51, level: 'degraded', title: 'Elevated error rate', minutes: 38 },
				{ daysAgo: 22, level: 'outage', title: 'Model failover', minutes: 72 },
				{ daysAgo: 6, level: 'degraded', title: 'Slow first tokens', minutes: 21 }
			]
		},
		{
			name: 'Embeddings',
			incidents: [
				{ daysAgo: 40, level: 'degraded', title: 'Queue backlog', minutes: 44 },
				{ daysAgo: 12, level: 'degraded', title: 'Stale index reads', minutes: 16 }
			]
		},
		{
			name: 'Realtime voice',
			incidents: [
				{ daysAgo: 57, level: 'degraded', title: 'Choppy audio', minutes: 30 },
				{ daysAgo: 18, level: 'outage', title: 'Sessions dropped', minutes: 26 },
				{ daysAgo: 17, level: 'degraded', title: 'Reconnect storm', minutes: 55 }
			]
		}
	];
</script>

<UptimeBar {services} />
