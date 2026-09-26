/** The domains people actually sign up with, most common first so a tie goes to the likelier one. */
export const commonDomains = [
	'gmail.com',
	'yahoo.com',
	'hotmail.com',
	'outlook.com',
	'icloud.com',
	'aol.com',
	'live.com',
	'msn.com',
	'proton.me',
	'protonmail.com',
	'me.com',
	'mac.com',
	'googlemail.com',
	'yandex.com',
	'gmx.com',
	'hey.com',
	'fastmail.com',
	'zoho.com',
	'comcast.net',
	'yahoo.co.uk',
	'hotmail.co.uk'
];

/**
 * Real domains that sit a letter or two from a common one, including the big
 * providers' regional twins. Never "correct" them.
 */
const knownDomains = new Set([
	...commonDomains,
	'ymail.com',
	'mail.com',
	'email.com',
	'gmx.de',
	'gmx.net',
	'gmx.at',
	'gmx.ch',
	'web.de',
	'pm.me',
	'hey.co',
	'yahoo.ca',
	'yahoo.fr',
	'yahoo.de',
	'yahoo.es',
	'yahoo.it',
	'yahoo.ie',
	'yahoo.in',
	'yahoo.cn',
	'yahoo.co.jp',
	'yahoo.co.in',
	'yahoo.co.id',
	'yahoo.co.nz',
	'yahoo.com.au',
	'yahoo.com.br',
	'yahoo.com.mx',
	'yahoo.com.ar',
	'hotmail.ca',
	'hotmail.fr',
	'hotmail.de',
	'hotmail.es',
	'hotmail.it',
	'hotmail.be',
	'hotmail.nl',
	'hotmail.co.jp',
	'hotmail.com.au',
	'hotmail.com.br',
	'live.ca',
	'live.fr',
	'live.de',
	'live.it',
	'live.nl',
	'live.co.uk',
	'live.com.au',
	'outlook.fr',
	'outlook.de',
	'outlook.es',
	'outlook.it',
	'outlook.jp',
	'yandex.ru'
]);

/** Endings that are almost always a slipped .com, .net, or .org. */
const endingSlips: Record<string, string> = {
	con: 'com',
	cmo: 'com',
	ocm: 'com',
	vom: 'com',
	xom: 'com',
	comm: 'com',
	cpm: 'com',
	cim: 'com',
	nte: 'net',
	ent: 'net',
	ner: 'net',
	ogr: 'org',
	rog: 'org',
	orh: 'org'
};

/**
 * The part of a domain that names its country or kind: "com", "ca", or a
 * two-part ending such as "co.uk". A slipped ending counts as the one it
 * slipped from, so "gmial.con" still ends in "com", and so does a bare "co"
 * that lost its "m".
 */
function ending(domain: string) {
	const parts = domain.split('.');
	const last = parts[parts.length - 1];
	if (parts.length > 2 && /^(co|com)$/.test(parts[parts.length - 2]) && last.length === 2) {
		return `${parts[parts.length - 2]}.${last}`;
	}
	return last === 'co' ? 'com' : (endingSlips[last] ?? last);
}

/** Loose on purpose: the server is the real judge of an address. */
export const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

/**
 * Optimal string alignment: edit distance that also counts two swapped
 * neighbours as one slip, so "hotmial" is one slip from "hotmail", not two.
 */
function distance(a: string, b: string) {
	const d = Array.from({ length: a.length + 1 }, (_, i) =>
		Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
	);
	for (let i = 1; i <= a.length; i++) {
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
			if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
				d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
			}
		}
	}
	return d[a.length][b.length];
}

/**
 * The address with a likely typo in its domain fixed, or null when it looks
 * right. Pass your own `domains`, most common first, to replace the built-in
 * list of popular mail providers.
 */
export function suggestEmail(email: string, domains: string[] = commonDomains): string | null {
	const at = email.lastIndexOf('@');
	if (at < 1) return null;
	const local = email.slice(0, at);
	const domain = email.slice(at + 1).toLowerCase();
	if (domain.length < 4 || !domain.includes('.') || knownDomains.has(domain)) return null;
	if (domains.includes(domain)) return null;
	const end = ending(domain);
	let best: string | null = null;
	let bestDistance = Infinity;
	for (const candidate of domains) {
		const d = distance(domain, candidate);
		// Two slips are only believable in a long name ("me.co" is not
		// "mac.com") that keeps its ending: "yahoo.ca" is a real Canadian
		// address, not a mangled "yahoo.com".
		const limit = candidate.length >= 9 && ending(candidate) === end ? 2 : 1;
		if (d <= limit && d < bestDistance) {
			best = candidate;
			bestDistance = d;
		}
	}
	if (best) return `${local}@${best}`;
	const dot = domain.lastIndexOf('.');
	const fix = endingSlips[domain.slice(dot + 1)];
	return fix ? `${local}@${domain.slice(0, dot)}.${fix}` : null;
}

/** The stretch of `to` that differs from `from`, trimmed of their shared start and end. */
export function changedRange(from: string, to: string): [number, number] {
	let start = 0;
	while (start < Math.min(from.length, to.length) && from[start] === to[start]) start++;
	let tail = 0;
	while (
		tail < Math.min(from.length, to.length) - start &&
		from[from.length - 1 - tail] === to[to.length - 1 - tail]
	) {
		tail++;
	}
	return [start, Math.max(start + 1, to.length - tail)];
}

export type Glyph = { key: string; char: string; kind: 'keep' | 'move' | 'new' };

/**
 * How the old text becomes the new: letters in the longest common run stay
 * put, a letter that only changed places slides to its new spot, and the
 * rest flip out or in. Keys carry each letter's identity across both.
 */
export function morphPlan(from: string, to: string) {
	const n = from.length;
	const m = to.length;
	const lcs = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
	for (let i = n - 1; i >= 0; i--) {
		for (let j = m - 1; j >= 0; j--) {
			lcs[i][j] =
				from[i] === to[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
		}
	}
	const kept = new Map<number, number>();
	for (let i = 0, j = 0; i < n && j < m;) {
		if (from[i] === to[j]) kept.set(j++, i++);
		else if (lcs[i + 1][j] >= lcs[i][j + 1]) i++;
		else j++;
	}
	const used = new Set(kept.values());
	const before: Glyph[] = [...from].map((char, i) => ({ key: `k${i}`, char, kind: 'keep' }));
	const after: Glyph[] = [...to].map((char, j) => {
		const i = kept.get(j);
		if (i !== undefined) return { key: `k${i}`, char, kind: 'keep' };
		const spare = [...from].findIndex((c, k) => c === char && !used.has(k));
		if (spare >= 0) {
			used.add(spare);
			return { key: `k${spare}`, char, kind: 'move' };
		}
		return { key: `n${j}`, char, kind: 'new' };
	});
	return { before, after };
}
