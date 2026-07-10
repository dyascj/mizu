<script lang="ts">
	import { Reasoning } from '$lib/components/ui/reasoning';

	let streaming = $state(true);

	$effect(() => {
		const timer = setInterval(() => (streaming = !streaming), streaming ? 3200 : 5600);
		return () => clearInterval(timer);
	});
</script>

<div class="w-full max-w-md">
	<Reasoning {streaming} summary="Thought for 3 seconds">
		The user wants dinner ideas but mentioned being tired, so speed matters more than novelty.
		They cooked salmon twice this week already; suggest something different, keep it one pan, and
		skip anything that needs a store run.
	</Reasoning>
</div>
