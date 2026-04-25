// Script font uploader: processes and uploads font files per writing system (e.g. Cyrillic, Greek, Arabic)

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Flex, Label, Select, Spinner, Stack, Text } from '@sanity/ui';
import { UploadIcon } from '@sanity/icons';
import * as fontkit from 'fontkit';
import slugify from 'slugify';
import { useSanityClient } from '../hooks/useSanityClient';
import { useFormValue } from 'sanity';
import { nanoid } from 'nanoid';
import generateCssFile from '../utils/generateCssFile';
import { generateStyleKeywords, reverseSpellingLookup } from '../utils/generateKeywords';
import { SCRIPTS } from '../utils/utils';
import StatusDisplay from './StatusDisplay';

/**
 * Component for uploading and managing script variants of fonts.
 * @param {Object} props
 * @param {Object} props.elementProps
 * @returns {JSX.Element}
 */
export const UploadScriptsComponent = (props) => {

	const { elementProps: { ref } } = props;
	const client = useSanityClient();

	const [selectedScript, setSelectedScript] = useState('');
	const [status, setStatus] = useState('');
	const [ready, setReady] = useState(true);
	const [error, setError] = useState(false);

	let doc_id = useFormValue(['_id']);
	const title = useFormValue(['title']);
	const slug = useFormValue(['slug']);
	const scripts = useFormValue(['scripts']) || [];
	const stylesObject = useFormValue(['styles']);
	let subfamiliesArray = stylesObject?.subfamilies || [];

	const { weightKeywordList, italicKeywordList } = useMemo(() => generateStyleKeywords(), []);

	/**
	 * Reads a font file and returns its content as a Uint8Array.
	 * @param {File} file
	 * @returns {Promise<Uint8Array>}
	 */
	const readFontFile = (file) => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (event) => { resolve(new Uint8Array(event.target.result)); };
			reader.onerror = (error) => { reject(error); };
			reader.readAsArrayBuffer(file);
		});
	};

	/**
	 * Handles the upload and processing of font files for a specific script.
	 * @param {Event} event
	 * @param {string} script
	 */
	const handleUpload = useCallback(async (event, script) => {
		setReady(false);
		setError(false);
		try {
			let failedFiles = [];
			setStatus('Uploading font files...');

			if (!title) {
				console.error('Typeface needs a title');
				setStatus('Typeface needs a title');
				setError(true);
				setReady(true);
				return;
			}

			let fontRefs = [];
			let variableRefs = [];
			let subfamilies = {};
			let fontsObjects = {};

			for (var i = 0; i < event.target.files.length; i++) {

				const file = event.target.files[i];
				const fontBuffer = await readFontFile(file);
				const font = fontkit.create(fontBuffer);

				let weightName = font?.name?.records?.preferredSubfamily ? font?.name?.records?.preferredSubfamily : font?.name?.records?.fontSubfamily;
				weightName = weightName?.en ? weightName.en : weightName.constructor == Object ? weightName[Object.keys(weightName)[0]] : weightName;
				weightName = weightName?.replace('Italic', '').replace('It', '').trim();

				if ((weightName == '' || weightName.toLowerCase() == 'roman') && font?.name?.records?.fullName) {
					weightName = font?.name?.records?.fullName;
					weightName = weightName?.en ? weightName.en : weightName.constructor == Object ? weightName[Object.keys(weightName)[0]] : weightName;
					weightName = weightName?.replace(title + ' ', '').replace(title, '').trim();
					weightName = weightName?.replace('Italic', '').replace('It', '').trim();
				}

				let variableFont = font?.variationAxes && Object.keys(font.variationAxes).length > 0 ? true : false;
				let subfamilyName = font.familyName.toLowerCase().trim().replace(title.toLowerCase().trim(), '').trim();
				let fontTitle = font?.fullName;
				let style = (font?.italicAngle !== 0 || font?.fullName.toLowerCase().includes('italic')) ? 'Italic' : 'Regular';

				if (fontTitle.toLowerCase().trim().includes(script)) {
					fontTitle = fontTitle.toLowerCase().trim().replace(script, '').trim();
					fontTitle = fontTitle.split(' ').map(word => {
						if (word == '') return;
						return word;
					})
						.filter(word => word != undefined)
						.join(' ');
				}

				weightKeywordList.forEach(keyword => {
					const kw = keyword.trim();
					if (subfamilyName.includes(kw)) subfamilyName = subfamilyName.replace(kw, '').trim();
				});

				let italicKW = [];
				italicKeywordList.forEach(keyword => {
					const kw = keyword.toLowerCase().trim();
					if (subfamilyName.includes(kw)) {
						subfamilyName = subfamilyName.replace(kw, '');
					}
					if (fontTitle.includes(kw)) {
						fontTitle = fontTitle.replace(kw, '');
						italicKW.push(kw.charAt(0).toUpperCase() + kw.slice(1));
					}
				});

				fontTitle = fontTitle.replace(/-/g, ' ');
				fontTitle = fontTitle.trim().split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');

				if (subfamilyName.trim().includes(script)) {
					subfamilyName = subfamilyName.trim().replace(script, '').trim();
				}

				subfamilyName = subfamilyName.trim();
				subfamilyName = (subfamilyName == '') ? 'Regular' : subfamilyName.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');

				if (subfamilyName !== '') {
					weightName = weightName
						.replace(`${subfamilyName} `, '')
						.replace(` ${subfamilyName}`, '')
						.trim();
				}

				if (variableFont && !fontTitle.toLowerCase().trim().endsWith(' vf')) fontTitle = fontTitle + ' VF';

				if (italicKW.length > 0) {
					italicKW = italicKW.map(item => reverseSpellingLookup(item));
					fontTitle = fontTitle + italicKW.join(' ');
					style = 'Italic';
				}

				let id = slugify(fontTitle.toLowerCase().trim());

				subfamilies[id] = subfamilyName;

				if (fontsObjects[id]) {
					fontsObjects[id].files = [...fontsObjects[id].files, file];
				} else {
					let fontObject = {
						_key: nanoid(),
						_id: id,
						title: fontTitle,
						slug: { _type: 'slug', current: id },
						typefaceName: title,
						style: (font?.italicAngle !== 0 || font?.fullName.toLowerCase().includes('italic')) ? 'Italic' : 'Regular',
						variableFont: variableFont,
						weightName: weightName,
						normalWeight: true,
						weight: font['OS/2']?.usWeightClass ? Number(font['OS/2']?.usWeightClass) :
							/hairline|extra thin|extrathin/.test(weightName?.toLowerCase()) ? 100 :
							/thin|extra light|extralight/.test(weightName?.toLowerCase()) ? 200 :
							/light|book/.test(weightName?.toLowerCase()) ? 300 :
							/regular|normal/.test(weightName?.toLowerCase()) ? 400 :
							/medium/.test(weightName?.toLowerCase()) ? 500 :
							/semi bold|semibold/.test(weightName?.toLowerCase()) ? 600 :
							/extra bold|extrabold/.test(weightName?.toLowerCase()) ? 800 :
							/bold/.test(weightName?.toLowerCase()) ? 700 :
							/black|ultra/.test(weightName?.toLowerCase()) ? 900 :
							400,
						files: [file],
						fontKit: font,
						scriptFileInput: { [script]: {} },
					};
					fontsObjects[id] = fontObject;
				}
			}

			let uniqueSubfamiles = [...new Set(Object.values(subfamilies))];

			for (var i = 0; i < Object.keys(fontsObjects).length; i++) {

				let id = Object.keys(fontsObjects)[i];
				let fontObject = fontsObjects[id];
				let files = fontObject.files;
				let newFileInput = fontObject.scriptFileInput[script];

				if (uniqueSubfamiles.length > 1) fontObject.subfamily = subfamilies[id];
				else fontObject.subfamily = '';

				fontObject.price = process.env.SANITY_STUDIO_DEFAULT_STYLE_PRICE || 40;
				if (fontObject.price > 0) fontObject.sell = true;

				for (var j = 0; j < files.length; j++) {
					let file = files[j];
					let fileType = '';
					if (file.name.endsWith('.otf')) fileType = 'otf';
					else if (file.name.endsWith('.ttf')) fileType = 'ttf';
					else if (file.name.endsWith('.woff')) fileType = 'woff';
					else if (file.name.endsWith('.woff2')) fileType = 'woff2';
					else if (file.name.endsWith('.eot')) fileType = 'eot';
					else if (file.name.endsWith('.svg')) fileType = 'svg';

					const filename = fontObject._id + '-' + script;
					let fontTitle = fontObject.title + ' ' + script;
					fontTitle = fontTitle.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');

					let baseAsset = await client.assets.upload('file', file, { filename: filename + '.' + fileType })
						.catch(err => {
							console.error('Error uploading font:', fontObject.title, err.message);
							setStatus('Error uploading font: ' + err.message);
							setError(true);
						});

					newFileInput[fileType] = {
						_type: 'file',
						asset: { _ref: baseAsset._id, _type: 'reference' },
					};

					if (file.name.endsWith('.woff2')) {
						setStatus('Generating CSS for: ' + fontObject.title);
						newFileInput = await generateCssFile({
							woff2File: file,
							fileInput: newFileInput,
							fontName: fontTitle,
							fileName: filename,
							variableFont: fontObject.variableFont,
							weight: fontObject.weight,
							client: client,
						});
					}

					fontObject.scriptFileInput[script] = newFileInput;
					fontsObjects[id] = fontObject;
				}
			}

			for (var i = 0; i < Object.keys(fontsObjects).length; i++) {
				let fontId = Object.keys(fontsObjects)[i];
				let font = fontsObjects[fontId];

				let existingFont = await client.fetch(
					`*[_type == 'font' && _id == $fontId]{
						fileInput,
						description,
						metaData,
						metrics,
						opentypeFeatures,
						characterSet,
						subfamily,
						scriptFileInput,
					}`,
					{ fontId: font._id }
				);

				existingFont = existingFont[0];

				let fontResponse;
				let files = font.files;
				let fontKit = font.fontKit;
				delete font.files;
				delete font.fontKit;

				try {
					if (existingFont && existingFont != null) {
						if (existingFont.scriptFileInput && existingFont.scriptFileInput != null) {
							let newFileInput = { ...font.scriptFileInput };
							Object.keys(existingFont.scriptFileInput).forEach(key => {
								if (!newFileInput[key]) newFileInput[key] = existingFont.scriptFileInput[key];
							});
							font.scriptFileInput = newFileInput;
						}
						fontResponse = await client.patch(font._id).set({ scriptFileInput: font.scriptFileInput }).commit();
					} else {
						fontResponse = await client.createOrReplace({
							_key: nanoid(),
							_id: font._id,
							_type: 'font',
							...font,
						});
					}
				} catch (e) {
					console.error('Error creating font:', font.title, font.subfamily, e.message);
					failedFiles = [...failedFiles, ...(files.map(file => ({ name: file.name, fk: fontKit })))];
					continue;
				}

				const fontRef = { _key: nanoid(), _type: 'reference', _ref: fontResponse._id, _weak: true };

				if (!font.variableFont) {
					if (stylesObject.fonts && stylesObject.fonts.length > 0) {
						let fontExists = stylesObject.fonts.findIndex(font => font._ref == fontResponse._id);
						let inFontRefs = fontRefs.findIndex(font => font._ref == fontResponse._id);
						if (fontExists == -1 && inFontRefs == -1) fontRefs.push(fontRef);
					} else {
						fontRefs.push(fontRef);
					}
				}

				if (font.variableFont) {
					if (stylesObject.variableFont && stylesObject.variableFont.length > 0) {
						let vfExists = stylesObject.variableFont.findIndex(font => font._ref == fontResponse._id);
						let inVariableRefs = variableRefs.findIndex(font => font._ref == fontResponse._id);
						if (vfExists == -1 && inVariableRefs == -1 && font.variableFont) variableRefs.push(fontRef);
					} else {
						variableRefs.push(fontRef);
					}
				}
			}

			setStatus('Updating font references...');

			let newStylesObject = stylesObject.fonts
				? { ...stylesObject, fonts: [...stylesObject.fonts, ...fontRefs] }
				: { ...stylesObject, fonts: [...fontRefs] };

			if (uniqueSubfamiles.length > 1) {
				newStylesObject.subfamilies = uniqueSubfamiles;
			} else {
				newStylesObject.subfamilies = [];
			}

			newStylesObject.variableFont = stylesObject?.variableFont ? [...stylesObject?.variableFont, ...variableRefs] : [...variableRefs];

			let patch = { styles: newStylesObject };

			subfamiliesArray = subfamiliesArray ? subfamiliesArray : [];
			subfamiliesArray = [...subfamiliesArray, ...uniqueSubfamiles].filter((sf, index, self) => {
				return self.indexOf(sf) === index;
			});

			patch.styles.subfamilies = subfamiliesArray;

			let includedScripts = [script, ...scripts].filter((lang, index, self) => {
				return self.indexOf(lang) === index;
			});
			patch.scripts = includedScripts;

			if (doc_id.startsWith('drafts.')) {
				await client.patch(doc_id).set(patch).commit()
					.catch(err => {
						console.error('Error patching styles:', err.message);
						setStatus('Error patching styles: ' + err.message);
						setError(true);
					});
				doc_id = doc_id.replace('drafts.', '');
			}

			await client.patch(doc_id).set(patch).commit()
				.catch(err => {
					console.error('Error patching styles:', err.message);
					setStatus('Error patching styles');
					setError(true);
				});

			if (failedFiles.length > 0) {
				const names = failedFiles.map(file => file.name);
				setStatus('Upload completed with errors. Failed files: ' + names.join(', '));
				setError(true);
			} else {
				setStatus('Fonts uploaded successfully');
				setError(false);
			}
		} catch (e) {
			console.error('Error uploading fonts:', e.message);
			setStatus('Error uploading fonts: ' + e.message);
			setError(true);
		}
		setReady(true);
	}, [title, slug, doc_id]);

	const scriptLabel = selectedScript
		? selectedScript[0]?.toUpperCase() + selectedScript.slice(1)
		: '';

	return (
		<Stack space={3}>
			<StatusDisplay status={status} error={error} />

			<Stack space={1}>
				<Label>Script variant</Label>
				<Select id="script-select" onChange={(e) => setSelectedScript(e.target.value)}>
					<option value="">Select a script...</option>
					{SCRIPTS.map((script, i) => (
						<option key={'script-' + i} value={script}>
							{script[0]?.toUpperCase() + script.slice(1)}
						</option>
					))}
				</Select>
			</Stack>

			{!!(selectedScript && selectedScript !== '') && (
				ready ? (
					<Card
						radius={2}
						padding={5}
						style={{
							position: 'relative',
							border: '1px dashed var(--card-border-color)',
							cursor: 'pointer',
							textAlign: 'center',
						}}
					>
						<Flex direction="column" align="center" justify="center" gap={3} style={{ pointerEvents: 'none' }}>
							<Text muted><UploadIcon style={{ fontSize: '1.5rem' }} /></Text>
							<Stack space={1}>
								<Text align="center" weight="semibold">Upload {scriptLabel} font files</Text>
								<Text size={1} muted align="center">TTF, OTF, WOFF, WOFF2</Text>
							</Stack>
						</Flex>
						<input
							ref={ref}
							type="file"
							multiple
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: '100%',
								opacity: 0,
								cursor: 'pointer',
							}}
							onChange={(event) => handleUpload(event, selectedScript)}
						/>
					</Card>
				) : (
					<Flex align="center" justify="center" gap={3} padding={4}>
						<Spinner />
						<Text muted size={1}>{status || 'Processing...'}</Text>
					</Flex>
				)
			)}
		</Stack>
	);
};
