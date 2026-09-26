<script lang="ts">
	import Avatar from './avatar.svelte';
	import AvatarFallback from './avatar-fallback.svelte';
	import type { AvatarPresence } from './status.js';

	let {
		status,
		statusLabel,
		class: className = 'size-12',
		frameClass
	}: {
		status?: AvatarPresence;
		statusLabel?: string;
		class?: string;
		frameClass?: string;
	} = $props();
</script>

<Avatar {status} {statusLabel} {frameClass} data-testid="avatar" class={className}>
	<AvatarFallback>MR</AvatarFallback>
</Avatar>
