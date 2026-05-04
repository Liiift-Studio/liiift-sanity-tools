// Hook for fetching nested objects from Sanity documents — used by NestedObjectArraySelector

import {useState, useEffect} from 'react'
import {useClient} from 'sanity'

/** A selectable item fetched from a nested Sanity document array */
export interface NestedObject {
	title: string
	value: string
}

/** Configuration for the useNestedObjects hook */
interface UseNestedObjectsConfig {
	/** Document type to query (e.g. 'licenseGroup') */
	sourceType: string
	/** Array field to extract from (e.g. 'sections') */
	nestedField: string
	/** GROQ expression for display text (e.g. 'title') */
	titleField: string
	/** GROQ expression for stored value (e.g. 'slug.current') */
	valueField: string
	/** Optional GROQ filter clause (e.g. 'state == "published"') */
	filter?: string
	/** Optional sort field and direction (e.g. 'title asc') */
	sortBy?: string
}

/** Return value of the useNestedObjects hook */
interface UseNestedObjectsResult {
	objects: NestedObject[]
	loading: boolean
	error: Error | null
}

/**
 * Fetches and flattens nested arrays from a Sanity document type into a list of selectable items.
 * Deduplicates by value and optionally sorts by a specified field.
 */
export function useNestedObjects({
	sourceType,
	nestedField,
	titleField,
	valueField,
	filter = '',
	sortBy = '',
}: UseNestedObjectsConfig): UseNestedObjectsResult {
	const client = useClient({apiVersion: '2023-01-01'})
	const [objects, setObjects] = useState<NestedObject[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	useEffect(() => {
		if (!sourceType || !nestedField || !titleField || !valueField) {
			setError(new Error('Missing required configuration'))
			setLoading(false)
			return
		}

		const fetchData = async () => {
			try {
				setLoading(true)
				setError(null)

				const filterClause = filter ? ` && ${filter}` : ''
				const query = `
					*[_type == "${sourceType}"${filterClause}] {
						"${nestedField}": ${nestedField}[] {
							"title": ${titleField},
							"value": ${valueField}
						}
					}
				`

				const result = await client.fetch<Array<Record<string, NestedObject[]>>>(query)

				if (!result || result.length === 0) {
					setObjects([])
					setLoading(false)
					return
				}

				// Flatten nested arrays from all documents and deduplicate by value
				const flattened = result.flatMap((doc) => doc[nestedField] || [])
				const uniqueMap = new Map<string, NestedObject>()
				flattened.forEach((item) => {
					if (item.value && item.title) uniqueMap.set(item.value, item)
				})

				let unique = Array.from(uniqueMap.values())

				if (sortBy) {
					const [sortField, sortOrder = 'asc'] = sortBy.split(' ')
					unique = unique.sort((a, b) => {
						const aVal = (a as Record<string, string>)[sortField] || a.title
						const bVal = (b as Record<string, string>)[sortField] || b.title
						const comparison = aVal.localeCompare(bVal)
						return sortOrder === 'desc' ? -comparison : comparison
					})
				}

				setObjects(unique)
			} catch (err) {
				console.error('useNestedObjects fetch error:', err)
				setError(err as Error)
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [sourceType, nestedField, titleField, valueField, filter, sortBy, client])

	return {objects, loading, error}
}
