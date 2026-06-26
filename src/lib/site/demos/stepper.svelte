<script lang="ts">
	import { Stepper } from '$lib/components/ui/stepper';

	const steps = [
		{ label: 'Collect', description: 'Gather rainfall' },
		{ label: 'Filter', description: 'Clear sediment' },
		{ label: 'Test', description: 'Check purity' },
		{ label: 'Store', description: 'Seal the tank' }
	];
</script>

<div class="w-full max-w-lg">
	<Stepper {steps} current={1} />
</div>
