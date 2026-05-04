// Generates a single primary full-family collection from a typeface's linked fonts and prepends it to the existing collections array

import React, { useCallback, useState } from 'react';
import { Stack, Flex, Text, Button, Card, Spinner } from '@sanity/ui';
import { useFormValue } from 'sanity';
import { nanoid } from 'nanoid';

import { useSanityClient } from '../hooks/useSanityClient';
import StatusDisplay from './StatusDisplay';

/**
 * Generates a full-family collection document from the typeface's linked fonts
 * and prepends it to the existing styles.collections array.
 */
export const PrimaryCollectionGeneratorTypeface = () => {
	const client = useSanityClient();

	const [status, setStatus] = useState('ready');
	const [ready, setReady] = useState(true);
	const [price, setPrice] = useState(
		process.env.SANITY_STUDIO_DEFAULT_COLLECTION_PRICE || 100
	);

	const fonts = useFormValue(['styles', 'fonts']);
	const title = useFormValue(['title']);
	const preferredStyle = useFormValue(['preferredStyle']);
	const docId = useFormValue(['_id']);
	const styles = useFormValue(['styles']);

	/** Creates or replaces the full-family collection document and prepends it to the typeface's collections array. */
	const generateCollection = useCallback(async () => {
		setStatus('Generating collection...');
		setReady(false);

		let id = title.toLowerCase().replace(/\s+/g, '-').slice(0, 200);
		if (!id.includes('collection')) id += '-collection';

		const colTitle = id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

		const collectionDoc = {
			_key: nanoid(),
			_id: id,
			title: colTitle,
			slug: { _type: 'slug', current: id },
			price: Number(price) || 0,
			fonts: Object.values(fonts),
			preferredStyle: preferredStyle,
			_type: 'collection',
			type: 'collection',
		};

		try {
			const sanityCollection = await client.createOrReplace(collectionDoc);
			const collections = styles.collections || [];

			await client.patch(docId)
				.setIfMissing({ styles: {} })
				.set({
					styles: {
						...styles,
						collections: [{
							_type: 'reference',
							_key: nanoid(),
							_ref: sanityCollection._id,
							_weak: true,
						}, ...collections],
					},
				})
				.commit();

			setStatus('Collection generated');
		} catch (err) {
			console.error('Error creating collection:', err.message);
			setStatus('Error generating collection');
		}

		setReady(true);
	}, [docId, fonts, price, preferredStyle, styles, title, client]);

	if (!title || !fonts) return null;

	return (
		<Stack space={2}>
			<StatusDisplay status={status} error={false} />
			<Card border padding={2} shadow={1} radius={2}>
				{ready ? (
					<Stack space={3}>
						<Flex align="center" gap={2} marginTop={1} marginBottom={1}>
							<Text size={1} muted>Price</Text>
							<Text size={1} muted>$</Text>
							<input
								value={price}
								onChange={(e) => setPrice(e.target.value)}
								type="number"
								style={{ textAlign: 'end', padding: '5px', maxWidth: '75px' }}
							/>
							<Text size={1} muted>per full family</Text>
						</Flex>
						<Button
							mode="ghost"
							tone="primary"
							style={{ width: '100%' }}
							onClick={generateCollection}
							text="Generate Full Family Collection"
						/>
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
