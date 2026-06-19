<script lang="ts">
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
</script>

<div class="flex w-full max-w-xs flex-col gap-2">
	<Label for="notes">Water notes</Label>
	<Textarea id="notes" placeholder="Note the clarity, depth, and current..." />
</div>
