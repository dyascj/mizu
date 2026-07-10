<script lang="ts">
	import { Sources } from '$lib/components/ui/sources';

	const sources = [
		{ label: 'svelte.dev', url: 'https://svelte.dev' },
		{ label: 'tailwindcss.com', url: 'https://tailwindcss.com' },
		{ label: 'bits-ui.com', url: 'https://bits-ui.com' }
	];
</script>

<div class="flex w-full max-w-md flex-col gap-2">
	<p class="text-sm text-muted-foreground">
		Mizu components are built on Svelte 5 runes with Tailwind v4 utilities, and interactive behavior
		comes from bits-ui.
	</p>
	<Sources items={sources} />
</div>
