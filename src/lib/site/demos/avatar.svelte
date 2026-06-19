<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
</script>

<div class="flex items-center gap-3">
	<Avatar.Root>
		<Avatar.Image src="https://i.pravatar.cc/80?img=12" alt="River" />
		<Avatar.Fallback>RV</Avatar.Fallback>
	</Avatar.Root>
	<Avatar.Root>
		<Avatar.Fallback>CL</Avatar.Fallback>
	</Avatar.Root>
	<Avatar.Root>
		<Avatar.Fallback>MZ</Avatar.Fallback>
	</Avatar.Root>
</div>
