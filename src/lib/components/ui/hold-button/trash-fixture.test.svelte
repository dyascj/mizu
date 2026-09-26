<script lang="ts">
	import { HoldButton, HoldButtonTrash } from './index.js';

	let { onConfirm, duration = 1000 }: { onConfirm: () => void; duration?: number } = $props();
</script>

<HoldButton {onConfirm} {duration} confirmedLabel="Deleted">
	<HoldButtonTrash />
	Hold to delete
</HoldButton>
