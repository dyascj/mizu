<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
</script>

<div class="flex w-full max-w-xs flex-col gap-2">
	<Label for="reservoir">Reservoir name</Label>
	<Input id="reservoir" placeholder="Clearwater Basin" />
</div>
