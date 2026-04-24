/**
 * A Sanity Studio component for uploading and managing font files in various formats (TTF, OTF, WOFF, WOFF2, EOT, SVG).
 * Handles file uploads, conversions between formats, CSS generation, and font metadata extraction.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Stack, Flex, Text, Button, Tooltip } from '@sanity/ui';
import { UploadIcon, GenerateIcon, RefreshIcon, CloseIcon } from '@sanity/icons';
import { useFormValue, set, unset } from 'sanity';
import { useSanityClient } from '../hooks/useSanityClient';

import generateCssFile from '../utils/generateCssFile';
import generateFontData from '../utils/generateFontData';
import generateFontFile from '../utils/generateFontFile';
import generateSubset from '../utils/generateSubset';

/** Builds a Sanity CDN file URL from an asset _ref */
const cdnUrl = (ref) =>
	`https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${ref.replace('file-', '').replace('-', '.')}`;

/** Read-only file row: label + optional link, with action buttons on the right */
const FileRow = ({ label, href, filename, muted, children }) => (
	<Flex justify="space-between" align="center">
		<Text muted={muted} size={1}>
			{label}:&nbsp;{href
				? <a href={href} target="_blank">{filename ? <b>{filename}</b> : <b>Misc File</b>}</a>
				: (filename ? <b>{filename}</b> : <b>Empty</b>)
			}
		</Text>
		{children}
	</Flex>
);

/** Upload button wrapping a hidden file input */
const UploadButton = React.forwardRef(({ onChange, tooltip }, ref) => (
	<Tooltip content={<Text size={1} padding={2}>{tooltip}</Text>} placement="top" portal>
		<label>
			<Button as="span" mode="ghost" icon={UploadIcon} />
			<input ref={ref} type="file" style={{ display: 'none' }} onChange={onChange} />
		</label>
	</Tooltip>
));

/** Danger delete button */
const DeleteButton = ({ onClick }) => (
	<Button mode="ghost" tone="critical" icon={CloseIcon} onClick={onClick} />
);

/**
 * Font uploader component that manages font file uploads and conversions
 * @param {Object} props - Component props
 * @param {Object} props.elementProps - Props for the form element
 * @param {Function} props.onChange - Callback for when the form value changes
 * @param {string} [props.value=''] - Current form value
 */
export const FontUploaderComponent = (props) => {
	const client = useSanityClient();

	const {
		elementProps: { ref },
		onChange,
		value = ''
	} = props;

	// State Management
	/** Status message displayed to user */
	const [message, setMessage] = useState('');
	/** Component status: 'ready' or processing */
	const [status, setStatus] = useState('ready');
	/** Original filenames for uploaded font files */
	const [filenames, setFilenames] = useState({});

	// Form Values
	/** Currently uploaded font files */
	let fileInput = useFormValue(['fileInput']);
	/** Document ID */
	let doc_id = useFormValue(['_id']);
	/** Font title */
	let doc_title = useFormValue(['title']);
	/** Whether font is variable */
	let doc_variableFont = useFormValue(['variableFont']);
	/** Font weight */
	let doc_weight = useFormValue(['weight']);
	/** Font style */
	let doc_style = useFormValue(['style']);
	/** URL-friendly slug */
	let doc_slug = useFormValue(['slug']);
	/** Font metadata */
	let doc_metaData = useFormValue(['metaData']);

	// Effects & Callbacks
	useEffect(() => {
		handleSetFilenames();
	}, [fileInput]);

	/**
	 * Updates the filenames state with the original filenames of uploaded assets.
	 * Uses ref→key mapping so multiple .woff2 fields don't collide by extension.
	 */
	const handleSetFilenames = useCallback(async() => {
		const refMap = {
			ttf: fileInput?.ttf?.asset?._ref,
			otf: fileInput?.otf?.asset?._ref,
			woff: fileInput?.woff?.asset?._ref,
			woff2: fileInput?.woff2?.asset?._ref,
			woff2_web: fileInput?.woff2_web?.asset?._ref,
			woff2_subset: fileInput?.woff2_subset?.asset?._ref,
			eot: fileInput?.eot?.asset?._ref,
			svg: fileInput?.svg?.asset?._ref,
			css: fileInput?.css?.asset?._ref,
		};

		const assetIds = Object.values(refMap).filter(Boolean);
		if (!assetIds.length) return;

		const assetData = await client.fetch(`*[_id in $assetIds] { _id, originalFilename }`, { assetIds });
		const byId = assetData.reduce((acc, a) => { acc[a._id] = a.originalFilename; return acc; }, {});

		const fontNames = {};
		Object.entries(refMap).forEach(([key, ref]) => {
			if (ref && byId[ref]) fontNames[key] = byId[ref];
		});

		setFilenames(fontNames);
	}, [fileInput]);

	/**
	 * Generates the DS-WEB fingerprinted web copy (woff2_web) and display subset (woff2_subset) from the existing woff2.
	 * Both are produced in a single fontWorker call.
	 */
	const handleGenerateWebSubset = useCallback(async() => {
		setMessage('Generating web font and subset...');
		const woff2Asset = await client.fetch(`*[_id == $id]{url}[0]`, { id: fileInput.woff2.asset._ref });
		await generateSubset({
			woff2Url: woff2Asset.url,
			filename: doc_slug.current,
			documentId: doc_id,
			documentTitle: doc_title,
			documentVariableFont: doc_variableFont,
			documentStyle: doc_style,
			documentWeight: doc_weight,
		});
		setMessage('Web font and subset generated!');
		setTimeout(() => { setMessage('') }, 3000);
	}, [fileInput, doc_slug, doc_id, doc_title, doc_variableFont, doc_style, doc_weight]);

	/**
	 * Generates CSS file from WOFF2 font
	 */
	const handleGenerateCssFile = useCallback(async() => {
		console.log('HANDLE generate css');
		setMessage('Generating css: ' + doc_title + '.css');

		let woff2Buffer = await client.fetch(`*[_id == '${fileInput.woff2.asset._ref}']{originalFilename, url}`);
		woff2Buffer = woff2Buffer[0];

		let blob = await fetch(woff2Buffer.url);
		blob = await blob.blob();

		let newFileInput = await generateCssFile({
			woff2File: blob,
			fileInput: fileInput,
			fontName: doc_title,
			fileName: woff2Buffer.originalFilename.replace('.woff2',''),
			variableFont: doc_variableFont,
			weight: doc_weight,
			style: doc_style,
			client: client
		});

		setMessage('CSS generated!');
		setTimeout(() => { setMessage('') }, 2000);
		onChange(set(newFileInput));
	}, [fileInput, onChange, doc_title, doc_variableFont]);

	/**
	 * Generates font files in specified format(s)
	 * @param {string} code - Font format code or 'all' for all formats
	 * @param {Object} sourceFile - Source font file object
	 */
	const handleGenerateFontFile = useCallback(async(code, sourceFile) => {
		setMessage('Generating files: ' + code);

		let url = `https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${sourceFile?.asset?._ref.replace("file-","").replace("-",".")}`;

		if (code === 'all') {
			await generateFontFile({
				codes: ['otf', 'woff', 'woff2', 'eot', 'svg', 'data'],
				srcUrl: url,
				filename: doc_slug.current,
				documentId: doc_id,
				documentTitle: doc_title,
				documentVariableFont: doc_variableFont,
				documentStyle: doc_style,
				documentWeight: doc_weight,
				fileInput: fileInput,
			});
		} else {
			await generateFontFile({
				codes: [code],
				srcUrl: url,
				filename: doc_slug.current,
				documentId: doc_id,
				documentTitle: doc_title,
				documentVariableFont: doc_variableFont,
				documentStyle: doc_style,
				documentWeight: doc_weight,
				fileInput: fileInput,
			});
		}

		setMessage('Files generated!');
		setTimeout(() => { setMessage('') }, 2000);
	}, []);

	/**
	 * Extracts and stores font metadata
	 */
	const handleGenerateFontData = useCallback(async() => {
		setMessage('Generating font data...');

		await generateFontData({
			fileInput: fileInput,
			fontId: doc_id,
			client: client,
		});

		onChange(set({...fileInput}));
		console.log('Font data generated');
		setMessage('Font data generated.');
		setTimeout(() => { setMessage('') }, 2000);
	}, [fileInput]);

	/**
	 * Handles font file upload
	 * @param {Event} event - Upload input change event
	 * @param {string} code - Font format code
	 */
	const handleUpload = useCallback(async(event, code) => {
		console.log('Handle upload', code);

		let file = event.target.files[0];
		let filename = doc_slug.current + '.' + file.name.split('.').pop();

		setMessage('Uploading: ' + filename);

		var asset = await client.assets.upload('file', file, { filename: filename });

		let newFileInput = {
			...fileInput,
			[code]: {
				_type: 'file',
				asset: {
					_ref: asset._id,
					_type: 'reference'
				}
			}
		};

		let id = doc_id;
		if (id.startsWith('drafts.')) id = id.replace('drafts.', '');

		setMessage(filename + ' uploaded!');
		setTimeout(() => { setMessage('') }, 2000);

		// Generate CSS and subset if WOFF2 uploaded
		if (code === 'woff2') {
			setMessage('Generating CSS: ' + doc_title + '.css');
			newFileInput = await generateCssFile({
				woff2File: file,
				fileInput: newFileInput,
				fontName: doc_title,
				fileName: filename.replace('.woff2',''),
				variableFont: doc_variableFont,
				weight: doc_weight,
				style: doc_style,
				client: client
			});

			// Subset is generated server-side from the uploaded WOFF2 URL — no TTF round-trip.
			// Patches fileInput.woff2_subset and fileInput.css_subset on the document directly.
			setMessage('Generating subset...');
			await generateSubset({
				woff2Url: asset.url,
				filename: doc_slug.current,
				documentId: doc_id,
				documentTitle: doc_title,
				documentVariableFont: doc_variableFont,
				documentStyle: doc_style,
				documentWeight: doc_weight,
			});

			setMessage(doc_title + ' CSS + subset generated!');
		}

		onChange(set(newFileInput));
	}, [fileInput, onChange, doc_title, doc_variableFont, doc_slug]);

	/**
	 * Deletes a font file
	 * @param {string} code - Font format code
	 */
	const handleDelete = useCallback(async(code) => {
		setMessage(`deleting ${code}`);
		const asset = fileInput[code]?.asset?._ref;

		onChange(unset([code]));

		await client.delete(asset)
			.then(result => {
				setMessage('deleted asset: ' + result);
				setTimeout(() => { setMessage('') }, 2000);
			})
			.catch(e => {
				console.error('Error deleting asset: ', e.message);
				setMessage('WARNING: ' + e.message);
			});
	}, [doc_id, fileInput, onChange]);

	/**
	 * Deletes all font files and resets font data
	 */
	const handleDeleteAll = useCallback(async() => {
		setMessage('deleting...');
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
			variableInstances: undefined
		})
		.commit()
		.catch(e => {
			console.error('error patching: ', e.message);
			setMessage('delete error');
			return;
		});

		for(var i = 0; i < Object.keys(fileInput).length; i++) {
			let refKey = Object.keys(fileInput)[i];
			if(refKey === 'documentInfo') return;

			const asset = value[refKey].asset._ref;

			try {
				await client.delete(asset)
					.then(result => {
						setMessage('deleted asset: ' + result);
						setTimeout(() => { setMessage('') }, 2000);
					});
			}
			catch(e) {
				console.error('error deleting asset: ', e.message);
			}
		}
	}, [fileInput]);

	// Render Component
	return (
		<Stack space={3}>
			{/* Status Message */}
			{message && <Text style={{ color: 'green' }}>{message}</Text>}

			{/* TTF Section */}
			<FileRow
				label="TTF"
				href={fileInput?.ttf?.asset?._ref && cdnUrl(fileInput.ttf.asset._ref)}
				filename={filenames?.ttf}
			>
				{status === 'ready' && (
					<Flex gap={1}>
						<UploadButton ref={ref} onChange={(e) => handleUpload(e, 'ttf')} tooltip="Upload TTF" />
						{value?.ttf && <DeleteButton onClick={() => handleDelete('ttf')} />}
					</Flex>
				)}
			</FileRow>

			{/* Regenerate all from TTF */}
			{status === 'ready' && value?.ttf && (
				<div style={{ paddingBottom: 8, width: '100%' }}>
					<Tooltip content={<Text size={1} padding={2}>Regenerates OTF, WOFF, WOFF2, EOT, SVG and font metadata from the uploaded TTF</Text>} placement="top" portal>
						<Button mode="default" icon={RefreshIcon} text="Regenerate All from TTF" onClick={() => handleGenerateFontFile('all', value.ttf)} style={{ width: '100%' }} />
					</Tooltip>
				</div>
			)}

			{/* OTF Section */}
			<FileRow
				label="OTF"
				href={fileInput?.otf?.asset?._ref && cdnUrl(fileInput.otf.asset._ref)}
				filename={filenames?.otf}
			>
				{status === 'ready' && (
					<Flex gap={1}>
						<UploadButton ref={ref} onChange={(e) => handleUpload(e, 'otf')} tooltip="Upload OTF" />
						{value?.ttf && (
							<Tooltip content={<Text size={1} padding={2}>Generate OTF from TTF</Text>} placement="top" portal>
								<Button mode="ghost" icon={GenerateIcon} onClick={() => handleGenerateFontFile('otf', value.ttf)} />
							</Tooltip>
						)}
						{value?.otf && <DeleteButton onClick={() => handleDelete('otf')} />}
					</Flex>
				)}
			</FileRow>

			{/* WOFF Section */}
			<FileRow
				label="WOFF"
				href={fileInput?.woff?.asset?._ref && cdnUrl(fileInput.woff.asset._ref)}
				filename={filenames?.woff}
			>
				{status === 'ready' && (
					<Flex gap={1}>
						<UploadButton ref={ref} onChange={(e) => handleUpload(e, 'woff')} tooltip="Upload WOFF" />
						{value?.ttf && (
							<Tooltip content={<Text size={1} padding={2}>Generate WOFF from TTF</Text>} placement="top" portal>
								<Button mode="ghost" icon={GenerateIcon} onClick={() => handleGenerateFontFile('woff', value.ttf)} />
							</Tooltip>
						)}
						{value?.woff && <DeleteButton onClick={() => handleDelete('woff')} />}
					</Flex>
				)}
			</FileRow>

			{/* WOFF2 Section */}
			<FileRow
				label="WOFF2"
				href={fileInput?.woff2?.asset?._ref && cdnUrl(fileInput.woff2.asset._ref)}
				filename={filenames?.woff2}
			>
				{status === 'ready' && (
					<Flex gap={1}>
						<UploadButton ref={ref} onChange={(e) => handleUpload(e, 'woff2')} tooltip="Upload WOFF2" />
						{value?.ttf && (
							<Tooltip content={<Text size={1} padding={2}>Generate WOFF2 from TTF</Text>} placement="top" portal>
								<Button mode="ghost" icon={GenerateIcon} onClick={() => handleGenerateFontFile('woff2', value.ttf)} />
							</Tooltip>
						)}
						{value?.woff2 && <DeleteButton onClick={() => handleDelete('woff2')} />}
					</Flex>
				)}
			</FileRow>

			{/* WOFF2 Web (fingerprinted) — read-only, generated from WOFF2 */}
			<FileRow
				label="WOFF2 Web"
				href={fileInput?.woff2_web?.asset?._ref && cdnUrl(fileInput.woff2_web.asset._ref)}
				filename={filenames?.woff2_web}
				muted
			>
				{status === 'ready' && value?.woff2 && (
					<Tooltip content={<Text size={1} padding={2}>Generate DS-WEB fingerprinted copy from WOFF2 (used for web delivery)</Text>} placement="top" portal>
						<Button mode="ghost" icon={GenerateIcon} onClick={() => handleGenerateWebSubset()} />
					</Tooltip>
				)}
			</FileRow>

			{/* WOFF2 Subset — read-only, generated from WOFF2 */}
			<FileRow
				label="WOFF2 Subset"
				href={fileInput?.woff2_subset?.asset?._ref && cdnUrl(fileInput.woff2_subset.asset._ref)}
				filename={filenames?.woff2_subset}
				muted
			>
				{status === 'ready' && value?.woff2 && (
					<Tooltip content={<Text size={1} padding={2}>Generate display subset from WOFF2 (fingerprinted, used for typeface page previews)</Text>} placement="top" portal>
						<Button mode="ghost" icon={GenerateIcon} onClick={() => handleGenerateWebSubset()} />
					</Tooltip>
				)}
			</FileRow>

			{/* EOT Section */}
			<FileRow
				label="EOT"
				href={fileInput?.eot?.asset?._ref && cdnUrl(fileInput.eot.asset._ref)}
				filename={filenames?.eot}
			>
				{status === 'ready' && (
					<Flex gap={1}>
						<UploadButton ref={ref} onChange={(e) => handleUpload(e, 'eot')} tooltip="Upload EOT" />
						{value?.ttf && (
							<Tooltip content={<Text size={1} padding={2}>Generate EOT from TTF</Text>} placement="top" portal>
								<Button mode="ghost" icon={GenerateIcon} onClick={() => handleGenerateFontFile('eot', value.ttf)} />
							</Tooltip>
						)}
						{value?.eot && <DeleteButton onClick={() => handleDelete('eot')} />}
					</Flex>
				)}
			</FileRow>

			{/* SVG Section */}
			<FileRow
				label="SVG"
				href={fileInput?.svg?.asset?._ref && cdnUrl(fileInput.svg.asset._ref)}
				filename={filenames?.svg}
			>
				{status === 'ready' && (
					<Flex gap={1}>
						<UploadButton ref={ref} onChange={(e) => handleUpload(e, 'svg')} tooltip="Upload SVG" />
						{value?.ttf && (
							<Tooltip content={<Text size={1} padding={2}>Generate SVG font from TTF</Text>} placement="top" portal>
								<Button mode="ghost" icon={GenerateIcon} onClick={() => handleGenerateFontFile('svg', value.ttf)} />
							</Tooltip>
						)}
						{value?.svg && <DeleteButton onClick={() => handleDelete('svg')} />}
					</Flex>
				)}
			</FileRow>

			{/* CSS Section */}
			<FileRow
				label="CSS"
				href={fileInput?.css?.asset?._ref && cdnUrl(fileInput.css.asset._ref)}
				filename={filenames?.css}
			>
				{status === 'ready' && (
					<Flex gap={1}>
						{value?.woff2 && (
							<Tooltip content={<Text size={1} padding={2}>Generate @font-face CSS from WOFF2</Text>} placement="top" portal>
								<Button mode="ghost" icon={GenerateIcon} onClick={() => handleGenerateCssFile()} />
							</Tooltip>
						)}
						{value?.css && <DeleteButton onClick={() => handleDelete('css')} />}
					</Flex>
				)}
			</FileRow>

			{/* Font Data Section */}
			<Flex justify="space-between" align="center">
				<Text muted size={1}>
					Data:&nbsp;{doc_metaData?.version ? <b>v{doc_metaData?.version} ({doc_metaData?.genDate})</b> : <b>Empty</b>}
				</Text>
				{status === 'ready' && value?.ttf && (
					<Tooltip content={<Text size={1} padding={2}>Extract font metadata, metrics and OpenType features from TTF</Text>} placement="top" portal>
						<Button mode="ghost" icon={GenerateIcon} onClick={() => handleGenerateFontData()} />
					</Tooltip>
				)}
			</Flex>

			{/* Delete All Button */}
			{status === 'ready' && (value?.ttf || value?.otf || value?.woff || value?.woff2) && (
				<Button mode="ghost" tone="critical" onClick={() => handleDeleteAll()} style={{ width: '100%' }}>
					Delete All
				</Button>
			)}
		</Stack>
	);
};
