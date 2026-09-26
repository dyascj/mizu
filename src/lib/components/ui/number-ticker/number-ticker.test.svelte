<script lang="ts">
	import NumberTicker from './number-ticker.svelte';

	// Owns its state, so changing one prop leaves the other untouched, as in an app.
	let value = $state(11);
	let format = $state<Intl.NumberFormatOptions | undefined>();

	export function setValue(next: number) {
		value = next;
	}

	export function setFormat(next: Intl.NumberFormatOptions) {
		format = next;
	}
</script>

<NumberTicker {value} {format} locale="en-US" />
