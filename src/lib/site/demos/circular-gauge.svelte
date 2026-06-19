<script lang="ts">
	import { CircularGauge } from '$lib/components/ui/circular-gauge';
	import { Droplets } from '@lucide/svelte';
</script>

<CircularGauge value={72} label="Focus">
	<Droplets class="size-5 text-primary" />
</CircularGauge>
