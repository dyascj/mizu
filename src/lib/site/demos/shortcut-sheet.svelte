<script lang="ts">
	import { ShortcutSheet, type Shortcut } from '$lib/components/ui/shortcut-sheet';

	const shortcuts: Shortcut[] = [
		{ id: 'new-chat', label: 'New chat', group: 'Chats', keys: ['Mod', 'Shift', 'O'] },
		{ id: 'search', label: 'Search chats', group: 'Chats', keys: ['Mod', 'K'] },
		{ id: 'next', label: 'Next message', group: 'Chats', keys: ['J'] },
		{ id: 'previous', label: 'Previous message', group: 'Chats', keys: ['K'] },
		{ id: 'send', label: 'Send prompt', group: 'Composer', keys: ['Mod', 'Enter'] },
		{ id: 'stop', label: 'Stop generating', group: 'Composer', keys: ['Mod', '.'] },
		{ id: 'copy', label: 'Copy last response', group: 'Composer', keys: ['Mod', 'Shift', 'C'] },
		{ id: 'attach', label: 'Attach a file', group: 'Composer', keys: ['Mod', 'U'] },
		{ id: 'model', label: 'Switch model', group: 'Models', keys: ['Mod', 'Shift', 'M'] },
		{ id: 'voice', label: 'Start voice mode', group: 'Models', keys: ['Mod', 'Shift', 'V'] },
		{ id: 'sidebar', label: 'Toggle sidebar', group: 'View', keys: ['Mod', 'B'] },
		{ id: 'help', label: 'Show shortcuts', group: 'View', keys: ['?'] }
	];

	let pressed = $state<string | null>(null);
</script>

<div class="flex flex-col items-center gap-3 text-center">
	<ShortcutSheet {shortcuts} onPress={(shortcut) => (pressed = shortcut.label)} />
	<p class="text-muted-foreground text-sm">
		{pressed ? `Last pressed: ${pressed}` : 'Press ? anywhere, then try a shortcut.'}
	</p>
</div>
