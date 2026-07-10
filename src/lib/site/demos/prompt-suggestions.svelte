<script lang="ts">
	import { PromptSuggestions } from '$lib/components/ui/prompt-suggestions';
	import { toast } from '$lib/components/ui/toast';

	const prompts = [
		'Plan a cozy weekend',
		'Draft a product description',
		'Fix the grammar in this sentence',
		'Suggest dinner from my fridge'
	];
</script>

<div class="max-w-md">
	<PromptSuggestions
		items={prompts}
		onSelect={(p) => toast.info({ title: 'Prompt', description: p })}
	/>
</div>
