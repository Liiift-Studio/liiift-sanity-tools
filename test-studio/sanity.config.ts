import { defineConfig } from 'sanity';
import { visionTool } from '@sanity/vision';

// Import all 14 Liiift Sanity Tools from local directories
import { AdvancedRefArray } from '../sanity-advanced-reference-array/src';
import { BulkDataOperations } from '../sanity-bulk-data-operations/src';
import { ConvertIdsToSlugs } from '../sanity-convert-ids-to-slugs/src';
import { ConvertReferences } from '../sanity-convert-references/src';
import { DeleteUnusedAssets } from '../sanity-delete-unused-assets/src';
import { DuplicateAndRename } from '../sanity-duplicate-and-rename/src';
import { ExportData } from '../sanity-export-data/src';
import { FontDataExtractor } from '../sanity-font-data-extractor/src';
import { FontUploaderComponent } from '../sanity-font-management-suite/src';
import { SearchAndDelete } from '../sanity-search-and-delete/src';
import { EnhancedCommerceComponent, enhancedCommerceSchemas } from '../sanity-enhanced-commerce/src';
import { RenewalsAuthorizationComponent } from '../sanity-renewals-authorization/src';
import { salesPortal } from '../sanity-sales-portal/src';
import { StudioUtilities } from '../sanity-studio-utilities/src';

// Import schemas
import { schemaTypes } from './schemas';

export default defineConfig({
	name: 'liiift-tools-test-studio',
	title: 'Liiift Sanity Tools - Test Studio',

	projectId: 'test-project-id', // Replace with your actual project ID
	dataset: 'test',

	plugins: [
		// Vision tool for GROQ testing
		visionTool(),

		// Sales Portal Plugin (uses definePlugin internally)
		salesPortal(),
	],

	schema: {
		types: [
			...schemaTypes,
			...enhancedCommerceSchemas, // Enhanced Commerce schemas
		],
	},

	tools: [
		// Data Management & Operations Tools
		{
			name: 'bulk-data-operations',
			title: 'Bulk Data Operations',
			component: BulkDataOperations,
			icon: () => '📦',
		},
		{
			name: 'convert-ids-to-slugs',
			title: 'Convert IDs to Slugs',
			component: ConvertIdsToSlugs,
			icon: () => '🔄',
		},
		{
			name: 'convert-references',
			title: 'Convert References',
			component: ConvertReferences,
			icon: () => '🔗',
		},
		{
			name: 'export-data',
			title: 'Export Data',
			component: ExportData,
			icon: () => '📤',
		},
		{
			name: 'search-and-delete',
			title: 'Search and Delete',
			component: SearchAndDelete,
			icon: () => '🔍',
		},

		// Content & Asset Management Tools
		{
			name: 'delete-unused-assets',
			title: 'Delete Unused Assets',
			component: DeleteUnusedAssets,
			icon: () => '🗑️',
		},
		{
			name: 'duplicate-and-rename',
			title: 'Duplicate and Rename',
			component: DuplicateAndRename,
			icon: () => '📋',
		},

		// Typography & Font Management Tools
		{
			name: 'font-data-extractor',
			title: 'Font Data Extractor',
			component: FontDataExtractor,
			icon: () => '🔤',
		},
		{
			name: 'font-management-suite',
			title: 'Font Management Suite',
			component: FontUploaderComponent,
			icon: () => '📝',
		},

		// E-commerce & Business Tools
		{
			name: 'enhanced-commerce',
			title: 'Enhanced Commerce',
			component: EnhancedCommerceComponent,
			icon: () => '🛒',
		},
		{
			name: 'renewals-authorization',
			title: 'Renewals Authorization',
			component: RenewalsAuthorizationComponent,
			icon: () => '🔄',
		},
		// Sales Portal is registered as a plugin above

		// Studio Enhancement Tools
		{
			name: 'studio-utilities',
			title: 'Studio Utilities - Master Dashboard',
			component: StudioUtilities,
			icon: () => '🛠️',
		},
	],

	// Configure document actions to include Advanced Reference Array
	document: {
		actions: (prev, context) => {
			// Add any document-level customizations here
			return prev;
		},
	},

	// Development configuration
	...(process.env.NODE_ENV === 'development' && {
		// Development-only settings
		basePath: '/test-studio',
	}),
});
