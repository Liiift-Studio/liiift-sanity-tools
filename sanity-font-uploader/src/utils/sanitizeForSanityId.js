// Utility to sanitize strings into valid Sanity document IDs
import slugify from 'slugify';

/**
 * Sanitizes a string into a valid Sanity document ID.
 *
 * Sanity ID requirements:
 * - Must start with a letter or underscore (not a number or hyphen)
 * - Can only contain lowercase letters (a-z), numbers (0-9), hyphens (-), and underscores (_)
 * - Must be between 1 and 128 characters
 *
 * @param {string} str - The raw string (e.g. font title or filename) to sanitize
 * @returns {string} A valid Sanity document ID
 */
export function sanitizeForSanityId(str) {
	if (!str || typeof str !== 'string') {
		return 'font-' + Date.now();
	}

	let sanitized = str.toLowerCase().trim();

	// Replace common symbols before slugify
	sanitized = sanitized.replace(/\+/g, 'plus');
	sanitized = sanitized.replace(/&/g, 'and');
	sanitized = sanitized.replace(/@/g, 'at');

	sanitized = slugify(sanitized, {
		replacement: '-',
		remove: /[^\w\s-]/g,
		lower: true,
		strict: true,
		locale: 'en',
		trim: true,
	});

	// Strip any characters that still aren't lowercase-alphanumeric, hyphens, or underscores
	sanitized = sanitized.replace(/[^a-z0-9\-_]/g, '-');

	// Collapse repeated hyphens and strip leading/trailing hyphens or underscores
	sanitized = sanitized.replace(/-+/g, '-');
	sanitized = sanitized.replace(/^[-_]+|[-_]+$/g, '');

	// IDs must not start with a number or hyphen
	if (sanitized && !/^[a-z_]/.test(sanitized)) {
		sanitized = 'font_' + sanitized;
	}

	if (!sanitized) {
		sanitized = 'font_' + Date.now();
	}

	// Sanity hard-caps IDs at 128 characters
	if (sanitized.length > 128) {
		const hash = Math.random().toString(36).substring(2, 8);
		sanitized = sanitized.substring(0, 120) + '_' + hash;
	}

	// Paranoid final validation
	if (!/^[a-z_][a-z0-9\-_]*$/.test(sanitized)) {
		console.warn(`ID sanitization produced invalid result: "${sanitized}", using fallback`);
		sanitized = 'font_' + Date.now();
	}

	return sanitized;
}
