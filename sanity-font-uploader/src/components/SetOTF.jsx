// Detects and sets active OpenType features on a typeface document from the first linked font's metadata

import React, { useState } from 'react';
import { set, useFormValue } from 'sanity';
import { Stack, Button, Text } from '@sanity/ui';
import { useSanityClient } from '../hooks/useSanityClient';

/**
 * Reads the first linked font's opentypeFeatures data and checks which configured
 * feature keys are supported. Patches the field with the detected features array.
 */
export const SetOTF = (props) => {
	const { onChange, value = {} } = props;
	const client = useSanityClient();
	const stylesObject = useFormValue(['styles']);
	const [message, setMessage] = useState('');

	/** Fetches the first font document and matches its OpenType features against the configured keys. */
	const detect = async () => {
		if (!stylesObject?.fonts?.length) {
			setMessage('Error: No fonts found in styles. Please add at least one font first.');
			setTimeout(() => setMessage(''), 5000);
			return;
		}

		const fontRef = stylesObject.fonts[0]?._ref;
		if (!fontRef) {
			setMessage('Error: Invalid font reference in styles.');
			setTimeout(() => setMessage(''), 5000);
			return;
		}

		try {
			const font = await client.fetch('*[_type == "font" && _id == $id][0]', { id: fontRef });

			if (!font) {
				setMessage('Error: Could not find the referenced font.');
				setTimeout(() => setMessage(''), 5000);
				return;
			}

			if (!font.opentypeFeatures?.chars) {
				setMessage(`Error: No OpenType feature data found in "${font.title || 'this font'}". Generate font data first.`);
				setTimeout(() => setMessage(''), 5000);
				return;
			}

			const features = [];
			Object.keys(value).forEach(key => {
				if (key !== 'features' && value[key]?.feature) {
					const requiredFeatures = value[key].feature.split(' ');
					const approved = requiredFeatures.every(v => font.opentypeFeatures.chars.includes(v));
					if (approved) features.push(key);
				}
			});

			onChange(set({ ...value, features }));
			setMessage(`Features detected: ${features.length ? features.join(', ') : 'none'}.`);
			setTimeout(() => setMessage(''), 5000);
		} catch (err) {
			setMessage('Error detecting features. Check the console for details.');
			console.error('SetOTF detect error:', err);
		}
	};

	return (
		<Stack className="openType">
			{value?.features?.length > 0 && (
				<Text muted size={1} style={{ marginBottom: '0.5rem' }}>
					Number of features: {value.features.length}
				</Text>
			)}
			{!!stylesObject?.fonts?.length && (
				<Button
					text="Detect OTF"
					mode="ghost"
					onClick={detect}
					style={{ borderRadius: '0 3px 0 0', marginBottom: '1rem' }}
				/>
			)}
			{!!message && (
				<Text muted size={1}><br />{message}<br /><br /></Text>
			)}
			{props.renderDefault(props)}
		</Stack>
	);
};
