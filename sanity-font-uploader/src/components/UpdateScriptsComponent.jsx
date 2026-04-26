// Updates and re-links existing script font variant references on font documents

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Stack, Text, Button } from '@sanity/ui';
import { useFormValue, set } from 'sanity';

import { useSanityClient } from '../hooks/useSanityClient';

/**
 * Wraps the default Sanity scripts array input with a button that reads
 * scriptFileInput from all linked font documents and syncs the list.
 * @param {Object} props - Sanity input component props
 */
export const UpdateScriptsComponent = (props) => {
	const { onChange } = props;

	const client = useSanityClient();
	const scripts = useFormValue(['scripts']) || [];
	const fonts = useFormValue(['styles', 'fonts']);

	const isReadyRef = useRef(false);
	const [message, setMessage] = useState('');

	// Delay ready flag to avoid triggering onChange during initial mount
	useEffect(() => {
		const timer = setTimeout(() => { isReadyRef.current = true; }, 100);
		return () => clearTimeout(timer);
	}, []);

	/** Fetches all linked font documents and derives the unique script list from their scriptFileInput fields. */
	const updateFromFonts = useCallback(async () => {
		if (!fonts || fonts.length === 0) {
			setMessage('No fonts found to extract scripts from');
			return;
		}

		const fontRefs = fonts.map(font => font._ref);

		let result;
		try {
			result = await client.fetch(
				`*[_type == "font" && _id in $fontRefs]{ _id, scriptFileInput }`,
				{ fontRefs }
			);
		} catch (err) {
			console.error('Failed to fetch font documents:', err);
			setMessage('Error updating scripts: ' + err.message);
			return;
		}

		const newScripts = result.reduce((acc, font) => {
			if (!font?.scriptFileInput) return acc;
			for (const language of Object.keys(font.scriptFileInput)) {
				if (!acc.includes(language)) acc.push(language);
			}
			return acc;
		}, []);

		if (isReadyRef.current) onChange(set(newScripts));
		setMessage('Scripts updated');
	}, [onChange, fonts, client]);

	return (
		<Stack space={3}>
			<Button
				mode="ghost"
				tone="primary"
				width="fill"
				text="Update Scripts from Font Files"
				onClick={updateFromFonts}
			/>
			{message && <Text size={1} style={{ color: 'green' }}>{message}</Text>}
			{props.renderDefault(props)}
		</Stack>
	);
};
