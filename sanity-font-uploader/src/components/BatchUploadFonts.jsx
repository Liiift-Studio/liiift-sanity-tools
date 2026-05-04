// Batch font uploader — drag-and-drop file list, confirm-to-upload, elapsed timer, Wake Lock, and beforeunload guard for long uploads

import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import { Card, Box, Flex, Grid, Text, Label, Switch, Button, Spinner, Tooltip, Stack } from '@sanity/ui';
import { ControlsIcon, InfoOutlineIcon, TrashIcon, UploadIcon, WarningOutlineIcon } from '@sanity/icons';
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
import { RegenerateSubfamiliesComponent } from './RegenerateSubfamiliesComponent';

// Accepted font file extensions
const ACCEPTED_EXTENSIONS = ['ttf', 'otf', 'woff', 'woff2', 'eot', 'svg'];

/** Formats elapsed seconds as "Xm Ys" or "Ys". */
const formatElapsed = (s) => {
	const m = Math.floor(s / 60);
	const sec = s % 60;
	return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

export const BatchUploadFonts = () => {
	const [status, setStatus] = useState('ready');
	const [ready, setReady] = useState(true);
	const [inputPrice, setInputPrice] = useState('0');
	const [error, setError] = useState(false);
	const [preserveShortenedNames, setPreserveShortenedNames] = useState(true);
	const [preserveFileNames, setPreserveFileNames] = useState(false);
	const [showUtilities, setShowUtilities] = useState(false);
	const [pendingFiles, setPendingFiles] = useState([]);
	const [isDragging, setIsDragging] = useState(false);
	const [elapsedSeconds, setElapsedSeconds] = useState(0);

	const fileInputRef = useRef(null);
	const elapsedTimerRef = useRef(null);
	const wakeLockRef = useRef(null);

	const client = useSanityClient();

	const doc_id = useFormValue(['_id']);
	const title = useFormValue(['title']);
	const preferredStyleRef = useFormValue(['preferredStyle']);
	const slug = useFormValue(['slug']);
	const stylesObject = useFormValue(['styles']) || { fonts: [], variableFont: [] };
	const subfamiliesArray = stylesObject?.subfamilies || [];

	const { weightKeywordList, italicKeywordList } = useMemo(() => generateStyleKeywords(), []);

	// Elapsed timer — runs while upload is in progress
	useEffect(() => {
		if (ready !== true) {
			setElapsedSeconds(0);
			elapsedTimerRef.current = setInterval(() => {
				setElapsedSeconds(s => s + 1);
			}, 1000);
		} else {
			clearInterval(elapsedTimerRef.current);
		}
		return () => clearInterval(elapsedTimerRef.current);
	}, [ready]);

	// Warn before navigating away while an upload is running
	useEffect(() => {
		if (ready !== true) {
			const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
			window.addEventListener('beforeunload', handler);
			return () => window.removeEventListener('beforeunload', handler);
		}
	}, [ready]);

	// Wake Lock — prevents the screen from sleeping during long uploads
	useEffect(() => {
		if (ready !== true) {
			navigator.wakeLock?.request('screen')
				.then(lock => { wakeLockRef.current = lock; })
				.catch(() => {});
		} else if (wakeLockRef.current) {
			wakeLockRef.current.release().catch(() => {});
			wakeLockRef.current = null;
		}
	}, [ready]);

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

	/** Sorts font files so TTF/OTF are processed before web formats. */
	const sortFilesByType = (files) => {
		if (!files) return [];
		const typeOrder = ['ttf', 'otf', 'eot', 'svg', 'woff', 'woff2'];
		return Array.from(files).sort((a, b) => {
			const aIndex = typeOrder.indexOf(a.name.split('.').pop().toLowerCase());
			const bIndex = typeOrder.indexOf(b.name.split('.').pop().toLowerCase());
			if (aIndex === bIndex) return a.name.localeCompare(b.name);
			return aIndex - bIndex;
		});
	};

	/** Returns only files with accepted font extensions. */
	const filterFontFiles = (files) =>
		Array.from(files).filter(f => ACCEPTED_EXTENSIONS.includes(f.name.split('.').pop().toLowerCase()));

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

	/** Adds files from the file picker to the pending list. */
	const handleFileSelect = useCallback((e) => {
		const files = filterFontFiles(e.target.files);
		if (files.length > 0) setPendingFiles(prev => [...prev, ...files]);
		e.target.value = '';
	}, []);

	/** Removes a single file from the pending list by object reference. */
	const handleRemoveFile = useCallback((file) => {
		setPendingFiles(prev => prev.filter(f => f !== file));
	}, []);

	const handleDragEnter = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
	const handleDragOver = useCallback((e) => { e.preventDefault(); }, []);
	const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);

	/** Adds dropped font files to the pending list. */
	const handleDrop = useCallback((e) => {
		e.preventDefault();
		setIsDragging(false);
		const files = filterFontFiles(e.dataTransfer.files);
		if (files.length > 0) setPendingFiles(prev => [...prev, ...files]);
	}, []);

	/** Processes and uploads the confirmed pending file list. */
	const handleConfirmUpload = useCallback(async () => {
		try {
			setStatus('Uploading font files...');
			setReady('upload');
			setError(false);

			if (!validateInputs(title, inputPrice)) {
				setReady(true);
				return false;
			}

			const sortedFiles = sortFilesByType(pendingFiles);
			setPendingFiles([]);

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
	}, [pendingFiles, stylesObject, title, slug, doc_id, inputPrice, weightKeywordList, italicKeywordList, client, preferredStyleRef, subfamiliesArray, preserveShortenedNames, preserveFileNames]);

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

	/** Renders an info-icon tooltip trigger wrapping a label. */
	const renderTooltipLabel = (label, description) => (
		<Tooltip
			content={<Box padding={2} style={{ maxWidth: 260 }}><Text size={1} style={{ lineHeight: 1.6 }}>{description}</Text></Box>}
			placement="top"
			portal
		>
			<Flex align="center" gap={1} style={{ cursor: 'default' }}>
				<Label>{label}</Label>
				<InfoOutlineIcon style={{ opacity: 0.5, display: 'block' }} />
			</Flex>
		</Tooltip>
	);

	/** Renders the in-progress state: spinner, live status, elapsed time, and do-not-close warning. */
	const renderProcessing = () => (
		<Stack space={3} paddingY={2}>
			<Flex align="center" gap={3}>
				<Spinner />
				<Text size={1} muted>{status}</Text>
			</Flex>
			<Card tone="caution" border radius={2} padding={2}>
				<Flex align="center" justify="space-between" gap={2}>
					<Flex align="center" gap={2}>
						<WarningOutlineIcon style={{ flexShrink: 0 }} />
						<Text size={1} weight="semibold">Do not close or reload this tab</Text>
					</Flex>
					<Text size={1} muted style={{ flexShrink: 0 }}>{formatElapsed(elapsedSeconds)}</Text>
				</Flex>
			</Card>
		</Stack>
	);

	/** Renders the drag-and-drop zone. */
	const renderDropZone = () => (
		<Box
			onDragEnter={handleDragEnter}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			style={{
				border: `2px dashed ${isDragging ? 'var(--card-focus-ring-color)' : 'var(--card-border-color)'}`,
				borderRadius: 4,
				padding: '28px 16px',
				textAlign: 'center',
				background: isDragging ? 'rgba(100, 153, 255, 0.06)' : 'transparent',
				transition: 'border-color 0.12s, background 0.12s',
				cursor: 'default',
			}}
		>
			<input
				ref={fileInputRef}
				type="file"
				multiple
				hidden
				accept=".ttf,.otf,.woff,.woff2,.eot,.svg"
				onChange={handleFileSelect}
			/>
			<Stack space={3}>
				<Text size={1} muted>
					{isDragging ? 'Release to add files' : 'Drop font files here'}
				</Text>
				<Flex justify="center">
					<Button
						mode="ghost"
						tone="primary"
						fontSize={1}
						padding={2}
						text="Browse files"
						onClick={() => fileInputRef.current?.click()}
					/>
				</Flex>
			</Stack>
		</Box>
	);

	/** Renders the sorted pending file list with a scrollable container, file count, and upload action. */
	const renderFileList = () => {
		const sorted = sortFilesByType(pendingFiles);
		return (
			<Stack space={2}>
				{/* Header: file count + clear */}
				<Flex align="center" justify="space-between">
					<Text size={1} muted>
						{pendingFiles.length} file{pendingFiles.length === 1 ? '' : 's'} selected
					</Text>
					<Button
						mode="bleed"
						tone="default"
						fontSize={1}
						padding={1}
						text="Clear all"
						onClick={() => setPendingFiles([])}
					/>
				</Flex>

				{/* Scrollable file list */}
				<Box style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
					{sorted.map((file, i) => {
						const ext = file.name.split('.').pop().toUpperCase();
						return (
							<Card key={`${file.name}-${file.size}-${i}`} border radius={1} paddingX={2} paddingY={2}>
								<Flex justify="space-between" align="center" gap={2}>
									<Flex gap={3} align="center" style={{ flex: 1, minWidth: 0 }}>
										<Text
											size={0}
											style={{ fontFamily: 'monospace', minWidth: '2.5rem', flexShrink: 0 }}
										>
											{ext}
										</Text>
										<Box style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
											<Text size={1}>{file.name}</Text>
										</Box>
									</Flex>
									<Button
										mode="bleed"
										tone="critical"
										icon={TrashIcon}
										padding={2}
										onClick={() => handleRemoveFile(file)}
									/>
								</Flex>
							</Card>
						);
					})}
				</Box>

				{/* Add more files zone */}
				<Box
					onDragEnter={handleDragEnter}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					style={{
						border: `2px dashed ${isDragging ? 'var(--card-focus-ring-color)' : 'var(--card-border-color)'}`,
						borderRadius: 4,
						padding: '10px 16px',
						textAlign: 'center',
						background: isDragging ? 'rgba(100, 153, 255, 0.06)' : 'transparent',
						transition: 'border-color 0.12s, background 0.12s',
					}}
				>
					<input
						ref={fileInputRef}
						type="file"
						multiple
						hidden
						accept=".ttf,.otf,.woff,.woff2,.eot,.svg"
						onChange={handleFileSelect}
					/>
					<Flex align="center" justify="center" gap={2}>
						<Text size={1} muted>{isDragging ? 'Release to add' : 'Drop more files or'}</Text>
						<Button
							mode="bleed"
							tone="primary"
							fontSize={1}
							padding={1}
							text="browse"
							onClick={() => fileInputRef.current?.click()}
						/>
					</Flex>
				</Box>

				{/* Upload confirm */}
				<Button
					mode="ghost"
					tone="primary"
					icon={UploadIcon}
					text={`Upload ${pendingFiles.length} Font${pendingFiles.length === 1 ? '' : 's'}`}
					style={{ width: '100%' }}
					onClick={handleConfirmUpload}
				/>
			</Stack>
		);
	};

	return (
		<>
			{title && title !== '' && slug && slug !== '' &&
				<>
					<StatusDisplay
						status={status}
						error={error}
						action={
							<Button
								mode={showUtilities ? 'default' : 'ghost'}
								tone="primary"
								icon={ControlsIcon}
								text="Utilities"
								fontSize={1}
								padding={2}
								onClick={() => setShowUtilities(v => !v)}
							/>
						}
					/>

					<Card border padding={2} shadow={1} radius={2}>
						{showUtilities ? (
							<Stack space={4} marginTop={2}>

								{/* Regenerate Subfamilies */}
								<Stack space={2}>
									<Text size={1} weight="semibold" style={{ lineHeight: 1.6 }}>Regenerate Subfamilies</Text>
									<RegenerateSubfamiliesComponent />
								</Stack>

								{/* Rename Fonts */}
								<Stack space={3}>
									<Text size={1} weight="semibold" style={{ lineHeight: 1.6 }}>Rename Fonts (name table, Full Name)</Text>
									<Flex align="center" gap={2}>
										<Switch
											checked={preserveShortenedNames}
											onChange={(e) => setPreserveShortenedNames(e.target.checked)}
										/>
										{renderTooltipLabel(
											'Preserve shortened names',
											'Abbreviations in font names are kept as-is (e.g. "XNarrow" stays "XNarrow", "Bd" stays "Bd").'
										)}
									</Flex>
									{ready === 'rename'
										? renderProcessing()
										: <Button mode="ghost" tone="primary" text="Rename Existing Fonts" style={{ width: '100%' }} onClick={handleRenameExistingFonts} disabled={ready !== true} />
									}
								</Stack>

								{/* Update Font Prices */}
								<Stack space={3}>
									<Text size={1} weight="semibold" style={{ lineHeight: 1.6 }}>Update Font Prices</Text>
									{ready === 'price'
										? renderProcessing()
										: <Stack space={2}>
											<PriceInput inputPrice={inputPrice} handleInputChange={handleInputChange} />
											<Button mode="ghost" tone="primary" text="Update All Font Prices" style={{ width: '100%' }} onClick={handleChangeFontPrice} disabled={ready !== true} />
										</Stack>
									}
								</Stack>

								{/* Regenerate CSS */}
								<Stack space={3}>
									<Text size={1} weight="semibold" style={{ lineHeight: 1.6 }}>Regenerate CSS</Text>
									<Text size={1} muted style={{ lineHeight: 1.6 }}>Rebuilds the CSS @font-face files for all fonts in the typeface fonts list.</Text>
									{ready === 'css'
										? renderProcessing()
										: <Button mode="ghost" tone="primary" text="Regenerate CSS Files" style={{ width: '100%' }} onClick={handleRegenerateCssFiles} disabled={ready !== true} />
									}
								</Stack>

							</Stack>
						) : (
							ready
								? <>
									<Grid columns={[2]} gap={4} marginTop={1} marginBottom={1}>
										{/* Left: price */}
										<Box>
											<PriceInput inputPrice={inputPrice} handleInputChange={handleInputChange} />
										</Box>
										{/* Right: toggles */}
										<Stack space={3}>
											<Flex align="center" gap={2}>
												<Switch
													checked={preserveShortenedNames}
													onChange={(e) => setPreserveShortenedNames(e.target.checked)}
												/>
												{renderTooltipLabel(
													'Preserve shortened names',
													'Abbreviations in font names are kept as-is (e.g. "XNarrow" stays "XNarrow", "Bd" stays "Bd").'
												)}
											</Flex>
											<Flex align="center" gap={2}>
												<Switch
													checked={preserveFileNames}
													onChange={(e) => setPreserveFileNames(e.target.checked)}
												/>
												{renderTooltipLabel(
													'Preserve file names',
													'Original filename capitalisation is used for asset naming instead of the normalised font title.'
												)}
											</Flex>
										</Stack>
									</Grid>
									<Box marginTop={3}>
										{pendingFiles.length === 0 ? renderDropZone() : renderFileList()}
									</Box>
								</>
								: renderProcessing()
						)}
					</Card>
				</>
			}
		</>
	);
};
