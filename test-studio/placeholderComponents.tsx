import React from 'react';
import { Box, Card, Text, Button, Flex } from '@sanity/ui';

interface PlaceholderProps {
	title: string;
	description: string;
	onClose?: () => void;
}

export const PlaceholderTool: React.FC<PlaceholderProps> = ({ title, description, onClose }) => (
	<Box padding={4}>
		<Card padding={4}>
			<Flex direction="column" gap={4}>
				<Text size={3} weight="bold">{title}</Text>
				<Text size={2}>{description}</Text>
				<Text size={1} muted>
					This is a placeholder component. The actual tool would be fully functional 
					after resolving dependency conflicts and completing the implementation.
				</Text>
				{onClose && (
					<Button text="Close" tone="critical" onClick={onClose} />
				)}
			</Flex>
		</Card>
	</Box>
);

// Placeholder components for tools with issues
export const AdvancedRefArrayPlaceholder = () => <PlaceholderTool title="🔗 Advanced Reference Array" description="Smart search and bulk operations for references" />;
export const BulkDataOperationsPlaceholder = () => <PlaceholderTool title="📦 Bulk Data Operations" description="Mass updates and batch processing" />;
export const ConvertIdsToSlugsPlaceholder = () => <PlaceholderTool title="🔄 Convert IDs to Slugs" description="Automated slug generation" />;
export const ConvertReferencesPlaceholder = () => <PlaceholderTool title="🔗 Convert References" description="Reference relationship migration" />;
export const DeleteUnusedAssetsPlaceholder = () => <PlaceholderTool title="🗑️ Delete Unused Assets" description="Storage optimization and cleanup" />;
export const DuplicateAndRenamePlaceholder = () => <PlaceholderTool title="📋 Duplicate and Rename" description="Smart document duplication" />;
export const ExportDataPlaceholder = () => <PlaceholderTool title="📤 Export Data" description="Multi-format data export" />;
export const FontDataExtractorPlaceholder = () => <PlaceholderTool title="🔤 Font Data Extractor" description="Comprehensive font metadata extraction" />;
export const FontManagementPlaceholder = () => <PlaceholderTool title="📝 Font Management Suite" description="Complete foundry management system" />;
export const SearchAndDeletePlaceholder = () => <PlaceholderTool title="🔍 Search and Delete" description="Advanced search with safe deletion" />;
export const SalesPortalPlaceholder = () => <PlaceholderTool title="📊 Sales Portal" description="Real-time sales analytics" />;
