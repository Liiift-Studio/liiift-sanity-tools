// Per-script font file manager: Upload/Build/Delete controls for each language variant (TTF, OTF, WOFF, WOFF2, EOT, SVG, CSS)

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Stack, Flex, Text, Button } from '@sanity/ui';
import { TrashIcon } from '@sanity/icons';
import { useFormValue, set, unset } from 'sanity';

import generateCssFile from '../utils/generateCssFile';
import generateFontFile from '../utils/generateFontFile';
import { SCRIPTS } from '../utils/utils';
import { useSanityClient } from '../hooks/useSanityClient';

/**
 * Component for managing font file uploads and conversions for different scripts/languages.
 * @param {Object} props
 * @param {Object} props.elementProps
 * @param {React.Ref} props.elementProps.ref
 * @param {Function} props.onChange
 * @param {string} props.value
 */
export const FontScriptUploaderComponent = (props) => {
	const client = useSanityClient();
	const { elementProps: { ref }, onChange, value = '' } = props;

	const [message, setMessage] = useState({});
	const [status, setStatus] = useState('ready');
	const [filenames, setFilenames] = useState({});

	const scriptFileInput = useFormValue(['scriptFileInput']) || [];
	const doc_id = useFormValue(['_id']);
	const doc_title = useFormValue(['title']);
	const doc_variableFont = useFormValue(['variableFont']);
	const doc_weight = useFormValue(['weight']);
	const doc_style = useFormValue(['style']);
	const doc_slug = useFormValue(['slug']);

	useEffect(() => {
		if (!scriptFileInput || Object.keys(scriptFileInput).length === 0) return;
		handleSetFilenames();
	}, [scriptFileInput]);

	/** Fetches filenames for all uploaded script font assets in a single GROQ request. */
	const handleSetFilenames = useCallback(async () => {
		const allIds = [];

		const assetIds = SCRIPTS.reduce((acc, language) => {
			if (scriptFileInput[language]) {
				const newFileInput = Object.keys(scriptFileInput[language]).reduce((ftacc, filetype) => {
					if (!scriptFileInput[language][filetype]?.asset?._ref) return ftacc;
					allIds.push(scriptFileInput[language][filetype].asset._ref);
					return { ...ftacc, [filetype]: scriptFileInput[language][filetype].asset._ref };
				}, {});
				acc[language] = newFileInput;
			}
			return acc;
		}, {});

		let assetData = await client.fetch(
			`*[_id in $allIds]{ _id, originalFilename }`,
			{ allIds }
		);
		assetData = assetData.reduce((acc, asset) => ({ ...acc, [asset._id]: asset.originalFilename }), {});

		const fontNames = {};
		SCRIPTS.forEach(language => {
			if (assetIds[language]) {
				Object.keys(assetIds[language]).forEach(filetype => {
					const assetRef = assetIds[language][filetype];
					fontNames[language] = { ...fontNames[language], [filetype]: assetData[assetRef] };
				});
			}
		});

		setFilenames(fontNames);
	}, [scriptFileInput, client]);

	/** Regenerates the @font-face CSS file from the stored woff2 asset for a given language. */
	const handleGenerateCssFile = useCallback(async (language) => {
		setMessage(prev => ({ ...prev, [language]: 'Generating CSS...' }));

		const woff2AssetRef = scriptFileInput[language]?.woff2?.asset?._ref;
		const [woff2Asset] = await client.fetch(
			`*[_id == $id]{ originalFilename, url }`,
			{ id: woff2AssetRef }
		);

		const blob = await (await fetch(woff2Asset.url)).blob();

		const newFileInput = await generateCssFile({
			woff2File: blob,
			fileInput: scriptFileInput,
			language,
			fontName: doc_title,
			fileName: woff2Asset.originalFilename.replace('.woff2', ''),
			variableFont: doc_variableFont,
			weight: doc_weight,
			style: doc_style,
			client,
		});

		setMessage(prev => ({ ...prev, [language]: 'CSS generated' }));
		setTimeout(() => setMessage(prev => ({ ...prev, [language]: '' })), 2000);
		onChange(set(newFileInput));
	}, [scriptFileInput, onChange, doc_title, doc_variableFont, doc_weight, doc_style, client]);

	/** Converts and uploads the source font file to one or more target formats for a given language. */
	const handleGenerateFontFile = useCallback(async (code, sourceFile, language) => {
		setMessage(prev => ({ ...prev, [language]: `Generating ${code === 'all' ? 'all files' : code}...` }));

		const url = `https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${sourceFile?.asset?._ref.replace('file-', '').replace('-', '.')}`;
		const codes = code === 'all' ? ['otf', 'woff', 'woff2', 'eot', 'svg'] : [code];

		await generateFontFile({
			codes,
			language,
			srcUrl: url,
			filename: doc_slug.current + '-' + language,
			documentId: doc_id,
			documentTitle: doc_title,
			documentVariableFont: doc_variableFont,
			documentStyle: doc_style,
			documentWeight: doc_weight,
			fileInput: scriptFileInput,
		});

		setMessage(prev => ({ ...prev, [language]: 'Files generated' }));
		setTimeout(() => setMessage(prev => ({ ...prev, [language]: '' })), 2000);
	}, [doc_id, doc_title, doc_variableFont, doc_style, doc_weight, doc_slug, scriptFileInput]);

	/** Uploads a single font file for a given language and format, generating CSS if woff2. */
	const handleUpload = useCallback(async (event, language, code) => {
		const file = event.target.files[0];
		const filename = doc_slug.current + '-' + language + '.' + file.name.split('.').pop();

		setMessage(prev => ({ ...prev, [language]: 'Uploading: ' + filename }));

		const asset = await client.assets.upload('file', file, { filename });

		const langObj = scriptFileInput[language] ? { ...scriptFileInput[language] } : {};
		let newFileInput = {
			...scriptFileInput,
			[language]: {
				...langObj,
				[code]: { _type: 'file', asset: { _ref: asset._id, _type: 'reference' } },
			},
		};

		setMessage(prev => ({ ...prev, [language]: filename + ' uploaded' }));

		if (code === 'woff2') {
			setMessage(prev => ({ ...prev, [language]: 'Generating CSS...' }));
			newFileInput = await generateCssFile({
				woff2File: file,
				fileInput: newFileInput,
				language,
				fontName: doc_title + '-' + language,
				fileName: filename.replace('.woff2', ''),
				variableFont: doc_variableFont,
				weight: doc_weight,
				style: doc_style,
				client,
			});
			setMessage(prev => ({ ...prev, [language]: doc_title + '.css generated' }));
		}

		onChange(set(newFileInput));
		setTimeout(() => setMessage(prev => ({ ...prev, [language]: '' })), 2000);
	}, [scriptFileInput, onChange, doc_title, doc_variableFont, doc_weight, doc_style, doc_slug, client]);

	/** Deletes a single font file asset and removes its reference for the given language. */
	const handleDelete = useCallback(async (code, language) => {
		setMessage(prev => ({ ...prev, [language]: `Deleting ${code}...` }));
		const asset = scriptFileInput[language][code]?.asset?._ref;

		onChange(unset([language, code]));

		try {
			await client.delete(asset);
			setMessage(prev => ({ ...prev, [language]: `${code} deleted` }));
			setTimeout(() => setMessage(prev => ({ ...prev, [language]: '' })), 2000);
		} catch (e) {
			console.error('Error deleting asset:', e.message);
			setMessage(prev => ({ ...prev, [language]: 'WARNING: ' + e.message }));
		}
	}, [scriptFileInput, onChange, client]);

	/** Deletes all font file assets for a given language. */
	const handleDeleteAll = useCallback(async (language) => {
		setMessage(prev => ({ ...prev, [language]: 'Deleting all...' }));
		onChange(unset([language]));

		for (const refKey of Object.keys(scriptFileInput[language])) {
			if (refKey === 'documentInfo') continue;
			const asset = scriptFileInput[language][refKey]?.asset?._ref;
			try { await client.delete(asset); } catch (e) { console.error('Error deleting asset:', e.message); }
		}

		setMessage(prev => ({ ...prev, [language]: '' }));
	}, [scriptFileInput, onChange, client]);

	/** Renders a bordered upload/build/delete row for a given font format and language. */
	const renderFormatRow = (format, language, buildSource = null) => {
		const formatUpper = format.toUpperCase();
		const hasFile = !!scriptFileInput[language]?.[format]?.asset?._ref;
		const fileUrl = hasFile
			? `https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${scriptFileInput[language][format].asset._ref.replace('file-', '').replace('-', '.')}`
			: null;

		return (
			<Card border radius={1} padding={2} key={format}>
				<Flex justify="space-between" align="center" gap={2}>
					<Flex gap={3} align="center" style={{ flex: 1, minWidth: 0 }}>
						<Text size={0} style={{ fontFamily: 'monospace', minWidth: '2.5rem', flexShrink: 0, opacity: hasFile ? 1 : 0.5 }}>
							{formatUpper}
						</Text>
						{hasFile ? (
							<Text size={1} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								<a href={fileUrl} target="_blank" rel="noreferrer">{filenames?.[language]?.[format] || 'File'}</a>
							</Text>
						) : (
							<Text size={1} muted>—</Text>
						)}
					</Flex>
					{status === 'ready' && (
						<Flex gap={1} align="center" style={{ flexShrink: 0 }}>
							{buildSource && scriptFileInput[language]?.[buildSource] && (
								<Button mode="ghost" tone="primary" fontSize={1} padding={2} onClick={() => handleGenerateFontFile(format, scriptFileInput[language][buildSource], language)} text="Build" />
							)}
							<Button as="label" mode="ghost" tone="primary" fontSize={1} padding={2} style={{ cursor: 'pointer' }}>
								<Text size={1}>Upload</Text>
								<input ref={ref} type="file" hidden onChange={(e) => handleUpload(e, language, format)} />
							</Button>
							{hasFile && (
								<Button mode="bleed" tone="critical" icon={TrashIcon} padding={2} onClick={() => handleDelete(format, language)} />
							)}
						</Flex>
					)}
				</Flex>
			</Card>
		);
	};

	/** Renders the CSS row — build only, no direct upload. */
	const renderCssRow = (language) => {
		const hasFile = !!scriptFileInput[language]?.css?.asset?._ref;
		const fileUrl = hasFile
			? `https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${scriptFileInput[language].css.asset._ref.replace('file-', '').replace('-', '.')}`
			: null;

		return (
			<Card border radius={1} padding={2}>
				<Flex justify="space-between" align="center" gap={2}>
					<Flex gap={3} align="center" style={{ flex: 1, minWidth: 0 }}>
						<Text size={0} style={{ fontFamily: 'monospace', minWidth: '2.5rem', flexShrink: 0, opacity: hasFile ? 1 : 0.5 }}>CSS</Text>
						{hasFile ? (
							<Text size={1} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								<a href={fileUrl} target="_blank" rel="noreferrer">{filenames?.[language]?.css || 'File'}</a>
							</Text>
						) : (
							<Text size={1} muted>—</Text>
						)}
					</Flex>
					{status === 'ready' && (
						<Flex gap={1} align="center" style={{ flexShrink: 0 }}>
							{scriptFileInput[language]?.woff2 && (
								<Button mode="ghost" tone="primary" fontSize={1} padding={2} onClick={() => handleGenerateCssFile(language)} text="Build" />
							)}
							{hasFile && (
								<Button mode="bleed" tone="critical" icon={TrashIcon} padding={2} onClick={() => handleDelete('css', language)} />
							)}
						</Flex>
					)}
				</Flex>
			</Card>
		);
	};

	return (
		<Stack space={3}>
			{SCRIPTS.map((language, i) => (
				<Card border radius={2} padding={3} key={'language-' + i}>
					<Stack space={2}>
						<Flex justify="space-between" align="center" gap={2}>
							<Text size={1} weight="semibold" style={{ flexShrink: 0 }}>{language[0]?.toUpperCase() + language.slice(1)}</Text>
							{message[language] && (
								<Text size={1} muted style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{message[language]}</Text>
							)}
						</Flex>

						{renderFormatRow('ttf', language)}

						{status === 'ready' && scriptFileInput[language]?.ttf && (
							<Button
								mode="ghost"
								tone="primary"
								onClick={() => handleGenerateFontFile('all', scriptFileInput[language].ttf, language)}
								text="Regenerate Files from TTF"
								style={{ width: '100%' }}
							/>
						)}

						{renderFormatRow('otf', language, 'woff')}
						{renderFormatRow('woff', language, 'ttf')}
						{renderFormatRow('woff2', language, 'ttf')}
						{renderFormatRow('eot', language, 'ttf')}
						{renderFormatRow('svg', language, 'ttf')}
						{renderCssRow(language)}

						{status === 'ready' && (scriptFileInput[language]?.ttf || scriptFileInput[language]?.otf || scriptFileInput[language]?.woff || scriptFileInput[language]?.woff2) && (
							<Button mode="ghost" tone="critical" onClick={() => handleDeleteAll(language)} text="Delete All" style={{ width: '100%' }} />
						)}
					</Stack>
				</Card>
			))}
		</Stack>
	);
};
