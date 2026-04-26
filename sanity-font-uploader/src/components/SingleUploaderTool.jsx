// Per-font file manager: upload/build/delete buttons for each font format

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Grid, Stack, Flex, Box, Text, Card } from '@sanity/ui';
import { TrashIcon, ControlsIcon } from '@sanity/icons';
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
import generateSubset from '../utils/generateSubset';
import { parseVariableFontInstances } from '../utils/parseVariableFontInstances';
import StatusDisplay from './StatusDisplay';

/**
 * Font file manager rendered inside a font document.
 * Shows TTF/OTF/WOFF/WOFF2/WEB/SUBSET/EOT/SVG/CSS/DATA rows with Upload/Build/Delete controls.
 * @param {Object} props
 * @param {Object} props.elementProps
 * @param {Function} props.onChange
 */
export const SingleUploaderTool = (props) => {
	const client = useSanityClient();

	const { elementProps: { ref }, onChange } = props;

	const [message, setMessage] = useState('');
	const [status, setStatus] = useState('ready');
	const [error, setError] = useState(false);
	const [filenames, setFilenames] = useState({});
	const [showAdvanced, setShowAdvanced] = useState(false);

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

	/** Fetches originalFilename for each asset ref in fileInput (including woff2_web/woff2_subset). */
	const handleSetFilenames = useCallback(async () => {
		const woff2WebRef = fileInput?.woff2_web?.asset?._ref ?? null;
		const woff2SubsetRef = fileInput?.woff2_subset?.asset?._ref ?? null;

		const assetIds = [
			fileInput?.ttf?.asset?._ref,
			fileInput?.otf?.asset?._ref,
			fileInput?.woff?.asset?._ref,
			fileInput?.woff2?.asset?._ref,
			fileInput?.eot?.asset?._ref,
			fileInput?.svg?.asset?._ref,
			fileInput?.css?.asset?._ref,
			woff2WebRef,
			woff2SubsetRef,
		].filter(Boolean);

		if (assetIds.length === 0) { setFilenames({}); return; }

		const assetData = await client.fetch(
			`*[_id in $assetIds]{ _id, originalFilename }`,
			{ assetIds }
		);

		const fontNames = assetData.reduce((acc, cur) => {
			if (cur.originalFilename.endsWith('.ttf')) acc.ttf = cur.originalFilename;
			else if (cur.originalFilename.endsWith('.otf')) acc.otf = cur.originalFilename;
			else if (cur.originalFilename.endsWith('.woff2') && cur._id === woff2WebRef) acc.woff2_web = cur.originalFilename;
			else if (cur.originalFilename.endsWith('.woff2') && cur._id === woff2SubsetRef) acc.woff2_subset = cur.originalFilename;
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
		const isMissing = Array.isArray(code);
		const label = code === 'all' ? 'all font files' : isMissing ? 'missing files' : code + ' file';
		setMessage(`Building ${label}...`);
		setStatus(`Building ${label}`);
		setError(false);

		try {
			const url = `https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${sourceFile?.asset?._ref.replace('file-', '').replace('-', '.')}`;
			const codes = code === 'all' ? ['otf', 'woff', 'woff2', 'eot', 'svg', 'data'] : isMissing ? code : [code];

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

	/** Builds woff2_web (DS-WEB fingerprinted) and woff2_subset from the existing woff2 via fontWorker. */
	const handleGenerateSubsetAndWeb = useCallback(async () => {
		try {
			const woff2AssetRef = fileInput?.woff2?.asset?._ref;
			if (!woff2AssetRef) throw new Error('No woff2 file available');

			setMessage('Building WEB + SUBSET files...');
			setStatus('Building WEB + SUBSET');
			setError(false);

			const [woff2Asset] = await client.fetch(
				`*[_id == $id]{ originalFilename, url }`,
				{ id: woff2AssetRef }
			);

			await generateSubset({
				woff2Url: woff2Asset.url,
				filename: doc_slug.current,
				documentId: doc_id,
				documentTitle: doc_title,
				documentVariableFont: doc_variableFont,
				documentStyle: doc_style,
				documentWeight: doc_weight,
			});

			setMessage('WEB + SUBSET building in background');
			setStatus('Building in background');
			setTimeout(() => { setMessage(''); setStatus('ready'); }, 4000);
		} catch (err) {
			console.error('Error building WEB + SUBSET:', err);
			setMessage('Error: ' + err.message);
			setStatus('Error building WEB + SUBSET');
			setError(true);
			setTimeout(() => { setMessage(''); setStatus('ready'); setError(false); }, 3000);
		}
	}, [fileInput, doc_id, doc_title, doc_variableFont, doc_style, doc_weight, doc_slug, client]);

	/** Uploads a file into fileInput.[fieldName] (woff2_web, woff2_subset). */
	const handleUploadTopLevelFile = useCallback(async (event, fieldName) => {
		try {
			const file = event.target.files[0];
			if (!file) return;

			const ext = file.name.split('.').pop();
			const filename = `${doc_slug.current}-${fieldName}.${ext}`;

			setMessage(`Uploading ${fieldName}...`);
			setStatus(`Uploading ${fieldName}`);
			setError(false);

			const asset = await client.assets.upload('file', file, { filename });
			const newFileInput = {
				...fileInput,
				[fieldName]: { _type: 'file', asset: { _ref: asset._id, _type: 'reference' } },
			};
			onChange(set(newFileInput));

			setMessage(`${fieldName} uploaded`);
			setStatus(`${fieldName} uploaded successfully`);
			setTimeout(() => { setMessage(''); setStatus('ready'); }, 2000);
		} catch (err) {
			console.error(`Error uploading ${fieldName}:`, err);
			setMessage('Error: ' + err.message);
			setStatus(`Error uploading ${fieldName}`);
			setError(true);
			setTimeout(() => { setMessage(''); setStatus('ready'); setError(false); }, 3000);
		}
	}, [fileInput, onChange, doc_slug, client]);

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

	/** Deletes a fileInput sub-field asset (woff2_web, woff2_subset). */
	const handleDeleteTopLevel = useCallback(async (fieldName) => {
		try {
			setMessage(`Deleting ${fieldName}...`);
			setStatus(`Deleting ${fieldName}`);
			setError(false);

			const asset = fileInput?.[fieldName]?.asset?._ref;
			if (!asset) { setMessage(`No ${fieldName} file to delete`); setStatus(`No ${fieldName} file to delete`); setError(true); return; }

			onChange(unset([fieldName]));
			await client.delete(asset);

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

			const allAssets = Object.keys(fileInput)
				.filter(k => k !== 'documentInfo')
				.map(k => fileInput[k]?.asset?._ref)
				.filter(Boolean);

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
	}, [fileInput, doc_id, onChange, client]);

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
							<Box style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								<a href={fileUrl} target="_blank" rel="noreferrer">{filenames?.[format] || 'File'}</a>
							</Box>
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

	/** Renders an upload/build/delete row for a top-level document asset field (woff2_web, woff2_subset). */
	const renderTopLevelAssetSection = (label, fieldName, assetRef, filename, onBuild) => {
		const hasFile = !!assetRef;
		const fileUrl = hasFile
			? `https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${assetRef.replace('file-', '').replace('-', '.')}`
			: null;

		return (
			<Card border radius={1} paddingX={2} paddingY={3}>
				<Flex justify="space-between" align="center" gap={2}>
					<Flex gap={3} align="center" style={{ flex: 1, minWidth: 0 }}>
						<Text size={0} style={{ fontFamily: 'monospace', minWidth: '2.5rem', flexShrink: 0, opacity: hasFile ? 1 : 0.5 }}>
							{label}
						</Text>
						{hasFile ? (
							<Box style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								<a href={fileUrl} target="_blank" rel="noreferrer">{filename || 'File'}</a>
							</Box>
						) : (
							<Text size={1} muted>—</Text>
						)}
					</Flex>
					{status === 'ready' && (
						<Flex gap={1} align="center" style={{ flexShrink: 0 }}>
							{onBuild && fileInput?.woff2 && (
								<Button mode="ghost" tone="primary" fontSize={1} padding={2} onClick={onBuild} text="Build" />
							)}
							<Button as="label" mode="ghost" tone="primary" fontSize={1} padding={2} style={{ cursor: 'pointer' }}>
								<Text size={1}>Upload</Text>
								<input type="file" hidden onChange={(e) => handleUploadTopLevelFile(e, fieldName)} />
							</Button>
							{hasFile && (
								<Button mode="bleed" tone="critical" icon={TrashIcon} padding={2} onClick={() => handleDeleteTopLevel(fieldName)} />
							)}
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
							<Box style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								<a href={fileUrl} target="_blank" rel="noreferrer">{filenames?.css || 'File'}</a>
							</Box>
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
			<StatusDisplay
				status={status}
				error={error}
				action={
					<Button
						mode="bleed"
						icon={ControlsIcon}
						padding={2}
						tone={showAdvanced ? 'primary' : 'default'}
						title="Show advanced file formats"
						onClick={() => setShowAdvanced(v => !v)}
					/>
				}
			/>

			{renderFontSection('ttf')}

			{status === 'ready' && fileInput?.ttf && (
				<Grid columns={[2]} gap={2}>
					<Button
						mode="ghost"
						tone="primary"
						onClick={() => handleGenerateFontFile('all', fileInput.ttf)}
						text="Rebuild All from TTF"
						style={{ width: '100%' }}
					/>
					<Button
						mode="ghost"
						tone="primary"
						onClick={() => {
							const missing = [
								!fileInput?.otf?.asset?._ref && 'otf',
								!fileInput?.woff?.asset?._ref && 'woff',
								!fileInput?.woff2?.asset?._ref && 'woff2',
								!fileInput?.eot?.asset?._ref && 'eot',
								!fileInput?.svg?.asset?._ref && 'svg',
								!doc_metaData?.version && 'data',
							].filter(Boolean);
							handleGenerateFontFile(missing, fileInput.ttf);
						}}
						text="Build Missing"
						style={{ width: '100%' }}
					/>
				</Grid>
			)}

			{renderFontSection('otf', 'woff')}
			{renderFontSection('woff', 'ttf')}
			{renderFontSection('woff2', 'ttf')}
			{showAdvanced && renderTopLevelAssetSection('WEB', 'woff2_web', fileInput?.woff2_web?.asset?._ref, filenames?.woff2_web, handleGenerateSubsetAndWeb)}
			{showAdvanced && renderTopLevelAssetSection('SUBSET', 'woff2_subset', fileInput?.woff2_subset?.asset?._ref, filenames?.woff2_subset, handleGenerateSubsetAndWeb)}
			{showAdvanced && renderFontSection('eot', 'ttf')}
			{showAdvanced && renderFontSection('svg', 'ttf')}
			{renderCssSection()}
			{showAdvanced && renderDataSection()}

			{status === 'ready' && (fileInput?.ttf || fileInput?.otf || fileInput?.woff || fileInput?.woff2) && (
				<Button mode="ghost" tone="critical" onClick={() => handleDeleteAll()} text="Delete All" style={{ width: '100%' }} />
			)}
		</Stack>
	);
};
