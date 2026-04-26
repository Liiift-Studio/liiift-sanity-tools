// Recalculates and patches the subfamily field on all fonts linked to a typeface

import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import { Button, Text, Stack, Box } from '@sanity/ui';
import { useFormValue } from 'sanity';
import { useSanityClient } from '../hooks/useSanityClient';
import { expandAbbreviations } from '../utils/generateKeywords';

/**
 * Button component that rebuilds the subfamilies array on the current typeface document
 * by grouping all linked fonts by their `subfamily` field.
 *
 * NOTE: This component uses its own local updateTypefaceDocument that patches ONLY
 * the `subfamilies` key while preserving all other styles fields (fonts, variableFont).
 * Do NOT replace it with the shared updateTypefaceDocument from utils/, which patches
 * the full styles object and would overwrite the fonts/variableFont arrays.
 */
export const RegenerateSubfamiliesComponent = () => {
	const [status, setStatus] = useState('');
	const [ready, setReady] = useState(true);
	const [error, setError] = useState(false);

	const client = useSanityClient();

	const doc_id = useFormValue(['_id']);
	const title = useFormValue(['title']);
	const slug = useFormValue(['slug']);
	const stylesObject = useFormValue(['styles']) || { fonts: [], variableFont: [] };

	const handleClick = () => {
		regenerateSubfamilies({ title, stylesObject, slug, doc_id, client, setStatus, setReady, setError });
	};

	return (
		<>
			{status && (
				<Box padding={3} style={{ borderRadius: '4px', marginBottom: '10px' }}>
					<Text size={1} style={{ color: error ? 'red' : 'green' }}>{status}</Text>
				</Box>
			)}
			<Button mode="ghost" tone="primary" width="fill" padding={3} onClick={handleClick} disabled={!ready}>
				<Stack space={2}>
					<Text align="center">Regenerate Subfamilies</Text>
				</Stack>
			</Button>
		</>
	);
};

/**
 * Fetches all fonts for a typeface, groups them by subfamily, and patches the document.
 */
const regenerateSubfamilies = async ({ title, stylesObject, slug, doc_id, client, setStatus, setReady, setError }) => {
	try {
		setStatus('Regenerating subfamilies...');
		setReady(false);
		setError(false);

		const allFonts = await fetchFonts(title, slug, client);

		if (!allFonts || allFonts.length === 0) {
			setStatus('No fonts found for this typeface');
			setReady(true);
			setError(true);
			return;
		}

		console.log('Found fonts:', allFonts.length);
		setStatus(`Found ${allFonts.length} fonts. Processing...`);

		const subfamilies = groupFontsBySubfamily(allFonts);
		const newSubfamiliesArray = createSubfamiliesArray(subfamilies);

		console.log('New subfamilies:', newSubfamiliesArray);
		setStatus(`Created ${newSubfamiliesArray.length} subfamily groups`);

		await updateTypefaceSubfamilies(doc_id, stylesObject, newSubfamiliesArray, client, setStatus, setError);

		setStatus('Subfamilies regenerated successfully');
	} catch (e) {
		console.error(e.message);
		setStatus('Error regenerating subfamilies');
		setError(true);
	}

	setReady(true);
};

/**
 * Fetches the font list for a typeface by slug.
 * @param {string} title
 * @param {Object} slug
 * @param {Object} client
 * @returns {Promise<Array>}
 */
const fetchFonts = async (title, slug, client) => {
	const slugCurrent = slug?.current || title;
	const query = await client.fetch(
		`*[_type == "typeface" && slug.current == $slugCurrent][0]{
			"fonts": styles.fonts[]->{ _id, title, subfamily, style, weight, _key }
		}`,
		{ slugCurrent }
	);
	return query?.fonts || [];
};

/**
 * Groups fonts by their subfamily name, excluding VF fonts from shared subfamilies.
 * @param {Object[]} fonts
 * @returns {Object}
 */
const groupFontsBySubfamily = (fonts) => {
	const subfamilies = {};
	fonts.forEach(font => {
		if (font.title?.includes('VF')) {
			// Variable fonts get isolated into their own unique group so they don't pollute subfamilies
			subfamilies[`VF_${font.title}`] = [font];
		} else {
			const subfamilyName = font.subfamily ? expandAbbreviations(font.subfamily) : 'Regular';
			if (!subfamilies[subfamilyName]) subfamilies[subfamilyName] = [];
			subfamilies[subfamilyName].push(font);
		}
	});
	return subfamilies;
};

/**
 * Converts a grouped subfamilies map into the Sanity array format.
 * @param {Object} subfamilies
 * @returns {Object[]}
 */
const createSubfamiliesArray = (subfamilies) => {
	return Object.keys(subfamilies).map(subfamilyName => ({
		title: subfamilyName,
		_key: nanoid(),
		_type: 'object',
		fonts: subfamilies[subfamilyName].map(font => ({
			_ref: font._id,
			_key: nanoid(),
			_type: 'reference',
			_weak: true,
		})),
	}));
};

/**
 * Patches ONLY the subfamilies key on the typeface document, preserving fonts and variableFont.
 * This is intentionally scoped — do NOT replace with the shared updateTypefaceDocument util.
 * @param {string} doc_id
 * @param {Object} stylesObject
 * @param {Object[]} newSubfamiliesArray
 * @param {Object} client
 * @param {Function} setStatus
 * @param {Function} setError
 */
const updateTypefaceSubfamilies = async (doc_id, stylesObject, newSubfamiliesArray, client, setStatus, setError) => {
	const patch = {
		styles: {
			...stylesObject,
			subfamilies: newSubfamiliesArray,
		},
	};

	try {
		await client.patch(doc_id).set(patch).commit();
		console.log(`Updated document: ${doc_id}`);

		if (doc_id.startsWith('drafts.')) {
			const publishedId = doc_id.replace('drafts.', '');
			// Parameterized to guard against any edge-case injection via draft IDs
			const publishedDoc = await client.fetch(`*[_id == $publishedId]`, { publishedId }).then(res => res[0]);
			if (publishedDoc) {
				await client.patch(publishedId).set(patch).commit();
				console.log(`Updated published document: ${publishedId}`);
			} else {
				console.log(`No published document found for ${publishedId}, skipping`);
			}
		}
	} catch (err) {
		console.error('Error updating document:', err.message);
		setStatus('Error regenerating subfamilies');
		setError(true);
	}
};
