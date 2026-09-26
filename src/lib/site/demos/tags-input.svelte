<script lang="ts">
	import { TagsInput } from '$lib/components/ui/tags-input';

	let value = $state(['User:', '###', '</answer>']);
</script>

<div class="mx-auto flex w-full max-w-md flex-col gap-2">
	<p class="text-sm font-medium">Stop sequences</p>
	<TagsInput bind:value placeholder="Add one…" max={8} />
	<p class="text-muted-foreground text-xs">
		The model stops writing when it produces one. Press Enter or comma to add.
	</p>
</div>
