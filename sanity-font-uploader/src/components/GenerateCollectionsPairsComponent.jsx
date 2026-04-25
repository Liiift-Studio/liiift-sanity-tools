// Generates font collections and pairs from a typeface's linked fonts

import React, { useCallback, useState } from 'react';
import { Stack, Grid, Flex, Text, Button, Card, Spinner, Box } from '@sanity/ui';
import { useFormValue } from 'sanity';
import slugify from 'slugify';
import { nanoid } from 'nanoid';

import { useSanityClient } from '../hooks/useSanityClient';
import StatusDisplay from './StatusDisplay';

/**
 * Generates Full Family, Uprights, Italics, Subfamily collections, and Regular/Italic pairs
 * from a typeface's linked fonts. Replaces existing collections and pairs respectively.
 */
export const GenerateCollectionsPairsComponent = () => {
	const [status, setStatus] = useState('ready');
	const [ready, setReady] = useState(true);
	const [collectionPrice, setCollectionPrice] = useState(
		process.env.SANITY_STUDIO_DEFAULT_COLLECTION_PRICE || 20
	);
	const [pairPrice, setPairPrice] = useState(
		process.env.SANITY_STUDIO_DEFAULT_PAIR_PRICE || 75
	);

	const client = useSanityClient();
	const doc_id = useFormValue(['_id']);
	const title = useFormValue(['title']);
	const slug = useFormValue(['slug']);
	const stylesObject = useFormValue(['styles']);

	/** Creates or replaces a collection document and returns a weak reference to it. */
	const createSanityCollection = useCallback(async (fontsList, collectionSlug, newTitle) => {
		const newSlug = collectionSlug.toLowerCase().trim();

		const fontRefs = fontsList.map(font => ({
			_key: nanoid(),
			_type: 'reference',
			_ref: font._id ?? font._ref,
			_weak: true,
		}));

		let preferredStyle = { weight: fontsList[0].weight, style: fontsList[0].style, _ref: fontsList[0]._ref };
		fontsList.forEach(font => {
			if (Number(font.weight) < Number(preferredStyle.weight)) return;
			if (Number(font.weight) === Number(preferredStyle.weight) && preferredStyle.style === 'Italic' && font.style === 'Regular') {
				preferredStyle = { weight: font.weight, style: font.style, _ref: font._id };
			} else if (Number(font.weight) > Number(preferredStyle.weight)) {
				preferredStyle = { weight: font.weight, style: font.style, _ref: font._id };
			}
		});

		const price = (collectionPrice ? Number(collectionPrice) : 0) * fontRefs.length;

		await client.createOrReplace({
			_key: nanoid(),
			_id: newSlug,
			_type: 'collection',
			state: 'active',
			type: 'collection',
			preferredStyle: { _type: 'reference', _ref: preferredStyle._ref, _weak: true },
			title: newTitle,
			slug: { _type: 'slug', current: newSlug },
			fonts: fontRefs,
			price,
		}).catch(err => { console.error('Error creating collection:', err.message); });

		return { _ref: newSlug, _type: 'reference', _weak: true, _key: nanoid() };
	}, [collectionPrice, client]);

	/** Creates or replaces a pair document and returns a weak reference to it. */
	const createSanityPair = useCallback(async (pair, pairSlug, newTitle) => {
		const newSlug = pairSlug.toLowerCase().trim();

		const fontRefs = pair.map(font => ({
			_key: nanoid(),
			_type: 'reference',
			_ref: font._id,
			_weak: true,
		}));

		await client.createOrReplace({
			_key: nanoid(),
			_id: newSlug,
			_type: 'pair',
			preferredStyle: { _type: 'reference', _ref: fontRefs[0]._ref, _weak: true },
			title: newTitle,
			slug: { _type: 'slug', current: newSlug },
			fonts: fontRefs,
			price: pairPrice ? Number(pairPrice) : 0,
		}).catch(err => { console.error('Error creating pair:', err.message); });

		return { _ref: newSlug, _type: 'reference', _weak: true, _key: nanoid() };
	}, [pairPrice, client]);

	/** Generates Full Family, Uprights, Italics, and Subfamily collections. */
	const handleGenerateCollections = useCallback(async () => {
		setStatus('Generating collections...');
		setReady(false);
		try {
			const result = await client.fetch(
				`*[_type == "typeface" && _id == $id]{ "fonts": styles.fonts[] -> }[0]`,
				{ id: doc_id }
			);
			const sanityFonts = result?.fonts ?? [];

			const subfamilies = stylesObject?.subfamilies ?? [];
			const totalCollections = subfamilies.length + 3;

			const fullFamily = [], uprights = [], italics = [];
			for (const font of sanityFonts) {
				fullFamily.push(font);
				if (font.style === 'Regular') uprights.push(font);
				else italics.push(font);
			}

			const typefacePatch = [];

			if (fullFamily.length > 1) {
				setStatus(`[1/${totalCollections}] Generating full family collection`);
				typefacePatch.push(await createSanityCollection(fullFamily, `${slug.current}-full-family`, `${title} Full Family`));
			}
			if (uprights.length > 1) {
				setStatus(`[2/${totalCollections}] Generating uprights collection`);
				const ref = await createSanityCollection(uprights, `${slug.current}-uprights`, `${title} Uprights`);
				if (ref) typefacePatch.push(ref);
			}
			if (italics.length > 1) {
				setStatus(`[3/${totalCollections}] Generating italics collection`);
				const ref = await createSanityCollection(italics, `${slug.current}-italics`, `${title} Italics`);
				if (ref) typefacePatch.push(ref);
			}
			for (let i = 0; i < subfamilies.length; i++) {
				setStatus(`[${i + 4}/${totalCollections}] Generating ${subfamilies[i].title} collection`);
				const ref = await createSanityCollection(
					subfamilies[i].fonts,
					`${slug.current}-${slugify(subfamilies[i].title)}-family`,
					`${title} ${subfamilies[i].title} Family`
				);
				if (ref) typefacePatch.push(ref);
			}

			await client.patch(doc_id).set({ styles: { ...stylesObject, collections: typefacePatch } }).commit();
			setStatus('Collections generated');
		} catch (err) {
			console.error('Error generating collections:', err);
			setStatus('Error generating collections');
		}
		setReady(true);
	}, [doc_id, title, slug, stylesObject, collectionPrice, client, createSanityCollection]);

	/** Generates Regular/Italic pairs matched by subfamily and weight. */
	const handleGeneratePairs = useCallback(async () => {
		setStatus('Generating pairs...');
		setReady(false);
		try {
			const result = await client.fetch(
				`*[_type == "typeface" && _id == $id]{ "fonts": styles.fonts[] -> }[0]`,
				{ id: doc_id }
			);
			const sanityFonts = result?.fonts ?? [];

			const regular = [], italic = [];
			for (const font of sanityFonts) {
				if (font.style === 'Regular') regular.push(font);
				else italic.push(font);
			}

			const pairs = [];
			for (const reg of regular) {
				for (const ita of italic) {
					if (ita.subfamily === reg.subfamily && ita.weight === reg.weight && ita.weightName === reg.weightName) {
						pairs.push([reg, ita]);
					}
				}
			}

			const typefacePatch = [];
			for (let i = 0; i < pairs.length; i++) {
				const [reg] = pairs[i];
				let pairSlug, pairTitle;
				if (reg.subfamily && reg.subfamily !== '') {
					if (reg.subfamily === 'Regular') {
						pairSlug = `${slug.current}-${slugify(reg.weightName)}s`;
						pairTitle = `${title} ${reg.weightName}s`;
					} else {
						pairSlug = `${slug.current}-${slugify(reg.subfamily)}-${slugify(reg.weightName)}s`;
						pairTitle = `${title} ${reg.subfamily} ${reg.weightName}s`;
					}
				} else {
					pairSlug = `${slug.current}-${slugify(reg.weightName)}s`;
					pairTitle = `${title} ${reg.weightName}s`;
				}
				setStatus(`[${i + 1}/${pairs.length}] Generating ${pairTitle}`);
				const ref = await createSanityPair(pairs[i], pairSlug, pairTitle);
				if (ref) typefacePatch.push(ref);
			}

			const preferredStyle = regular[0]?._id ?? '';
			await client.patch(doc_id).set({
				preferredStyle: { _ref: preferredStyle, _type: 'reference', _weak: true },
				styles: { ...stylesObject, pairs: typefacePatch },
			}).commit();

			setStatus('Pairs generated');
		} catch (err) {
			console.error('Error generating pairs:', err);
			setStatus('Error generating pairs');
		}
		setReady(true);
	}, [doc_id, title, slug, stylesObject, pairPrice, client, createSanityPair]);

	if (!title || !slug) return null;

	return (
		<Stack space={2}>
			<StatusDisplay status={status} error={false} />
			<Card border padding={2} shadow={1} radius={2}>
				{ready ? (
					<Stack space={3}>
						<Grid columns={[2]} gap={4} marginTop={1} marginBottom={1}>
							<Stack space={2}>
								<Text size={1} muted>Collection price / font</Text>
								<Flex align="center" gap={2}>
									<Text size={1} muted>$</Text>
									<input
										value={collectionPrice}
										onChange={(e) => setCollectionPrice(e.target.value)}
										type="number"
										style={{ textAlign: 'end', padding: '5px', maxWidth: '75px' }}
									/>
								</Flex>
							</Stack>
							<Stack space={2}>
								<Text size={1} muted>Pair price</Text>
								<Flex align="center" gap={2}>
									<Text size={1} muted>$</Text>
									<input
										value={pairPrice}
										onChange={(e) => setPairPrice(e.target.value)}
										type="number"
										style={{ textAlign: 'end', padding: '5px', maxWidth: '75px' }}
									/>
								</Flex>
							</Stack>
						</Grid>
						<Box>
							<Button mode="ghost" tone="primary" width="fill" text="Generate Collections" onClick={handleGenerateCollections} />
						</Box>
						<Box>
							<Button mode="ghost" tone="primary" width="fill" text="Generate Pairs" onClick={handleGeneratePairs} />
						</Box>
					</Stack>
				) : (
					<Flex align="center" justify="center" gap={3} padding={4}>
						<Spinner />
						<Text muted size={1}>{status}</Text>
					</Flex>
				)}
			</Card>
		</Stack>
	);
};
