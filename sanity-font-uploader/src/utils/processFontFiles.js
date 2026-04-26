// Reads font files via FileReader, parses with fontkit, and builds the fontsObjects map — exports individual weight/style extraction helpers

import * as fontkit from 'fontkit';
import { nanoid } from 'nanoid';
import { expandAbbreviations, removeWeightNames, reverseSpellingLookup } from './generateKeywords';
import { sanitizeForSanityId } from './sanitizeForSanityId';

/**
 * Reads a font file and returns its content as a Uint8Array.
 * @param {File} file
 * @returns {Promise<Uint8Array>}
 */
export const readFontFile = (file) => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (event) => { resolve(new Uint8Array(event.target.result)); };
		reader.onerror = (error) => { reject(error); };
		reader.readAsArrayBuffer(file);
	});
};

/**
 * Processes an array of font files and extracts metadata for each.
 * @param {File[]} files
 * @param {string} title - Typeface title
 * @param {string[]} weightKeywordList
 * @param {string[]} italicKeywordList
 * @param {Function} setStatus
 * @param {boolean} preserveShortenedNames - Skip abbreviation expansion when true
 * @param {boolean} preserveFileNames - Preserve original filename capitalization when true
 * @returns {Promise<Object>}
 */
export const processFontFiles = async (
	files,
	title,
	weightKeywordList,
	italicKeywordList,
	setStatus,
	preserveShortenedNames = false,
	preserveFileNames = false,
) => {
	let failedFiles = [];
	let subfamilies = {};
	let fontsObjects = {};
	let newPreferredStyle = { weight: -100, style: 'Italic', _ref: '' };

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const fontBuffer = await readFontFile(file);
		const font = fontkit.create(fontBuffer);

		console.log('File name: ', file.name);

		if (file.name.endsWith('.woff2') || file.name.endsWith('.woff')) {
			await handleWebfontMetadata(file, font, files);
		}

		const { weightName, subfamilyName, fontTitle, style, italicKW, variableFont } = extractFontMetadata(
			font,
			title,
			weightKeywordList,
			italicKeywordList,
			preserveShortenedNames,
		);

		const id = sanitizeForSanityId(fontTitle);

		let originalFilename = null;
		if (preserveFileNames) {
			originalFilename = file.name.replace(/\.(ttf|otf|woff2?|eot|svg)$/i, '');
		}

		logFontInfo(id, fontTitle, font, file.name, subfamilyName, style, weightName, variableFont, italicKW);

		subfamilies[id] = subfamilyName;

		if (fontsObjects[id]) {
			fontsObjects[id].files = [...fontsObjects[id].files, file];
			if (preserveFileNames && originalFilename) {
				fontsObjects[id].originalFilename = originalFilename;
			}
		} else {
			fontsObjects[id] = createFontObject(
				id,
				fontTitle,
				title,
				font,
				variableFont,
				weightName,
				subfamilyName,
				file,
				preserveFileNames ? originalFilename : null,
			);
		}
	}

	fontsObjects = sortFontObjects(fontsObjects);
	const uniqueSubfamilies = [...new Set(Object.values(subfamilies))];

	console.log('Subfamilies:', subfamilies);
	console.log('Unique subfamilies:', uniqueSubfamilies, uniqueSubfamilies.length);
	console.log('Font objects:', fontsObjects);

	return { fontsObjects, subfamilies, uniqueSubfamilies, newPreferredStyle, failedFiles };
};

/**
 * Patches webfont name records from a matching TTF when woff/woff2 metadata is missing.
 * @param {File} file
 * @param {Object} font
 * @param {File[]} files
 */
const handleWebfontMetadata = async (file, font, files) => {
	if (
		!font?.name?.records?.fullName ||
		font?.name?.records?.fullName === '' ||
		!/^[A-Z0-9]+$/.test(font?.name?.records?.fullName)
	) {
		const ttfFile = files.find(f => f.name === file.name.replace('.woff2', '.ttf').replace('.woff', '.ttf'));
		if (ttfFile) {
			const ttfFileBuffer = await readFontFile(ttfFile);
			const ttfFileData = fontkit.create(ttfFileBuffer);
			if (ttfFileData) font.name.records = ttfFileData?.name?.records;
		}
	}
};

/**
 * Extracts and normalises metadata from a fontkit font object.
 * @param {Object} font
 * @param {string} title
 * @param {string[]} weightKeywordList
 * @param {string[]} italicKeywordList
 * @param {boolean} preserveShortenedNames
 * @returns {Object}
 */
export const extractFontMetadata = (font, title, weightKeywordList, italicKeywordList, preserveShortenedNames = false) => {
	let weightName = extractWeightName(font, italicKeywordList);
	if (!preserveShortenedNames) {
		weightName = expandAbbreviations(weightName);
	}

	if ((weightName === '' || weightName.toLowerCase() === 'roman') && font?.name?.records?.fullName) {
		weightName = extractWeightFromFullName(font, title);
		if (!preserveShortenedNames) {
			weightName = expandAbbreviations(weightName);
		}
	}

	const variableFont = font?.variationAxes && Object.keys(font.variationAxes).length > 0;

	let subfamilyName = font?.name?.records?.fullName?.en?.replace(title.trim(), '').trim() ||
		font.subfamilyName.trim().replace(title.trim(), '').trim();

	if (!preserveShortenedNames) {
		subfamilyName = expandAbbreviations(subfamilyName);
	}

	let fontTitle = font?.fullName.trim();
	let style = (font?.italicAngle !== 0 || font?.fullName.toLowerCase().includes('italic')) ? 'Italic' : 'Regular';

	const italicKW = processItalicKeywords(font, fontTitle, italicKeywordList);

	subfamilyName = processSubfamilyName(subfamilyName, weightKeywordList, italicKW, preserveShortenedNames);
	fontTitle = formatFontTitle(fontTitle, preserveShortenedNames);

	subfamilyName = subfamilyName === '' ? 'Regular' : subfamilyName.replace(/\s+/g, ' ').trim();

	if (subfamilyName !== '') {
		weightName = weightName
			.replace(`${subfamilyName} `, '')
			.replace(` ${subfamilyName}`, '')
			.trim();
	}

	if (variableFont) {
		if (!fontTitle.toLowerCase().includes('vf')) {
			fontTitle = fontTitle + ' VF';
		}
		subfamilyName = '';
	}

	if (!(variableFont && fontTitle.toLowerCase().includes('italic'))) {
		fontTitle = addItalicToFontTitle(font, fontTitle, italicKW, style, preserveShortenedNames);
	}

	return { weightName, subfamilyName, fontTitle, style, italicKW, variableFont };
};

/**
 * Extracts the weight name from a font's preferred subfamily or subfamily record.
 * Returns "Variable" for variable fonts.
 * @param {Object} font
 * @param {string[]} italicKW
 * @returns {string}
 */
export const extractWeightName = (font, italicKW) => {
	let weightName = font?.name?.records?.preferredSubfamily || font?.name?.records?.fontSubfamily;

	if (typeof weightName === 'object') {
		weightName = weightName?.en ||
			(weightName.constructor === Object ? weightName[Object.keys(weightName)[0]] : null);
	}

	if (font?.variationAxes && Object.keys(font.variationAxes).length > 0) {
		return 'Variable';
	}

	if (italicKW) {
		italicKW.forEach(keyword => {
			const kwRegex = new RegExp(`\\b${keyword.trim()}\\b`, 'i');
			if (kwRegex.test(weightName)) {
				weightName = weightName.replace(kwRegex, '').trim();
			}
		});
	}

	return weightName?.toString()
		.replace('Italic', '')
		.replace('It', '')
		.replace('Slanted', '')
		.replace('Slant', '')
		.replace('Backslant', '')
		.trim();
};

/**
 * Extracts a weight name from the font's full name record when subfamily is empty or "Roman".
 * @param {Object} font
 * @param {string} title
 * @returns {string}
 */
export const extractWeightFromFullName = (font, title) => {
	let weightName = font?.name?.records?.fullName;
	weightName = weightName?.en
		? weightName.en
		: (weightName?.constructor === Object ? weightName[Object.keys(weightName)[0]] : weightName);
	weightName = weightName?.replace(title + ' ', '').replace(title, '').trim();
	weightName = weightName?.replace('Italic', '').replace('It', '').replace('Slanted', '').replace('Slant', '').trim();
	return weightName;
};

/**
 * Strips weight and italic keywords from a subfamily name string.
 * @param {string} subfamilyName
 * @param {string[]} weightKeywordList
 * @param {string[]} italicKeywordList
 * @param {boolean} preserveShortenedNames
 * @returns {string}
 */
export const processSubfamilyName = (subfamilyName, weightKeywordList, italicKeywordList, preserveShortenedNames = false) => {
	weightKeywordList.forEach(keyword => {
		const kwRegex = new RegExp(`\\b${keyword.trim()}\\b`, 'i');
		if (kwRegex.test(subfamilyName)) {
			subfamilyName = subfamilyName.replace(kwRegex, '').trim();
		}
		subfamilyName = removeWeightNames(subfamilyName) || subfamilyName;
		if (!preserveShortenedNames) {
			subfamilyName = expandAbbreviations(subfamilyName);
		}
	});

	italicKeywordList.forEach(keyword => {
		const kwRegex = new RegExp(`\\b${keyword.trim()}\\b`, 'i');
		if (kwRegex.test(subfamilyName)) {
			subfamilyName = subfamilyName.replace(kwRegex, '').trim();
		}
	});

	return subfamilyName;
};

/**
 * Collects italic keywords present in a font's full name.
 * @param {Object} font
 * @param {string} fontTitle
 * @param {string[]} italicKeywordList
 * @returns {string[]}
 */
export const processItalicKeywords = (font, fontTitle, italicKeywordList) => {
	let italicKW = [];

	italicKeywordList.forEach(keyword => {
		const kw = keyword.trim();
		const kwRegex = new RegExp(`\\b${kw}\\b`, 'i');
		if (kwRegex.test(fontTitle)) {
			fontTitle = fontTitle.replace(kwRegex, '').trim();
			italicKW.push(kw);
		}
		if (font?.fullName && typeof font.fullName === 'string' && font.fullName.toLowerCase().includes(kw.toLowerCase())) {
			if (!italicKW.includes(kw)) italicKW.push(kw);
		}
	});

	return italicKW;
};

/**
 * Normalises and title-cases a font title, optionally expanding abbreviations.
 * @param {string} fontTitle
 * @param {boolean} preserveShortenedNames
 * @returns {string}
 */
export const formatFontTitle = (fontTitle, preserveShortenedNames = false) => {
	const hasItalic = fontTitle.toLowerCase().includes('italic');
	fontTitle = fontTitle.replace(/-/g, ' ');

	return fontTitle.replace(/\s+/g, ' ').trim().split(' ').map(word => {
		if (hasItalic && word.toLowerCase() === 'italic') return 'Italic';
		let fullWord = word;
		if (!preserveShortenedNames) {
			fullWord = reverseSpellingLookup(word) || word;
		}
		return fullWord[0].toUpperCase() + fullWord.slice(1);
	}).join(' ');
};

/**
 * Appends any italic keywords to the font title that aren't already present.
 * @param {Object} font
 * @param {string} fontTitle
 * @param {string[]} italicKW
 * @param {string} style
 * @param {boolean} preserveShortenedNames
 * @returns {string}
 */
export const addItalicToFontTitle = (font, fontTitle, italicKW, style, preserveShortenedNames = false) => {
	const hasItalicAngle = font?.italicAngle !== 0;
	const hasItalicInName = font?.fullName.toLowerCase().includes('italic');

	if (italicKW.length > 0 || hasItalicAngle || hasItalicInName) {
		italicKW = [...new Set(italicKW)];

		if (italicKW.length === 0 && (hasItalicAngle || hasItalicInName)) {
			italicKW = ['Italic'];
		}

		if (!preserveShortenedNames) {
			italicKW = italicKW.map(item => reverseSpellingLookup(item) || item);
		}

		italicKW = [...new Set(italicKW)];

		if (italicKW.length > 1 && italicKW.includes('Italic')) {
			italicKW = ['Italic'];
		}

		const fontTitleLower = fontTitle.toLowerCase();
		italicKW = italicKW.filter(keyword => {
			const keywordLower = keyword.toLowerCase();
			const kwRegex = new RegExp(`\\b${keywordLower}\\b`);
			const isSubstring = fontTitleLower.split(' ').some(word =>
				word.includes(keywordLower) || keywordLower.includes(word)
			);
			return !kwRegex.test(fontTitleLower) && !isSubstring;
		});

		if (italicKW.length > 0) {
			fontTitle = fontTitle.trim() + ' ' + italicKW.join(' ');
		}
	}

	return fontTitle;
};

/**
 * Builds a font object ready for staging and upload.
 * originalFilename is stored temporarily and deleted before saving to Sanity.
 * @param {string} id
 * @param {string} fontTitle
 * @param {string} title
 * @param {Object} font
 * @param {boolean} variableFont
 * @param {string} weightName
 * @param {string} subfamilyName
 * @param {File} file
 * @param {string|null} originalFilename
 * @returns {Object}
 */
export const createFontObject = (id, fontTitle, title, font, variableFont, weightName, subfamilyName, file, originalFilename = null) => {
	const fontObject = {
		_key: nanoid(),
		_id: id,
		title: fontTitle,
		slug: { _type: 'slug', current: id },
		typefaceName: title,
		style: (font?.italicAngle !== 0 || font?.fullName.toLowerCase().includes('italic')) ? 'Italic' : 'Regular',
		variableFont: variableFont,
		weightName: weightName,
		subfamily: subfamilyName,
		normalWeight: true,
		weight: Number(determineWeight(font, weightName)),
		fileInput: {},
		files: [file],
		fontKit: font,
	};

	if (originalFilename) {
		fontObject.originalFilename = originalFilename;
	}

	return fontObject;
};

/**
 * Determines a numeric CSS weight value for a font.
 * @param {Object} font
 * @param {string} weightName
 * @returns {number}
 */
export const determineWeight = (font, weightName) => {
	if (font['OS/2']?.usWeightClass) {
		return Number(font['OS/2'].usWeightClass);
	}

	const wn = weightName?.toLowerCase() || '';

	if (/hairline|extra thin|extrathin/.test(wn)) return 100;
	if (/thin|extra light|extralight/.test(wn)) return 200;
	if (/light|book/.test(wn)) return 300;
	if (/regular|normal/.test(wn)) return 400;
	if (/medium/.test(wn)) return 500;
	if (/semi bold|semibold/.test(wn)) return 600;
	if (/extra bold|extrabold/.test(wn)) return 800;
	if (/bold/.test(wn)) return 700;
	if (/black|ultra/.test(wn)) return 900;

	return 400;
};

/**
 * Sorts a map of font objects by ascending weight, with Regular before Italic at equal weights.
 * @param {Object} fontsObjects
 * @returns {Object}
 */
export const sortFontObjects = (fontsObjects) => {
	return Object.fromEntries(
		Object.entries(fontsObjects).sort((a, b) => {
			const weightA = Number(a[1].weight);
			const weightB = Number(b[1].weight);
			if (weightA === weightB) {
				if (a[1].style === 'Regular' && b[1].style === 'Italic') return -1;
				if (a[1].style === 'Italic' && b[1].style === 'Regular') return 1;
				return 0;
			}
			return weightA - weightB;
		})
	);
};

/**
 * Logs font metadata to the console for debugging.
 * @param {string} id
 * @param {string} fontTitle
 * @param {Object} font
 * @param {string} fileName
 * @param {string} subfamilyName
 * @param {string} style
 * @param {string} weightName
 * @param {boolean} variableFont
 * @param {string[]} italicKW
 */
export const logFontInfo = (id, fontTitle, font, fileName, subfamilyName, style, weightName, variableFont, italicKW) => {
	console.log('=== Font Info ====');
	console.log('Font id: ', id);
	console.log('Font title: ', fontTitle);
	console.log('Fontkit fullName: ', font.fullName);
	console.log('Fontkit family name: ', font.familyName);
	console.log('File name: ', fileName);
	console.log('Subfamily: ', subfamilyName);
	console.log('Style: ', style);
	console.log('Weight: ', weightName);
	console.log('Variable: ', variableFont);
	console.log('italicKW: ', italicKW);
	console.log('Font italic angle: ', (font?.italicAngle !== 0 || font?.fullName.toLowerCase().includes('italic')) ? 'Italic' : 'Regular');
	console.log('=======');
};
