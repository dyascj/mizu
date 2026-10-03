<script lang="ts">
	import { FollowButton } from '$lib/components/ui/follow-button';
	import { duration, pop, springs } from '$lib/components/ui/motion';
	import { NumberTicker } from '$lib/components/ui/number-ticker';
	import User from '@lucide/svelte/icons/user';
	import { fade } from 'svelte/transition';

	let following = $state(false);

	const known = [
		{ initials: 'A', name: 'Ava Kim' },
		{ initials: 'B', name: 'Ben Ortiz' },
		{ initials: 'C', name: 'Cara Liu' }
	];
	const people = $derived(following ? [...known, { initials: '', name: 'You' }] : known);
</script>

<div class="bg-card flex w-full max-w-sm flex-col gap-4 rounded-2xl p-5 shadow-sm">
	<div class="flex items-center gap-3">
		<span
			class="bg-secondary text-muted-foreground grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold"
		>
			PR
		</span>
		<div class="min-w-0">
			<p class="truncate font-semibold tracking-tight">Priya Raman</p>
			<p class="text-muted-foreground truncate text-sm">Builds research agents for finance teams</p>
		</div>
	</div>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex items-center gap-2">
			<!-- Your face joins the end of the stack, so nothing already there moves. -->
			<ul class="flex" aria-label="Followers you know">
				{#each people as person (person.name)}
					<li
						class="-ms-2 first:ms-0"
						in:pop={{ scale: 0.6, spring: springs.bouncy }}
						out:fade={{ duration: duration.instant }}
					>
						<span
							class={[
								'ring-card grid size-7 place-items-center rounded-full text-xs font-semibold ring-2',
								person.initials
									? 'bg-secondary text-muted-foreground'
									: 'bg-primary-muted text-primary'
							]}
							role="img"
							aria-label={person.name}
						>
							{#if person.initials}{person.initials}{:else}<User class="size-3.5" />{/if}
						</span>
					</li>
				{/each}
			</ul>
			<span class="text-muted-foreground text-xs tabular-nums">
				<NumberTicker value={following ? 2419 : 2418} locale="en-US" /> followers
			</span>
		</div>
		<FollowButton bind:following name="Priya Raman" />
	</div>
</div>
