// Test schemas for all Liiift Sanity Tools
import { referenceTestSchema } from './reference-test';
import { assetTestSchema } from './asset-test';
import { bulkTestSchema } from './bulk-test';
import { fontTestSchema } from './font-test';
import { typefaceTestSchema, collectionSchema, pairSchema } from './typeface-test';

export const schemaTypes = [
	// Core foundry types (font manager targets)
	typefaceTestSchema,
	fontTestSchema,
	collectionSchema,
	pairSchema,

	// General test types
	referenceTestSchema,
	assetTestSchema,
	bulkTestSchema,
];
