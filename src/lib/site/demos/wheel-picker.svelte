<script lang="ts">
	import { WheelPicker, WheelPickerColumn } from '$lib/components/ui/wheel-picker';

	const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
	const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
	const periods = ['AM', 'PM'];

	let hour = $state('7');
	let minute = $state('30');
	let period = $state('AM');
</script>

<div
	class="bg-card flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl px-4 pt-5 pb-6 shadow-sm"
>
	<div class="w-full min-w-0">
		<p class="font-semibold tracking-tight">Morning briefing</p>
		<p class="text-muted-foreground text-sm">Your assistant sends the day's summary at</p>
	</div>
	<WheelPicker label="Briefing time" class="w-full">
		<WheelPickerColumn label="Hour" options={hours} bind:value={hour} />
		<WheelPickerColumn label="Minute" options={minutes} bind:value={minute} />
		<WheelPickerColumn label="AM or PM" options={periods} bind:value={period} />
	</WheelPicker>
	<output aria-label="Briefing time" class="text-4xl font-semibold tracking-tight tabular-nums">
		{hour}:{minute}<span class="text-muted-foreground ml-2 text-xl font-medium">{period}</span>
	</output>
</div>
