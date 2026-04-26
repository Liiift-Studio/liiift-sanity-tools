// Returns the Sanity client instance from the studio context
import {useMemo} from 'react'
import {useClient} from 'sanity'

/** Returns a memoized Sanity client pinned to api version 2021-10-23 */
export function useSanityClient() {
	const client = useClient({apiVersion: '2021-10-23'})
	return useMemo(() => client, [client])
}
