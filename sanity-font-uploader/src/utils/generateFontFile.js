// Triggers server-side font format conversion via the consuming site's fontWorker API endpoint

export default async function generateFontFile({
	srcUrl,
	language = null,
	filename,
	codes,
	documentId,
	documentTitle,
	documentVariableFont,
	documentStyle,
	documentWeight,
	fileInput
}) {
	await fetch(`${process.env.SANITY_STUDIO_SITE_URL}/api/sanity/fontWorker`, {
		method: 'POST',
		mode: 'no-cors',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			code: 'generate-fonts',
			language: language,
			srcUrl: srcUrl,
			filename: filename,
			documentId: documentId,
			documentTitle: documentTitle,
			documentVariableFont: documentVariableFont,
			documentStyle: documentStyle,
			documentWeight: documentWeight,
			fileInput: fileInput,
			codes: codes
		})
	}).catch(e => {
		console.log(e.message);
		return -1;
	});
	return 1;

}
