// Renames font document IDs across a typeface when a typeface slug changes

import * as fontkit from 'fontkit';
import {
	readFontFile,
	extractFontMetadata,
} from './processFontFiles';

/**
 * Re-downloads TTF/OTF files for all fonts in a typeface and re-extracts their metadata,
 * patching each font document's title, slug, weightName, and subfamily.
 *
 * @param {Object} params
 * @param {Object} params.client - Sanity client
 * @param {string} params.typefaceName
 * @param {Object} params.slug - Typeface slug object
 * @param {string[]} params.weightKeywordList
 * @param {string[]} params.italicKeywordList
 * @param {boolean} params.preserveShortenedNames
 * @param {Function} params.setStatus
 * @param {Function} params.setError
 * @returns {Promise<Object>}
 */
export const renameFontDocuments = async ({
	client,
	typefaceName,
	slug,
	weightKeywordList,
	italicKeywordList,
	preserveShortenedNames = false,
	setStatus,
	setError,
}) => {
	try {
		if (!typefaceName) {
			setStatus('Typeface needs a title');
			setError(true);
			console.error('Typeface needs title');
			return { success: false, message: 'Typeface needs title' };
		}

		setStatus('Fetching font documents...');
		const slugCurrent = slug?.current || typefaceName;

		const query = await client.fetch(
			`*[_type == "typeface" && slug.current == $slugCurrent][0]{
				"fonts": styles.fonts[]->{ _id, title, subfamily, fileInput, style, weight, _key }
			}`,
			{ slugCurrent }
		);
		const fontDocuments = query?.fonts || [];

		if (fontDocuments.length === 0) {
			setStatus('No font documents found for this typeface');
			setError(true);
			return { success: false, message: 'No font documents found for this typeface' };
		}

		setStatus(`Found ${fontDocuments.length} font documents to process...`);

		let updatedCount = 0;
		let skippedCount = 0;
		let errorCount = 0;

		for (let i = 0; i < fontDocuments.length; i++) {
			const fontDoc = fontDocuments[i];
			setStatus(`Processing font ${i + 1}/${fontDocuments.length}: ${fontDoc.title}`);

			if (!fontDoc.fileInput?.ttf?.asset?._ref && !fontDoc.fileInput?.otf?.asset?._ref) {
				console.log(`Skipping ${fontDoc.title} — no TTF or OTF file found`);
				skippedCount++;
				continue;
			}

			try {
				let file;
				let ttfAsset;
				let otfAsset;

				if (fontDoc.fileInput?.ttf?.asset?._ref) {
					ttfAsset = await client.getDocument(fontDoc.fileInput.ttf.asset._ref);
				}

				if (!ttfAsset?.url) {
					if (fontDoc.fileInput?.otf?.asset?._ref) {
						otfAsset = await client.getDocument(fontDoc.fileInput.otf.asset._ref);
					}
					if (!otfAsset?.url) {
						console.log(`Skipping ${fontDoc.title} — no TTF or OTF URL`);
						skippedCount++;
						continue;
					}
					setStatus(`Fetching OTF file for ${fontDoc.title}...`);
					const res = await fetch(otfAsset.url);
					file = await res.blob();
				} else {
					setStatus(`Fetching TTF file for ${fontDoc.title}...`);
					const res = await fetch(ttfAsset.url);
					file = await res.blob();
				}

				const fontBuffer = await readFontFile(file);
				const font = fontkit.create(fontBuffer);

				const { weightName, subfamilyName, fontTitle } = extractFontMetadata(
					font,
					typefaceName,
					weightKeywordList,
					italicKeywordList,
					preserveShortenedNames,
				);

				const slugValue = fontTitle.toLowerCase().replace(/\s+/g, '-');

				setStatus(`Updating font ${i + 1}/${fontDocuments.length}: ${fontTitle}`);
				await client.patch(fontDoc._id)
					.set({
						title: fontTitle,
						slug: { _type: 'slug', current: slugValue },
						weightName: weightName,
						subfamily: subfamilyName,
					})
					.commit();

				updatedCount++;
			} catch (err) {
				console.error(`Error processing ${fontDoc.title}:`, err);
				errorCount++;
			}
		}

		const resultMessage = `Renamed ${updatedCount} of ${fontDocuments.length} font documents (${skippedCount} skipped, ${errorCount} errors)`;
		setStatus(resultMessage);

		return {
			success: true,
			message: resultMessage,
			stats: { total: fontDocuments.length, updated: updatedCount, skipped: skippedCount, errors: errorCount },
		};
	} catch (err) {
		console.error('Error renaming font documents:', err);
		setError(true);
		setStatus(`Error: ${err.message}`);
		return { success: false, message: `Error: ${err.message}` };
	}
};
