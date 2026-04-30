// Layout wrapper that renders the studio plus a fixed version badge on the structure root

import React, { useState, useEffect } from 'react';
import { Badge, Card, Flex, Stack, Text } from '@sanity/ui';

const COOKIE_NAME = 'liiift_pkg_versions';
const SHOW_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const isLocalhost = () => {
	const { hostname } = window.location;
	return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
};

/** Read and parse the version cookie, or return null. */
const readCookie = () => {
	const match = document.cookie.split('; ').find(r => r.startsWith(COOKIE_NAME + '='));
	if (!match) return null;
	try {
		return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')));
	} catch {
		return null;
	}
};

/** Write the version cookie with a 1-year expiry. */
const writeCookie = (data) => {
	const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
	document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(data))}; expires=${expires}; path=/; SameSite=Strict`;
};

/**
 * Diffs current package versions against the stored cookie.
 *
 * First visit (no cookie): writes versions silently, returns shouldShow=false (localhost overrides).
 * Subsequent visits: shows badge if versions changed or >7 days since last shown; resets seenAt when shown.
 *
 * @param {{ name: string, version: string }[]} packages
 */
const compareVersions = (packages) => {
	const local = isLocalhost();
	const stored = readCookie();
	const currentVersions = Object.fromEntries(packages.map(({ name, version }) => [name, version]));

	// First visit — write cookie, show badge without any "new" labels
	if (!stored) {
		writeCookie({ versions: currentVersions, seenAt: Date.now() });
		return { updatedPackages: new Set(), shouldShow: true };
	}

	const { versions: storedVersions = {}, seenAt = 0 } = stored;

	const updatedPackages = new Set();
	for (const { name, version } of packages) {
		if (storedVersions[name] !== version) updatedPackages.add(name);
	}

	const hasUpdates = updatedPackages.size > 0;
	const pastWindow = (Date.now() - seenAt) > SHOW_DURATION_MS;

	// Reset seenAt whenever the badge is due to show on production
	if (hasUpdates || pastWindow) {
		writeCookie({ versions: currentVersions, seenAt: Date.now() });
	}

	return {
		updatedPackages,
		shouldShow: local || hasUpdates || pastWindow,
	};
};

/**
 * Returns true when the current URL is on the structure root with no document open.
 * Sanity uses a semicolon separator in the path when a pane/document is open.
 */
const isStructureRoot = () => {
	const { pathname } = window.location;
	return pathname.includes('/structure') && !pathname.includes(';');
};

/**
 * Studio layout component that injects a fixed bottom-right version badge.
 *
 * Visibility rules:
 * - Localhost: always visible on the structure root
 * - Production: visible on structure root only when packages changed or >7 days since last shown
 * - First visit: badge is suppressed; versions are recorded silently for future diffing
 *
 * Packages updated since the last visit are labelled "new".
 *
 * @param {Object} props
 * @param {Function} props.renderDefault - Sanity-provided renderer for the default studio layout
 * @param {{ name: string, version: string }[]} props.packages - Array of imported package.json objects
 */
export const VersionBadgeLayout = ({ renderDefault, packages = [], ...props }) => {
	const [onStructureRoot, setOnStructureRoot] = useState(isStructureRoot);
	const [{ updatedPackages, shouldShow }] = useState(() => compareVersions(packages));

	useEffect(() => {
		const checkVisibility = () => setOnStructureRoot(isStructureRoot());

		// Patch both pushState and replaceState — Sanity uses replaceState for its initial
		// navigation to /structure, so patching only pushState misses the first route change.
		const origPushState = history.pushState.bind(history);
		const origReplaceState = history.replaceState.bind(history);

		history.pushState = function (...args) {
			origPushState(...args);
			window.dispatchEvent(new Event('locationchange'));
		};
		history.replaceState = function (...args) {
			origReplaceState(...args);
			window.dispatchEvent(new Event('locationchange'));
		};

		window.addEventListener('locationchange', checkVisibility);
		window.addEventListener('popstate', checkVisibility);
		checkVisibility();

		return () => {
			history.pushState = origPushState;
			history.replaceState = origReplaceState;
			window.removeEventListener('locationchange', checkVisibility);
			window.removeEventListener('popstate', checkVisibility);
		};
	}, []);

	const visible = onStructureRoot && shouldShow && packages.length > 0;

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
						{packages.map(({ name, version }) => {
							const displayName = name.replace('@liiift-studio/', '');
							const isNew = updatedPackages.has(name);
							return (
								<Flex key={name} align="center" gap={2}>
									<Text size={1} muted style={{ fontFamily: 'monospace' }}>
										{displayName}
										<span style={{ opacity: 0.5 }}>@</span>
										{version}
									</Text>
									{isNew && <Badge tone="positive" size={0}>new</Badge>}
								</Flex>
							);
						})}
					</Stack>
				</Card>
			)}
		</>
	);
};
