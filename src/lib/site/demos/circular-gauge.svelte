<script lang="ts">
	import { CircularGauge } from '$lib/components/ui/circular-gauge';
	import Droplets from '@lucide/svelte/icons/droplets';
</script>

<CircularGauge value={72} label="Focus">
	<Droplets class="text-primary size-5" />
</CircularGauge>
