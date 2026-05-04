// Resolves named variable font instances into Sanity font document references, creating documents for missing instances

import { nanoid } from 'nanoid';
import { expandAbbreviations } from './generateKeywords';

/**
 * Parses a variable font's named instances and maps each to its corresponding static font document.
 * Uses 6 matching strategies in priority order:
 *   1. Exact title match
 *   2. Title normalisation (strips VF/var/variable prefixes, handles Regular/Italic suffixes)
 *   3. Abbreviation expansion
 *   4. Weight + style matching
 *   5. weightName comparison
 *   6. metaData.fullName fallback
 *
 * @param {Object} font - The variable font object (must have typefaceName and variableInstances)
 * @param {Object} client - Sanity client (parameterized queries only)
 * @returns {Promise<Array>} Array of { key, value, _key } instance mappings
 */
export const parseVariableFontInstances = async (font, client) => {
	if (!font.variableFont || !font.variableInstances) return [];

	let variableInstances;
	try {
		variableInstances = JSON.parse(font.variableInstances);
	} catch (err) {
		console.error('Error parsing variable instances:', err);
		variableInstances = {};
	}

	if (Object.keys(variableInstances).length === 0) return [];

	// Fetch the typeface's curated font list (parameterized — no injection risk)
	let staticFonts;
	const typeface = await client.fetch(
		`*[_type == 'typeface' && title == $typefaceName][0]{
			'fonts': styles.fonts[]-> {
				_id,
				title,
				subfamily,
				style,
				weight,
				weightName,
				metaData,
				variableFont
			}
		}`,
		{ typefaceName: font.typefaceName }
	);

	if (typeface?.fonts && typeface.fonts.length > 0) {
		staticFonts = typeface.fonts.filter(f => !f.variableFont);
		console.log('Using curated typeface fonts list:', staticFonts.length, 'fonts');
	} else {
		console.warn('Typeface not found or no fonts in curated list, falling back to all fonts query');
		staticFonts = await client.fetch(
			`*[_type == 'font' && typefaceName == $typefaceName && variableFont != true]{
				_id,
				title,
				subfamily,
				style,
				weight,
				weightName,
				metaData
			}`,
			{ typefaceName: font.typefaceName }
		);
	}

	console.log('Variable font instances:', Object.keys(variableInstances));
	console.log('Available static fonts:', staticFonts.map(sf => sf.title));

	const instanceMappings = [];

	Object.keys(variableInstances).forEach(instanceName => {
		let matchingFont = null;

		// Strategy 1: Exact title match
		matchingFont = staticFonts.find(sf => sf.title === instanceName);

		// Strategy 2: Title normalisation — strip VF/var/variable prefix words, handle Regular/Italic
		if (!matchingFont && staticFonts.some(sf => sf.metaData?.fullName)) {
			matchingFont = staticFonts.find(sf => {
				if (!sf.metaData?.fullName) return false;

				let fullName = sf.metaData.fullName;

				const WORDS_TO_REMOVE = ['VF', 'var', 'variable', 'VAR', 'vf'];
				const variableName = font.metaData?.familyName
					?.replace(new RegExp(`\\b(${WORDS_TO_REMOVE.join('|')})\\b`, 'gi'), '')
					.replace(/\s{2,}/g, ' ')
					.trim();

				if (variableName && fullName.startsWith(variableName)) {
					fullName = fullName.substring(variableName.length).trim();
				}

				if (variableName) {
					const words = variableName.split(/\s+/).map(w => w.trim()).filter(Boolean);
					if (words.length > 0) {
						const regex = new RegExp(`\\b(${words.join('|')})\\b`, 'gi');
						const stripped = fullName.replace(regex, '').replace(/\s{2,}/g, ' ').trim();
						if (stripped !== '') fullName = stripped;
					}
				}

				if (fullName.startsWith(font.typefaceName)) {
					fullName = fullName.substring(font.typefaceName.length).trim();
				}

				if (sf.style?.toLowerCase() === 'italic' &&
					!fullName.toLowerCase().endsWith('italic') &&
					!fullName.toLowerCase().endsWith('slanted')) {
					fullName = fullName + ' Italic';
				}

				if (fullName.trim().toLowerCase().endsWith('regular')) {
					if (instanceName.trim().toLowerCase() + ' regular' === fullName.trim().toLowerCase()) return true;
				}
				if (fullName.trim().toLowerCase().startsWith('regular')) {
					if ('regular ' + instanceName.trim().toLowerCase() === fullName.trim().toLowerCase()) return true;
				}
				if (fullName.trim().toLowerCase().endsWith('italic')) {
					if (instanceName.trim().toLowerCase().endsWith('italic')) {
						const k = instanceName.trim().toLowerCase().slice(0, -6).trim() + ' regular italic';
						if (k === fullName.trim().toLowerCase()) return true;
					}
				}

				return fullName.trim().toLowerCase() === instanceName.trim().toLowerCase();
			});
		}

		// Strategy 3: Abbreviation expansion
		if (!matchingFont) {
			const expandedName = instanceName.split(' ').map(word => expandAbbreviations(word)).join(' ');
			matchingFont = staticFonts.find(sf => {
				const nameWithoutTypeface = sf.title.replace(font.typefaceName, '').trim();
				return nameWithoutTypeface === expandedName;
			});
		}

		// Strategy 4: Weight + style matching
		if (!matchingFont) {
			const isItalic = instanceName.toLowerCase().includes('italic');
			const weightTerms = [
				{ term: 'thin', weight: '100' },
				{ term: 'extralight', weight: '200' },
				{ term: 'extra light', weight: '200' },
				{ term: 'light', weight: '300' },
				{ term: 'regular', weight: '400' },
				{ term: 'normal', weight: '400' },
				{ term: 'medium', weight: '500' },
				{ term: 'semibold', weight: '600' },
				{ term: 'semi bold', weight: '600' },
				{ term: 'bold', weight: '700' },
				{ term: 'extrabold', weight: '800' },
				{ term: 'extra bold', weight: '800' },
				{ term: 'black', weight: '900' },
				{ term: 'heavy', weight: '900' },
			];

			let instanceWeight = '400';
			for (const { term, weight } of weightTerms) {
				if (instanceName.toLowerCase().includes(term)) {
					instanceWeight = weight;
					break;
				}
			}

			matchingFont = staticFonts.find(sf =>
				sf.weight === instanceWeight &&
				((isItalic && sf.style === 'Italic') || (!isItalic && sf.style === 'Regular'))
			);
		}

		// Strategy 5: weightName comparison
		if (!matchingFont) {
			matchingFont = staticFonts.find(sf => {
				if (!sf.weightName) return false;
				const cleanInstance = instanceName.toLowerCase().replace(/italic/i, '').trim();
				const cleanWeight = sf.weightName.toLowerCase().replace(/italic/i, '').trim();
				return cleanInstance === cleanWeight;
			});
		}

		// Strategy 6: Legacy metaData.fullName fallback
		if (!matchingFont && staticFonts.some(sf => sf.metaData?.fullName)) {
			matchingFont = staticFonts.find(sf => {
				if (!sf.metaData?.fullName) return false;
				const typefacePattern = new RegExp(`^${font.typefaceName}\\s+`, 'i');
				const stylePart = sf.metaData.fullName.replace(typefacePattern, '').trim();
				return instanceName.toLowerCase() === stylePart.toLowerCase();
			});
		}

		console.log(`Instance "${instanceName}" matched with:`, matchingFont ? matchingFont.title : 'No match found');

		instanceMappings.push({
			key: instanceName,
			value: matchingFont
				? { _type: 'reference', _ref: matchingFont._id, _weak: true }
				: null,
			_key: nanoid(),
		});
	});

	return instanceMappings;
};

export default parseVariableFontInstances;
