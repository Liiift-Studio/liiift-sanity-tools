// Test schema for field definition packages — sanity-typeface-fields and sanity-typeface-seo
import {
	freeFontField,
	includesSerifField,
	sortHeaviestFirstField,
	classificationField,
	releaseDateField,
	createStateField,
} from '../../sanity-typeface-fields/src';
import { seoField } from '../../sanity-typeface-seo/src';

const stateField = createStateField();

const typefaceFieldTestSchema = {
	name: 'typefaceFieldTest',
	title: 'Typeface Fields Test',
	type: 'document',
	groups: [
		{ name: 'general', title: 'General', default: true },
		{ name: 'seo', title: 'SEO' },
	],
	fields: [
		{
			name: 'title',
			title: 'Title',
			type: 'string',
			group: 'general',
			validation: (Rule: any) => Rule.required(),
		},
		{ ...freeFontField, group: 'general' },
		{ ...includesSerifField, group: 'general' },
		{ ...sortHeaviestFirstField, group: 'general' },
		{ ...classificationField, group: 'general' },
		{ ...releaseDateField, group: 'general' },
		{ ...stateField, group: 'general' },
		{ ...seoField, group: 'seo' },
	],
};

export const fieldTestSchemas = [typefaceFieldTestSchema];
