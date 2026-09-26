/**
 * Mizu toast store: a tiny reactive queue, sonner-style.
 *
 * Mount one `<Toaster />` at your app root, then call `toast(...)` from anywhere:
 *   toast.success('Saved');
 *   toast.error({ title: "Couldn't save", description: 'Try again in a moment.' });
 *   toast({ title: 'Heads up', action: { label: 'Undo', onclick: () => {} } });
 *   toast.undo({ title: "Deleted 'Q3 roadmap'", onUndo: restore, onCommit: purge });
 *   toast.promise(save, { loading: 'Saving', success: 'Saved', error: "Couldn't save" });
 */
export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export type ToastAction = {
	label: string;
	onclick: () => void;
	/** Close the toast after the action runs. Defaults to true. */
	dismiss?: boolean;
};

/** An action you can take back until the toast's countdown runs out. */
export type ToastUndo = {
	/** Restores whatever the action changed. Runs on the Undo button or Ctrl/Cmd+Z. */
	onUndo: () => void;
	/** Makes the action permanent. Runs when the countdown ends or the toast is dismissed. */
	onCommit?: () => void;
	/** The button label. Defaults to "Undo". */
	label?: string;
	/** Announced once the action is undone. Defaults to "Restored". */
	undoneText?: string;
};

export type ToastData = {
	id: number;
	title: string;
	description?: string;
	variant: ToastVariant;
	/** Auto-dismiss after this many ms. `0` keeps it until dismissed. */
	duration: number;
	action?: ToastAction;
	/** Shows a spinner in place of the icon while work is in flight. */
	loading?: boolean;
	/** Turns the toast into an undo snackbar with a countdown ring. */
	undo?: ToastUndo;
	/** Bumped on every in-place update, so the toast can morph between versions. */
	version?: number;
};

export type ToastOptions = {
	/** Updates the toast with this id in place instead of adding a new one. */
	id?: number;
	title?: string;
	description?: string;
	duration?: number;
	action?: ToastAction;
	/** Shows a spinner in place of the icon. */
	loading?: boolean;
};

export type ToastUndoOptions = Omit<ToastOptions, 'action' | 'loading'> & ToastUndo;

/** A message for one outcome of `toast.promise`: a title, options, or a function of the result. */
type PromiseMessage<T> = string | ToastOptions | ((value: T) => string | ToastOptions);

export type ToastPromiseOptions<T> = {
	/** Morphs this existing toast instead of adding one. A newer run replaces an older one. */
	id?: number;
	loading: string | ToastOptions;
	success: PromiseMessage<T>;
	error: PromiseMessage<unknown>;
	/**
	 * Adds a Retry action to the error, which runs the task again in the same
	 * toast. Pass a string to relabel it. Needs `task` to be a function.
	 */
	retry?: boolean | string;
};

/** Either a bare title string or a full options object. */
type ToastInput = string | ToastOptions;

const DEFAULT_DURATION = 4500;
/** Long enough to notice a mistake and reach for Undo. */
const UNDO_DURATION = 5000;
/** A settled success needs only a glance. */
const PROMISE_SUCCESS_DURATION = 2000;
/** Errors wait longer, because they ask for a decision. */
const PROMISE_ERROR_DURATION = 6000;

class ToastStore {
	toasts = $state<ToastData[]>([]);
	/** Ids whose dismiss timer is counting down right now. Countdown visuals follow it. */
	running = $state<Record<number, boolean>>({});
	/** The latest message for the Toaster's polite live region. */
	announcement = $state('');
	#id = 0;
	#timers = new Map<number, ReturnType<typeof setTimeout>>();
	#remaining = new Map<number, number>();
	#startedAt = new Map<number, number>();
	/** Toasts paused on their own, by hover or focus. */
	#paused = new Set<number>();
	/** Reasons every toast is on hold, such as a hovered stack or a hidden tab. */
	#holds = new Set<string>();
	/** The latest run of each promise toast, so stale results are dropped. */
	#runs = new Map<number, AbortController>();

	add(input: ToastInput, variant: ToastVariant, extra: Partial<ToastData> = {}): number {
		const opts: ToastOptions = typeof input === 'string' ? { title: input } : input;
		const existing = opts.id === undefined ? undefined : this.#find(opts.id);
		const id = opts.id ?? ++this.#id;
		if (opts.id !== undefined) this.#id = Math.max(this.#id, opts.id);
		const duration = opts.duration ?? DEFAULT_DURATION;
		const data: ToastData = {
			id,
			title: opts.title ?? '',
			description: opts.description,
			variant,
			duration,
			action: opts.action,
			loading: opts.loading,
			...extra
		};
		if (existing) {
			// In place: the toast keeps its slot and morphs to the new content.
			data.version = (existing.version ?? 0) + 1;
			this.toasts = this.toasts.map((toast) => (toast.id === id ? data : toast));
		} else {
			data.version = 0;
			this.toasts.push(data);
		}
		this.#clearTimer(id);
		this.#remaining.delete(id);
		if (duration > 0) {
			this.#remaining.set(id, duration);
			this.#sync(id);
		}
		return id;
	}

	#find(id: number) {
		return this.toasts.find((toast) => toast.id === id);
	}

	#arm(id: number, ms: number) {
		this.#clearTimer(id);
		this.#remaining.set(id, ms);
		this.#startedAt.set(id, Date.now());
		this.#timers.set(
			id,
			setTimeout(() => this.dismiss(id), ms)
		);
		this.running[id] = true;
	}

	#clearTimer(id: number) {
		const t = this.#timers.get(id);
		if (t) clearTimeout(t);
		this.#timers.delete(id);
		this.#startedAt.delete(id);
		if (this.running[id]) this.running[id] = false;
	}

	/** Runs or stops one toast's timer to match its pauses and the global holds. */
	#sync(id: number) {
		const remaining = this.#remaining.get(id);
		if (remaining === undefined || !this.#find(id)) return;
		const counting = this.#timers.has(id);
		const shouldCount = this.#holds.size === 0 && !this.#paused.has(id);
		if (shouldCount && !counting) {
			if (remaining <= 0) this.dismiss(id);
			else this.#arm(id, remaining);
		} else if (!shouldCount && counting) {
			const startedAt = this.#startedAt.get(id) ?? Date.now();
			this.#remaining.set(id, Math.max(0, remaining - (Date.now() - startedAt)));
			this.#clearTimer(id);
		}
	}

	/** Pause auto-dismiss (e.g. while hovered). */
	pause(id: number) {
		if (!this.#find(id)) return;
		this.#paused.add(id);
		this.#sync(id);
	}

	/** Resume auto-dismiss using the exact duration left when it was paused. */
	resume(id: number) {
		this.#paused.delete(id);
		this.#sync(id);
	}

	/**
	 * Holds every toast's timer while `on`, for a reason such as `hover` or
	 * `hidden`. Timers run again once no reason is left.
	 */
	hold(reason: string, on: boolean) {
		if (on === this.#holds.has(reason)) return;
		if (on) this.#holds.add(reason);
		else this.#holds.delete(reason);
		for (const toast of this.toasts) this.#sync(toast.id);
	}

	/** Takes back an undo toast's action and closes it without committing. */
	undo(id: number) {
		const undo = this.#find(id)?.undo;
		if (!undo) return;
		this.#remove(id);
		undo.onUndo();
		this.announce(undo.undoneText ?? 'Restored');
	}

	/** Closes a toast. An undo toast commits its action. */
	dismiss(id: number) {
		const toast = this.#find(id);
		this.#remove(id);
		toast?.undo?.onCommit?.();
	}

	#remove(id: number) {
		this.#clearTimer(id);
		this.#remaining.delete(id);
		this.#paused.delete(id);
		this.#runs.get(id)?.abort();
		this.#runs.delete(id);
		delete this.running[id];
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}

	/** Sends a message to the Toaster's polite live region. */
	announce(message: string) {
		// Cleared first, so the same words twice in a row are still read out.
		this.announcement = '';
		queueMicrotask(() => (this.announcement = message));
	}

	clear() {
		for (const toast of [...this.toasts]) this.dismiss(toast.id);
	}

	promise<T>(
		task: Promise<T> | ((signal: AbortSignal) => Promise<T>),
		options: ToastPromiseOptions<T>
	): number {
		const loading =
			typeof options.loading === 'string' ? { title: options.loading } : options.loading;
		const id = this.add({ ...loading, id: options.id, duration: 0 }, 'info', { loading: true });
		// Replace, never stack: a newer run makes the older result meaningless.
		this.#runs.get(id)?.abort();
		const controller = new AbortController();
		this.#runs.set(id, controller);

		const settle = <V>(message: PromiseMessage<V>, value: V, variant: ToastVariant) => {
			if (controller.signal.aborted || !this.#find(id)) return;
			this.#runs.delete(id);
			const resolved = typeof message === 'function' ? message(value) : message;
			const opts = typeof resolved === 'string' ? { title: resolved } : resolved;
			const retry =
				variant === 'error' && options.retry && typeof task === 'function'
					? {
							label: typeof options.retry === 'string' ? options.retry : 'Retry',
							onclick: () => this.promise(task, { ...options, id }),
							dismiss: false
						}
					: undefined;
			this.add(
				{
					action: retry,
					duration: variant === 'error' ? PROMISE_ERROR_DURATION : PROMISE_SUCCESS_DURATION,
					...opts,
					id
				},
				variant
			);
		};

		const running = typeof task === 'function' ? task(controller.signal) : task;
		running.then(
			(value) => settle(options.success, value, 'success'),
			(error: unknown) => settle(options.error, error, 'error')
		);
		return id;
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
	/** A toast with a spinner that stays until you update or dismiss it. */
	loading: (input: ToastInput) => number;
	/**
	 * An undo snackbar: the action has already happened, and a countdown ring
	 * shows how long is left to take it back. Pass the same `id` again to fold a
	 * second action into it, which restarts the countdown.
	 */
	undo: (input: ToastUndoOptions) => number;
	/**
	 * One toast that morphs from loading into success or error as the task
	 * settles. Returns its id.
	 */
	promise: <T>(
		task: Promise<T> | ((signal: AbortSignal) => Promise<T>),
		options: ToastPromiseOptions<T>
	) => number;
	dismiss: (id: number) => void;
	clear: () => void;
};

export const toast: ToastFn = Object.assign((input: ToastInput) => store.add(input, 'info'), {
	success: (input: ToastInput) => store.add(input, 'success'),
	error: (input: ToastInput) => store.add(input, 'error'),
	warning: (input: ToastInput) => store.add(input, 'warning'),
	info: (input: ToastInput) => store.add(input, 'info'),
	loading: (input: ToastInput) =>
		store.add({ duration: 0, ...(typeof input === 'string' ? { title: input } : input) }, 'info', {
			loading: true
		}),
	undo: ({ onUndo, onCommit, label, undoneText, ...input }: ToastUndoOptions) =>
		store.add({ duration: UNDO_DURATION, ...input }, 'info', {
			undo: { onUndo, onCommit, label, undoneText }
		}),
	promise: <T>(
		task: Promise<T> | ((signal: AbortSignal) => Promise<T>),
		options: ToastPromiseOptions<T>
	) => store.promise(task, options),
	dismiss: (id: number) => store.dismiss(id),
	clear: () => store.clear()
});
