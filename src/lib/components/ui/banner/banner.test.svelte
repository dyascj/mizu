<script lang="ts">
	import { Banner } from './index.js';

	let {
		open = $bindable(true),
		onDismiss,
		dismissible,
		returnFocus,
		after = true
	}: {
		open?: boolean;
		onDismiss?: () => void;
		dismissible?: boolean;
		returnFocus?: HTMLElement | string;
		/** Renders the controls after the bar; otherwise they sit before it. */
		after?: boolean;
	} = $props();
</script>

{#snippet controls()}
	<p>Plain text first, which focus skips.</p>
	<button type="button" onclick={() => (open = !open)}>Toggle</button>
	<button type="button" id="elsewhere">Elsewhere</button>
{/snippet}

{#if !after}{@render controls()}{/if}
<Banner bind:open {onDismiss} {dismissible} {returnFocus}>
	{#snippet icon()}<svg data-testid="icon"></svg>{/snippet}
	Voice mode is now on for every assistant.
	{#snippet action()}<a href="#voice">Try it</a>{/snippet}
</Banner>
{#if after}{@render controls()}{/if}
