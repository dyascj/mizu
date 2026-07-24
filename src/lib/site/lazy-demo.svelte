<script lang="ts">
	import { getDemoComponent } from './demos';

	let { slug }: { slug: string } = $props();
	let root = $state<HTMLDivElement | null>(null);
	let visible = $state(false);

	$effect(() => {
		if (!root || visible) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				visible = true;
				observer.disconnect();
			},
			{ rootMargin: '240px' }
		);
		observer.observe(root);
		return () => observer.disconnect();
	});

	const componentPromise = $derived(visible ? getDemoComponent(slug) : null);
</script>

<div bind:this={root} class="flex min-h-24 w-full items-center justify-center">
	{#if componentPromise}
		{#await componentPromise}
			<span class="size-5 animate-pulse rounded-full bg-secondary" aria-hidden="true"></span>
		{:then Demo}
			{#if Demo}
				<Demo />
			{/if}
		{/await}
	{/if}
</div>
