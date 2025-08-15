// Test schemas for all Liiift Sanity Tools
import { referenceTestSchema } from './reference-test';
import { fontTestSchema } from './font-test';
import { assetTestSchema } from './asset-test';
import { bulkTestSchema } from './bulk-test';

export const schemaTypes = [
	// Reference testing schema (for Advanced Reference Array)
	referenceTestSchema,

	// Font testing schema (for Font Management tools)
	fontTestSchema,

	// Asset testing schema (for Asset Management tools)
	assetTestSchema,

	// Bulk operations testing schema (for Bulk Operations)
	bulkTestSchema,
];
