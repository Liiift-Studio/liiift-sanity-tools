import { defineConfig } from 'sanity';
import { visionTool } from '@sanity/vision';
import React from 'react';

// All tools are now placeholders to avoid dependency issues in builds
// Working versions would be available after proper dependency management

// Placeholder components
import { PlaceholderTool, AdvancedRefArrayPlaceholder, BulkDataOperationsPlaceholder, ConvertIdsToSlugsPlaceholder, ConvertReferencesPlaceholder, DeleteUnusedAssetsPlaceholder, DuplicateAndRenamePlaceholder, ExportDataPlaceholder, FontDataExtractorPlaceholder, FontManagementPlaceholder, SearchAndDeletePlaceholder, SalesPortalPlaceholder } from './placeholderComponents';

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
		// Working Tools (now using placeholders for build compatibility)
		{
			name: 'enhanced-commerce',
			title: '🛒 Enhanced Commerce',
			component: () =>
				React.createElement(PlaceholderTool, {
					title: '🛒 Enhanced Commerce',
					description: 'Complete e-commerce schemas and dashboard. This tool includes cart management, order processing, customer tracking, and renewal workflows. Would be fully functional after resolving build dependencies.',
				}),
			icon: () => '🛒',
		},
		{
			name: 'renewals-authorization',
			title: '🔄 Renewals Authorization',
			component: () =>
				React.createElement(PlaceholderTool, {
					title: '🔄 Renewals Authorization',
					description: 'License renewal management system. Features order searching, cart importing, renewal creation, and pricing calculations. Production version available in sanity-renewals-authorization directory.',
				}),
			icon: () => '🔄',
		},
		{
			name: 'studio-utilities',
			title: '🛠️ Studio Utilities',
			component: () =>
				React.createElement(PlaceholderTool, {
					title: '🛠️ Studio Utilities',
					description: 'Master dashboard providing access to all tools and utilities. Centralizes workflow management and tool navigation. Working version available in sanity-studio-utilities directory.',
				}),
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
