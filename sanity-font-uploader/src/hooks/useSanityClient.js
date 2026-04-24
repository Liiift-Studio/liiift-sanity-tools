// Thin wrapper around useClient that pins the API version for the font uploader
import {useMemo} from 'react'
import {useClient} from 'sanity'

/** Returns a memoized Sanity client pinned to api version 2021-10-23 */
export function useSanityClient() {
	const client = useClient({apiVersion: '2021-10-23'})
	return useMemo(() => client, [client])
}
