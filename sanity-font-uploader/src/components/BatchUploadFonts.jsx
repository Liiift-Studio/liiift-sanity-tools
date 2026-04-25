// Batch font uploader with tabbed Upload / Font Utilities interface

import React, { useCallback, useState, useMemo } from 'react';
import { Card, Stack, Flex, Text, Label, Switch, Button, Tab, TabList, TabPanel, Spinner } from '@sanity/ui';
import { ControlsIcon, UploadIcon } from '@sanity/icons';
import { useFormValue } from 'sanity';

import { useSanityClient } from '../hooks/useSanityClient';
import { processFontFiles } from '../utils/processFontFiles';
import { uploadFontFiles } from '../utils/uploadFontFiles';
import { updateTypefaceDocument } from '../utils/updateTypefaceDocument';
import { generateStyleKeywords } from '../utils/generateKeywords';
import { renameFontDocuments } from '../utils/regenerateFontData';
import { updateFontPrices } from '../utils/updateFontPrices';
import generateCssFile from '../utils/generateCssFile';

import StatusDisplay from './StatusDisplay';
import PriceInput from './PriceInput';
import UploadButton from './UploadButton';

export const BatchUploadFonts = ({ elementProps: { ref } }) => {
	const [status, setStatus] = useState('ready');
	const [ready, setReady] = useState(true);
	const [inputPrice, setInputPrice] = useState('0');
	const [error, setError] = useState(false);
	const [preserveShortenedNames, setPreserveShortenedNames] = useState(true);
	const [preserveFileNames, setPreserveFileNames] = useState(false);
	const [tabId, setTabId] = useState('upload');

	const client = useSanityClient();

	const doc_id = useFormValue(['_id']);
	const title = useFormValue(['title']);
	const preferredStyleRef = useFormValue(['preferredStyle']);
	const slug = useFormValue(['slug']);
	const stylesObject = useFormValue(['styles']) || { fonts: [], variableFont: [] };
	const subfamiliesArray = stylesObject?.subfamilies || [];

	const { weightKeywordList, italicKeywordList } = useMemo(() => generateStyleKeywords(), []);

	/** Validates that title and price are set before starting an upload. */
	const validateInputs = (title, inputPrice) => {
		const price = Number(inputPrice);
		if (!title) {
			setStatus('Typeface needs a title');
			setError(true);
			return false;
		}
		if (isNaN(price) || typeof price !== 'number') {
			setStatus('Invalid price — please refresh and try again');
			setError(true);
			return false;
		}
		return true;
	};

	/** Sorts uploaded files so TTF/OTF are processed before web formats. */
	const sortFilesByType = (files) => {
		if (!files) return [];
		const typeOrder = ['ttf', 'otf', 'eot', 'svg', 'woff', 'woff2'];
		return Array.from(files).sort((a, b) => {
			const aIndex = typeOrder.indexOf(a.name.split('.').pop());
			const bIndex = typeOrder.indexOf(b.name.split('.').pop());
			if (aIndex === bIndex) return a.name.localeCompare(b.name);
			return aIndex - bIndex;
		});
	};

	/** Sets final status after upload completes, reporting any failed files. */
	const handleCompletionStatus = (failedFiles, setError, setStatus) => {
		if (failedFiles.length > 0) {
			console.error('Failed uploads:', {
				files: failedFiles,
				names: failedFiles.map(f => f.name),
				metadata: failedFiles.map(f => f?.fk?.name?.records),
			});
			setError(true);
			setStatus(`Upload completed with errors. Failed files: ${failedFiles.map(f => f.name).join(', ')}`);
		} else {
			setError(false);
			setStatus('Upload completed successfully');
		}
	};

	/** Handles the font file upload event — processes, uploads, and updates the typeface document. */
	const handleUpload = useCallback(async (event) => {
		try {
			setStatus('Uploading font files...');
			setReady('upload');
			setError(false);

			if (!validateInputs(title, inputPrice)) {
				setReady(true);
				return false;
			}

			const files = event.target.files;
			const sortedFiles = sortFilesByType(files);

			const { fontsObjects, subfamilies, uniqueSubfamilies, newPreferredStyle, failedFiles } =
				await processFontFiles(
					sortedFiles,
					title,
					weightKeywordList,
					italicKeywordList,
					setStatus,
					preserveShortenedNames,
					preserveFileNames,
				);

			const { fontRefs, variableRefs } = await uploadFontFiles(
				fontsObjects,
				subfamilies,
				client,
				inputPrice,
				stylesObject,
				setStatus,
				setError,
			);

			await updateTypefaceDocument(
				doc_id,
				fontRefs,
				variableRefs,
				subfamilies,
				uniqueSubfamilies,
				subfamiliesArray,
				preferredStyleRef,
				newPreferredStyle,
				stylesObject,
				client,
				setStatus,
				setError,
			);

			handleCompletionStatus(failedFiles, setError, setStatus);
		} catch (e) {
			console.error(e.message);
			setError(true);
			setStatus('Error uploading font');
		}

		setReady(true);
		setError(false);
	}, [stylesObject, title, slug, doc_id, inputPrice, weightKeywordList, italicKeywordList, client, preferredStyleRef, subfamiliesArray, preserveShortenedNames, preserveFileNames]);

	/** Renames all existing font documents in this typeface by re-reading their TTF metadata. */
	const handleRenameExistingFonts = useCallback(async () => {
		try {
			setStatus('Processing font documents...');
			setReady('rename');
			setError(false);

			if (!title) {
				setStatus('Typeface needs a title');
				setError(true);
				setReady(true);
				return false;
			}

			const result = await renameFontDocuments({
				client,
				typefaceName: title,
				slug,
				weightKeywordList,
				italicKeywordList,
				preserveShortenedNames,
				setStatus,
				setError,
			});

			if (!result.success) setError(true);
		} catch (err) {
			console.error('Error renaming font documents:', err);
			setError(true);
			setStatus(`Error: ${err.message}`);
		}
		setReady(true);
	}, [title, client, slug, weightKeywordList, italicKeywordList, preserveShortenedNames]);

	/** Bulk-sets the same price on every font in this typeface. */
	const handleChangeFontPrice = useCallback(async () => {
		setStatus('Updating font prices...');
		setReady('price');
		setError(false);

		await updateFontPrices({ client, title, slug, inputPrice, doc_id, setStatus, setError });

		setReady(true);
	}, [title, slug, client, doc_id, inputPrice]);

	/** Regenerates the CSS @font-face file for every font in this typeface from its woff2 asset. */
	const handleRegenerateCssFiles = useCallback(async () => {
		try {
			setStatus('Regenerating CSS files...');
			setReady('css');
			setError(false);

			if (!title) { setStatus('Typeface needs a title'); setError(true); setReady(true); return false; }
			if (!slug?.current) { setStatus('Typeface needs a slug'); setError(true); setReady(true); return false; }

			const typeface = await client.fetch(
				`*[_type == "typeface" && slug.current == $slug][0]`,
				{ slug: slug.current }
			);

			if (!typeface) { setStatus('Typeface not found'); setError(true); setReady(true); return false; }
			if (!typeface.styles?.fonts?.length) { setStatus('No fonts found in typeface'); setError(true); setReady(true); return false; }

			const fontRefs = typeface.styles.fonts;
			setStatus(`Regenerating CSS for ${fontRefs.length} fonts...`);

			let updatedCount = 0;
			let errorCount = 0;

			for (let i = 0; i < fontRefs.length; i++) {
				try {
					const fontDoc = await client.fetch(`*[_id == $id][0]`, { id: fontRefs[i]._ref });
					if (!fontDoc) { errorCount++; continue; }
					if (!fontDoc.fileInput?.woff2?.asset) { errorCount++; continue; }

					const woff2Asset = await client.fetch(`*[_id == $id][0]`, { id: fontDoc.fileInput.woff2.asset._ref });
					if (!woff2Asset?.url) { errorCount++; continue; }

					const woff2Response = await fetch(woff2Asset.url);
					const woff2Blob = await woff2Response.blob();
					const woff2File = new File([woff2Blob], `${fontDoc._id}.woff2`, { type: 'font/woff2' });

					setStatus(`Regenerating CSS for font ${i + 1}/${fontRefs.length}: ${fontDoc.title}`);

					const updatedFileInput = await generateCssFile({
						woff2File,
						fileInput: fontDoc.fileInput,
						fileName: fontDoc._id,
						fontName: fontDoc.title,
						variableFont: fontDoc.variableFont || false,
						weight: fontDoc.weight || 400,
						client,
						style: fontDoc.style || 'normal',
					});

					await client.patch(fontRefs[i]._ref).set({ fileInput: updatedFileInput }).commit();
					updatedCount++;
					setStatus(`Regenerated CSS for ${updatedCount}/${fontRefs.length} fonts...`);
				} catch (err) {
					console.error(`Error regenerating CSS for font ${fontRefs[i]._ref}:`, err);
					errorCount++;
				}
			}

			const successMessage = `Successfully regenerated CSS for ${updatedCount} fonts${errorCount > 0 ? ` (${errorCount} errors)` : ''}`;
			setStatus(successMessage);
			if (errorCount > 0) setError(true);
		} catch (err) {
			console.error('Error regenerating CSS files:', err);
			setError(true);
			setStatus(`Error: ${err.message}`);
		}
		setReady(true);
	}, [title, slug, client]);

	/** Handles price field changes. */
	const handleInputChange = (e) => {
		setInputPrice(e.target.value);
		setError(false);
		setStatus('ready');
	};

	/** Spinner shown while a utility action runs — displays live status string. */
	const renderSpinner = () => (
		<Flex align="center" justify="center" gap={3} padding={3}>
			<Spinner />
			<Text muted size={1}>{status}</Text>
		</Flex>
	);

	/** Grouped switch row — label and description stacked next to the toggle. */
	const renderSwitch = (checked, onChange, label, description) => (
		<Flex align="flex-start" gap={3}>
			<Switch checked={checked} onChange={onChange} style={{ flexShrink: 0, marginTop: 2 }} />
			<Stack space={1}>
				<Label>{label}</Label>
				<Text size={1} muted>{description}</Text>
			</Stack>
		</Flex>
	);

	return (
		<>
			{title && title !== '' && slug && slug !== '' &&
				<>
					<TabList space={2} paddingBottom={2}>
						<Tab
							aria-controls="upload-panel"
							icon={UploadIcon}
							id="upload-tab"
							label="Upload Fonts"
							onClick={() => setTabId('upload')}
							selected={tabId === 'upload'}
							space={2}
						/>
						<Tab
							aria-controls="utilities-panel"
							icon={ControlsIcon}
							id="utilities-tab"
							label="Font Utilities"
							onClick={() => setTabId('utilities')}
							selected={tabId === 'utilities'}
							space={2}
						/>
					</TabList>
					<Card border padding={3} shadow={1} radius={2}>
						<StatusDisplay status={status} error={error} />

						<TabPanel aria-labelledby="upload-tab" hidden={tabId !== 'upload'} id="upload-panel">
							{ready ? (
								<Stack space={3}>
									{renderSwitch(
										preserveShortenedNames,
										(e) => setPreserveShortenedNames(e.target.checked),
										'Preserve shortened names',
										'Abbreviations in font names are kept as-is (e.g. "XNarrow" stays "XNarrow", "Bd" stays "Bd").',
									)}
									{renderSwitch(
										preserveFileNames,
										(e) => setPreserveFileNames(e.target.checked),
										'Preserve file names',
										'Original filename capitalisation is used for asset naming instead of the normalised font title.',
									)}
									<PriceInput inputPrice={inputPrice} handleInputChange={handleInputChange} />
									<UploadButton ref={ref} handleUpload={handleUpload} />
								</Stack>
							) : (
								<Flex align="center" justify="center" gap={3} padding={4}>
									<Spinner />
									<Text muted size={1}>{status}</Text>
								</Flex>
							)}
						</TabPanel>

						<TabPanel aria-labelledby="utilities-tab" hidden={tabId !== 'utilities'} id="utilities-panel">
							<Stack space={3}>
								<Card border radius={2} padding={3}>
									<Stack space={3}>
										<Stack space={1}>
											<Text size={1} weight="semibold">Rename Fonts</Text>
											<Text size={1} muted>Renames all fonts in the typeface based on their TTF/OTF file metadata.</Text>
										</Stack>
										{renderSwitch(
											preserveShortenedNames,
											(e) => setPreserveShortenedNames(e.target.checked),
											'Preserve shortened names',
											'Abbreviations in font names are kept as-is.',
										)}
										{ready === 'rename'
											? renderSpinner()
											: <Button mode="ghost" tone="primary" text="Rename Existing Fonts" onClick={handleRenameExistingFonts} disabled={ready !== true} style={{ width: '100%' }} />
										}
									</Stack>
								</Card>

								<Card border radius={2} padding={3}>
									<Stack space={3}>
										<Stack space={1}>
											<Text size={1} weight="semibold">Update Font Prices</Text>
											<Text size={1} muted>Sets the same price on every font in this typeface.</Text>
										</Stack>
										<PriceInput inputPrice={inputPrice} handleInputChange={handleInputChange} />
										{ready === 'price'
											? renderSpinner()
											: <Button mode="ghost" tone="primary" text="Update All Font Prices" onClick={handleChangeFontPrice} disabled={ready !== true} style={{ width: '100%' }} />
										}
									</Stack>
								</Card>

								<Card border radius={2} padding={3}>
									<Stack space={3}>
										<Stack space={1}>
											<Text size={1} weight="semibold">Regenerate CSS</Text>
											<Text size={1} muted>Rebuilds the @font-face CSS file for every font in the typeface from its woff2 asset.</Text>
										</Stack>
										{ready === 'css'
											? renderSpinner()
											: <Button mode="ghost" tone="primary" text="Regenerate CSS Files" onClick={handleRegenerateCssFiles} disabled={ready !== true} style={{ width: '100%' }} />
										}
									</Stack>
								</Card>
							</Stack>
						</TabPanel>
					</Card>
				</>
			}
		</>
	);
};
