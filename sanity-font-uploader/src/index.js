// Entry point for @liiift-studio/sanity-font-manager — exports all font manager components, hooks, and utilities

// Components
export { BatchUploadFonts } from './components/BatchUploadFonts.jsx';
export { GenerateCollectionsPairsComponent } from './components/GenerateCollectionsPairsComponent.jsx';
export { UpdateScriptsComponent } from './components/UpdateScriptsComponent.jsx';
export { SingleUploaderTool } from './components/SingleUploaderTool.jsx';
export { RegenerateSubfamiliesComponent } from './components/RegenerateSubfamiliesComponent.jsx';
export { UploadScriptsComponent } from './components/UploadScriptsComponent.jsx';
export { FontScriptUploaderComponent } from './components/FontScriptUploaderComponent.jsx';
export { default as StatusDisplay } from './components/StatusDisplay.jsx';
export { default as PriceInput } from './components/PriceInput.jsx';
export { default as UploadButton } from './components/UploadButton.jsx';

// Hooks
export { useSanityClient } from './hooks/useSanityClient.js';

// Core utilities
export { default as generateCssFile } from './utils/generateCssFile.js';
export { default as generateFontData } from './utils/generateFontData.js';
export { default as generateFontFile } from './utils/generateFontFile.js';
export { default as generateSubset } from './utils/generateSubset.js';
export { default as parseVariableFontInstances } from './utils/parseVariableFontInstances.js';
export { getEmptyFontKit } from './utils/getEmptyFontKit.js';
export { SCRIPTS, SCRIPTS_OBJECT, HtmlDescription } from './utils/utils.js';

// Font processing utilities
export {
	processFontFiles,
	readFontFile,
	extractFontMetadata,
	extractWeightName,
	extractWeightFromFullName,
	processSubfamilyName,
	processItalicKeywords,
	formatFontTitle,
	addItalicToFontTitle,
	createFontObject,
	determineWeight,
	sortFontObjects,
	logFontInfo,
} from './utils/processFontFiles.js';

export { uploadFontFiles } from './utils/uploadFontFiles.js';
export { updateTypefaceDocument } from './utils/updateTypefaceDocument.js';
export { renameFontDocuments } from './utils/regenerateFontData.js';
export { updateFontPrices } from './utils/updateFontPrices.js';
export { sanitizeForSanityId } from './utils/sanitizeForSanityId.js';

// Keyword utilities
export {
	generateStyleKeywords,
	reverseSpellingLookup,
	expandAbbreviations,
	removeWeightNames,
} from './utils/generateKeywords.js';
