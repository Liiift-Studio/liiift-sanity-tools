// Generates a CSS asset from a WOFF2 file: an inline base64 @font-face plus a category-appropriate, cross-platform tuned fallback @font-face for CLS reduction
import base64 from 'base-64';
import { Buffer } from 'buffer';
import * as fontkit from 'fontkit';

function _arrayBufferToBase64(buffer) {
	var binary = '';
	var bytes = new Uint8Array(buffer);
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return base64.encode(binary);
}

/**
 * Reads variable axes from a fontkit font object and returns:
 *   { descriptors, skipped }
 * where `descriptors` is the CSS string for the @font-face block and
 * `skipped` lists axis tags that have no CSS descriptor (opsz, custom axes, etc.)
 * so callers can surface them in comments.
 *
 * Edge cases handled:
 *  - Degenerate axes (min === max): skipped — no actual variation range
 *  - ital with max === 0: skipped — axis exists but font has no italic
 *  - slnt ordering: sorted ascending as CSS spec requires
 *  - ital + slnt coexistence: slnt takes priority (more expressive)
 *  - min > max from corrupt font data: clamped with Math.min/Math.max
 * @param {Object} font - fontkit font instance
 * @returns {{ descriptors: string, skipped: string[] }}
 */
export function buildVFDescriptors(font) {
	const cssAxes = {}
	const skipped = []
	try {
		const va = font.variationAxes
		if (!va) return { descriptors: '', skipped: [] }

		for (const [tag, axis] of Object.entries(va)) {
			const lo = Math.min(axis.min, axis.max)
			const hi = Math.max(axis.min, axis.max)

			// Skip degenerate axes — no actual range
			if (lo === hi) { skipped.push(tag); continue }

			if (tag === 'wght') {
				cssAxes['font-weight'] = `${lo} ${hi}`
			} else if (tag === 'wdth') {
				cssAxes['font-stretch'] = `${lo}% ${hi}%`
			} else if (tag === 'slnt') {
				// slnt: ascending order required by CSS Fonts Level 4
				cssAxes['font-style'] = `oblique ${lo}deg ${hi}deg`
			} else if (tag === 'ital' && !cssAxes['font-style']) {
				// ital: only emit if font actually has italic range; slnt takes priority
				if (hi > 0) cssAxes['font-style'] = 'italic'
				else skipped.push(tag)
			} else {
				// opsz, GRAD, XTRA, XHGT and all other custom axes have no CSS @font-face descriptor
				skipped.push(tag)
			}
		}
	} catch (_) {
		// axes unreadable — no descriptors
	}
	const descriptors = Object.entries(cssAxes).map(([k, v]) => `${k}:${v}`).join(';') + (Object.keys(cssAxes).length ? ';' : '')
	return { descriptors, skipped }
}

// Cross-platform fallback font stacks by category.
// Multiple local() sources ensure the first available system font is used.
// Liberation Sans covers Linux; Roboto covers Android; Georgia is universal for serifs.
const FALLBACK_STACKS = {
	'sans-serif': "local('Arial'), local('Helvetica Neue'), local('Roboto'), local('Liberation Sans')",
	'serif':      "local('Georgia'), local('Times New Roman'), local('Times')",
	'monospace':  "local('Courier New'), local('Courier'), local('Menlo'), local('Monaco')",
	// Display and script fonts have no universally suitable system fallback; default to sans-serif
	'default':    "local('Arial'), local('Helvetica Neue'), local('Roboto'), local('Liberation Sans')",
};

// OS/2 sFamilyClass high byte → FALLBACK_STACKS key.
// Classes 1–5,7 = serif variants; 8 = sans-serif; 9 = ornamental; 10 = script; 12 = symbolic.
const FAMILY_CLASS_MAP = {
	1: 'serif', 2: 'serif', 3: 'serif', 4: 'serif', 5: 'serif', 7: 'serif',
	8: 'sans-serif',
};

/** Detects font category from the OS/2 sFamilyClass field; returns a key into FALLBACK_STACKS */
function detectFontCategory(font) {
	try {
		const familyClass = font._tables?.['OS/2']?.sFamilyClass ?? 0;
		const highByte = (familyClass >> 8) & 0xFF;
		return FAMILY_CLASS_MAP[highByte] ?? 'default';
	} catch {
		return 'default';
	}
}

/** Extracts metric override percentages and detects the category fallback stack from a font ArrayBuffer */
function calcFallbackData(arrayBuffer) {
	try {
		let font = fontkit.create(Buffer.from(arrayBuffer));
		let upm = font.unitsPerEm;
		let category = detectFontCategory(font);
		return {
			fallbackSrc: FALLBACK_STACKS[category],
			ascentOverride: `${(font.ascent / upm * 100).toFixed(2)}%`,
			descentOverride: `${(Math.abs(font.descent) / upm * 100).toFixed(2)}%`,
			lineGapOverride: `${(font.lineGap / upm * 100).toFixed(2)}%`,
		};
	} catch (err) {
		console.error('Failed to extract fallback font data:', err);
		return {
			fallbackSrc: FALLBACK_STACKS['default'],
			ascentOverride: '100%',
			descentOverride: '0%',
			lineGapOverride: '0%',
		};
	}
}

export default async function generateCssFile({
	woff2File,
	fileInput,
	language = null,
	fileName,
	fontName,
	variableFont,
	weight,
	style = 'Normal',
	client,
}) {
	try {
		// Read the file once; reuse the same buffer for base64 encoding and fontkit analysis
		let arrayBuffer = await woff2File.arrayBuffer();
		let b64 = _arrayBufferToBase64(arrayBuffer);
		let fontkitFont = fontkit.create(Buffer.from(arrayBuffer));
		let { fallbackSrc, ascentOverride, descentOverride, lineGapOverride } = calcFallbackData(arrayBuffer);

		let cssString;
		if (variableFont) {
			let { descriptors, skipped } = buildVFDescriptors(fontkitFont);
			// Axes with no CSS @font-face descriptor (opsz needs font-optical-sizing:auto on elements;
			// custom axes like GRAD require CSS @font-face syntax not yet standardised).
			let skipComment = skipped.length
				? `/* axes present but have no @font-face descriptor: ${skipped.join(', ')}` +
				  (skipped.includes('opsz') ? ' — add font-optical-sizing:auto to your element CSS' : '') +
				  ' */'
				: ''
			cssString = `${skipComment}@font-face{font-family:'${fontName}';src:url(data:application/font-woff2;charset=utf-8;base64,${b64})format('woff2-variations');${descriptors}font-display:swap;}`;
		} else {
			let fontStyle = style === 'Italic' ? 'italic' : 'normal';
			cssString = `@font-face{font-family:'${fontName}';src:url(data:application/font-woff2;charset=utf-8;base64,${b64})format('woff2');font-weight:${weight};font-style:${fontStyle};font-display:swap;}`;
		}

		// Fallback @font-face: tunes a category-appropriate system font to match the custom font's
		// line metrics (ascent/descent/lineGap), reducing layout shift while the custom font loads.
		// Customers who reference fontSrc in their own projects get this fallback automatically.
		let fallbackCssString = `@font-face{font-family:'${fontName} Fallback';src:${fallbackSrc};ascent-override:${ascentOverride};descent-override:${descentOverride};line-gap-override:${lineGapOverride};}`;

		let uploadBuffer = Buffer.from(cssString + fallbackCssString, 'utf-8');
		let doc = await client.assets.upload('file', uploadBuffer, { filename: fileName + '.css' });

		let newFileInput = language == null ?
			{
				...fileInput,
				css: {
					_type: 'file',
					asset: {
						_type: 'reference',
						_ref: doc._id
					}
				}
			}
			:
			{
				...fileInput,
				[language]: {
					...fileInput[language],
					css: {
						_type: 'file',
						asset: {
							_type: 'reference',
							_ref: doc._id
						}
					}
				}
			}

		return newFileInput;

	}
	catch (err) {
		console.error(err);
		throw err;
	}

}
