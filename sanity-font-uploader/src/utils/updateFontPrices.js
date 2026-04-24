// Utility for bulk-updating the price of all fonts in a typeface

/**
 * Sets the same price on every font document referenced by a typeface.
 *
 * @param {Object} params
 * @param {Object} params.client - Sanity client
 * @param {string} params.title - Typeface title
 * @param {Object} params.slug - Typeface slug object
 * @param {string} params.inputPrice - New price value (will be coerced to Number)
 * @param {string} params.doc_id - Document ID (used to detect draft state)
 * @param {Function} params.setStatus
 * @param {Function} params.setError
 * @returns {Promise<Object>}
 */
export const updateFontPrices = async ({
	client,
	title,
	slug,
	inputPrice,
	doc_id,
	setStatus,
	setError,
}) => {
	try {
		if (!title) {
			setStatus('Typeface needs a title');
			setError(true);
			console.error('Typeface needs title');
			return { success: false, message: 'Typeface needs title' };
		}

		if (!slug?.current) {
			setStatus('Typeface needs a slug');
			setError(true);
			console.error('Typeface needs slug');
			return { success: false, message: 'Typeface needs slug' };
		}

		const price = Number(inputPrice);
		if (isNaN(price)) {
			setStatus('Invalid price value');
			setError(true);
			console.error('Invalid price value');
			return { success: false, message: 'Invalid price value' };
		}

		setStatus('Fetching typeface document...');
		const typeface = await client.fetch(
			`*[_type == "typeface" && slug.current == $slug][0]`,
			{ slug: slug.current }
		);

		if (!typeface) {
			setStatus('Typeface not found');
			setError(true);
			console.error('Typeface not found');
			return { success: false, message: 'Typeface not found' };
		}

		if (!typeface.styles?.fonts?.length) {
			setStatus('No fonts found in typeface');
			setError(true);
			console.error('No fonts found in typeface');
			return { success: false, message: 'No fonts found in typeface' };
		}

		const fontRefs = typeface.styles.fonts;
		setStatus(`Updating prices for ${fontRefs.length} fonts...`);

		let updatedCount = 0;
		for (let i = 0; i < fontRefs.length; i++) {
			try {
				await client.patch(fontRefs[i]._ref).set({ price, sell: price > 0 }).commit();
				updatedCount++;
				setStatus(`Updated ${updatedCount}/${fontRefs.length} fonts...`);
			} catch (err) {
				console.error(`Error updating font ${fontRefs[i]._ref}:`, err);
			}
		}

		const successMessage = `Successfully updated prices for ${updatedCount} fonts to $${price}`;
		setStatus(successMessage);
		console.log(successMessage);

		return { success: true, message: successMessage, updatedCount };
	} catch (err) {
		const errorMessage = `Error: ${err.message}`;
		console.error('Error updating font prices:', err);
		setError(true);
		setStatus(errorMessage);
		return { success: false, message: errorMessage };
	}
};
