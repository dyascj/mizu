/** Presence shown by an avatar's status badge. */
export type AvatarPresence = 'online' | 'away' | 'busy' | 'offline';

/** What each presence is called when read aloud. */
export const presenceLabels: Record<AvatarPresence, string> = {
	online: 'Online',
	away: 'Away',
	busy: 'Busy',
	offline: 'Offline'
};
