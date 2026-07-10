<script lang="ts">
	import Moon from '@lucide/svelte/icons/moon';
	import Sun from '@lucide/svelte/icons/sun';
	import { Button } from '$lib/components/ui/button';
	import { toggleTheme } from '$lib/theme.svelte';
</script>

<!-- Icon visibility is driven by the `.dark` class (set pre-paint), so there is
     no hydration mismatch and no flash. -->
<Button variant="ghost" size="icon" aria-label="Toggle theme" onclick={toggleTheme}>
	<Sun class="hidden size-4.5 dark:block" />
	<Moon class="block size-4.5 dark:hidden" />
</Button>
