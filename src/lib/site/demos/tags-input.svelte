<script lang="ts">
	import { TagsInput } from '$lib/components/ui/tags-input';

	let value = $state(['rainfall', 'spring', 'reservoir']);
</script>

<div class="mx-auto w-full max-w-md">
	<TagsInput bind:value placeholder="Add a source…" />
</div>
