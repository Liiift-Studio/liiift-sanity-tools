// Per-font file manager: upload/build/delete buttons for each font format

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Stack, Flex, Box, Text } from '@sanity/ui';
import { useFormValue, set, unset } from 'sanity';
import { Buffer } from 'buffer';
import * as fontkit from 'fontkit';

import { useSanityClient } from '../hooks/useSanityClient';
import {
	readFontFile,
	extractFontMetadata,
	determineWeight,
} from '../utils/processFontFiles';
import { generateStyleKeywords } from '../utils/generateKeywords';
import generateCssFile from '../utils/generateCssFile';
import generateFontData from '../utils/generateFontData';
import generateFontFile from '../utils/generateFontFile';
import { parseVariableFontInstances } from '../utils/parseVariableFontInstances';
import StatusDisplay from './StatusDisplay';

/**
 * Font file manager rendered inside a font document.
 * Shows TTF/OTF/WOFF/WOFF2/EOT/SVG/CSS rows, each with Upload/Build/Delete controls.
 * @param {Object} props
 * @param {Object} props.elementProps
 * @param {Function} props.onChange
 * @param {string} props.value - Current fileInput value
 */
export const SingleUploaderTool = (props) => {
	const client = useSanityClient();

	const { elementProps: { ref }, onChange, value = '' } = props;

	const [message, setMessage] = useState('');
	const [status, setStatus] = useState('ready');
	const [error, setError] = useState(false);
	const [filenames, setFilenames] = useState({});

	const fileInput = useFormValue(['fileInput']);
	const doc_id = useFormValue(['_id']);
	const doc_title = useFormValue(['title']);
	const doc_typefaceName = useFormValue(['typefaceName']);
	const doc_variableFont = useFormValue(['variableFont']);
	const doc_weight = useFormValue(['weight']);
	const doc_style = useFormValue(['style']);
	const doc_slug = useFormValue(['slug']);
	const doc_metaData = useFormValue(['metaData']);

	const { weightKeywordList, italicKeywordList } = useMemo(() => generateStyleKeywords(), []);

	useEffect(() => { handleSetFilenames(); }, [fileInput]);

	/** Fetches filenames for all uploaded font assets in a single GROQ request. */
	const handleSetFilenames = useCallback(async () => {
		const assetIds = [
			fileInput?.ttf?.asset?._ref,
			fileInput?.otf?.asset?._ref,
			fileInput?.woff?.asset?._ref,
			fileInput?.woff2?.asset?._ref,
			fileInput?.eot?.asset?._ref,
			fileInput?.svg?.asset?._ref,
			fileInput?.css?.asset?._ref,
		].filter(Boolean);

		if (assetIds.length === 0) { setFilenames({}); return; }

		const assetData = await client.fetch(
			`*[_id in $assetIds]{ _id, originalFilename }`,
			{ assetIds }
		);

		const fontNames = assetData.reduce((acc, cur) => {
			if (cur.originalFilename.endsWith('.ttf')) acc.ttf = cur.originalFilename;
			else if (cur.originalFilename.endsWith('.otf')) acc.otf = cur.originalFilename;
			else if (cur.originalFilename.endsWith('.woff2')) acc.woff2 = cur.originalFilename;
			else if (cur.originalFilename.endsWith('.woff')) acc.woff = cur.originalFilename;
			else if (cur.originalFilename.endsWith('.eot')) acc.eot = cur.originalFilename;
			else if (cur.originalFilename.endsWith('.svg')) acc.svg = cur.originalFilename;
			else if (cur.originalFilename.endsWith('.css')) acc.css = cur.originalFilename;
			return acc;
		}, {});

		setFilenames(fontNames);
	}, [fileInput, client]);

	/** Regenerates the @font-face CSS file from the stored woff2 asset. */
	const handleGenerateCssFile = useCallback(async () => {
		setMessage('Generating CSS: ' + doc_title + '.css');
		setStatus('Generating CSS file');
		setError(false);

		try {
			const woff2AssetRef = fileInput?.woff2?.asset?._ref;
			if (!woff2AssetRef) throw new Error('No woff2 file available');

			// Parameterized — woff2AssetRef is a Sanity asset ID
			const [woff2Asset] = await client.fetch(
				`*[_id == $id]{ originalFilename, url }`,
				{ id: woff2AssetRef }
			);

			const blob = await (await fetch(woff2Asset.url)).blob();

			const newFileInput = await generateCssFile({
				woff2File: blob,
				fileInput: fileInput,
				fontName: doc_title,
				fileName: woff2Asset.originalFilename.replace('.woff2', ''),
				variableFont: doc_variableFont,
				weight: doc_weight,
				client: client,
			});

			setMessage('CSS generated');
			setStatus('CSS generated successfully');
			setTimeout(() => { setMessage(''); setStatus('ready'); }, 2000);
			onChange(set(newFileInput));
		} catch (err) {
			console.error('Error generating CSS file:', err);
			setMessage('Error generating CSS file: ' + err.message);
			setStatus('Error generating CSS file');
			setError(true);
			setTimeout(() => { setMessage(''); setStatus('ready'); setError(false); }, 3000);
		}
	}, [fileInput, onChange, doc_title, doc_variableFont, doc_weight, client]);

	/** Converts and uploads the source font file to one or more target formats. */
	const handleGenerateFontFile = useCallback(async (code, sourceFile) => {
		setMessage(`Generating ${code === 'all' ? 'all font files' : code + ' file'}...`);
		setStatus(`Generating ${code === 'all' ? 'all font files' : code + ' file'}`);
		setError(false);

		try {
			const url = `https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${sourceFile?.asset?._ref.replace('file-', '').replace('-', '.')}`;
			const codes = code === 'all' ? ['otf', 'woff', 'woff2', 'eot', 'svg', 'data'] : [code];

			await generateFontFile({
				codes,
				srcUrl: url,
				filename: doc_slug.current,
				documentId: doc_id,
				documentTitle: doc_title,
				documentVariableFont: doc_variableFont,
				documentStyle: doc_style,
				documentWeight: doc_weight,
				fileInput: fileInput,
				client: client,
			});

			setMessage('Files generated');
			setStatus('Files generated successfully');
			setTimeout(() => { setMessage(''); setStatus('ready'); }, 2000);
		} catch (err) {
			console.error('Error generating font files:', err);
			setMessage('Error generating font files: ' + err.message);
			setStatus('Error generating font files');
			setError(true);
			setTimeout(() => { setMessage(''); setStatus('ready'); setError(false); }, 3000);
		}
	}, [doc_id, doc_title, doc_variableFont, doc_style, doc_weight, doc_slug, fileInput, client]);

	/** Re-extracts metadata from the stored TTF and regenerates font data fields. */
	const handleGenerateFontData = useCallback(async () => {
		setMessage('Generating font data...');
		setStatus('Generating font data');
		setError(false);

		try {
			if (!fileInput?.ttf?.asset?._ref) {
				setMessage('Error: TTF file is required for font data generation');
				setStatus('Error: TTF file is required');
				setError(true);
				setTimeout(() => { setMessage(''); setStatus('ready'); setError(false); }, 2000);
				return;
			}

			// Parameterized — prevents injection from stored asset _ref values
			const [ttfAsset] = await client.fetch(
				`*[_id == $id]{ url }`,
				{ id: fileInput.ttf.asset._ref }
			);

			if (!ttfAsset?.url) throw new Error('Could not fetch TTF file URL');

			const arrayBuffer = await (await fetch(ttfAsset.url)).arrayBuffer();
			const font = fontkit.create(Buffer.from(arrayBuffer));

			const { weightName, subfamilyName, style, variableFont } = extractFontMetadata(
				font,
				doc_typefaceName,
				weightKeywordList,
				italicKeywordList,
			);
			const weight = determineWeight(font, weightName);

			await client.patch(doc_id).set({ weightName, subfamily: subfamilyName, style, variableFont, weight }).commit();

			const fontData = await generateFontData({
				url: ttfAsset.url,
				fontKit: font,
				fontId: doc_id,
				client: client,
				commit: true,
			});

			if (variableFont && fontData.variableInstances) {
				const fontObj = {
					_id: doc_id,
					typefaceName: doc_typefaceName,
					variableFont,
					variableInstances: fontData.variableInstances,
				};
				const instanceMappings = await parseVariableFontInstances(fontObj, client);
				if (instanceMappings.length > 0) {
					await client.patch(doc_id).set({ variableInstanceReferences: instanceMappings }).commit();
				}
			}

			setMessage('Font data generated successfully');
			setStatus('Font data generated successfully');
			setTimeout(() => { setMessage(''); setStatus('ready'); }, 2000);
		} catch (err) {
			console.error('Error generating font data:', err);
			setMessage('Error generating font data: ' + err.message);
			setStatus('Error generating font data');
			setError(true);
			setTimeout(() => { setMessage(''); setStatus('ready'); setError(false); }, 3000);
		}
	}, [fileInput, doc_id, doc_typefaceName, client, weightKeywordList, italicKeywordList]);

	/** Uploads a single font file and triggers CSS/metadata generation as appropriate. */
	const handleUpload = useCallback(async (event, code) => {
		try {
			const file = event.target.files[0];
			if (!file) { setMessage('No file selected'); setStatus('No file selected'); setError(true); return; }

			const ext = file.name.split('.').pop();
			const filename = doc_slug.current + '.' + ext;

			setMessage('Uploading: ' + filename);
			setStatus('Uploading: ' + filename);
			setError(false);

			const asset = await client.assets.upload('file', file, { filename });

			let newFileInput = {
				...fileInput,
				[code]: { _type: 'file', asset: { _ref: asset._id, _type: 'reference' } },
			};

			setMessage(filename + ' uploaded');
			setStatus(filename + ' uploaded successfully');

			if (code === 'woff2') {
				setMessage('Generating CSS: ' + doc_title + '.css');
				setStatus('Generating CSS file');
				newFileInput = await generateCssFile({
					woff2File: file,
					fileInput: newFileInput,
					fontName: doc_title,
					fileName: filename.replace('.woff2', ''),
					variableFont: doc_variableFont,
					weight: doc_weight,
					client: client,
				});
				setMessage(doc_title + '.css generated');
				setStatus('CSS file generated successfully');
			}

			if (code === 'ttf') {
				const fontBuffer = await readFontFile(file);
				const font = fontkit.create(fontBuffer);
				const { weightName, subfamilyName, style, variableFont } = extractFontMetadata(
					font, doc_typefaceName, weightKeywordList, italicKeywordList
				);
				const weight = determineWeight(font, weightName);
				const normalizedId = doc_id.startsWith('drafts.') ? doc_id.replace('drafts.', '') : doc_id;
				await client.patch(normalizedId).set({ weightName, subfamily: subfamilyName, style, variableFont, weight }).commit();
			}

			onChange(set(newFileInput));
			setTimeout(() => { setMessage(''); setStatus('ready'); }, 2000);
		} catch (err) {
			console.error('Error uploading file:', err);
			setMessage('Error uploading file: ' + err.message);
			setStatus('Error uploading file');
			setError(true);
			setTimeout(() => { setMessage(''); setStatus('ready'); setError(false); }, 3000);
		}
	}, [fileInput, onChange, doc_title, doc_typefaceName, doc_variableFont, doc_weight, doc_slug, doc_id, client, weightKeywordList, italicKeywordList]);

	/** Deletes a single font file asset and removes its reference from the document. */
	const handleDelete = useCallback(async (code) => {
		try {
			setMessage(`Deleting ${code} file...`);
			setStatus(`Deleting ${code} file`);
			setError(false);

			const asset = fileInput[code]?.asset?._ref;
			if (!asset) { setMessage(`No ${code} file to delete`); setStatus(`No ${code} file to delete`); setError(true); return; }

			onChange(unset([code]));
			await client.delete(asset);

			setMessage(`${code} file deleted`);
			setStatus(`${code} file deleted successfully`);
			setTimeout(() => { setMessage(''); setStatus('ready'); }, 2000);
		} catch (err) {
			console.error('Error deleting asset:', err);
			setMessage('WARNING: ' + err.message);
			setStatus('Error deleting asset');
			setError(true);
			setTimeout(() => { setMessage(''); setStatus('ready'); setError(false); }, 3000);
		}
	}, [fileInput, onChange, client]);

	/** Deletes all font file assets and resets all metadata fields. */
	const handleDeleteAll = useCallback(async () => {
		try {
			setMessage('Deleting all files and metadata...');
			setStatus('Deleting all files and metadata');
			setError(false);

			onChange(unset([]));

			await client.patch(doc_id).set({
				characterSet: { chars: [] },
				glyphCount: 0,
				metaData: undefined,
				metrics: undefined,
				normalWeight: undefined,
				price: 0,
				sell: false,
				style: 'Normal',
				variableAxes: undefined,
				variableFont: false,
				weight: 400,
				variableInstances: undefined,
			}).commit();

			for (const refKey of Object.keys(fileInput)) {
				if (refKey === 'documentInfo') continue;
				const asset = value[refKey]?.asset?._ref;
				if (!asset) continue;
				try { await client.delete(asset); } catch (e) { console.error('Error deleting asset:', e.message); }
			}

			setMessage('All files and metadata deleted');
			setStatus('All files and metadata deleted successfully');
			setTimeout(() => { setMessage(''); setStatus('ready'); }, 2000);
		} catch (err) {
			console.error('Error deleting all files:', err);
			setMessage('Delete error: ' + err.message);
			setStatus('Error deleting all files');
			setError(true);
			setTimeout(() => { setMessage(''); setStatus('ready'); setError(false); }, 3000);
		}
	}, [fileInput, value, doc_id, onChange, client]);

	/** Renders an Upload/Build/Delete row for a given font format. */
	const renderFontSection = (format, buildSource = null) => {
		const formatUpper = format.toUpperCase();
		const hasFile = fileInput?.[format]?.asset?._ref;
		const fileUrl = hasFile
			? `https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${fileInput[format].asset._ref.replace('file-', '').replace('-', '.')}`
			: null;

		return (
			<Flex justify="space-between" align="center" wrap="wrap" gap={2}>
				<Box style={{ flex: 1, minWidth: '200px' }}>
					{!hasFile ? (
						<Text size={1}>{formatUpper}:&nbsp;<strong>{filenames?.[format] || 'Empty'}</strong></Text>
					) : (
						<Text size={1}>
							{formatUpper}:&nbsp;
							<a href={fileUrl} target="_blank" rel="noreferrer">
								<strong>{filenames?.[format] || 'File'}</strong>
							</a>
						</Text>
					)}
				</Box>
				<Flex gap={2} align="center">
					{status === 'ready' && (
						<>
							{buildSource && value?.[buildSource] && (
								<Button mode="default" tone="primary" onClick={() => handleGenerateFontFile(format, value[buildSource])} text="Build" />
							)}
							<Button as="label" mode="ghost" tone="primary" style={{ cursor: 'pointer' }}>
								<Text>Upload</Text>
								<input ref={ref} type="file" placeholder="Upload file" hidden onChange={(e) => handleUpload(e, format)} />
							</Button>
							{value?.[format] && (
								<Button mode="ghost" tone="critical" onClick={() => handleDelete(format)} text="×" />
							)}
						</>
					)}
				</Flex>
			</Flex>
		);
	};

	return (
		<Stack space={3}>
			<Box>
				<StatusDisplay status={status} error={error} />
			</Box>

			{renderFontSection('ttf')}

			{status === 'ready' && value?.ttf && (
				<Box>
					<Button
						mode="default"
						tone="primary"
						onClick={() => handleGenerateFontFile('all', value.ttf)}
						text="Regenerate Files/Data from TTF"
						style={{ width: '100%' }}
					/>
				</Box>
			)}

			{renderFontSection('otf', 'woff')}
			{renderFontSection('woff', 'ttf')}
			{renderFontSection('woff2', 'ttf')}
			{renderFontSection('eot', 'ttf')}
			{renderFontSection('svg', 'ttf')}

			{/* CSS row — Build only (no direct upload) */}
			<Flex justify="space-between" align="center" wrap="wrap" gap={2}>
				<Box style={{ flex: 1, minWidth: '200px' }}>
					{!fileInput?.css?.asset?._ref ? (
						<Text size={1}>CSS:&nbsp;<strong>{filenames?.css || 'Empty'}</strong></Text>
					) : (
						<Text size={1}>
							CSS:&nbsp;
							<a
								href={`https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${fileInput.css.asset._ref.replace('file-', '').replace('-', '.')}`}
								target="_blank"
								rel="noreferrer"
							>
								<strong>{filenames?.css || 'File'}</strong>
							</a>
						</Text>
					)}
				</Box>
				<Flex gap={2} align="center">
					{status === 'ready' && (
						<>
							{value?.woff2 && <Button mode="default" tone="primary" onClick={() => handleGenerateCssFile()} text="Build" />}
							{value?.css && <Button mode="ghost" tone="critical" onClick={() => handleDelete('css')} text="×" />}
						</>
					)}
				</Flex>
			</Flex>

			{/* Data row */}
			<Flex justify="space-between" align="center" wrap="wrap" gap={2}>
				<Box style={{ flex: 1, minWidth: '200px' }}>
					<Text size={1}>
						Data:&nbsp;
						{doc_metaData?.version
							? <strong>v{doc_metaData.version} ({doc_metaData.genDate})</strong>
							: <strong>Empty</strong>
						}
					</Text>
				</Box>
				<Flex gap={2} align="center">
					{status === 'ready' && value?.ttf &&
						<Button mode="default" tone="primary" onClick={() => handleGenerateFontData()} text="Generate" />
					}
				</Flex>
			</Flex>

			{status === 'ready' && (value?.ttf || value?.otf || value?.woff || value?.woff2) &&
				<Box>
					<Button mode="ghost" tone="critical" onClick={() => handleDeleteAll()} text="Delete All" style={{ width: '100%' }} />
				</Box>
			}
		</Stack>
	);
};
