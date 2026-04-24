// Script font uploader: processes and uploads font files per writing system (e.g. Cyrillic, Greek, Arabic)

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Flex, Grid, Stack, Text, TextInput, MenuButton, Menu, MenuItem, Select } from '@sanity/ui';
import * as fontkit from 'fontkit';
import slugify from 'slugify';
import { useSanityClient } from '../hooks/useSanityClient';
import { useFormValue } from 'sanity';
import { nanoid } from 'nanoid';
import generateCssFile from '../utils/generateCssFile';
import { generateStyleKeywords, reverseSpellingLookup } from '../utils/generateKeywords';
import { SCRIPTS } from '../utils/utils';

/**
 * Component for uploading and managing script variants of fonts
 * @param {Object} props - Component props
 * @param {Object} props.elementProps - Element properties including ref
 * @returns {JSX.Element} Upload interface for script variants
 */
export const UploadScriptsComponent = (props) => {

    // Props and client initialization
    const {elementProps: {ref}} = props;
    const client = useSanityClient();

    // Component state
    const [selectedScript, setSelectedScript] = useState(""); // Currently selected script
    const [status, setStatus] = React.useState(''); // Upload status message
    const [ready, setReady] = React.useState(true); // Component ready state

    // Form values from Sanity
    let doc_id = useFormValue(['_id']); // Document ID
    const title = useFormValue(['title']); // Typeface title
    const slug = useFormValue(['slug']); // URL slug
    const scripts = useFormValue(['scripts']) || []; // Supported scripts
    const stylesObject = useFormValue(['styles']); // Font styles data
    let subfamiliesArray = stylesObject?.subfamilies || []; // Font subfamilies

    // Memoized style keywords for font processing
    const {weightKeywordList, italicKeywordList} = useMemo(() =>
        generateStyleKeywords()
    , []);

    /**
     * Reads a font file and returns its content as a Uint8Array
     * @param {File} file - The font file to read
     * @returns {Promise<Uint8Array>} Font file content
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
     * Handles the upload and processing of font files for a specific script
     * @param {Event} event - The file input change event
     * @param {string} script - The selected script variant (e.g., 'cyrillic', 'greek')
     */
    const handleUpload = useCallback(async(event, script) => {
        setReady(false);
        try{
            let failedFiles = [];

            console.log('handle upload ', title, script );
            setStatus('uploading fonts files.. ');

            if(!title) {
                console.error('typeface needs title');
                return;
            }

            let fontRefs = [];
            let variableRefs = [];
            let subfamilies = {};
            let fontsObjects = {};

            // read font files ,
            // create if doesnt exist - create sanity fontObjects template
            // add font file to sanity font
            // create subfamily list
            for(var i = 0 ; i < event.target.files.length ; i++ ){

                const file = event.target.files[i];
                const fontBuffer = await readFontFile(file);
                const font = fontkit.create(fontBuffer);

                console.log('reading font : ', font.fullName +' '+file.name, font.name.records);

                let weightName = font?.name?.records?.preferredSubfamily ? font?.name?.records?.preferredSubfamily: font?.name?.records?.fontSubfamily;
                weightName = weightName?.en ? weightName.en: weightName.constructor == Object ? weightName[Object.keys(weightName)[0]] : weightName;
				weightName = weightName?.replace("Italic", "").replace("It", "").trim();

				if ((weightName == '' || weightName.toLowerCase() == 'roman') && font?.name?.records?.fullName) {
					weightName = font?.name?.records?.fullName;
					weightName = weightName?.en ? weightName.en: weightName.constructor == Object ? weightName[Object.keys(weightName)[0]] : weightName;
					weightName = weightName?.replace(title + " ", "").replace(title, "").trim();
					weightName = weightName?.replace("Italic", "").replace("It", "").trim();
				}

                let variableFont = font?.variationAxes && Object.keys(font.variationAxes).length > 0 ? true: false;
                let subfamilyName = font.familyName.toLowerCase().trim().replace(title.toLowerCase().trim(),'').trim();
                let fontTitle = font?.fullName;
                let style = (font?.italicAngle !== 0 || font?.fullName.toLowerCase().includes('italic')) ? 'Italic' : 'Regular';

                if(fontTitle.toLowerCase().trim().includes(script)){
                    fontTitle = fontTitle.toLowerCase().trim().replace(script, '').trim();
                    fontTitle = fontTitle.split(' ').map( word => {
                        if( word == '') return
                        return word;
                    })
                    .filter( word => word != undefined)
                    .join(' ');
                }

                // remove weight and italic keywords from subfamily name
                weightKeywordList.forEach( keyword => {
                    const kw = keyword.trim();
                    if(subfamilyName.includes(kw)) subfamilyName = subfamilyName.replace(kw, '').trim();

                    // if(fontTitle.includes(kw)){
                    //     fontTitle = fontTitle.replace(kw, '');
                    // }
                });

				let italicKW = [];
                italicKeywordList.forEach( keyword => {
                    const kw = keyword.toLowerCase().trim();
                    if(subfamilyName.includes(kw)){
                        subfamilyName = subfamilyName.replace(kw, '');
                    }

                    if(fontTitle.includes(kw)){
                        fontTitle = fontTitle.replace(kw, '');
						italicKW.push(kw.charAt(0).toUpperCase() + kw.slice(1));

                    }
                });

				fontTitle = fontTitle.replace(/-/g, ' ');
                fontTitle = fontTitle.trim().split(' ').map( word => word[0].toUpperCase() + word.slice(1)).join(' ');

                if(subfamilyName.trim().includes(script)){
                    subfamilyName = subfamilyName.trim().replace(script, '').trim();
                }

                subfamilyName = subfamilyName.trim();
                subfamilyName = (subfamilyName == '' ) ? 'Regular' : subfamilyName.split(' ').map( word => word[0].toUpperCase() + word.slice(1)).join(' ');

				// remove subfamily from weight name
				if (subfamilyName !== '' ) {
					weightName = weightName
						.replace(`${subfamilyName} `, '')
						.replace(` ${subfamilyName}`, '')
						.trim();
				}

                if(variableFont && !fontTitle.toLowerCase().trim().endsWith(' vf')) fontTitle = fontTitle + ' VF';

                if(italicKW.length > 0){
                    italicKW = italicKW.map( item => reverseSpellingLookup(item)); // replace each item in the italicKW list with the value in reverseSpellingLookup
                    fontTitle = fontTitle + italicKW.join(' ');
                    style = 'Italic';
                }

                let id = slugify(fontTitle.toLowerCase().trim());

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
                console.log(' ')
				console.log('=======');

                subfamilies[id] = subfamilyName; // add subfamily to list

                if( fontsObjects[id]){
                    fontsObjects[id].files = [...fontsObjects[id].files, file];
                } else {
                    let fontObject = {
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
                        files : [file],
                        fontKit: font,
                        scriptFileInput: {[script]:{}},
                    };
                    fontsObjects[id] = fontObject;
                }
            }

            // Extract unique subfamily names and prepare for processing
            let uniqueSubfamiles = [...new Set(Object.values(subfamilies))];

            console.log('Subfamilies : ', subfamilies, uniqueSubfamiles, uniqueSubfamiles.length);
            console.log('fontsObjects : ', fontsObjects);

            // Process each font object:
            // 1. Upload font files as Sanity assets
            // 2. Create file references linking fonts to assets
            // 3. Generate CSS for web fonts
            for(var i = 0 ; i < Object.keys(fontsObjects).length ; i++ ){

                let id = Object.keys(fontsObjects)[i];
                let fontObject = fontsObjects[id];
                let files = fontObject.files;
                let newFileInput = fontObject.scriptFileInput[script];

                console.log(fontObject.title , ' : subfamily : ', subfamilies[id]);

                // add subfamily to font object if more than one exists
                if(uniqueSubfamiles.length > 1) fontObject.subfamily = subfamilies[id];
                else fontObject.subfamily = '';

                // add price to font object - set sell = true if there is a price > 0
                fontObject.price = process.env.SANITY_STUDIO_DEFAULT_STYLE_PRICE || 40;
                if(fontObject.price > 0) fontObject.sell = true;

                // upload files
                for(var j = 0 ; j < files.length ; j++ ){
                    let file = files[j];
                    let fileType = "";
                    if ( file.name.endsWith('.otf') ) 	 	fileType = "otf"
                    else if ( file.name.endsWith('.ttf') ) 	 fileType = "ttf"
                    else if ( file.name.endsWith('.woff') )  fileType = "woff"
                    else if ( file.name.endsWith('.woff2') ) fileType = "woff2"
                    else if ( file.name.endsWith('.eot') ) 	 fileType = "eot"
                    else if ( file.name.endsWith('.svg') ) 	 fileType = "svg"

                    console.log('uploading font file : ', fontObject._id+'.'+fileType);
                    const filename = fontObject._id+'-'+script;
                    let fontTitle = fontObject.title+' '+script;
                    fontTitle = fontTitle.split(' ').map( word => word[0].toUpperCase() + word.slice(1)).join(' ');

                    let baseAsset = await client.assets.upload('file', file, { filename: filename+'.'+fileType })
                        .catch( err => {
                            console.error('error uploading font: ', fontObject.title);
                            setStatus('error uploading font ' + err.message);
                        });

                    // create file ref from font
                    newFileInput[fileType] = {
                        _type: 'file',
                        asset: {
                            _ref: baseAsset._id,
                            _type: 'reference'
                        }
                    }

                    console.log('newFileInput', newFileInput);

                    // generate css
                    if(file.name.endsWith('.woff2')){
                        console.log('generating css file for: ', fontObject.title);
                        setStatus('generating css file for: ' + fontObject.title);
                        newFileInput = await generateCssFile({
                            woff2File: file,
                            fileInput: newFileInput,
                            // script: script,
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

            console.log('creating sanity fonts', fontsObjects);


            // create (with existing data if exists ) fonts and refs (for typeface)
            for(var i = 0 ; i < Object.keys(fontsObjects).length ; i++ ){
                let fontId = Object.keys(fontsObjects)[i];
                let font = fontsObjects[fontId];

                // add existing file refs to new file input
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

                console.log('creating font : ', font);

				try{
                    if(existingFont && existingFont != null){

                        if(existingFont.scriptFileInput && existingFont.scriptFileInput != null){
                            let newFileInput = {...font.scriptFileInput};

                            Object.keys(existingFont.scriptFileInput).forEach( key => {
                                if(!newFileInput[key]){
                                    newFileInput[key] = existingFont.scriptFileInput[key];
                                }
                            });
                            font.scriptFileInput = newFileInput;
                        }

                        fontResponse = await client.patch(font._id).set({ scriptFileInput: font.scriptFileInput }).commit()

                    } else{
                        fontResponse = await client.createOrReplace({
                            _key: nanoid(),
                            _id: font._id,
                            _type: 'font',
                            ...font,
                        });
                    }
				}
				catch(e){
					console.error('error creating font: ', font.title, font.subfamily);
					failedFiles = [...failedFiles, ...(files.map(file=>{return{name:file.name, fk: fontKit}}))];
					continue;
				}


                // Create font refs for typeface
                // add to fontRef array or variableRef array

                const fontRef = {_key: nanoid(), _type:'reference', _ref: fontResponse._id, _weak: true };

                console.log('font response : ', fontResponse);
                console.log('existing styles object : ', stylesObject);

                // add new font refs for typeface
                if(!font.variableFont){
                    if(stylesObject.fonts && stylesObject.fonts.length > 0){
                        let fontExists = stylesObject.fonts.findIndex( font => font._ref == fontResponse._id);
                        let inFontRefs = fontRefs.findIndex( font => font._ref == fontResponse._id);
                        if(fontExists == -1 && inFontRefs == -1){
                            fontRefs.push(fontRef);
                        }
                    } else {
                        fontRefs.push(fontRef);
                    }
                }

                // add new font refs for typeface (variable)
                if(font.variableFont){
                    if(stylesObject.variableFont && stylesObject.variableFont.length > 0){
                        let vfExists = stylesObject.variableFont.findIndex( font => font._ref == fontResponse._id);
                        let inVariableRefs = variableRefs.findIndex( font => font._ref == fontResponse._id);
                        if( vfExists == -1 && inVariableRefs == -1 && font.variableFont){
                            variableRefs.push(fontRef);
                        }
                    } else {
                        variableRefs.push(fontRef);
                    }
                }

                console.log(fontResponse._id, ' created!');
            }

            // Update Sanity typeface document with new font references
            console.log('updating styles refs (fonts, variable fonts, subfamilies) ', fontRefs, variableRefs, subfamilies, uniqueSubfamiles)
            setStatus('Updating font references...');

            let newStylesObject = stylesObject.fonts ?
                { ...stylesObject, fonts : [...stylesObject.fonts, ...fontRefs] }
            :
                { ...stylesObject, fonts : [...fontRefs] };

            if(uniqueSubfamiles.length > 1){
                newStylesObject.subfamilies = uniqueSubfamiles;
            }
            else{
                newStylesObject.subfamilies = [];
            }

            newStylesObject.variableFont = stylesObject?.variableFont ? [...stylesObject?.variableFont, ...variableRefs] : [...variableRefs];

            let patch = {styles:newStylesObject};

            subfamiliesArray = subfamiliesArray ? subfamiliesArray : [];

            console.log('new styles obj : ', newStylesObject);
            console.log('existing subfamily list : ', subfamiliesArray);
            console.log('unique subfamilies ', uniqueSubfamiles);

            subfamiliesArray = [...subfamiliesArray, ...uniqueSubfamiles].filter((sf, index, self) => {
                return self.indexOf(sf) === index;
            });

            patch.styles.subfamilies = subfamiliesArray;

            console.log('doc_id : ',doc_id);
            console.log('typeface patch : ',patch);

            let includedScripts = [ script, ...scripts].filter((lang, index, self) => {
                return self.indexOf(lang) === index;
            });

            patch.scripts = includedScripts;

            console.log('included scripts : ', includedScripts);


            if( doc_id.startsWith('drafts.')){
                await client.patch(doc_id).set(patch).commit()
                    .catch(err => {
                        console.error('error patching styles: ', err.message);
                        setStatus('error patching styles '+ err.message);
                    });
                doc_id = doc_id.replace('drafts.','');
            }

            await client.patch(doc_id).set(patch).commit()
                .catch(err => {
                    console.error('error patching styles: ', err.message);
                    setStatus('error patching styles');
                });

            console.log('success');

            if(failedFiles.length > 0){
				console.log('failed files : ', failedFiles);
				const names = failedFiles.map( file => file.name);
				console.log('names : ', failedFiles.map( file => file?.fk?.name?.records));
				setStatus('fonts uploaded with errors. Failed files : '+ names.join(', '));
			} else {
				setStatus('fonts uploaded!');
			}
            setStatus('fonts uploaded!');
        } catch(e){
            console.error(e);
            setStatus('error uploading font '+e.message);
        }
        setReady(true);

    },[title, slug, doc_id]);

    // Render component UI
    return (
        <Stack>
            {/* Display status message when processing */}
            {!ready &&
                <Text><br/>{status}<br/><br/></Text>
            }

            {/* Display upload interface when ready */}
            {ready &&
                <Stack>
                    <Grid columns={!!(selectedScript && selectedScript !== "") ? 2 : 1} gap={2}>
                        {/* Script selection dropdown */}
                        <Select
                            id="menu-button-example"
                            onChange={(e)=>setSelectedScript(e.target.value)}
                        >
                            <option key={'script-none'} value={""}> </option>
                            {SCRIPTS.map((script,i) =>
                                <option key={'script-'+i} value={script}>
                                    {script[0]?.toUpperCase()+script.slice(1)}
                                </option>
                            )}
                        </Select>

                        {/* File upload button - only shown when script is selected */}
                        {!!(selectedScript && selectedScript !== "") &&
                            <>
                                <label htmlFor="upload-scripts-file">
                                    <Button
                                        style={{pointerEvents: "none"}}
                                        text="Upload (ttf/otf/woff/woff2/etc..)"
                                    />
                                </label>
                                <input
                                    ref={ref}
                                    name="upload-scripts-file"
                                    id="upload-scripts-file"
                                    type="file"
                                    multiple
                                    hidden
                                    onChange={(event) => handleUpload(event, selectedScript)}
                                />
                            </>
                        }
                    </Grid>
                </Stack>
            }
        </Stack>
    )
};
