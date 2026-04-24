// Client-side utility: triggers subset generation on the server from an existing WOFF2 URL.
// The server subsets the WOFF2 directly — no TTF conversion involved.

/**
 * Calls fontWorker to generate a display subset WOFF2 and subset CSS from an existing WOFF2 URL.
 * Patches fileInput.woff2_subset and fileInput.css_subset on the Sanity document directly.
 * @param {object} params
 * @param {string} params.woff2Url - CDN URL of the existing WOFF2 to subset
 * @param {string} params.filename - base filename (no extension) for the generated assets
 * @param {string} params.documentId
 * @param {string} params.documentTitle
 * @param {boolean} params.documentVariableFont
 * @param {string} params.documentStyle
 * @param {string} params.documentWeight
 * @returns {Promise<number>} 1 on success, -1 on network error
 */
export default async function generateSubset({
	woff2Url,
	filename,
	documentId,
	documentTitle,
	documentVariableFont,
	documentStyle,
	documentWeight,
}) {
	await fetch(`${process.env.SANITY_STUDIO_SITE_URL}/api/sanity/fontWorker`, {
		method: 'POST',
		mode: 'no-cors',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			code: 'generate-subset',
			woff2Url,
			filename,
			documentId,
			documentTitle,
			documentVariableFont,
			documentStyle,
			documentWeight,
		})
	}).catch(e => {
		console.warn('Subset generation call failed:', e.message);
		return -1;
	});
	return 1;
}
