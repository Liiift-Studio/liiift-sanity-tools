// Extracts font metadata, metrics, and OpenType features from a TTF file and optionally patches the Sanity document

import { Buffer } from 'buffer';
import * as fontkit from 'fontkit';

/**
 * Extracts metadata and metrics from a fontkit font object into plain objects.
 * @param {Object} font - fontkit font instance
 * @returns {{ metaData: Object, metrics: Object }}
 */
export function buildFontMetadata(font) {
	const metaData = {
		postscriptName: font.postscriptName,
		fullName: font.fullName,
		familyName: font.familyName,
		subfamilyName: font.subfamilyName,
		copyright: font.copyright,
		version: font.version ? String(font.version).replaceAll('Version ', '') : '',
		genDate: new Date().toISOString(),
	};
	const metrics = {
		unitsPerEm: font.unitsPerEm,
		ascender: font.ascent,
		descender: font.descent,
		lineGap: font.lineGap,
		underlinePosition: font.underlinePosition,
		underlineThickness: font.underlineThickness,
		italicAngle: font.italicAngle,
		capHeight: font.capHeight,
		xHeight: font.xHeight,
		boundingBox: font.bbox,
	};
	return { metaData, metrics };
}

export default async function generateFontData({ fileInput, url, fontKit, fontId, client, commit = true }) {
	if (fontId.startsWith('drafts.')) {
		fontId = fontId.replace('drafts.', '');
	}
	console.log('generate-font-data ', fontId, commit);

	let srcUrl;
	if (!url || url == null) {
		srcUrl = await client.fetch(`*[_id == $id]{url}`, { id: fileInput.ttf.asset._ref });
		console.log('src url ', srcUrl);
		srcUrl = srcUrl[0].url;
	} else {
		srcUrl = url;
	}

	let font = fontKit;
	if (!fontKit || fontKit == null) {
		let buffer = await fetch(srcUrl);
		buffer = await buffer.arrayBuffer();
		buffer = Buffer.from(buffer);
		font = fontkit.create(buffer);
	}


	let variableAxes;
	try {
		variableAxes = font.variationAxes;
	} catch (err) {
		console.error('err: ', err);
	}

	let variableInstances;
	try {
		variableInstances = font.namedVariations;
	} catch (e) {
		console.log('variable instances 2 error : ', e.message);
		let fvar = font?.fvar?.instance;

		fvar?.forEach(fv => {
			if (fv?.nameID === 2) fv.name = font?._tables?.name?.records?.fontSubfamily
			if (fv?.nameID === 17) fv.name = font?._tables?.name?.records?.preferredSubfamily
		})

		variableInstances = {};
		fvar.forEach(v => {
			let key = v.name;
			if (typeof key === 'object') {
				key = Object.values(key)[0];
			}

			let coordKeys = Object.keys(variableAxes);
			let coord = {};

			coordKeys.forEach((ck, ckIndex) => {
				coord[ck] = v.coord[ckIndex];
			});
			variableInstances[key] = coord;
		});

	}
	console.log('font : ', font);
	console.log('variable instances : ', variableInstances);
	console.log('variable axes : ', variableAxes);

	let opentypeFeatures = font.availableFeatures;
	let glyphCount = font.numGlyphs;
	let characterSet = font.characterSet;

	let metaData = {
		postscriptName: font.postscriptName,
		fullName: font.fullName,
		familyName: font.familyName,
		subfamilyName: font.subfamilyName,
		copyright: font.copyright,
		version: font.version.replaceAll("Version ", ""),
		genDate: new Date().toISOString(),
	};

	let metrics = {
		unitsPerEm: font.unitsPerEm,
		ascender: font.ascent,
		descender: font.descent,
		lineGap: font.lineGap,
		underlinePosition: font.underlinePosition,
		underlineThickness: font.underlineThickness,
		italicAngle: font.italicAngle,
		capHeight: font.capHeight,
		xHeight: font.xHeight,
		boundingBox: font.bbox
	};

	let variableFont = false;
	if (variableAxes && variableAxes != null && Object.keys(variableAxes).length > 0 && variableInstances && variableInstances != null && Object.keys(variableInstances).length > 0) {
		variableFont = true;
	}
	let patch = {
		metrics: metrics,
		metaData: metaData,
		variableFont: variableFont,
		variableAxes: JSON.stringify(variableAxes),
		variableInstances: JSON.stringify(variableInstances),
		glyphCount: glyphCount,
		opentypeFeatures: { chars: opentypeFeatures },
		characterSet: { chars: characterSet }
	}

	console.log('data : ', patch);
	if (commit) patch = await client.patch(fontId).set(patch).commit({ autoGenerateArrayKeys: true });
	return patch;
}
