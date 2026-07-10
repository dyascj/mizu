<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import OrbMark from '$lib/site/orb-mark.svelte';
</script>

<svelte:head>
	<title>{page.status} · Mizu</title>
</svelte:head>

<div class="flex min-h-[70dvh] flex-col items-center justify-center gap-6 px-6 text-center">
	<OrbMark class="size-20 opacity-80" />
	<div>
		<p class="text-sm font-medium text-muted-foreground tabular-nums">{page.status}</p>
		<h1 class="mt-1 text-2xl font-semibold tracking-tight">
			{page.status === 404 ? 'Lost in the mist' : 'Something went quiet'}
		</h1>
		<p class="mt-2 max-w-sm text-sm text-balance text-muted-foreground">
			{page.status === 404
				? 'This page does not exist, or it drifted somewhere new.'
				: (page.error?.message ?? 'An unexpected error occurred.')}
		</p>
	</div>
	<div class="flex items-center gap-2">
		<Button href="/">Back home</Button>
		<Button href="/docs/components" variant="ghost">Browse components</Button>
	</div>
</div>
