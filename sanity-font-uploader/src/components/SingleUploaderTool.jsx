// Per-font file manager: upload/build/delete buttons for each font format

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Stack, Flex, Box, Text, Card } from '@sanity/ui';
import { TrashIcon } from '@sanity/icons';
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
 * Shows TTF/OTF/WOFF/WOFF2/WEB/SUBSET/EOT/SVG/CSS/DATA rows with Upload/Build/Delete controls.
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

	// Fingerprinted web delivery and subset WOFF2 — stored as top-level document fields
	const doc_woff2_web = useFormValue(['woff2_web']);
	const doc_woff2_subset = useFormValue(['woff2_subset']);

	const { weightKeywordList, italicKeywordList } = useMemo(() => generateStyleKeywords(), []);

	useEffect(() => { handleSetFilenames(); }, [fileInput, doc_woff2_web, doc_woff2_subset]);

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
			doc_woff2_web?.asset?._ref,
			doc_woff2_subset?.asset?._ref,
		].filter(Boolean);

		if (assetIds.length === 0) { setFilenames({}); return; }

		const assetData = await client.fetch(
			`*[_id in $assetIds]{ _id, originalFilename }`,
			{ assetIds }
		);

		const fontNames = assetData.reduce((acc, cur) => {
			if (cur.originalFilename.endsWith('.ttf')) acc.ttf = cur.originalFilename;
			else if (cur.originalFilename.endsWith('.otf')) acc.otf = cur.originalFilename;
			else if (cur.originalFilename.endsWith('.woff2') && cur._id === doc_woff2_web?.asset?._ref) acc.woff2_web = cur.originalFilename;
			else if (cur.originalFilename.endsWith('.woff2') && cur._id === doc_woff2_subset?.asset?._ref) acc.woff2_subset = cur.originalFilename;
			else if (cur.originalFilename.endsWith('.woff2')) acc.woff2 = cur.originalFilename;
			else if (cur.originalFilename.endsWith('.woff')) acc.woff = cur.originalFilename;
			else if (cur.originalFilename.endsWith('.eot')) acc.eot = cur.originalFilename;
			else if (cur.originalFilename.endsWith('.svg')) acc.svg = cur.originalFilename;
			else if (cur.originalFilename.endsWith('.css')) acc.css = cur.originalFilename;
			return acc;
		}, {});

		setFilenames(fontNames);
	}, [fileInput, doc_woff2_web, doc_woff2_subset, client]);

	/** Regenerates the @font-face CSS file from the stored woff2 asset. */
	const handleGenerateCssFile = useCallback(async () => {
		setMessage('Building CSS: ' + doc_title + '.css');
		setStatus('Building CSS file');
		setError(false);

		try {
			const woff2AssetRef = fileInput?.woff2?.asset?._ref;
			if (!woff2AssetRef) throw new Error('No woff2 file available');

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

			setMessage('CSS built');
			setStatus('CSS built successfully');
			setTimeout(() => { setMessage(''); setStatus('ready'); }, 2000);
			onChange(set(newFileInput));
		} catch (err) {
			console.error('Error building CSS file:', err);
			setMessage('Error building CSS file: ' + err.message);
			setStatus('Error building CSS file');
			setError(true);
			setTimeout(() => { setMessage(''); setStatus('ready'); setError(false); }, 3000);
		}
	}, [fileInput, onChange, doc_title, doc_variableFont, doc_weight, client]);

	/** Converts and uploads the source font file to one or more target formats. */
	const handleGenerateFontFile = useCallback(async (code, sourceFile) => {
		setMessage(`Building ${code === 'all' ? 'all font files' : code + ' file'}...`);
		setStatus(`Building ${code === 'all' ? 'all font files' : code + ' file'}`);
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

			setMessage('Files built');
			setStatus('Files built successfully');
			setTimeout(() => { setMessage(''); setStatus('ready'); }, 2000);
		} catch (err) {
			console.error('Error building font files:', err);
			setMessage('Error building font files: ' + err.message);
			setStatus('Error building font files');
			setError(true);
			setTimeout(() => { setMessage(''); setStatus('ready'); setError(false); }, 3000);
		}
	}, [doc_id, doc_title, doc_variableFont, doc_style, doc_weight, doc_slug, fileInput, client]);

	/** Re-extracts metadata from the stored TTF and regenerates font data fields. */
	const handleGenerateFontData = useCallback(async () => {
		setMessage('Building font data...');
		setStatus('Building font data');
		setError(false);

		try {
			if (!fileInput?.ttf?.asset?._ref) {
				setMessage('Error: TTF file is required for font data generation');
				setStatus('Error: TTF file is required');
				setError(true);
				setTimeout(() => { setMessage(''); setStatus('ready'); setError(false); }, 2000);
				return;
			}

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

			setMessage('Font data built successfully');
			setStatus('Font data built successfully');
			setTimeout(() => { setMessage(''); setStatus('ready'); }, 2000);
		} catch (err) {
			console.error('Error building font data:', err);
			setMessage('Error building font data: ' + err.message);
			setStatus('Error building font data');
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
				setMessage('Building CSS: ' + doc_title + '.css');
				setStatus('Building CSS file');
				newFileInput = await generateCssFile({
					woff2File: file,
					fileInput: newFileInput,
					fontName: doc_title,
					fileName: filename.replace('.woff2', ''),
					variableFont: doc_variableFont,
					weight: doc_weight,
					style: doc_style || 'Normal',
					client: client,
				});
				setMessage(doc_title + '.css built');
				setStatus('CSS file built successfully');
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

	/** Deletes a single fileInput font file asset. */
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

	/** Deletes a top-level document field asset (woff2_web, woff2_subset). */
	const handleDeleteTopLevel = useCallback(async (fieldName, assetRef) => {
		try {
			setMessage(`Deleting ${fieldName}...`);
			setStatus(`Deleting ${fieldName}`);
			setError(false);

			await client.patch(doc_id).unset([fieldName]).commit();
			if (assetRef) await client.delete(assetRef);

			setMessage(`${fieldName} deleted`);
			setStatus(`${fieldName} deleted successfully`);
			setTimeout(() => { setMessage(''); setStatus('ready'); }, 2000);
		} catch (err) {
			console.error(`Error deleting ${fieldName}:`, err);
			setMessage('Error: ' + err.message);
			setStatus(`Error deleting ${fieldName}`);
			setError(true);
			setTimeout(() => { setMessage(''); setStatus('ready'); setError(false); }, 3000);
		}
	}, [doc_id, client]);

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
			}).unset(['woff2_web', 'woff2_subset']).commit();

			const allAssets = [
				...Object.keys(fileInput).filter(k => k !== 'documentInfo').map(k => fileInput[k]?.asset?._ref),
				doc_woff2_web?.asset?._ref,
				doc_woff2_subset?.asset?._ref,
			].filter(Boolean);

			for (const assetRef of allAssets) {
				try { await client.delete(assetRef); } catch (e) { console.error('Error deleting asset:', e.message); }
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
	}, [fileInput, value, doc_id, doc_woff2_web, doc_woff2_subset, onChange, client]);

	/** Renders a bordered upload/build/delete row for a fileInput format. */
	const renderFontSection = (format, buildSource = null) => {
		const formatUpper = format.toUpperCase();
		const hasFile = !!fileInput?.[format]?.asset?._ref;
		const fileUrl = hasFile
			? `https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${fileInput[format].asset._ref.replace('file-', '').replace('-', '.')}`
			: null;

		return (
			<Card border radius={1} paddingX={2} paddingY={3}>
				<Flex justify="space-between" align="center" gap={2}>
					<Flex gap={3} align="center" style={{ flex: 1, minWidth: 0 }}>
						<Text size={0} style={{ fontFamily: 'monospace', minWidth: '2.5rem', flexShrink: 0, opacity: hasFile ? 1 : 0.5 }}>
							{formatUpper}
						</Text>
						{hasFile ? (
							<Text size={1} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								<a href={fileUrl} target="_blank" rel="noreferrer">{filenames?.[format] || 'File'}</a>
							</Text>
						) : (
							<Text size={1} muted>—</Text>
						)}
					</Flex>
					{status === 'ready' && (
						<Flex gap={1} align="center" style={{ flexShrink: 0 }}>
							{buildSource && fileInput?.[buildSource] && (
								<Button mode="ghost" tone="primary" fontSize={1} padding={2} onClick={() => handleGenerateFontFile(format, fileInput[buildSource])} text="Build" />
							)}
							<Button as="label" mode="ghost" tone="primary" fontSize={1} padding={2} style={{ cursor: 'pointer' }}>
								<Text size={1}>Upload</Text>
								<input ref={ref} type="file" hidden onChange={(e) => handleUpload(e, format)} />
							</Button>
							{hasFile && (
								<Button mode="bleed" tone="critical" icon={TrashIcon} padding={2} onClick={() => handleDelete(format)} />
							)}
						</Flex>
					)}
				</Flex>
			</Card>
		);
	};

	/** Renders a read-only row for a top-level document asset field (woff2_web, woff2_subset). */
	const renderTopLevelAssetSection = (label, fieldName, assetRef, filename) => {
		const hasFile = !!assetRef;
		const fileUrl = hasFile
			? `https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${assetRef.replace('file-', '').replace('-', '.')}`
			: null;

		return (
			<Card border radius={1} paddingX={2} paddingY={3} tone={hasFile ? 'transparent' : 'transparent'}>
				<Flex justify="space-between" align="center" gap={2}>
					<Flex gap={3} align="center" style={{ flex: 1, minWidth: 0 }}>
						<Text size={0} style={{ fontFamily: 'monospace', minWidth: '2.5rem', flexShrink: 0, opacity: hasFile ? 1 : 0.5 }}>
							{label}
						</Text>
						{hasFile ? (
							<Text size={1} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								<a href={fileUrl} target="_blank" rel="noreferrer">{filename || 'File'}</a>
							</Text>
						) : (
							<Text size={1} muted>—</Text>
						)}
					</Flex>
					{status === 'ready' && hasFile && (
						<Flex gap={1} align="center" style={{ flexShrink: 0 }}>
							<Button mode="bleed" tone="critical" icon={TrashIcon} padding={2} onClick={() => handleDeleteTopLevel(fieldName, assetRef)} />
						</Flex>
					)}
				</Flex>
			</Card>
		);
	};

	/** Renders the CSS row — build-only, no direct upload. */
	const renderCssSection = () => {
		const hasFile = !!fileInput?.css?.asset?._ref;
		const fileUrl = hasFile
			? `https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${fileInput.css.asset._ref.replace('file-', '').replace('-', '.')}`
			: null;

		return (
			<Card border radius={1} paddingX={2} paddingY={3}>
				<Flex justify="space-between" align="center" gap={2}>
					<Flex gap={3} align="center" style={{ flex: 1, minWidth: 0 }}>
						<Text size={0} style={{ fontFamily: 'monospace', minWidth: '2.5rem', flexShrink: 0, opacity: hasFile ? 1 : 0.5 }}>
							CSS
						</Text>
						{hasFile ? (
							<Text size={1} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								<a href={fileUrl} target="_blank" rel="noreferrer">{filenames?.css || 'File'}</a>
							</Text>
						) : (
							<Text size={1} muted>—</Text>
						)}
					</Flex>
					{status === 'ready' && (
						<Flex gap={1} align="center" style={{ flexShrink: 0 }}>
							{fileInput?.woff2 && (
								<Button mode="ghost" tone="primary" fontSize={1} padding={2} onClick={() => handleGenerateCssFile()} text="Build" />
							)}
							{hasFile && (
								<Button mode="bleed" tone="critical" icon={TrashIcon} padding={2} onClick={() => handleDelete('css')} />
							)}
						</Flex>
					)}
				</Flex>
			</Card>
		);
	};

	/** Renders the Data row — shows metadata version and build button. */
	const renderDataSection = () => (
		<Card border radius={1} paddingX={2} paddingY={3}>
			<Flex justify="space-between" align="center" gap={2}>
				<Flex gap={3} align="center" style={{ flex: 1, minWidth: 0 }}>
					<Text size={0} style={{ fontFamily: 'monospace', minWidth: '2.5rem', flexShrink: 0, opacity: doc_metaData?.version ? 1 : 0.5 }}>
						DATA
					</Text>
					{doc_metaData?.version ? (
						<Text size={1}>v{doc_metaData.version} <Text as="span" size={1} muted>({doc_metaData.genDate})</Text></Text>
					) : (
						<Text size={1} muted>—</Text>
					)}
				</Flex>
				{status === 'ready' && fileInput?.ttf && (
					<Flex gap={1} align="center" style={{ flexShrink: 0 }}>
						<Button mode="ghost" tone="primary" fontSize={1} padding={2} onClick={() => handleGenerateFontData()} text="Build" />
					</Flex>
				)}
			</Flex>
		</Card>
	);

	return (
		<Stack space={2}>
			<StatusDisplay status={status} error={error} />

			{renderFontSection('ttf')}

			{status === 'ready' && fileInput?.ttf && (
				<Button
					mode="ghost"
					tone="primary"
					onClick={() => handleGenerateFontFile('all', fileInput.ttf)}
					text="Regenerate Files / Data from TTF"
					style={{ width: '100%' }}
				/>
			)}

			{renderFontSection('otf', 'woff')}
			{renderFontSection('woff', 'ttf')}
			{renderFontSection('woff2', 'ttf')}
			{renderTopLevelAssetSection('WEB', 'woff2_web', doc_woff2_web?.asset?._ref, filenames?.woff2_web)}
			{renderTopLevelAssetSection('SUBSET', 'woff2_subset', doc_woff2_subset?.asset?._ref, filenames?.woff2_subset)}
			{renderFontSection('eot', 'ttf')}
			{renderFontSection('svg', 'ttf')}
			{renderCssSection()}
			{renderDataSection()}

			{status === 'ready' && (fileInput?.ttf || fileInput?.otf || fileInput?.woff || fileInput?.woff2) && (
				<Button mode="ghost" tone="critical" onClick={() => handleDeleteAll()} text="Delete All" style={{ width: '100%' }} />
			)}
		</Stack>
	);
};
