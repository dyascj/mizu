<script lang="ts">
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
</script>

<div class="flex w-full max-w-xs flex-col gap-2">
	<Label for="notes">Project brief</Label>
	<Textarea id="notes" placeholder="Describe the outcome and the people it should help..." />
</div>
