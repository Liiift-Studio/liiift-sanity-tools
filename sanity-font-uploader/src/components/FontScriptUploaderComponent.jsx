// Script-aware uploader for per-script font file variants (Latin, Arabic, Hebrew, etc.) stored in scriptFileInput

import React, { useState, useEffect, useCallback } from 'react';
import { Stack, Flex, Text, Button } from '@sanity/ui';
import { useFormValue, set, unset } from 'sanity';

// Utils
import generateCssFile from '../utils/generateCssFile';
import generateFontFile from '../utils/generateFontFile';
import { SCRIPTS } from '../utils/utils';
import { useSanityClient } from '../hooks/useSanityClient';

/**
 * Component for managing font file uploads and conversions for different scripts/languages
 * @param {Object} props - Component props
 * @param {Object} props.elementProps - Props for the form element
 * @param {React.Ref} props.elementProps.ref - Reference for file input
 * @param {Function} props.onChange - Callback for handling form value changes
 * @param {string} props.value - Current form value
 */
export const FontScriptUploaderComponent = (props) => {
	const client = useSanityClient();
	const {
		elementProps: { ref },
		onChange,
		value = ''
	} = props;

	// State management
	const [expanded, setExpanded] = useState(SCRIPTS.reduce((acc, language) => ({ ...acc, [language]: true }), {}));
	const [message, setMessage] = useState({});
	const [status, setStatus] = useState('ready');
	const [filenames, setFilenames] = useState({});

	// Form values from Sanity
	let scriptFileInput = useFormValue(['scriptFileInput']) || [];
	let fileInput = useFormValue(['fileInput']);
	let doc_id = useFormValue(['_id']);
	let doc_title = useFormValue(['title']);
	let doc_variableFont = useFormValue(['variableFont']);
	let doc_weight = useFormValue(['weight']);
	let doc_style = useFormValue(['style']);
	let doc_slug = useFormValue(['slug']);

	/**
	 * Updates filenames state based on scriptFileInput changes
	 */
	useEffect(() => {
		if (!scriptFileInput || Object.keys(scriptFileInput).length === 0) return;
		handleSetFilenames();
	}, [scriptFileInput]);

	/**
	 * Fetches and sets filenames for all uploaded font files
	 */
	const handleSetFilenames = useCallback(async () => {
		console.log('Set font names ', scriptFileInput);
		let allIds = [];

		const assetIds = SCRIPTS.reduce((acc, language) => {
			if (scriptFileInput[language]) {
				let newFileInput = Object.keys(scriptFileInput[language]).reduce((ftacc, filetype) => {
					if (!scriptFileInput[language][filetype]?.asset?._ref) return ftacc;
					allIds.push(scriptFileInput[language][filetype]?.asset?._ref);
					return { ...ftacc, [filetype]: scriptFileInput[language][filetype]?.asset?._ref }
				}, {});
				acc[language] = newFileInput;
			}
			return acc;
		}, {});

		// Fetch all assets in a single request
		let assetData = await client.fetch(`*[_id in $allIds] {
			_id,
			originalFilename
		}`, { allIds });

		assetData = assetData.reduce((acc, asset) => {
			let ref = asset._id;
			return { ...acc, [ref]: asset.originalFilename }
		}, {});

		let fontNames = {};
		SCRIPTS.forEach(language => {
			if (assetIds[language]) {
				Object.keys(assetIds[language]).forEach(filetype => {
					let ref = assetIds[language][filetype];
					fontNames[language] = { ...fontNames[language], [filetype]: assetData[ref] }
				});
			}
		});

		setFilenames(fontNames);
	}, [scriptFileInput]);

	/**
	 * Generates CSS file for a specific language
	 */
	const handleGenerateCssFile = useCallback(async (language) => {
		setMessage({ ...message, [language]: 'Generating css: ' + doc_title + '.css' });

		const woff2AssetRef = scriptFileInput[language]?.woff2?.asset?._ref;
		// Parameterized — prevents injection via scriptFileInput asset refs
		let [woff2Buffer] = await client.fetch(
			`*[_id == $id]{ originalFilename, url }`,
			{ id: woff2AssetRef }
		);

		let blob = await fetch(woff2Buffer.url);
		blob = await blob.blob();

		let newFileInput = await generateCssFile({
			woff2File: blob,
			fileInput: scriptFileInput,
			language: language,
			fontName: doc_title,
			fileName: woff2Buffer.originalFilename.replace('.woff2', ''),
			variableFont: doc_variableFont,
			weight: doc_weight,
			style: doc_style,
			client: client
		});

		setMessage({ ...message, [language]: 'CSS generated!' });
		setTimeout(() => { setMessage({}) }, 2000);
		onChange(set(newFileInput));
	}, [scriptFileInput, onChange, doc_title, doc_variableFont]);

	/**
	 * Generates font files in specified formats
	 */
	const handleGenerateFontFile = useCallback(async (code, sourceFile, language) => {
		setMessage({ ...message, [language]: 'Generating files: ', code });

		let url = `https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${sourceFile?.asset?._ref.replace("file-", "").replace("-", ".")}`;
		console.log('Handle generate font file ', code, sourceFile, url);

		if (code === 'all') {
			await generateFontFile({
				codes: ['otf', 'woff', 'woff2', 'eot', 'svg'],
				language: language,
				srcUrl: url,
				filename: doc_slug.current + '-' + language,
				documentId: doc_id,
				documentTitle: doc_title,
				documentVariableFont: doc_variableFont,
				documentStyle: doc_style,
				documentWeight: doc_weight,
				fileInput: scriptFileInput,
			});
		} else {
			await generateFontFile({
				codes: [code],
				language: language,
				srcUrl: url,
				filename: doc_slug.current + '-' + language,
				documentId: doc_id,
				documentTitle: doc_title,
				documentVariableFont: doc_variableFont,
				documentStyle: doc_style,
				documentWeight: doc_weight,
				fileInput: scriptFileInput,
			});
		}
		setMessage({ ...message, [language]: 'Files generated!' });
		setTimeout(() => { setMessage({}) }, 2000);
	}, []);

	/**
	 * Handles font file upload for a specific language and format
	 */
	const handleUpload = useCallback(async (event, language, code) => {
		console.log('Handle upload ', scriptFileInput, language, code);

		let file = event.target.files[0];
		let filename = doc_slug.current + '-' + language + '.' + file.name.split('.').pop();

		setMessage({ ...message, [language]: 'Uploading: ' + filename });

		var asset = await client.assets.upload('file', file, { filename: filename });

		let langObj = scriptFileInput[language] ? { ...scriptFileInput[language] } : {};
		let newFileInput = {
			...scriptFileInput,
			[language]: {
				...langObj,
				[code]: {
					_type: 'file',
					asset: {
						_ref: asset._id,
						_type: 'reference'
					}
				}
			}
		};

		let id = doc_id;
		if (id.startsWith('drafts.')) {
			id = id.replace('drafts.', '');
		}

		setMessage({ ...message, [language]: filename + ' uploaded!' });
		setTimeout(() => { setMessage({}) }, 2000);

		// Generate CSS for WOFF2 files
		if (code === 'woff2') {
			console.log('woff2');
			setMessage({ ...message, [language]: 'Generating Css: ' + doc_title + '.css' });

			newFileInput = await generateCssFile({
				woff2File: file,
				fileInput: newFileInput,
				language: language,
				fontName: doc_title + '-' + language,
				fileName: filename.replace('.woff2', ''),
				variableFont: doc_variableFont,
				weight: doc_weight,
				style: doc_style,
				client: client
			});
			setMessage({ ...message, [language]: '' + doc_title + '.css generated!' });
		}

		onChange(set(newFileInput));
	}, [scriptFileInput, onChange, doc_title, doc_variableFont, doc_slug]);

	/**
	 * Deletes a specific font file
	 */
	const handleDelete = useCallback(async (code, language) => {
		console.log('Delete : ', code, language);

		setMessage({ ...message, [language]: `deleting ${language} ${code}` });
		const asset = scriptFileInput[language][code]?.asset?._ref;

		let newFileInput = { ...scriptFileInput };
		delete newFileInput[language][code];

		onChange(unset([language, code]));

		await client.delete(asset)
			.then(result => {
				setMessage({ ...message, [language]: 'deleted asset: ', result });
				setTimeout(() => { setMessage({}) }, 2000);
			})
			.catch(e => {
				console.error('Error deleting asset: ', e.message);
				setMessage({ ...message, [language]: 'WARNING: ' + e.message });
			});
	}, [doc_id, scriptFileInput, onChange]);

	/**
	 * Deletes all font files for a specific language
	 */
	const handleDeleteAll = useCallback(async (language) => {
		setMessage({ ...message, [language]: 'deleting...' });
		onChange(unset([language]));

		console.log('Delete all : ', scriptFileInput[language]);
		for (var i = 0; i < Object.keys(scriptFileInput[language]).length; i++) {
			let refKey = Object.keys(scriptFileInput[language])[i];
			if (refKey == 'documentInfo') return;

			const asset = scriptFileInput[language][refKey]?.asset?._ref;

			try {
				await client.delete(asset)
					.then(result => {
						setMessage({ ...message, [language]: 'deleted asset: ', result });
						setTimeout(() => { setMessage({}) }, 2000);
					});
			}
			catch (e) {
				console.error('Error deleting asset: ', e.message);
			}
		}
	}, [scriptFileInput]);

	// Render component
	return (
		<Stack space={4}>
			{SCRIPTS && scriptFileInput && SCRIPTS.map((language, i) => {
				return (
					<Stack space={2} key={'language-' + i} style={{ borderBottom: '1px solid var(--card-border-color)', paddingBottom: 8 }}>
						<Flex gap={2}>
							<Text weight="semibold">{language[0]?.toUpperCase() + language.slice(1)}</Text>
							{message && message[language] && message[language] !== '' && (
								<Text style={{ color: 'green' }}>{message[language]}</Text>
							)}
						</Flex>

						{expanded[language] && (
							<Stack space={2}>
								{/* TTF Section */}
								<Flex justify="space-between" align="center">
									<Text>
										TTF:&nbsp;{!scriptFileInput[language]?.ttf?.asset?._ref
											? (filenames[language]?.ttf ? <b>{filenames[language].ttf}</b> : <b>Empty</b>)
											: <a href={`https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${scriptFileInput[language]?.ttf?.asset?._ref.replace("file-", "").replace("-", ".")}`} target="_blank">
												{filenames[language]?.ttf ? <b>{filenames[language].ttf}</b> : <b>File</b>}
											</a>
										}
									</Text>
									{status === 'ready' && (
										<Flex gap={1}>
											<label>
												<Button as="span" mode="ghost">Upload</Button>
												<input ref={ref} type="file" style={{ display: 'none' }} onChange={(event) => handleUpload(event, language, 'ttf')} />
											</label>
											{value[language]?.ttf && <Button mode="ghost" tone="critical" onClick={() => handleDelete('ttf', language)}>×</Button>}
										</Flex>
									)}
								</Flex>

								{/* Generate All Button */}
								{status === 'ready' && value[language]?.ttf && (
									<Button mode="default" onClick={() => handleGenerateFontFile('all', value[language].ttf, language)}>
										Regenerate Files from TTF
									</Button>
								)}

								{/* OTF Section */}
								<Flex justify="space-between" align="center">
									<Text>
										OTF:&nbsp;{!scriptFileInput[language]?.otf?.asset?._ref
											? (filenames[language]?.otf ? <b>{filenames[language]?.otf}</b> : <b>Empty</b>)
											: <a href={`https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${scriptFileInput[language]?.otf?.asset?._ref.replace("file-", "").replace("-", ".")}`} target="_blank">
												{filenames[language]?.otf ? <b>{filenames[language]?.otf}</b> : <b>File</b>}
											</a>
										}
									</Text>
									{status === 'ready' && (
										<Flex gap={1}>
											{value[language]?.woff && <Button mode="default" onClick={() => handleGenerateFontFile('otf', value[language].woff, language)}>Build</Button>}
											<label>
												<Button as="span" mode="ghost">Upload</Button>
												<input ref={ref} type="file" style={{ display: 'none' }} onChange={async (event) => handleUpload(event, language, 'otf')} />
											</label>
											{value[language]?.otf && <Button mode="ghost" tone="critical" onClick={() => handleDelete('otf', language)}>×</Button>}
										</Flex>
									)}
								</Flex>

								{/* WOFF Section */}
								<Flex justify="space-between" align="center">
									<Text>
										WOFF:&nbsp;{!scriptFileInput[language]?.woff?.asset?._ref
											? (filenames[language]?.woff ? <b>{filenames[language]?.woff}</b> : <b>Empty</b>)
											: <a href={`https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${scriptFileInput[language]?.woff?.asset?._ref.replace("file-", "").replace("-", ".")}`} target="_blank">
												{filenames[language]?.woff ? <b>{filenames[language]?.woff}</b> : <b>File</b>}
											</a>
										}
									</Text>
									{status === 'ready' && (
										<Flex gap={1}>
											{value[language]?.ttf && <Button mode="default" onClick={() => handleGenerateFontFile('woff', value[language].ttf, language)}>Build</Button>}
											<label>
												<Button as="span" mode="ghost">Upload</Button>
												<input ref={ref} type="file" style={{ display: 'none' }} onChange={async (event) => handleUpload(event, language, 'woff')} />
											</label>
											{value[language]?.woff && <Button mode="ghost" tone="critical" onClick={() => handleDelete('woff', language)}>×</Button>}
										</Flex>
									)}
								</Flex>

								{/* WOFF2 Section */}
								<Flex justify="space-between" align="center">
									<Text>
										WOFF2:&nbsp;{!scriptFileInput[language]?.woff2?.asset?._ref
											? (filenames[language]?.woff2 ? <b>{filenames[language]?.woff2}</b> : <b>Empty</b>)
											: <a href={`https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${scriptFileInput[language]?.woff2?.asset?._ref.replace("file-", "").replace("-", ".")}`} target="_blank">
												{filenames[language]?.woff2 ? <b>{filenames[language]?.woff2}</b> : <b>File</b>}
											</a>
										}
									</Text>
									{status === 'ready' && (
										<Flex gap={1}>
											{value[language]?.ttf && <Button mode="default" onClick={() => handleGenerateFontFile('woff2', value[language].ttf, language)}>Build</Button>}
											<label>
												<Button as="span" mode="ghost">Upload</Button>
												<input ref={ref} type="file" style={{ display: 'none' }} onChange={async (event) => handleUpload(event, language, 'woff2')} />
											</label>
											{value[language]?.woff2 && <Button mode="ghost" tone="critical" onClick={() => handleDelete('woff2', language)}>×</Button>}
										</Flex>
									)}
								</Flex>

								{/* EOT Section */}
								<Flex justify="space-between" align="center">
									<Text>
										EOT:&nbsp;{!scriptFileInput[language]?.eot?.asset?._ref
											? (filenames[language]?.eot ? <b>{filenames[language]?.eot}</b> : <b>Empty</b>)
											: <a href={`https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${scriptFileInput[language]?.eot?.asset?._ref.replace("file-", "").replace("-", ".")}`} target="_blank">
												{filenames[language]?.eot ? <b>{filenames[language]?.eot}</b> : <b>File</b>}
											</a>
										}
									</Text>
									{status === 'ready' && (
										<Flex gap={1}>
											{value[language]?.ttf && <Button mode="default" onClick={() => handleGenerateFontFile('eot', value[language].ttf, language)}>Build</Button>}
											<label>
												<Button as="span" mode="ghost">Upload</Button>
												<input ref={ref} type="file" style={{ display: 'none' }} onChange={async (event) => handleUpload(event, language, 'eot')} />
											</label>
											{value[language]?.eot && <Button mode="ghost" tone="critical" onClick={() => handleDelete('eot', language)}>×</Button>}
										</Flex>
									)}
								</Flex>

								{/* SVG Section */}
								<Flex justify="space-between" align="center">
									<Text>
										SVG:&nbsp;{!scriptFileInput[language]?.svg?.asset?._ref
											? (filenames[language]?.svg ? <b>{filenames[language]?.svg}</b> : <b>Empty</b>)
											: <a href={`https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${scriptFileInput[language]?.svg?.asset?._ref.replace("file-", "").replace("-", ".")}`} target="_blank">
												{filenames[language]?.svg ? <b>{filenames[language]?.svg}</b> : <b>File</b>}
											</a>
										}
									</Text>
									{status === 'ready' && (
										<Flex gap={1}>
											{value[language]?.ttf && <Button mode="default" onClick={() => handleGenerateFontFile('svg', value[language].ttf, language)}>Build</Button>}
											<label>
												<Button as="span" mode="ghost">Upload</Button>
												<input ref={ref} type="file" style={{ display: 'none' }} onChange={async (event) => handleUpload(event, language, 'svg')} />
											</label>
											{value[language]?.svg && <Button mode="ghost" tone="critical" onClick={() => handleDelete('svg', language)}>×</Button>}
										</Flex>
									)}
								</Flex>

								{/* CSS Section */}
								<Flex justify="space-between" align="center">
									<Text>
										CSS:&nbsp;{!scriptFileInput[language]?.css?.asset?._ref
											? (filenames[language]?.css ? <b>{filenames[language]?.css}</b> : <b>Empty</b>)
											: <a href={`https://cdn.sanity.io/files/${process.env.SANITY_STUDIO_PROJECT_ID}/${process.env.SANITY_STUDIO_DATASET}/${scriptFileInput[language]?.css?.asset?._ref.replace("file-", "").replace("-", ".")}`} target="_blank">
												{filenames[language]?.css ? <b>{filenames[language]?.css}</b> : <b>File</b>}
											</a>
										}
									</Text>
									{status === 'ready' && (
										<Flex gap={1}>
											{value[language]?.woff2 && <Button mode="default" onClick={() => handleGenerateCssFile(language)}>Build</Button>}
											{value[language]?.css && <Button mode="ghost" tone="critical" onClick={() => handleDelete('css', language)}>×</Button>}
										</Flex>
									)}
								</Flex>

								{/* Delete All Button */}
								{status === 'ready' && (value[language]?.ttf || value[language]?.otf || value[language]?.woff || value[language]?.woff2) && (
									<Button mode="ghost" tone="critical" onClick={() => handleDeleteAll(language)} style={{ width: '100%' }}>
										Delete All
									</Button>
								)}
							</Stack>
						)}
					</Stack>
				)
			})}
		</Stack>
	)
}
