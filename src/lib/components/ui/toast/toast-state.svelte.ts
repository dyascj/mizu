/**
 * Mizu toast store: a tiny reactive queue, sonner-style.
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
	#remaining = new Map<number, number>();
	#startedAt = new Map<number, number>();

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
		if (duration > 0) {
			this.#remaining.set(id, duration);
			this.#arm(id, duration);
		}
		return id;
	}

	#arm(id: number, ms: number) {
		this.#clearTimer(id);
		this.#remaining.set(id, ms);
		this.#startedAt.set(id, Date.now());
		this.#timers.set(
			id,
			setTimeout(() => this.dismiss(id), ms)
		);
	}

	#clearTimer(id: number) {
		const t = this.#timers.get(id);
		if (t) clearTimeout(t);
		this.#timers.delete(id);
		this.#startedAt.delete(id);
	}

	/** Pause auto-dismiss (e.g. while hovered). */
	pause(id: number) {
		const startedAt = this.#startedAt.get(id);
		const remaining = this.#remaining.get(id);
		if (startedAt === undefined || remaining === undefined) return;
		this.#remaining.set(id, Math.max(0, remaining - (Date.now() - startedAt)));
		this.#clearTimer(id);
	}

	/** Resume auto-dismiss using the exact duration left when it was paused. */
	resume(id: number) {
		const remaining = this.#remaining.get(id);
		if (!this.toasts.some((toast) => toast.id === id) || remaining === undefined) return;
		if (remaining <= 0) this.dismiss(id);
		else this.#arm(id, remaining);
	}

	dismiss(id: number) {
		this.#clearTimer(id);
		this.#remaining.delete(id);
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}

	clear() {
		for (const id of this.#timers.keys()) this.#clearTimer(id);
		this.#remaining.clear();
		this.toasts = [];
	}
}

const store = new ToastStore();

/** The reactive toaster store; read `toaster.toasts` inside `<Toaster />`. */
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
