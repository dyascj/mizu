<script lang="ts">
	import { FloatingLabel } from '$lib/components/ui/floating-label';

	// Deliberately loose: the server is the real judge of an address.
	function validateEmail(value: string) {
		const email = value.trim();
		if (email === '') return 'Enter an email address.';
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
			return "That doesn't look like an email address.";
		return null;
	}
</script>

<form
	class="flex w-full max-w-sm flex-col gap-3"
	novalidate
	onsubmit={(event) => event.preventDefault()}
>
	<p class="text-sm font-medium">Invite a teammate to Research agents</p>
	<FloatingLabel label="Full name" name="name" autocomplete="name" />
	<FloatingLabel
		label="Work email"
		type="email"
		name="email"
		autocomplete="email"
		validate={validateEmail}
	/>
</form>
