// @ts-check
/**
 * Extract a component's public API from its Svelte 5 source — no build step,
 * no hand-maintained metadata. Every Mizu component anchors on a single
 * `let { … }: <Type> = $props()` destructuring, so we read the destructuring
 * for prop names / defaults / `$bindable`, the type expression for types, and
 * resolve `tv()` variant unions (so `variant` reads `'primary' | 'secondary'`
 * instead of an opaque alias). Base types in an intersection
 * (`HTMLButtonAttributes`, `Dialog.ContentProps`, …) become "extends" notes.
 *
 * Pure string parsing — runnable under plain node for testing.
 */

/** @typedef {{ name: string, type: string, default: string | null, bindable: boolean, optional: boolean }} PropRow */
/** @typedef {{ props: PropRow[], extendsTypes: string[] }} ParsedProps */

/** @type {Record<string, string | undefined>} */
const OPENERS = { '(': ')', '[': ']', '{': '}' };
/** @type {Record<string, boolean | undefined>} */
const CLOSERS = { ')': true, ']': true, '}': true };

/**
 * Split `str` on a single-character separator, ignoring separators nested in
 * (), [], {}, generics `<…>`, or string literals. `<>` only counts as depth
 * when `angle` is true, and `=>` is never treated as a closing angle.
 * @param {string} str
 * @param {string} sep
 * @param {{ angle?: boolean }} [opts]
 * @returns {string[]}
 */
function splitTopLevel(str, sep, opts = {}) {
	const { angle = false } = opts;
	const parts = [];
	let depth = 0;
	let cur = '';
	/** @type {string | null} */
	let str_ = null;
	for (let i = 0; i < str.length; i++) {
		const ch = str[i];
		if (str_) {
			cur += ch;
			if (ch === str_ && str[i - 1] !== '\\') str_ = null;
			continue;
		}
		if (ch === '"' || ch === "'" || ch === '`') {
			str_ = ch;
			cur += ch;
			continue;
		}
		if (OPENERS[ch]) depth++;
		else if (CLOSERS[ch]) depth--;
		else if (angle && ch === '<') depth++;
		else if (angle && ch === '>' && str[i - 1] !== '=') depth--;
		else if (depth === 0 && ch === sep) {
			parts.push(cur);
			cur = '';
			continue;
		}
		cur += ch;
	}
	parts.push(cur);
	return parts.map((s) => s.trim()).filter((s) => s.length > 0);
}

/**
 * Given the index of an opening bracket, return the index of its match.
 * @param {string} str
 * @param {number} open
 * @returns {number} index of matching close, or -1
 */
function matchBracket(str, open) {
	const closer = OPENERS[str[open]];
	let depth = 0;
	/** @type {string | null} */
	let str_ = null;
	for (let i = open; i < str.length; i++) {
		const ch = str[i];
		if (str_) {
			if (ch === str_ && str[i - 1] !== '\\') str_ = null;
			continue;
		}
		if (ch === '"' || ch === "'" || ch === '`') str_ = ch;
		else if (ch === str[open]) depth++;
		else if (ch === closer) {
			depth--;
			if (depth === 0) return i;
		}
	}
	return -1;
}

/**
 * Locate the `let { … }: <Type> = $props()` statement and return its raw
 * destructuring text and type-annotation text.
 * @param {string} source
 * @returns {{ destructure: string, typeText: string } | null}
 */
function extractPropsBlock(source) {
	const propsIdx = source.indexOf('$props(');
	if (propsIdx === -1) return null;
	const letIdx = source.lastIndexOf('let', propsIdx);
	if (letIdx === -1) return null;
	const braceOpen = source.indexOf('{', letIdx);
	if (braceOpen === -1 || braceOpen > propsIdx) return null;
	const braceClose = matchBracket(source, braceOpen);
	if (braceClose === -1) return null;
	const destructure = source.slice(braceOpen + 1, braceClose);

	// Between the `}` and `$props(` lies `: <Type> =`. Trim the colon and `=`.
	let between = source.slice(braceClose + 1, propsIdx).trim();
	if (!between.startsWith(':')) return { destructure, typeText: '' };
	between = between.slice(1).trim();
	if (between.endsWith('=')) between = between.slice(0, -1).trim();
	return { destructure, typeText: between };
}

/**
 * Parse the destructuring into ordered prop entries (name, default, bindable).
 * @param {string} destructure
 * @returns {{ name: string, default: string | null, bindable: boolean, rest: boolean }[]}
 */
function parseDestructure(destructure) {
	return splitTopLevel(destructure, ',').map((tokenRaw) => {
		const token = tokenRaw.trim();
		if (token.startsWith('...')) {
			return { name: token.slice(3), default: null, bindable: false, rest: true };
		}
		const eq = splitTopLevel(token, '=');
		const binding = eq[0];
		let def = eq.length > 1 ? eq.slice(1).join('=').trim() : null;
		let bindable = false;
		if (def && def.startsWith('$bindable')) {
			bindable = true;
			const open = def.indexOf('(');
			const close = open === -1 ? -1 : matchBracket(def, open);
			const inner = open !== -1 && close !== -1 ? def.slice(open + 1, close).trim() : '';
			def = inner.length ? inner : null;
		}
		// `class: className` → public name is the key (`class`).
		const name = binding.split(':')[0].trim();
		return { name, default: def, bindable, rest: false };
	});
}

/**
 * Extract the right-hand side of a `type <name> = …;` alias, reading to the
 * statement-terminating `;` at top level (so internal `;` inside an object
 * literal don't truncate it).
 * @param {string} source
 * @param {string} name
 * @returns {string | null}
 */
function extractTypeAlias(source, name) {
	const m = new RegExp(`type\\s+${name}\\s*=`).exec(source);
	if (!m) return null;
	const start = m.index + m[0].length;
	let depth = 0;
	/** @type {string | null} */
	let str_ = null;
	let i = start;
	for (; i < source.length; i++) {
		const ch = source[i];
		if (str_) {
			if (ch === str_ && source[i - 1] !== '\\') str_ = null;
			continue;
		}
		if (ch === '"' || ch === "'" || ch === '`') str_ = ch;
		else if (OPENERS[ch] || ch === '<') depth++;
		else if (CLOSERS[ch] || (ch === '>' && source[i - 1] !== '=')) depth--;
		else if (ch === ';' && depth === 0) break;
	}
	return source.slice(start, i).trim();
}

/**
 * Map a tv() variant component: variant-group key → option keys.
 * e.g. `const buttonVariants = tv({ variants: { variant: { primary: …, … } } })`.
 * @param {string} source
 * @returns {Map<string, Map<string, string[]>>} tvName → (groupKey → options)
 */
function parseTvVariants(source) {
	/** @type {Map<string, Map<string, string[]>>} */
	const out = new Map();
	const re = /(?:const|let|var)\s+(\w+)\s*=\s*tv\s*\(/g;
	let m;
	while ((m = re.exec(source))) {
		const open = source.indexOf('(', m.index);
		const close = matchBracket(source, open);
		if (close === -1) continue;
		const body = source.slice(open + 1, close);
		const vIdx = body.indexOf('variants');
		if (vIdx === -1) continue;
		const vOpen = body.indexOf('{', vIdx);
		const vClose = matchBracket(body, vOpen);
		if (vOpen === -1 || vClose === -1) continue;
		const variantsBody = body.slice(vOpen + 1, vClose);
		/** @type {Map<string, string[]>} */
		const groups = new Map();
		for (const groupTok of splitTopLevel(variantsBody, ',')) {
			const colon = groupTok.indexOf(':');
			if (colon === -1) continue;
			const key = groupTok.slice(0, colon).trim().replace(/['"]/g, '');
			const objStart = groupTok.indexOf('{', colon);
			if (objStart === -1) continue;
			const objClose = matchBracket(groupTok, objStart);
			const obj = groupTok.slice(objStart + 1, objClose === -1 ? undefined : objClose);
			const options = splitTopLevel(obj, ',')
				.map((opt) => opt.slice(0, opt.indexOf(':')).trim().replace(/['"]/g, ''))
				.filter(Boolean);
			if (options.length) groups.set(key, options);
		}
		if (groups.size) out.set(m[1], groups);
	}
	return out;
}

/**
 * Resolve a type string into something human-friendly: VariantProps unions
 * from tv(), `type X = …` aliases that point at variant props, etc.
 * @param {string} type
 * @param {Map<string, Map<string, string[]>>} tv
 * @param {string} source
 * @returns {string}
 */
function resolveType(type, tv, source) {
	const t = type.trim();

	// Direct: VariantProps<typeof someVariants>['groupKey']
	const direct = t.match(/VariantProps<\s*typeof\s+(\w+)\s*>\[['"](\w+)['"]\]/);
	if (direct) {
		const opts = tv.get(direct[1])?.get(direct[2]);
		if (opts) return opts.map((o) => `'${o}'`).join(' | ');
	}

	// Alias: `type Foo = VariantProps<typeof someVariants>['groupKey']`
	if (/^\w+$/.test(t)) {
		const aliasRe = new RegExp(
			`type\\s+${t}\\s*=\\s*VariantProps<\\s*typeof\\s+(\\w+)\\s*>\\[['"](\\w+)['"]\\]`
		);
		const am = source.match(aliasRe);
		if (am) {
			const opts = tv.get(am[1])?.get(am[2]);
			if (opts) return opts.map((o) => `'${o}'`).join(' | ');
		}
	}
	return t;
}

/**
 * Resolve a bits-ui import alias back to its readable name, e.g.
 * `import { Dialog as DialogPrimitive } from 'bits-ui'` ⇒ DialogPrimitive→Dialog.
 * @param {string} source
 * @returns {Map<string, string>}
 */
function parseBitsAliases(source) {
	/** @type {Map<string, string>} */
	const map = new Map();
	const re = /import\s*\{([^}]*)\}\s*from\s*['"]bits-ui['"]/g;
	let m;
	while ((m = re.exec(source))) {
		for (const spec of m[1].split(',')) {
			const asMatch = spec.trim().match(/^(\w+)\s+as\s+(\w+)$/);
			if (asMatch) map.set(asMatch[2], asMatch[1]);
		}
	}
	return map;
}

/** @param {string} type @param {Map<string,string>} aliases */
function applyAliases(type, aliases) {
	let out = type;
	for (const [alias, real] of aliases) {
		out = out.replace(new RegExp(`\\b${alias}\\b`), real);
	}
	return out;
}

/**
 * Parse a component's source into its public API.
 * @param {string} source
 * @returns {ParsedProps}
 */
export function parseProps(source) {
	const block = extractPropsBlock(source);
	if (!block) return { props: [], extendsTypes: [] };

	const tv = parseTvVariants(source);
	const bitsAliases = parseBitsAliases(source);
	const destructured = parseDestructure(block.destructure);

	// Expand the annotation: a bare `Props` resolves to its `type Props = …`.
	let typeExpr = block.typeText;
	if (/^Props$/.test(typeExpr)) {
		const def = extractTypeAlias(source, 'Props');
		if (def) typeExpr = def;
	}

	/** @type {Map<string, { type: string, optional: boolean }>} */
	const members = new Map();
	/** @type {string[]} */
	const extendsTypes = [];

	for (const operand of splitTopLevel(typeExpr, '&', { angle: true })) {
		if (operand.startsWith('{')) {
			const close = matchBracket(operand, 0);
			const body = operand.slice(1, close === -1 ? undefined : close);
			for (const member of splitTopLevel(body, ';', { angle: true })) {
				const colon = member.indexOf(':');
				if (colon === -1) continue;
				let key = member.slice(0, colon).trim();
				const optional = key.endsWith('?');
				key = key.replace(/\?$/, '').trim();
				const type = member.slice(colon + 1).trim();
				if (/^[\w$]+$/.test(key)) members.set(key, { type, optional });
			}
		} else {
			extendsTypes.push(applyAliases(operand, bitsAliases));
		}
	}

	/** @type {PropRow[]} */
	const props = [];
	const seen = new Set();
	for (const d of destructured) {
		if (d.rest) continue;
		seen.add(d.name);
		const member = members.get(d.name);
		const rawType = member?.type ?? '';
		props.push({
			name: d.name,
			type: rawType ? applyAliases(resolveType(rawType, tv, source), bitsAliases) : '',
			default: d.default,
			bindable: d.bindable,
			optional: member ? member.optional : d.default !== null
		});
	}
	// Members declared in the type but not destructured (rare) still count.
	for (const [name, member] of members) {
		if (seen.has(name)) continue;
		props.push({
			name,
			type: applyAliases(resolveType(member.type, tv, source), bitsAliases),
			default: null,
			bindable: false,
			optional: member.optional
		});
	}

	return { props, extendsTypes };
}
