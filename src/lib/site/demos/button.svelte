<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Droplet } from '@lucide/svelte';
</script>

<div class="flex flex-wrap items-center justify-center gap-3">
	<Button>Primary</Button>
	<Button variant="secondary">Secondary</Button>
	<Button variant="destructive">Destructive</Button>
	<Button variant="success">Success</Button>
	<Button variant="outline">Outline</Button>
	<Button variant="ghost">Ghost</Button>
	<Button variant="link">Link</Button>
	<Button size="icon" aria-label="Add">
		<Droplet class="size-5" />
	</Button>
</div>
