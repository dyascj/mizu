<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Droplets } from '@lucide/svelte';
</script>

<div class="flex flex-wrap items-center justify-center gap-2.5">
	<Badge>
		<Droplets class="size-3" />
		Primary
	</Badge>
	<Badge variant="secondary">Secondary</Badge>
	<Badge variant="success">
		<span class="size-1.5 rounded-full bg-current"></span>
		Success
	</Badge>
	<Badge variant="warning">Warning</Badge>
	<Badge variant="destructive">Destructive</Badge>
	<Badge variant="outline">Outline</Badge>
</div>
