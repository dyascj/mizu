<script lang="ts">
	import { Moon, Sun } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { toggleTheme } from '$lib/theme.svelte';
</script>

<!-- Icon visibility is driven by the `.dark` class (set pre-paint), so there is
     no hydration mismatch and no flash. -->
<Button variant="ghost" size="icon" aria-label="Toggle theme" onclick={toggleTheme}>
	<Sun class="hidden size-5 dark:block" />
	<Moon class="block size-5 dark:hidden" />
</Button>
