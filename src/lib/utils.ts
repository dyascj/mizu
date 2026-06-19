import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind-aware conflict resolution.
 * The standard helper every Mizu component uses to compose `class` props.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Convenience alias for `T | null | undefined`. */
export type Maybe<T> = T | null | undefined;
