/**
 * Mizu toast store — a tiny reactive queue, sonner-style.
 *
 * Mount one `<Toaster />` at your app root, then call `toast(...)` from anywhere:
 *   toast.success('Saved');
 *   toast.error({ title: "Couldn't save", description: 'Try again in a moment.' });
 *   toast({ title: 'Heads up', action: { label: 'Undo', onclick: () => {} } });
 */
export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export type ToastAction = { label: string; onclick: () => void };

export type ToastData = {
	id: number;
	title: string;
	description?: string;
	variant: ToastVariant;
	/** Auto-dismiss after this many ms. `0` keeps it until dismissed. */
	duration: number;
	action?: ToastAction;
};

export type ToastOptions = {
	title?: string;
	description?: string;
	duration?: number;
	action?: ToastAction;
};

/** Either a bare title string or a full options object. */
type ToastInput = string | ToastOptions;

const DEFAULT_DURATION = 4500;

class ToastStore {
	toasts = $state<ToastData[]>([]);
	#id = 0;
	#timers = new Map<number, ReturnType<typeof setTimeout>>();

	add(input: ToastInput, variant: ToastVariant): number {
		const opts: ToastOptions = typeof input === 'string' ? { title: input } : input;
		const id = ++this.#id;
		const duration = opts.duration ?? DEFAULT_DURATION;
		this.toasts.push({
			id,
			title: opts.title ?? '',
			description: opts.description,
			variant,
			duration,
			action: opts.action
		});
		if (duration > 0) this.#arm(id, duration);
		return id;
	}

	#arm(id: number, ms: number) {
		this.#clear(id);
		this.#timers.set(
			id,
			setTimeout(() => this.dismiss(id), ms)
		);
	}

	#clear(id: number) {
		const t = this.#timers.get(id);
		if (t) clearTimeout(t);
		this.#timers.delete(id);
	}

	/** Pause auto-dismiss (e.g. while hovered). */
	pause(id: number) {
		this.#clear(id);
	}

	/** Resume auto-dismiss with the toast's remaining-ish duration. */
	resume(id: number) {
		const t = this.toasts.find((x) => x.id === id);
		if (t && t.duration > 0) this.#arm(id, t.duration);
	}

	dismiss(id: number) {
		this.#clear(id);
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}

	clear() {
		for (const id of this.#timers.keys()) this.#clear(id);
		this.toasts = [];
	}
}

const store = new ToastStore();

/** The reactive toaster store — read `toaster.toasts` inside `<Toaster />`. */
export const toaster = store;

type ToastFn = ((input: ToastInput) => number) & {
	success: (input: ToastInput) => number;
	error: (input: ToastInput) => number;
	warning: (input: ToastInput) => number;
	info: (input: ToastInput) => number;
	dismiss: (id: number) => void;
	clear: () => void;
};

export const toast: ToastFn = Object.assign((input: ToastInput) => store.add(input, 'info'), {
	success: (input: ToastInput) => store.add(input, 'success'),
	error: (input: ToastInput) => store.add(input, 'error'),
	warning: (input: ToastInput) => store.add(input, 'warning'),
	info: (input: ToastInput) => store.add(input, 'info'),
	dismiss: (id: number) => store.dismiss(id),
	clear: () => store.clear()
});
