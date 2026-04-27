// Generic checkbox-list selector for nested objects from Sanity documents — configured via schema options

import React, { useMemo, useState } from 'react';
import { Stack, Card, Text, Checkbox, Box, Spinner, Flex } from '@sanity/ui';
import { useNestedObjects } from '../hooks/useNestedObjects';
import { set, unset } from 'sanity';

/**
 * Sanity input component that renders a searchable checkbox list of items fetched
 * from nested arrays inside Sanity documents.
 *
 * Configure via schema options:
 * ```js
 * components: { input: NestedObjectArraySelector },
 * options: {
 *   sourceType: 'licenseGroup',      // document type to query
 *   nestedField: 'sections',          // array field to extract
 *   titleField: 'title',              // GROQ expression for display text
 *   valueField: 'slug.current',       // GROQ expression for stored value
 *   filter: 'state == "published"',   // optional GROQ filter
 *   sortBy: 'title asc',              // optional sort field + direction
 *   emptyMessage: 'No options found', // optional empty state text
 *   searchPlaceholder: 'Search...',   // optional search input placeholder
 * }
 * ```
 */
export const NestedObjectArraySelector = React.forwardRef((props, ref) => {
	const { value = [], onChange, schemaType } = props;

	const options = schemaType?.options || {};
	const {
		sourceType,
		nestedField,
		titleField,
		valueField,
		filter = '',
		sortBy = 'title asc',
		emptyMessage = 'No options found',
		searchPlaceholder = 'Search...',
	} = options;

	const [searchTerm, setSearchTerm] = useState('');
	const { objects, loading, error } = useNestedObjects({ sourceType, nestedField, titleField, valueField, filter, sortBy });

	const filteredObjects = useMemo(() => {
		if (!searchTerm) return objects;
		const lower = searchTerm.toLowerCase();
		return objects.filter(obj => obj.title?.toLowerCase().includes(lower));
	}, [objects, searchTerm]);

	const handleToggle = (itemValue) => {
		const currentValue = value || [];
		const isSelected = currentValue.includes(itemValue);
		if (isSelected) {
			const newValue = currentValue.filter(v => v !== itemValue);
			onChange(newValue.length > 0 ? set(newValue) : unset());
		} else {
			onChange(set([...currentValue, itemValue]));
		}
	};

	if (!sourceType || !nestedField || !titleField || !valueField) {
		return (
			<Card padding={3} tone="critical" border>
				<Text size={1}>Configuration error: Missing required options (sourceType, nestedField, titleField, or valueField)</Text>
			</Card>
		);
	}

	if (loading) {
		return (
			<Card padding={3} border>
				<Flex align="center" justify="center" padding={4}>
					<Spinner />
					<Box marginLeft={3}><Text size={1}>Loading options...</Text></Box>
				</Flex>
			</Card>
		);
	}

	if (error) {
		return (
			<Card padding={3} tone="critical" border>
				<Text size={1}>Error loading options: {error.message}</Text>
			</Card>
		);
	}

	if (objects.length === 0) {
		return (
			<Card padding={3} tone="transparent" border>
				<Text size={1} muted>{emptyMessage}</Text>
			</Card>
		);
	}

	return (
		<Card padding={0} border ref={ref}>
			{objects.length > 5 && (
				<Box padding={3} style={{ borderBottom: '1px solid var(--card-border-color)' }}>
					<input
						type="text"
						placeholder={searchPlaceholder}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--card-border-color)', borderRadius: '4px', fontSize: '13px', fontFamily: 'inherit' }}
					/>
				</Box>
			)}

			<Stack space={0}>
				{filteredObjects.length === 0 ? (
					<Box padding={3}>
						<Text size={1} muted>No results found for "{searchTerm}"</Text>
					</Box>
				) : (
					filteredObjects.map((obj, index) => {
						const isSelected = value?.includes(obj.value);
						const isLast = index === filteredObjects.length - 1;
						return (
							<Box
								key={obj.value}
								padding={3}
								style={{ borderBottom: isLast ? 'none' : '1px solid var(--card-border-color)', cursor: 'pointer', backgroundColor: isSelected ? 'var(--card-muted-fg-color)' : 'transparent', transition: 'background-color 0.2s' }}
								onClick={() => handleToggle(obj.value)}
							>
								<Flex align="center" gap={3}>
									<Checkbox checked={isSelected} readOnly style={{ pointerEvents: 'none' }} />
									<Text size={1} weight={isSelected ? 'semibold' : 'regular'}>{obj.title}</Text>
								</Flex>
							</Box>
						);
					})
				)}
			</Stack>

			{value?.length > 0 && (
				<Box padding={2} paddingX={3} style={{ borderTop: '1px solid var(--card-border-color)', backgroundColor: 'var(--card-muted-fg-color)' }}>
					<Text size={1} muted>{value.length} selected</Text>
				</Box>
			)}
		</Card>
	);
});

NestedObjectArraySelector.displayName = 'NestedObjectArraySelector';
