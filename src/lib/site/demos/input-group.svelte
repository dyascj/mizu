<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Search } from '@lucide/svelte';
</script>

<InputGroup.Root class="w-full max-w-sm">
	<InputGroup.Addon>
		<Search />
	</InputGroup.Addon>
	<InputGroup.Input type="search" placeholder="Search streams and springs" />
</InputGroup.Root>
