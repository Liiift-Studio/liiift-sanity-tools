// Bulk font uploader component for Sanity CMS - handles multiple font file uploads and metadata generation

import React, { useCallback, useEffect, useMemo } from 'react';
import { Stack, Flex, Text, Button } from '@sanity/ui';
import * as fontkit from 'fontkit';
import slugify from 'slugify';
import { useSanityClient } from '../hooks/useSanityClient';
import { useFormValue } from 'sanity';
import { nanoid } from 'nanoid';
import generateFontData from '../utils/generateFontData';
import generateCssFile from '../utils/generateCssFile';
import { generateStyleKeywords, reverseSpellingLookup } from '../utils/generateKeywords';

/**
 * UploadFontsComponent
 *
 * Component for uploading font files and managing font data.
 *
 * Props:
 * - props: Contains elementProps for the component.
 */
export const UploadFontsComponent = ({ elementProps: { ref } }) => {

	// State variables for managing component status and input
	const [status, setStatus] = React.useState('ready'); // Current status of the upload process
	const [ready, setReady] = React.useState(true); // Indicates if the component is ready for user interaction
	const [inputPrice, setInputPrice] = React.useState('0'); // Price input for the font style
	const [error, setError] = React.useState(false); // Error state for handling upload issues

	// Initialize Sanity client
	const client = useSanityClient(); // Sanity client for database interactions

	// Retrieve form values from Sanity
	let doc_id = useFormValue(['_id']); // Document ID
	const title = useFormValue(['title']); // Typeface title
	const preferredStyleRef = useFormValue(['preferredStyle']); // Reference to the preferred style
	const slug = useFormValue(['slug']); // Slug for the typeface
	const stylesObject = useFormValue(['styles']) || { fonts: [], variableFont: [] }; // Styles object
	let subfamiliesArray = stylesObject?.subfamilies || []; // Array of subfamilies


	// Generate style keywords for font processing
	const { weightKeywordList, italicKeywordList } = useMemo(() => generateStyleKeywords(), []); // Memoized style keywords


	/**
	 * Reads a font file and returns its content as a Uint8Array.
	 * @param {File} file - The font file to read.
	 * @returns {Promise<Uint8Array>} - A promise that resolves with the file content.
	 */
	const readFontFile = (file) => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = (event) => {
				resolve(new Uint8Array(event.target.result));
			};

			reader.onerror = (error) => { reject(error); };
			reader.readAsArrayBuffer(file);
		});
	};

	/**
	 * Sanitizes a string to create a valid Sanity document ID.
	 * Removes or replaces characters that are not allowed in Sanity IDs.
	 * Sanity ID requirements:
	 * - Must start with a letter, number, or underscore (not hyphen)
	 * - Can only contain letters (a-z), numbers (0-9), hyphens (-), and underscores (_)
	 * - Must be between 1 and 128 characters long
	 * - Case-sensitive but we convert to lowercase for consistency
	 *
	 * @param {string} str - The string to sanitize
	 * @returns {string} - A valid Sanity document ID
	 */
	const sanitizeForSanityId = (str) => {
		// Handle empty or invalid input
		if (!str || typeof str !== 'string') {
			return 'font-' + Date.now(); // Fallback with timestamp
		}

		// Convert to lowercase and trim whitespace
		let sanitized = str.toLowerCase().trim();

		// Replace common problematic patterns before slugify
		// Replace plus signs with the word 'plus'
		sanitized = sanitized.replace(/\+/g, 'plus');
		// Replace ampersands with 'and'
		sanitized = sanitized.replace(/&/g, 'and');
		// Replace @ with 'at'
		sanitized = sanitized.replace(/@/g, 'at');

		// Use slugify with very strict settings
		sanitized = slugify(sanitized, {
			replacement: '-',  // Replace spaces and removed characters with hyphen
			remove: /[^\w\s-]/g, // Remove all non-word chars except spaces and hyphens
			lower: true,       // Convert to lower case
			strict: true,      // Strip special characters except replacement
			locale: 'en',      // Use English locale for transliteration
			trim: true        // Trim leading and trailing replacement chars
		});

		// Additional cleanup to ensure Sanity compliance
		// Remove any characters that are not lowercase letters, numbers, hyphens, or underscores
		sanitized = sanitized.replace(/[^a-z0-9\-_]/g, '-');

		// Replace multiple consecutive hyphens with a single hyphen
		sanitized = sanitized.replace(/-+/g, '-');

		// Remove leading and trailing hyphens or underscores
		sanitized = sanitized.replace(/^[-_]+|[-_]+$/g, '');

		// Ensure the ID starts with a letter or underscore (not a number or hyphen)
		// Sanity requires IDs to start with a letter, number, or underscore
		// But starting with a number can sometimes cause issues, so we prefer letter/underscore
		if (sanitized && !/^[a-z_]/.test(sanitized)) {
			// If it starts with a number or hyphen, prefix with 'font_'
			sanitized = 'font_' + sanitized;
		}

		// Ensure the ID is not empty after all sanitization
		if (!sanitized) {
			sanitized = 'font_' + Date.now(); // Fallback with timestamp
		}

		// Ensure the ID doesn't exceed Sanity's 128 character limit
		if (sanitized.length > 128) {
			// Truncate to 120 chars and add a short hash suffix for uniqueness
			const hash = Math.random().toString(36).substring(2, 8);
			sanitized = sanitized.substring(0, 120) + '_' + hash;
		}

		// Final validation - ensure we only have valid characters
		// This is a paranoid check but ensures absolute compliance
		if (!/^[a-z_][a-z0-9\-_]*$/.test(sanitized)) {
			console.warn(`ID sanitization produced invalid result: "${sanitized}", using fallback`);
			sanitized = 'font_' + Date.now();
		}

		return sanitized;
	};

	/**
	 * Handles the upload of font files, processes them, and updates the Sanity database.
	 * @param {Event} event - The file input change event.
	 */
	const handleUpload = useCallback(async (event) => {

		try{
			console.log('handle upload ', title );
			let failedFiles = []; // Track files that failed to upload
			let fontRefs = [];
			let variableRefs = [];
			let subfamilies = {};
			let fontsObjects = {};
			let files = event.target.files;

			let newPreferredStyle = {weight:-100, style:'Italic', _ref:''};

			setStatus('uploading font files...');
			setReady(false);
			setError(false);

			const price = Number(inputPrice); // Convert inputPrice to a number

			// Validate title and price
			if (!title) {
				setStatus('typeface needs title');
				setReady(true);
				setError(true);
				console.log('typeface needs title');
				return false;
			}

			if (isNaN(price) || typeof price !== 'number') {
				setStatus('typeface needs price, Please refresh the page and try again');
				setReady(true);
				setError(true);
				console.log('typeface needs price');
				return false;
			}

			console.log("files: ", files);
			// Sort files by file type [ttf, otf, eot, svg, woff, woff2, etc..] then alphabetically
			// This will help with finding missing metadata later
			if (files) {
				files = Array.from(files).sort((a, b) => {
					const typeOrder = ['ttf', 'otf', 'eot', 'svg', 'woff', 'woff2'];
					const aIndex = typeOrder.indexOf(a.name.split('.').pop());
					const bIndex = typeOrder.indexOf(b.name.split('.').pop());
					if (aIndex === bIndex) return a.name.localeCompare(b.name);
					return aIndex - bIndex;
				});
			}

			console.log("sorted files: ", files);
			// read font files,
			// create if doesnt exist - create sanity fontObjects template
			// add font file to sanity font
			// create subfamily list
			// Process each font file
			for (var i = 0; i < files.length; i++) {

				const file = files[i];
				const fontBuffer = await readFontFile(file);
				const font = fontkit.create(fontBuffer);

				console.log("file name: ", file.name);
				console.log('fontkit data: ', font, font.name);

				// if its a webfont (woff2 or woff) and the fullName is empty or a
				// single non A-Z,0-9 character, look for a file with the same name (different file extension — presumably a ttf) and use that instead
				if (file.name.endsWith('.woff2') || file.name.endsWith('.woff')) {
					if (
						!font?.name?.records?.fullName ||
						font?.name?.records?.fullName === '' ||
						!/^[A-Z0-9]+$/.test(font?.name?.records?.fullName)
					) {
						const ttfFile = files.find(f => f.name === file.name.replace('.woff2', '.ttf').replace('.woff', '.ttf'));
						const ttfFileBuffer = await readFontFile(ttfFile);
						const ttfFileData = fontkit.create(ttfFileBuffer);
						console.log('ttfFileData: ', ttfFileData);
						if (ttfFileData) font.name.records = ttfFileData?.name?.records;
						console.log('font kit updated  : ', font, font.name);
					}
				}

				// Determine weight name from font metadata
				let weightName = font?.name?.records?.preferredSubfamily || font?.name?.records?.fontSubfamily;

				// Handle multilingual or object-based weight names
				if (typeof weightName === 'object') {
					// Prefer English, otherwise take the first available language
					weightName = weightName?.en ||
						(weightName.constructor === Object ? weightName[Object.keys(weightName)[0]] : null);
				}

				// Normalize weight name by removing style indicators
				weightName = weightName?.toString()
					.replace("Italic", "")
					.replace("It", "")
					.replace("Slanted", "")
					.replace("Slant", "")
					.trim();

				if ((weightName == '' || weightName.toLowerCase() == 'roman') && font?.name?.records?.fullName) {
					weightName = font?.name?.records?.fullName;
					weightName = weightName?.en ? weightName.en: weightName.constructor == Object ? weightName[Object.keys(weightName)[0]] : weightName;
					weightName = weightName?.replace(title + " ", "").replace(title, "").trim();
					weightName = weightName?.replace("Italic", "").replace("It", "").replace("Slanted", "").replace("Slant", "").trim();
				}
				console.log('font : ', font);

				let variableFont = font?.variationAxes && Object.keys(font.variationAxes).length > 0 ? true : false;
				let subfamilyName = font.familyName.trim().replace(title.trim(),'').trim();
				let fontTitle = font?.fullName.trim();
				let style = (font?.italicAngle !== 0 || font?.fullName.toLowerCase().includes('italic')) ? 'Italic' : 'Regular';

				// remove italic keywords from subfamily name
				// Remove italic keywords from subfamily name
				weightKeywordList.forEach(keyword => {
					const kw = keyword.trim();
					if(subfamilyName.includes(kw)) subfamilyName = subfamilyName.replace(kw, '').trim();

					// if(fontTitle.includes(kw)){
					// 	fontTitle = fontTitle.replace(kw, '');
					// }

				});

				let italicKW = []; // Track italic keywords found
				italicKeywordList.forEach(keyword => {
					const kw = keyword.trim();
					if(subfamilyName.endsWith(kw)){
						subfamilyName = subfamilyName.slice(0, subfamilyName.lastIndexOf(kw));
					}
					if(fontTitle.endsWith(kw)){
						fontTitle = fontTitle.slice(0, fontTitle.lastIndexOf(kw));
						italicKW.push(kw);
					}
				});

				// Format font title - clean up before processing
				fontTitle = fontTitle.replace(/-/g, ' ');
				fontTitle = fontTitle.replace(/\s+/g, ' ').trim();

				// Remove any stray plus signs that might have been in the original
				fontTitle = fontTitle.replace(/\+/g, '');

				// Capitalize words
				fontTitle = fontTitle.split(' ').map( word => word[0] ? word[0].toUpperCase() + word.slice(1) : word).join(' ');

				subfamilyName = (subfamilyName == '' ) ? 'Regular' : subfamilyName.replace(/\s+/g, ' ').split(' ').map( word => word[0] ? word[0].toUpperCase() + word.slice(1) : word).join(' ');

				// remove subfamily from weight name
				if (subfamilyName !== '' ) {
					weightName = weightName
						.replace(`${subfamilyName} `, '')
						.replace(` ${subfamilyName}`, '')
						.trim();
				}

				// Process italic keywords and update fontTitle
				if(italicKW.length > 0){
					// Map abbreviations back to full words
					let processedItalicKW = italicKW.map(item => {
						const lookup = reverseSpellingLookup(item);
						// Only use the lookup if it returns a valid result, otherwise keep original
						return lookup && lookup !== "" ? lookup : item;
					});
					fontTitle = fontTitle.trim() + " " + processedItalicKW.join(' ');
					style = 'Italic';
				}

				// Generate ID after all fontTitle modifications are complete
				// Use the custom sanitization function to ensure valid Sanity ID
				let id = sanitizeForSanityId(fontTitle);

				// Check if we need to add VF suffix for variable fonts
				if(variableFont && !id.endsWith('-vf') && !id.endsWith('_vf')) {
					fontTitle = fontTitle + ' VF';
					// Regenerate id with the updated fontTitle
					id = sanitizeForSanityId(fontTitle);
				}


				console.log('=== Font Info ====');
				console.log(' ')
				console.log('font id : ', id);
				console.log('font title : ', fontTitle);
				console.log('fontkit fullName : ', font.fullName );
				console.log('fontkit family name: ', font.familyName);
				console.log('file name : ', file.name);
				console.log('subfamily : ', subfamilyName);
				console.log('style : ', style);
				console.log('weight : ', weightName);
				console.log('variable : ', variableFont);
				console.log('italicKW ', italicKW);
				console.log('font italic angle : ', (font?.italicAngle !== 0 || font?.fullName.toLowerCase().includes('italic')) ? 'Italic' : 'Regular');
				console.log(' ')
				console.log('=======');

				subfamilies[id] = subfamilyName; // Add subfamily to list

				if( fontsObjects[id]){
					fontsObjects[id].files = [...fontsObjects[id].files, file];
				} else {

					let fontObject = { // Create font object template
						_key: nanoid(),
						_id: id,
						title: fontTitle,
						slug: {_type:'slug', current:id},
						typefaceName: title, // Change to match Typeface Document
						style: (font?.italicAngle !== 0 || font?.fullName.toLowerCase().includes('italic')) ? 'Italic' : 'Regular',
						variableFont: variableFont,
						weightName: weightName,
						normalWeight:true, // TODO : check if weight is normal ??
						weight: font['OS/2']?.usWeightClass ? Number(font['OS/2']?.usWeightClass) :
							/hairline|extra thin|extrathin/.test(weightName?.toLowerCase()) ? 100 :
							/thin|extra light|extralight/.test(weightName?.toLowerCase()) ? 200 :
							/light|book/.test(weightName?.toLowerCase()) ? 300 :
							/regular|normal/.test(weightName?.toLowerCase()) ? 400 :
							/medium/.test(weightName?.toLowerCase()) ? 500 :
							/semi bold|semibold/.test(weightName?.toLowerCase()) ? 600 :
							/bold/.test(weightName?.toLowerCase()) ? 700 :
							/extra bold|extrabold/.test(weightName?.toLowerCase()) ? 800 :
							/black|ultra/.test(weightName?.toLowerCase()) ? 900 :
							400,
						fileInput: {},
						files : [file],
						fontKit: font
					};
					fontsObjects[id] = fontObject;
				}
			}

			// Sort font objects by weight and style
			// 1. Primary sort by weight (100-900)
			// 2. Secondary sort by style (Regular before Italic) for same weights
			fontsObjects = Object.fromEntries(
				Object.entries(fontsObjects).sort((a, b) => {
					const weightA = Number(a[1].weight);
					const weightB = Number(b[1].weight);

					if (weightA === weightB) {
						// For same weights, sort Regular before Italic
						if (a[1].style === 'Regular' && b[1].style === 'Italic') return -1;
						if (a[1].style === 'Italic' && b[1].style === 'Regular') return 1;
						return 0;
					}

					// Sort by ascending weight
					return weightA - weightB;
				})
			);



			// Extract unique subfamily names
			let uniqueSubfamilies = [...new Set(Object.values(subfamilies))];

			console.log('Subfamilies:', subfamilies);
			console.log('Unique subfamilies:', uniqueSubfamilies, uniqueSubfamilies.length);
			console.log('Font objects:', fontsObjects);

			// Process each font object:
			// 1. Upload font files as Sanity assets
			// 2. Create file references linking fonts to assets
			// 3. Generate font metadata from TTF files
			// 4. Generate CSS for WOFF2 files
			const fontObjectKeys = Object.keys(fontsObjects); // Get keys of font objects
			for(var i = 0 ; i < fontObjectKeys.length ; i++ ){

				let id = fontObjectKeys[i];
				let fontObject = fontsObjects[id];
				let files = fontObject.files;
				let fontKit = fontObject.fontKit;
				let newFileInput = fontObject.fileInput;

				// Add subfamily to font object
				fontObject.subfamily = subfamilies[id] ? subfamilies[id] : '';

				// Add price to font object - set sell = true if there is a price > 0
				fontObject.price = Number(inputPrice) ? Number(inputPrice) : 0;
				if(fontObject.price > 0) fontObject.sell = true;

				// Add preferred style (style with greatest weight and non-italic if equal)
				if( Number(newPreferredStyle.weight) < Number(fontObject.weight) ){
					newPreferredStyle = {weight:fontObject.weight, style:fontObject.style, _ref:fontObject._id};
				}
				if ( Number(newPreferredStyle.weight )== Number(fontObject.weight) && newPreferredStyle.style == 'Italic' && fontObject.style == 'Regular' ){
					newPreferredStyle = {weight:fontObject.weight, style:fontObject.style, _ref:fontObject._id};
				}

				// Upload files
				for(var j = 0 ; j < files.length ; j++ ){
					let file = files[j];
					let fileType = "";
					if ( file.name.endsWith('.otf') ) 		fileType = "otf"
					else if ( file.name.endsWith('.ttf') ) 	fileType = "ttf"
					else if ( file.name.endsWith('.woff') )  	fileType = "woff"
					else if ( file.name.endsWith('.woff2') ) 	fileType = "woff2"
					else if ( file.name.endsWith('.eot') ) 	fileType = "eot"
					else if ( file.name.endsWith('.svg') ) 	fileType = "svg"


				console.log(`[${i+1}/${Object.keys(fontsObjects).length}][${j+1}/${files.length}] uploading font file: ${fontObject._id}.${fileType}`);
				setStatus(`[${i+1}/${Object.keys(fontsObjects).length}][${j+1}/${files.length}] uploading font file: ${fontObject._id}.${fileType}`);

				let baseAsset = await client.assets.upload('file', file, { filename: fontObject._id+'.'+fileType })
					.catch( err => {
						console.error('error uploading font: ', fontObject.title);
						setStatus('error uploading font: ' + err.message);
						setError(true);
						return null; // Return null on error so we can check for it
					});

				// Skip this file if upload failed
				if (!baseAsset || !baseAsset._id) {
					console.warn(`Skipping file ${file.name} - upload failed`);
					failedFiles.push({ name: file.name, error: 'Upload failed' });
					continue;
				}

				// Create file ref from font
				newFileInput[fileType] = {
					_type: 'file',
					asset: {
						_ref: baseAsset._id,
						_type: 'reference'
					}
				}

					// Generate CSS
					if(file.name.endsWith('.woff2')){
						console.log(`[${i+1}/${Object.keys(fontsObjects).length}][${j+1}/${files.length}] generating css file for: ${fontObject.title}`);
						setStatus(`[${i+1}/${Object.keys(fontsObjects).length}][${j+1}/${files.length}] generating css file for: ${fontObject.title}`);
						newFileInput = await generateCssFile({
							woff2File: file,
							fileInput: newFileInput,
							fontName: fontObject.title,
							fileName: fontObject._id,
							variableFont: fontObject.variableFont,
							weight: fontObject.weight,
							client: client,
						});
					}

					// Generate font data
					if(file.name.endsWith('.ttf')){
						console.log(`[${i+1}/${Object.keys(fontsObjects).length}][${j+1}/${files.length}] generating font data for: ${fontObject.title}`);
						setStatus(`[${i+1}/${Object.keys(fontsObjects).length}][${j+1}/${files.length}] generating font data for: ${fontObject.title}`);

						let metadata = await generateFontData({
							fontId: fontObject._id,
							url: baseAsset.url,
							fontKit : fontKit,
							client: client,
							commit : false
						});
						fontObject = {...fontObject,...metadata};
					}

					fontObject.fileInput = newFileInput;
					fontsObjects[id] = fontObject;
				}
			}


			console.log('Creating/updating Sanity font documents:', fontsObjects);

			// Process each font object to create or update Sanity documents
			for(let i = 0; i < Object.keys(fontsObjects).length; i++) {
				let fontId = Object.keys(fontsObjects)[i];
				let font = fontsObjects[fontId];

				// Fetch existing font document if it exists
				// This allows us to preserve existing metadata and merge new changes
				let existingFont = await client.fetch(`*[_type == 'font' && _id == '${font._id}']{
					fileInput,      	// File references
					description,    	// Font description
					metaData,       	// Font metadata
					metrics,        	// Font metrics
					opentypeFeatures, // OpenType feature support
					characterSet,   	// Available characters
					subfamily,      	// Font subfamily
					scriptFileInput 	// Script-specific files
				}`);

				existingFont = existingFont[0]; // Get first match

				let fontResponse;
				// Extract temporary processing data before saving
				let { files, fontKit } = font;
				delete font.files;    // Remove local file references
				delete font.fontKit;   // Remove fontkit instance

				try {
					if(existingFont && existingFont != null) {
						// Update existing font document

						// Merge new file references with existing ones
						if(existingFont.fileInput && existingFont.fileInput != null) {
							let newFileInput = {...font.fileInput};
							// Preserve existing file references that weren't updated
							Object.keys(existingFont.fileInput).forEach(key => {
								if(!newFileInput[key]) {
									newFileInput[key] = existingFont.fileInput[key];
								}
							});
							font.fileInput = newFileInput;
						}


						// Preserve existing metadata fields if new data is empty/null
						// This ensures we don't lose existing data during updates

						// Font metadata (name, version, copyright, etc.)
						font.metaData = !font?.metaData || Object.keys(font?.metaData || {}).length === 0
							? existingFont?.metaData || {}
							: font.metaData;

						// Font metrics (ascender, descender, line gap, etc.)
						font.metrics = !font?.metrics || Object.keys(font?.metrics || {}).length === 0
							? existingFont?.metrics || {}
							: font.metrics;

						// OpenType feature support (ligatures, alternates, etc.)
						font.opentypeFeatures = !font?.opentypeFeatures || Object.keys(font?.opentypeFeatures || {}).length === 0
							? existingFont?.opentypeFeatures || {}
							: font.opentypeFeatures;

						// Character set information
						font.characterSet = !font?.characterSet || Object.keys(font?.characterSet || {}).length === 0
							? existingFont?.characterSet || {}
							: font.characterSet;

						// Script-specific file references
						font.scriptFileInput = existingFont?.scriptFileInput || {};

						// Clean metadata values
						// 1. Replace null values with empty strings
						// 2. Remove control characters that could cause issues
						Object.keys(font?.metaData || {}).forEach(key => {
							if (font.metaData[key] == null) {
								font.metaData[key] = '';
							} else {
								// Remove control characters (0x00-0x1F)
								font.metaData[key] = font.metaData[key].replace(/[ -]/g, "");
							}
						});

						console.log('Updating Existing font : ', font._id, font.title);
						fontResponse = await client.patch(font._id).set({
							fileInput: font.fileInput,
							subfamily: font.subfamily,
							weight: font.weight,
						}).commit();

					} else {

						console.log('creating new font : ', font._id, font.title, font);

						// Remove null characters from metadata
						Object.keys(font?.metaData).forEach( key => {
							if (font.metaData[key] == null) font.metaData[key] = '';
							else font.metaData[key] = font.metaData[key].replace(/[ -]/g, "");
						});

						fontResponse = await client.createOrReplace({
							_key: nanoid(),
							_id: font._id,
							_type: 'font',
							...font,
						});
					}
				} catch(e) {
					console.error('error creating font: ', font.title, font.subfamily);
					console.error(e);
					setError(true);
					failedFiles = [...failedFiles, ...(files.map(file=>{return{name:file.name, fk: fontKit}}))];
					continue;
				}


				// Create font refs for typeface and add to fontRef array or variableRef array
				const fontRef = {_key: nanoid(), _type:'reference', _ref: fontResponse._id, _weak: true };

				if(!font.variableFont){
					if(stylesObject.fonts && stylesObject.fonts.length > 0){
						let fontExists = stylesObject.fonts.findIndex( font => font._ref == fontResponse._id);
						let inFontRefs = fontRefs.findIndex( font => font._ref == fontResponse._id);
						if(fontExists == -1 && inFontRefs == -1) fontRefs.push(fontRef);
					} else {
						fontRefs.push(fontRef);
					}
				}

				// Add new font refs for typeface (variable)
				if(font.variableFont){
					if(stylesObject?.variableFont?.length){
						let vfExists = stylesObject.variableFont.findIndex( font => font._ref == fontResponse._id);
						let inVariableRefs = variableRefs.findIndex( font => font._ref == fontResponse._id);
						if( vfExists == -1 && inVariableRefs == -1 && font.variableFont) variableRefs.push(fontRef);
					} else {
						variableRefs.push(fontRef);
					}
				}

				console.log(`[${i+1}/${Object.keys(fontsObjects).length}] ${fontResponse._id} created!`, fontResponse);
				setStatus(`[${i+1}/${Object.keys(fontsObjects).length}] ${fontResponse._id} created!`);

			}

			// Update Sanity typeface document with new font references
			console.log('Updating typeface document with new fonts:', {
				fontRefs,
				variableRefs,
				subfamilies,
				uniqueSubfamilies
			});
			setStatus('Updating typeface references...');

			// Prepare patch object for typeface update
			let patch = {
				styles: {
					// Merge existing fonts with new ones
					fonts: stylesObject.fonts
						? [...stylesObject.fonts, ...fontRefs]
						: [...fontRefs],

					// Add subfamilies only if multiple exist
					subfamilies: uniqueSubfamilies.length > 1
						? uniqueSubfamilies
						: [],

					// Merge existing variable fonts with new ones
					variableFont: stylesObject?.variableFont
						? [...stylesObject.variableFont, ...variableRefs]
						: [...variableRefs]
				}
			};


			// Process subfamily relationships
			setStatus('Organizing font subfamilies...');
			subfamiliesArray = subfamiliesArray || [];

			// Create or update subfamily groups
			// Each subfamily represents a distinct font variation (e.g., Condensed, Extended)
			uniqueSubfamilies.map(subfamilyName => {
				// Check if subfamily already exists
				if (!subfamiliesArray.find(sf => sf.title === subfamilyName)) {
					// Create new subfamily group
					subfamiliesArray.push({
						title: subfamilyName,
						_key: nanoid(),
						_type: 'object',
						fonts: [], // Will hold references to fonts in this subfamily
					});
				}
			});

			// Associate fonts with their subfamilies
			if (subfamiliesArray.length > 0) {
				// Add font references to appropriate subfamily groups
				Object.entries(fontsObjects).forEach(([id, fontObj]) => {
					const subfamilyIndex = subfamiliesArray.findIndex(
						sf => sf.title === fontObj.subfamily
					);

					// Create reference to font in subfamily
					subfamiliesArray[subfamilyIndex].fonts.push({
						_ref: fontObj._id,
						_key: fontObj._key,
						_type: 'reference',
						_weak: true
					});
				});

				// Ensure no duplicate font references in subfamilies
				subfamiliesArray = subfamiliesArray.map(subfamily => ({
					...subfamily,
					fonts: subfamily.fonts.filter((font, index, self) =>
						index === self.findIndex(f => f._ref === font._ref)
					)
				}));
			}

			patch.styles.subfamilies = subfamiliesArray;

			// Update the typeface's preferred style if necessary
			// The preferred style is typically the heaviest non-italic variant
			if (preferredStyleRef?._ref &&
				preferredStyleRef?._ref !== '' &&
				preferredStyleRef?._ref !== null &&
				newPreferredStyle._ref !== preferredStyleRef._ref
			) {
				// Fetch current preferred style details
				let prefStyle = await client.fetch(`*[_id == '${doc_id}']{
					preferredStyle->{
						weight,  // Font weight (100-900)
						style,   // Regular or Italic
						_id     // Document ID
					}
				}`);

				prefStyle = prefStyle[0]?.preferredStyle;

				// Update preferred style if:
				// 1. Current style is missing weight info
				// 2. Current style doesn't exist
				// 3. New style has a heavier weight
				if (!prefStyle?.weight || prefStyle === null || prefStyle.weight < newPreferredStyle.weight) {
					patch.preferredStyle = {
						_type: 'reference',
						_ref: newPreferredStyle._ref,
						_weak: true
					};
				}
			}

			console.log('doc_id: ',doc_id);
			console.log('Typeface patch: ',patch);
			console.log('New preferred style: ',newPreferredStyle);
			console.log('SubfamiliesArray', subfamiliesArray)

			// Update both draft and published documents
			// This ensures changes are reflected in both preview and live versions
			if (doc_id.startsWith('drafts.')) {
				// Update draft document first
				try {
					await client.patch(doc_id).set(patch).commit();
					// Then update published version
					await client.patch(doc_id.replace('drafts.', '')).set(patch).commit();
				} catch (err) {
					console.error('Error updating typeface documents:', err.message);
					setStatus('Error updating typeface');
					setError(true);
					return;
				}
			} else {
				// Update published document directly
				try {
					await client.patch(doc_id).set(patch).commit();
				} catch (err) {
					console.error('Error updating typeface document:', err.message);
					setStatus('Error updating typeface');
					setError(true);
					return;
				}
			}

			// Handle upload completion status
			if (failedFiles.length > 0) {
				// Some files failed to upload
				console.error('Failed uploads:', {
					files: failedFiles,
					names: failedFiles.map(file => file.name),
					metadata: failedFiles.map(file => file?.fk?.name?.records)
				});
				setError(true);
				setStatus(`Upload completed with errors. Failed files: ${failedFiles.map(f => f.name).join(', ')}`);
			} else {
				// All files uploaded successfully
				console.log('All files uploaded successfully');
				setError(false);
				setStatus('Upload completed successfully!');
			}
		} catch(e){
			console.error(e.message);
			setError(true);
			setStatus('Error uploading font');
		}

		setReady(true);
		setError(false);

	},[stylesObject, title, slug, doc_id, inputPrice, ready, status, setStatus, setError]);

	/**
	 * Handles changes to the input price field.
	 * @param {Event} e - The input change event.
	 */
	function handleInputChange(e) {
		setInputPrice(e.target.value);
		setError(false);
		setStatus('ready');
	}

	// Log input price changes
	useEffect(() => {
		console.log(inputPrice)
	},[inputPrice])

	// Render component UI
	return (
		<>
		{/* Only render if title and slug are present */}
		{title && title !== '' && slug && slug !== '' && (
			<Stack space={3}>
				{/* Status display */}
				<Flex gap={2}>
					<Text>Status:</Text>
					<Text style={{ color: error ? 'red' : 'green' }}>{status}</Text>
				</Flex>

				{/* Main content area */}
				{ready && (
					<Flex align="center" gap={3}>
						{/* Price input */}
						<Flex align="center" gap={2}>
							<Text>Style Price:</Text>
							<Text>$</Text>
							<input
								defaultValue={inputPrice}
								onChange={(e) => handleInputChange(e)}
								type='number'
								style={{ textAlign: 'end', padding: '5px', maxWidth: '75px' }}
							/>
						</Flex>

						{/* Upload button */}
						<label>
							<Button as="span" mode="ghost">
								<Stack space={1}>
									<Text>Upload (ttf/otf/woff/woff2/etc...)</Text>
									<Text size={0} muted>replaces existing fonts</Text>
								</Stack>
							</Button>
							<input
								ref={ref}
								type="file"
								multiple
								style={{ display: 'none' }}
								onChange={(event) => handleUpload(event)}
							/>
						</label>
					</Flex>
				)}
			</Stack>
		)}
		</>
	);
};
