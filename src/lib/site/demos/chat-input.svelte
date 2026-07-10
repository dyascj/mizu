<script lang="ts">
	import { ChatInput } from '$lib/components/ui/chat-input';
	import { toast } from '$lib/components/ui/toast';

	let value = $state('');
</script>

<div class="w-full max-w-md">
	<ChatInput bind:value onSubmit={(message) => toast.success({ title: 'Sent', description: message })} />
</div>
