// Layout wrapper that renders the studio plus a fixed version badge on the structure root

import React, {useState, useEffect} from 'react'
import {Badge, Card, Flex, Stack, Text} from '@sanity/ui'

const COOKIE_NAME = 'liiift_pkg_versions'
/** Duration window for showing the badge on revisit (7 days in ms) */
const SHOW_DURATION_MS = 7 * 24 * 60 * 60 * 1000

/** A package name+version pair */
export interface PackageInfo {
	name: string
	version: string
}

/** Stored cookie data shape */
interface CookieData {
	versions: Record<string, string>
	seenAt: number
}

/** Result of version comparison */
interface CompareVersionsResult {
	shouldShow: boolean
	packagesToCheck: PackageInfo[]
}

/** Props for the VersionBadgeLayout component */
interface VersionBadgeLayoutProps {
	renderDefault: (props: Record<string, unknown>) => React.ReactNode
	packages?: PackageInfo[]
	[key: string]: unknown
}

/** Returns true when the current hostname is a local dev environment */
const isLocalhost = (): boolean => {
	const {hostname} = window.location
	return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

/** Read and parse the version cookie, or return null. */
const readCookie = (): CookieData | null => {
	const match = document.cookie.split('; ').find((r) => r.startsWith(COOKIE_NAME + '='))
	if (!match) return null
	try {
		return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('='))) as CookieData
	} catch {
		return null
	}
}

/** Write the version cookie with a 1-year expiry. */
const writeCookie = (data: CookieData): void => {
	const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()
	document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(data))}; expires=${expires}; path=/; SameSite=Strict`
}

/**
 * Diffs current versions against the stored cookie.
 * Returns shouldShow and which packages need an npm publish-date check.
 *
 * packagesToCheck is:
 *   - all packages on first visit (no cookie)
 *   - only changed packages when a version bump is detected
 *   - empty on 7-day reminder visits (no version changes, no "new" labels needed)
 */
const compareVersions = (packages: PackageInfo[]): CompareVersionsResult => {
	const local = isLocalhost()
	const stored = readCookie()
	const currentVersions = Object.fromEntries(packages.map(({name, version}) => [name, version]))

	// First visit — write cookie, show badge; check all packages against npm
	if (!stored) {
		writeCookie({versions: currentVersions, seenAt: Date.now()})
		return {shouldShow: true, packagesToCheck: packages}
	}

	const {versions: storedVersions = {}, seenAt = 0} = stored
	const changedPackages = packages.filter(({name, version}) => storedVersions[name] !== version)
	const hasUpdates = changedPackages.length > 0
	const pastWindow = Date.now() - seenAt > SHOW_DURATION_MS

	if (hasUpdates || pastWindow) {
		writeCookie({versions: currentVersions, seenAt: Date.now()})
	}

	return {
		shouldShow: local || hasUpdates || pastWindow,
		// 7-day reminder has no changed packages, so no "new" labels needed
		packagesToCheck: changedPackages,
	}
}

/**
 * Fetches publish dates from the npm registry in parallel.
 * Returns a Set of package names published within the last 7 days.
 */
const fetchRecentlyPublished = async (packages: PackageInfo[]): Promise<Set<string>> => {
	const cutoff = Date.now() - SHOW_DURATION_MS
	const results = await Promise.all(
		packages.map(async ({name, version}) => {
			try {
				const res = await fetch(`https://registry.npmjs.org/${name}`)
				if (!res.ok) return null
				const data = (await res.json()) as {time?: Record<string, string>}
				const publishedAt = data.time?.[version]
				return publishedAt && new Date(publishedAt).getTime() > cutoff ? name : null
			} catch {
				return null
			}
		}),
	)
	return new Set(results.filter((r): r is string => r !== null))
}

/**
 * Returns true when the current URL is on the structure root with no document open.
 * Sanity uses a semicolon separator in the path when a pane/document is open.
 */
const isStructureRoot = (): boolean => {
	const {pathname} = window.location
	return pathname.includes('/structure') && !pathname.includes(';')
}

/**
 * Studio layout component that injects a fixed bottom-right version badge.
 *
 * Visibility rules:
 * - Localhost: always visible on the structure root
 * - Production: visible on structure root only when packages changed or >7 days since last shown
 * - "new" labels appear only on packages published to npm within the last 7 days
 */
export const VersionBadgeLayout = ({renderDefault, packages = [], ...props}: VersionBadgeLayoutProps) => {
	const [onStructureRoot, setOnStructureRoot] = useState<boolean>(isStructureRoot)
	const [{shouldShow, packagesToCheck}] = useState<CompareVersionsResult>(() =>
		compareVersions(packages),
	)
	const [recentPackages, setRecentPackages] = useState<Set<string>>(new Set())

	// Fetch npm publish dates for packages that need checking
	useEffect(() => {
		if (packagesToCheck.length === 0) return
		fetchRecentlyPublished(packagesToCheck).then(setRecentPackages)
	}, [])

	useEffect(() => {
		const checkVisibility = () => setOnStructureRoot(isStructureRoot())

		// Patch both pushState and replaceState — Sanity uses replaceState for its initial
		// navigation to /structure, so patching only pushState misses the first route change.
		const origPushState = history.pushState.bind(history)
		const origReplaceState = history.replaceState.bind(history)

		history.pushState = function (...args: Parameters<typeof history.pushState>) {
			origPushState(...args)
			window.dispatchEvent(new Event('locationchange'))
		}
		history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
			origReplaceState(...args)
			window.dispatchEvent(new Event('locationchange'))
		}

		window.addEventListener('locationchange', checkVisibility)
		window.addEventListener('popstate', checkVisibility)
		checkVisibility()

		return () => {
			history.pushState = origPushState
			history.replaceState = origReplaceState
			window.removeEventListener('locationchange', checkVisibility)
			window.removeEventListener('popstate', checkVisibility)
		}
	}, [])

	const visible = onStructureRoot && shouldShow && packages.length > 0

	return (
		<>
			{renderDefault(props)}
			{visible && (
				<Card
					shadow={1}
					radius={2}
					padding={3}
					style={{
						position: 'fixed',
						bottom: 16,
						right: 16,
						zIndex: 9999,
						pointerEvents: 'none',
						minWidth: 180,
					}}
				>
					<Stack space={2}>
						{packages.map(({name, version}) => {
							const displayName = name.replace('@liiift-studio/', '')
							const isNew = recentPackages.has(name)
							return (
								<Flex key={name} align="center" gap={2}>
									<Text size={1} muted style={{fontFamily: 'monospace'}}>
										{displayName}
										<span style={{opacity: 0.5}}>@</span>
										{version}
									</Text>
									{isNew && (
										<Badge tone="positive" size={0}>
											new
										</Badge>
									)}
								</Flex>
							)
						})}
					</Stack>
				</Card>
			)}
		</>
	)
}
