<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Toaster, toast } from '$lib/components/ui/toast';
</script>

<!-- One <Toaster /> lives at your app root; it's shown here so the demo is self-contained. -->
<Toaster position="bottom-right" />

<div class="flex flex-wrap items-center justify-center gap-2.5">
	<Button variant="secondary" onclick={() => toast.success('Your changes have been saved.')}>
		Success
	</Button>
	<Button
		variant="secondary"
		onclick={() =>
			toast.error({
				title: "Couldn't reach the server",
				description: 'Check your connection and try again.'
			})}
	>
		Error
	</Button>
	<Button
		variant="secondary"
		onclick={() =>
			toast.warning({ title: 'Storage almost full', description: '92% of 5 GB used.' })}
	>
		Warning
	</Button>
	<Button
		onclick={() =>
			toast({
				title: 'Message archived',
				action: { label: 'Undo', onclick: () => toast.success('Restored to inbox') }
			})}
	>
		With action
	</Button>
</div>
