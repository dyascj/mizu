<script lang="ts">
	import { Plan, type PlanStep } from '$lib/components/ui/plan';

	const script = [
		'Understanding your question',
		'Reviewing your calendar',
		'Searching the web',
		'Considering 6 results',
		'Wrapping up'
	];

	let done = $state(1);

	$effect(() => {
		const timer = setInterval(() => {
			done = done >= script.length ? 0 : done + 1;
		}, 1800);
		return () => clearInterval(timer);
	});

	const steps = $derived(
		script.map(
			(label, i): PlanStep => ({
				label,
				state: i < done ? 'done' : i === done ? 'active' : 'pending'
			})
		)
	);
</script>

<Plan {steps} />
