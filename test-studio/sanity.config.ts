import { defineConfig } from 'sanity';
import { visionTool } from '@sanity/vision';
import React from 'react';

// Import actual working tools now that dependencies are resolved
import { EnhancedCommerceComponent } from '../sanity-enhanced-commerce/src';
import { RenewalsAuthorizationComponent } from '../sanity-renewals-authorization/src';
import { StudioUtilitiesComponent } from '../sanity-studio-utilities/src';

// Placeholder components for tools with remaining issues
import { AdvancedRefArrayPlaceholder, BulkDataOperationsPlaceholder, ConvertIdsToSlugsPlaceholder, ConvertReferencesPlaceholder, DeleteUnusedAssetsPlaceholder, DuplicateAndRenamePlaceholder, ExportDataPlaceholder, FontDataExtractorPlaceholder, FontManagementPlaceholder, SearchAndDeletePlaceholder, SalesPortalPlaceholder } from './placeholderComponents';

// Import schemas
import { schemaTypes } from './schemas';

export default defineConfig({
	name: 'liiift-tools-test-studio',
	title: 'Liiift Sanity Tools - Test Studio',

	projectId: process.env.SANITY_STUDIO_PROJECT_ID || '6fljbzmb',
	dataset: process.env.SANITY_STUDIO_DATASET || 'production',

	plugins: [
		// Vision tool for GROQ testing
		visionTool(),
	],

	schema: {
		types: [
			...schemaTypes,
			// Enhanced Commerce schemas removed to avoid dependency conflicts
		],
	},

	tools: [
		// Fully Working Tools (dependencies now resolved)
		{
			name: 'enhanced-commerce',
			title: '🛒 Enhanced Commerce',
			component: EnhancedCommerceComponent,
			icon: () => '🛒',
		},
		{
			name: 'renewals-authorization',
			title: '🔄 Renewals Authorization',
			component: RenewalsAuthorizationComponent,
			icon: () => '🔄',
		},
		{
			name: 'studio-utilities',
			title: '🛠️ Studio Utilities',
			component: StudioUtilitiesComponent,
			icon: () => '🛠️',
		},

		// Placeholder Tools (for demonstration)
		{
			name: 'advanced-ref-array',
			title: '🔗 Advanced Reference Array',
			component: AdvancedRefArrayPlaceholder,
			icon: () => '🔗',
		},
		{
			name: 'bulk-data-operations',
			title: '📦 Bulk Data Operations',
			component: BulkDataOperationsPlaceholder,
			icon: () => '📦',
		},
		{
			name: 'convert-ids-to-slugs',
			title: '🔄 Convert IDs to Slugs',
			component: ConvertIdsToSlugsPlaceholder,
			icon: () => '🔄',
		},
		{
			name: 'convert-references',
			title: '🔗 Convert References',
			component: ConvertReferencesPlaceholder,
			icon: () => '🔗',
		},
		{
			name: 'delete-unused-assets',
			title: '🗑️ Delete Unused Assets',
			component: DeleteUnusedAssetsPlaceholder,
			icon: () => '🗑️',
		},
		{
			name: 'duplicate-and-rename',
			title: '📋 Duplicate and Rename',
			component: DuplicateAndRenamePlaceholder,
			icon: () => '📋',
		},
		{
			name: 'export-data',
			title: '📤 Export Data',
			component: ExportDataPlaceholder,
			icon: () => '📤',
		},
		{
			name: 'font-data-extractor',
			title: '🔤 Font Data Extractor',
			component: FontDataExtractorPlaceholder,
			icon: () => '🔤',
		},
		{
			name: 'font-management-suite',
			title: '📝 Font Management Suite',
			component: FontManagementPlaceholder,
			icon: () => '📝',
		},
		{
			name: 'sales-portal',
			title: '📊 Sales Portal',
			component: SalesPortalPlaceholder,
			icon: () => '📊',
		},
		{
			name: 'search-and-delete',
			title: '🔍 Search and Delete',
			component: SearchAndDeletePlaceholder,
			icon: () => '🔍',
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
