// Hook for fetching nested objects from Sanity documents — used by NestedObjectArraySelector

import { useState, useEffect } from 'react';
import { useClient } from 'sanity';

/**
 * Fetches and flattens nested arrays from a Sanity document type into a list of selectable items.
 * @param {Object} config
 * @param {string} config.sourceType - Document type to query (e.g. 'licenseGroup')
 * @param {string} config.nestedField - Array field to extract from (e.g. 'sections')
 * @param {string} config.titleField - GROQ expression for display text (e.g. 'title')
 * @param {string} config.valueField - GROQ expression for stored value (e.g. 'slug.current')
 * @param {string} [config.filter] - Optional GROQ filter clause (e.g. 'state == "published"')
 * @param {string} [config.sortBy] - Optional sort field and direction (e.g. 'title asc')
 * @returns {{ objects: Array, loading: boolean, error: Error|null }}
 */
export function useNestedObjects({
	sourceType,
	nestedField,
	titleField,
	valueField,
	filter = '',
	sortBy = '',
}) {
	const client = useClient({ apiVersion: '2023-01-01' });
	const [objects, setObjects] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!sourceType || !nestedField || !titleField || !valueField) {
			setError(new Error('Missing required configuration'));
			setLoading(false);
			return;
		}

		const fetchData = async () => {
			try {
				setLoading(true);
				setError(null);

				const filterClause = filter ? ` && ${filter}` : '';
				const query = `
					*[_type == "${sourceType}"${filterClause}] {
						"${nestedField}": ${nestedField}[] {
							"title": ${titleField},
							"value": ${valueField}
						}
					}
				`;

				const result = await client.fetch(query);

				if (!result || result.length === 0) {
					setObjects([]);
					setLoading(false);
					return;
				}

				// Flatten nested arrays from all documents and deduplicate by value
				const flattened = result.flatMap(doc => doc[nestedField] || []);
				const uniqueMap = new Map();
				flattened.forEach(item => {
					if (item.value && item.title) uniqueMap.set(item.value, item);
				});

				let unique = Array.from(uniqueMap.values());

				if (sortBy) {
					const [sortField, sortOrder = 'asc'] = sortBy.split(' ');
					unique = unique.sort((a, b) => {
						const aVal = a[sortField] || a.title;
						const bVal = b[sortField] || b.title;
						const comparison = aVal.localeCompare(bVal);
						return sortOrder === 'desc' ? -comparison : comparison;
					});
				}

				setObjects(unique);
			} catch (err) {
				console.error('useNestedObjects fetch error:', err);
				setError(err);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [sourceType, nestedField, titleField, valueField, filter, sortBy, client]);

	return { objects, loading, error };
}
